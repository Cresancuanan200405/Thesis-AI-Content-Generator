<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

class GoogleAccountController extends Controller
{
    /**
     * Step 1: Verify ownership of current Google account before replacement.
     */
    public function verifyCurrentAccount(Request $request): RedirectResponse|SymfonyRedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isGoogleUser() || empty($user->provider_id)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Only accounts currently linked to Google can use Google identity re-authentication.'));
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google Sign-In is not configured yet.'));
        }

        $state = Str::random(40);
        $request->session()->put('google_verify_current_state', [
            'user_id' => $user->id,
            'state' => $state,
            'initiated_at' => now()->timestamp,
        ]);

        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $driver->redirectUrl(route('settings.google.verify-current.callback'));

        return $driver->with([
            'prompt' => 'select_account',
            'state' => $state,
        ])->redirect();
    }

    /**
     * Handle callback for current Google account ownership verification.
     */
    public function handleVerifyCurrentCallback(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isGoogleUser() || empty($user->provider_id)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Only accounts currently linked to Google can use Google identity re-authentication.'));
        }

        if ($request->has('error')) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google verification was cancelled: '.$request->input('error')));
        }

        $sessionState = $request->session()->get('google_verify_current_state');
        $request->session()->forget('google_verify_current_state');

        // Verify state
        if (
            empty($sessionState) ||
            empty($sessionState['state']) ||
            ! hash_equals((string) $sessionState['state'], (string) $request->input('state')) ||
            (int) ($sessionState['user_id'] ?? 0) !== (int) $user->id ||
            (now()->timestamp - (int) ($sessionState['initiated_at'] ?? 0)) > 600
        ) {
            return redirect()->route('profile.edit')
                ->with('error', __('The verification session has expired or is invalid. Please try again.'));
        }

        try {
            /** @var GoogleProvider $driver */
            $driver = Socialite::driver('google');
            $driver->redirectUrl(route('settings.google.verify-current.callback'));

            if (method_exists($driver, 'stateless')) {
                $driver = $driver->stateless();
            }

            $socialUser = $driver->user();
            $socialId = (string) $socialUser->getId();

            if (empty($socialId) || ! hash_equals((string) $user->provider_id, $socialId)) {
                Log::warning('Current Google account verification failed: provider ID mismatch', [
                    'user_id' => $user->id,
                    'expected_provider_id' => $user->provider_id,
                    'received_provider_id' => $socialId,
                ]);

                return redirect()->route('profile.edit')
                    ->with('error', __('The selected Google account does not match your currently linked Google account.'));
            }

            // Grant 15-minute window to choose new Google account
            Cache::put("google_account_change_auth:{$user->id}", [
                'verified_at' => now()->timestamp,
            ], now()->addMinutes(15));

            return redirect()->route('profile.edit')
                ->with('success', __('Current Google identity verified. You may now connect your new Google account.'));
        } catch (Throwable $e) {
            Log::error('Error verifying current Google identity', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()->route('profile.edit')
                ->with('error', __('Unable to verify your current Google account. Please try again.'));
        }
    }

    /**
     * Verify ownership via password for accounts that have a usable local password.
     */
    public function verifyPassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasUsablePassword()) {
            throw ValidationException::withMessages([
                'password' => [__('This account is authenticated via Google and must verify ownership using the current Google account.')],
            ]);
        }

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('The provided password does not match your current password.')],
            ]);
        }

        Cache::put("google_account_change_auth:{$user->id}", [
            'verified_at' => now()->timestamp,
        ], now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => __('Identity verified. You may now connect a Google account.'),
        ]);
    }

    /**
     * Step 2: Redirect to Google OAuth to authorize the NEW Google account.
     */
    public function redirectToNewGoogle(Request $request): RedirectResponse|SymfonyRedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! Cache::has("google_account_change_auth:{$user->id}")) {
            return redirect()->route('profile.edit')
                ->with('error', __('Please verify ownership of your current account before changing your linked Google account.'));
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google Sign-In is not configured yet.'));
        }

        $state = Str::random(40);
        $request->session()->put('google_change_oauth_state', [
            'user_id' => $user->id,
            'state' => $state,
            'initiated_at' => now()->timestamp,
        ]);

        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $driver->redirectUrl(route('settings.google.change.callback'));

        return $driver->with([
            'prompt' => 'select_account',
            'state' => $state,
        ])->redirect();
    }

    /**
     * Handle callback for linking the NEW Google account to the SAME MarketPilot user.
     */
    public function handleNewGoogleCallback(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // 1. Must have prior ownership authorization
        if (! Cache::has("google_account_change_auth:{$user->id}")) {
            return redirect()->route('profile.edit')
                ->with('error', __('The authorization window has expired. Please verify ownership of your current account first.'));
        }

        if ($request->has('error')) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google authentication was cancelled: '.$request->input('error')));
        }

        $sessionState = $request->session()->get('google_change_oauth_state');
        $request->session()->forget('google_change_oauth_state');

        // 2. Validate dedicated OAuth state
        if (
            empty($sessionState) ||
            empty($sessionState['state']) ||
            ! hash_equals((string) $sessionState['state'], (string) $request->input('state')) ||
            (int) ($sessionState['user_id'] ?? 0) !== (int) $user->id ||
            (now()->timestamp - (int) ($sessionState['initiated_at'] ?? 0)) > 600
        ) {
            return redirect()->route('profile.edit')
                ->with('error', __('The verification session has expired or is invalid. Please try again.'));
        }

        try {
            /** @var GoogleProvider $driver */
            $driver = Socialite::driver('google');
            $driver->redirectUrl(route('settings.google.change.callback'));

            if (method_exists($driver, 'stateless')) {
                $driver = $driver->stateless();
            }

            $socialUser = $driver->user();
            $newSocialId = (string) $socialUser->getId();
            $newEmail = (string) $socialUser->getEmail();
            $newAvatar = $socialUser->getAvatar();

            // 3. CASE D: Missing or invalid provider ID from Google
            if (empty($newSocialId)) {
                Log::warning('Google account replacement rejected: missing provider ID', ['user_id' => $user->id]);

                return redirect()->route('profile.edit')
                    ->with('error', __('Google did not return a valid account identifier. Replacement was aborted.'));
            }

            // 4. CASE B: User selected the same Google account that is already linked
            if ($user->isGoogleUser() && hash_equals((string) $user->provider_id, $newSocialId)) {
                Cache::forget("google_account_change_auth:{$user->id}");

                return redirect()->route('profile.edit')
                    ->with('info', __('This Google account is already linked to your MarketPilot profile. No changes were made.'));
            }

            // 5. CASE C: New Google account is already linked to ANOTHER MarketPilot user
            $existingLinkedUser = User::where('provider_name', 'google')
                ->where('provider_id', $newSocialId)
                ->where('id', '!=', $user->id)
                ->first();

            if ($existingLinkedUser) {
                Log::warning('Google account replacement rejected: provider collision', [
                    'user_id' => $user->id,
                    'colliding_user_id' => $existingLinkedUser->id,
                    'provider_id' => $newSocialId,
                ]);

                return redirect()->route('profile.edit')
                    ->with('error', __('This Google account is already linked to another MarketPilot account.'));
            }

            // 6. Check if new Google email is already used by another MarketPilot account
            if (! empty($newEmail)) {
                $emailOwner = User::where('email', $newEmail)
                    ->where('id', '!=', $user->id)
                    ->first();

                if ($emailOwner) {
                    Log::warning('Google account replacement rejected: email collision', [
                        'user_id' => $user->id,
                        'colliding_user_id' => $emailOwner->id,
                        'email' => $newEmail,
                    ]);

                    return redirect()->route('profile.edit')
                        ->with('error', __('The email address associated with this Google account is already in use by another MarketPilot account.'));
                }
            }

            // 7. Atomic update of the SAME user record (CASE J: rollback on failure)
            $oldProviderId = $user->provider_id;
            $oldEmail = $user->email;

            DB::transaction(function () use ($user, $newSocialId, $newEmail, $newAvatar) {
                $user->forceFill([
                    'provider_name' => 'google',
                    'provider_id' => $newSocialId,
                    'email' => ! empty($newEmail) ? $newEmail : $user->email,
                    'email_verified_at' => now(),
                    'avatar' => $newAvatar ?: $user->avatar,
                ])->save();
            });

            // Clear authorization
            Cache::forget("google_account_change_auth:{$user->id}");

            // Security audit notification
            NotificationService::notifySecurity(
                $user,
                'Google Account Replaced',
                'Your linked Google account was successfully updated to a new Google account.',
                route('profile.edit')
            );

            Log::info('Google account successfully replaced', [
                'user_id' => $user->id,
                'old_provider_id' => $oldProviderId,
                'new_provider_id' => $newSocialId,
                'old_email' => $oldEmail,
                'new_email' => $user->email,
            ]);

            return redirect()->route('profile.edit')
                ->with('success', __('Your linked Google account was successfully updated.'));
        } catch (Throwable $e) {
            Log::error('Exception during Google account replacement', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()->route('profile.edit')
                ->with('error', __('Unable to complete Google account replacement. All changes were rolled back.'));
        }
    }
}
