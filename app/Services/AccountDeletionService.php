<?php

namespace App\Services;

use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AccountDeletionService
{
    /**
     * Collect all physical storage paths owned by the user and their business.
     *
     * @return array{public: list<string>, local: list<string>}
     */
    public function collectTenantFilePaths(User $user): array
    {
        $publicPaths = [];
        $localPaths = [];

        $business = $user->business;

        // 1. Business registration document (local disk)
        if ($business && filled($business->business_registration_document_path)) {
            $localPaths[] = (string) $business->business_registration_document_path;
        }

        // 2. Product images (public disk) - includes active and soft-deleted products
        if ($business) {
            $productImages = Product::withTrashed()
                ->where('business_id', $business->id)
                ->whereNotNull('image_path')
                ->pluck('image_path')
                ->all();

            foreach ($productImages as $path) {
                if (filled($path)) {
                    $publicPaths[] = (string) $path;
                }
            }
        }

        // 3. Design generated images and reference images (public disk) - includes drafts, completed, and soft-deleted designs
        $designQuery = Design::withTrashed()->where('user_id', $user->id);
        if ($business) {
            $designQuery->orWhere('business_id', $business->id);
        }

        $designs = $designQuery->get(['generated_image_path', 'reference_image_path']);
        foreach ($designs as $design) {
            if (filled($design->generated_image_path)) {
                $publicPaths[] = (string) $design->generated_image_path;
            }
            if (filled($design->reference_image_path)) {
                $publicPaths[] = (string) $design->reference_image_path;
            }
        }

        // 4. GenerationRequest reference images (public disk)
        $genRequestQuery = GenerationRequest::where('user_id', $user->id);
        if ($business) {
            $genRequestQuery->orWhere('business_id', $business->id);
        }

        $genReferenceImages = $genRequestQuery
            ->whereNotNull('reference_image_path')
            ->pluck('reference_image_path')
            ->all();

        foreach ($genReferenceImages as $path) {
            if (filled($path)) {
                $publicPaths[] = (string) $path;
            }
        }

        return [
            'public' => array_values(array_unique(array_filter($publicPaths, fn ($p) => filled($p)))),
            'local' => array_values(array_unique(array_filter($localPaths, fn ($p) => filled($p)))),
        ];
    }

    /**
     * Permanently delete a user account and all associated tenant resources and files.
     *
     * @return array{
     *     user_id: int,
     *     deleted_files_count: int,
     *     failed_files_count: int
     * }
     */
    public function deleteUser(User $user): array
    {
        $userId = $user->id;
        $userEmail = $user->email;

        // 1. Collect all tenant-owned storage paths BEFORE database deletion
        $filesToDelete = $this->collectTenantFilePaths($user);

        // 2. Execute database deletion inside a transaction
        DB::transaction(function () use ($user, $userId, $userEmail) {
            // Explicitly delete user-owned custom Events (is_global = false)
            // Global holidays (is_global = true) are strictly preserved.
            Event::where('user_id', $userId)
                ->where('is_global', false)
                ->delete();

            // Clean up session records for this user
            DB::table('sessions')->where('user_id', $userId)->delete();

            // Clean up password reset tokens for this user's email
            DB::table('password_reset_tokens')->where('email', $userEmail)->delete();

            // Delete the User model (database cascades remove dependent tenant rows: business, products, designs, campaigns, generation requests, notifications, legal acceptances)
            $user->delete();
        });

        // 3. Clear any user-specific transient caches
        Cache::forget("pending_email_change:{$userId}");
        Cache::forget("email_change_auth:{$userId}");
        Cache::forget("google_account_change_auth:{$userId}");

        // 4. Perform post-commit physical storage cleanup
        $deletedFilesCount = 0;
        $failedFilesCount = 0;

        foreach ($filesToDelete as $disk => $paths) {
            $storage = Storage::disk($disk);
            foreach ($paths as $path) {
                try {
                    if ($storage->exists($path)) {
                        $storage->delete($path);
                        $deletedFilesCount++;
                    }
                } catch (\Throwable $e) {
                    $failedFilesCount++;
                    Log::warning("Account deletion: failed to delete storage file [{$disk}:{$path}]: {$e->getMessage()}", [
                        'user_id' => $userId,
                        'disk' => $disk,
                        'path' => $path,
                        'exception' => $e,
                    ]);
                }
            }
        }

        return [
            'user_id' => $userId,
            'deleted_files_count' => $deletedFilesCount,
            'failed_files_count' => $failedFilesCount,
        ];
    }
}
