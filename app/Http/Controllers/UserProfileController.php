<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBusinessProfileRequest;
use App\Http\Requests\UpdateBusinessRegistrationDocumentRequest;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserProfileController extends Controller
{
    /**
     * Display the authenticated user's personal profile and account overview ("My Profile").
     */
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('business');

        $provider = $user->provider_name ? ucfirst($user->provider_name) : 'Email & Password';

        return Inertia::render('profile/my-profile', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'suffix' => $user->suffix,
                'mobile_number' => $user->mobile_number,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'email_verified_at' => $user->email_verified_at?->format('M j, Y'),
                'provider' => $provider,
                'role' => 'Workspace Owner',
                'account_status' => 'Active',
                'created_at' => $user->created_at?->format('M j, Y'),
                'member_since' => $user->created_at?->format('F Y'),
                'two_factor_enabled' => (bool) $user->two_factor_confirmed_at,
            ],
            'business' => [
                'id' => $user->business?->id,
                'name' => $user->business->name ?? 'Not configured',
                'industry' => $user->business->industry ?? 'General',
                'category' => $user->business->category ?? 'General',
                'description' => $user->business?->description,
            ],
            'stats' => [
                'products_count' => $user->business?->products()->count() ?? 0,
                'campaigns_count' => $user->campaigns()->count(),
                'designs_count' => $user->designs()->count(),
            ],
        ]);
    }

    /**
     * Display the persistent Business Profile ("Business Profile") used for image generation.
     */
    public function showBusiness(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->load('business');

        $business = $user->business;

        return Inertia::render('profile/business', [
            'profile' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified' => (bool) $user->hasVerifiedEmail(),
                'member_since' => $user->created_at?->format('F Y'),
            ],
            'business' => [
                'id' => $business?->id,
                'name' => $business->name ?? 'Not specified',
                'industry' => $business->industry ?? 'Food & Beverage',
                'category' => $business->category ?? 'Restaurant',
                'description' => $business?->description,
                'business_address' => $business?->business_address,
                'barangay' => $business?->barangay,
                'city_municipality' => $business?->city_municipality,
                'province' => $business?->province,
                'region' => $business?->region,
                'registration_type' => $business?->registration_type,
                'registration_number' => $business?->registration_number,
                'business_permit_number' => $business?->business_permit_number,
                'registration_permit_date' => $business?->registration_permit_date?->format('Y-m-d'),
                'created_at' => $business?->created_at?->format('M j, Y'),
            ],
        ]);
    }

    /**
     * Update the authenticated user's persistent business identity.
     */
    public function updateBusiness(UpdateBusinessProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $business = $user->business()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'user_id' => $user->id,
                'name' => $user->name ?: 'My Business',
                'industry' => 'Food & Beverage',
                'category' => 'Restaurant',
                'description' => '',
            ]
        );

        $validated = $request->validated();
        $business->update($validated);

        return back()->with('success', 'Business profile updated successfully.');
    }

    public function storeBusinessDocument(UpdateBusinessRegistrationDocumentRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $business = $user->business()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'user_id' => $user->id,
                'name' => $user->name ?: 'My Business',
                'industry' => 'Food & Beverage',
                'category' => 'Restaurant',
                'description' => '',
            ]
        );

        $file = $request->file('business_registration_document');

        if ($business->business_registration_document_path && Storage::disk('local')->exists($business->business_registration_document_path)) {
            Storage::disk('local')->delete($business->business_registration_document_path);
        }

        $path = $file->storeAs(
            'business-documents/'.$user->id,
            $this->buildRegistrationDocumentFilename($business, $file),
            'local'
        );

        if ($path === false) {
            return back()->withErrors([
                'business_registration_document' => 'Unable to store the business registration document.',
            ]);
        }

        $business->forceFill([
            'business_registration_document_path' => $path,
        ])->save();

        return redirect()->route('profile.business')->with('success', 'Business registration document uploaded successfully.');
    }

    public function downloadBusinessDocument(Request $request): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();
        $business = $user?->business()->first();

        if (! $business || ! $business->business_registration_document_path || ! Storage::disk('local')->exists($business->business_registration_document_path)) {
            abort(404, 'The requested business document is not available.');
        }

        return Storage::disk('local')->download(
            $business->business_registration_document_path,
            $this->buildDocumentDownloadName($business)
        );
    }

    public function deleteBusinessDocument(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $business = $user?->business()->first();

        if ($business && $business->business_registration_document_path && Storage::disk('local')->exists($business->business_registration_document_path)) {
            Storage::disk('local')->delete($business->business_registration_document_path);
        }

        if ($business) {
            $business->forceFill([
                'business_registration_document_path' => null,
            ])->save();
        }

        return redirect()->route('profile.business')->with('success', 'Business registration document removed successfully.');
    }

    protected function buildRegistrationDocumentFilename(Business $business, UploadedFile $file): string
    {
        $baseName = preg_replace('/[^A-Za-z0-9._-]+/', '-', (string) $business->name ?: 'business-registration-document');
        $baseName = trim((string) $baseName, '-_.');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'pdf');

        return ($baseName !== '' ? $baseName : 'business-registration-document').'-'.now()->format('YmdHis').'.'.$extension;
    }

    protected function buildDocumentDownloadName(Business $business): string
    {
        $baseName = preg_replace('/[^A-Za-z0-9._-]+/', '-', (string) $business->name ?: 'business-registration-document');
        $baseName = trim((string) $baseName, '-_.');

        return ($baseName !== '' ? $baseName : 'business-registration-document').'-document'.'.'.pathinfo($business->business_registration_document_path, PATHINFO_EXTENSION);
    }
}
