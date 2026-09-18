<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\EmailChangeVerificationNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class EmailChangeController extends Controller
{
    /**
     * Redirect user to Google OAuth specifically for email change identity verification.
     */
    public function redirectToGoogle(Request $request): RedirectResponse|SymfonyRedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isGoogleUser() || empty($user->provider_id)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google verification is only available for accounts connected via Google Sign-In.'));
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google Sign-In is not configured yet.'));
        }

        $state = Str::random(40);
        $request->session()->put('email_change_oauth_state', [
            'user_id' => $user->id,
            'state' => $state,
            'initiated_at' => now()->timestamp,
        ]);

        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');
        $driver->redirectUrl(route('settings.email.verify.google.callback'));

        return $driver->with([
            'prompt' => 'select_account',
            'state' => $state,
        ])->redirect();
    }

    /**
     * Handle Google OAuth callback specifically for email change identity verification.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isGoogleUser() || empty($user->provider_id)) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google verification is only available for accounts connected via Google Sign-In.'));
        }

        if ($request->has('error')) {
            return redirect()->route('profile.edit')
                ->with('error', __('Google verification was cancelled: '.$request->input('error')));
        }

        $sessionState = $request->session()->get('email_change_oauth_state');
        $request->session()->forget('email_change_oauth_state');

        // 1. Verify OAuth state was initiated by current user and has not expired (10 min TTL)
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
            $driver->redirectUrl(route('settings.email.verify.google.callback'));

            if (method_exists($driver, 'stateless')) {
                $driver = $driver->stateless();
            }

            $socialUser = $driver->user();
            $socialId = (string) $socialUser->getId();

            // 2. Authoritative check: provider ID must match the current user's provider_id
            if (empty($socialId) || ! hash_equals((string) $user->provider_id, $socialId)) {
                Log::warning('Email change Google verification failed: provider ID mismatch', [
                    'user_id' => $user->id,
                    'expected_provider_id' => $user->provider_id,
                    'received_provider_id' => $socialId,
                ]);

                return redirect()->route('profile.edit')
                    ->with('error', __('The selected Google account does not match the Google account connected to your MarketPilot profile.'));
            }

            // 3. Grant 15-minute verification window (same token used by verifyIdentity)
            Cache::put("email_change_auth:{$user->id}", [
                'verified_at' => now()->timestamp,
                'method' => 'google_oauth',
            ], now()->addMinutes(15));

            return redirect()->route('profile.edit')
                ->with('success', __('Google identity verified successfully. You may now enter your new email address.'));
        } catch (\Throwable $e) {
            Log::error('Email change Google verification exception', [
                'user_id' => $user->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()->route('profile.edit')
                ->with('error', __('Unable to complete Google verification. Please try again.'));
        }
    }

    /**
     * Step 1: Verify the authenticated user's current identity.
     */
    public function verifyIdentity(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasUsablePassword()) {
            throw ValidationException::withMessages([
                'password' => [__('This account is authenticated through Google and does not use a local password. Please verify using your connected Google account.')],
            ]);
        }

        $rules = [
            'password' => ['required', 'string'],
        ];

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $rules['two_factor_code'] = ['required', 'string'];
        }

        $request->validate($rules);

        if (! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('The provided password does not match your current password.')],
            ]);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $code = $request->input('two_factor_code');
            $valid = false;

            if ($user->two_factor_secret) {
                try {
                    $provider = app(TwoFactorAuthenticationProvider::class);
                    $valid = $provider->verify(decrypt($user->two_factor_secret), (string) $code);
                } catch (\Throwable) {
                    $valid = false;
                }
            }

            if (! $valid && $user->two_factor_recovery_codes) {
                try {
                    $recoveryCodes = json_decode(decrypt($user->two_factor_recovery_codes), true) ?: [];
                    if (in_array($code, $recoveryCodes, true)) {
                        $valid = true;
                    }
                } catch (\Throwable) {
                    $valid = false;
                }
            }

            if (! $valid) {
                throw ValidationException::withMessages([
                    'two_factor_code' => [__('The provided two-factor authentication code was invalid.')],
                ]);
            }
        }

        // Grant 15-minute verification window for changing email
        Cache::put("email_change_auth:{$user->id}", [
            'verified_at' => now()->timestamp,
        ], now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => __('Identity verified successfully.'),
        ]);
    }

    /**
     * Step 2: Validate the requested new email and send a verification code.
     */
    public function requestChange(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! Cache::has("email_change_auth:{$user->id}")) {
            return response()->json([
                'message' => __('Please verify your identity before requesting an email change.'),
            ], 403);
        }

        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'confirmed'],
            'email_confirmation' => ['required', 'string'],
        ]);

        $newEmail = strtolower(trim((string) $request->input('email')));

        if ($newEmail === strtolower(trim((string) $user->email))) {
            throw ValidationException::withMessages([
                'email' => [__('The new email address cannot be the same as your current email address.')],
            ]);
        }

        if (User::where('email', $newEmail)->where('id', '!=', $user->id)->exists()) {
            throw ValidationException::withMessages([
                'email' => [__('This email address is already registered to another account.')],
            ]);
        }

        $code = (string) random_int(100000, 999999);

        Cache::put("pending_email_change:{$user->id}", [
            'new_email' => $newEmail,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(15)->timestamp,
            'attempts' => 0,
            'resend_available_at' => now()->addSeconds(60)->timestamp,
        ], now()->addMinutes(15));

        try {
            Notification::route('mail', $newEmail)->notify(
                new EmailChangeVerificationNotification($code, $newEmail, $user)
            );
        } catch (\Throwable $e) {
            // If mail fails, continue without exposing internals
        }

        return response()->json([
            'success' => true,
            'masked_email' => $this->maskEmail($newEmail),
            'message' => __('Verification code sent to your new email address.'),
        ]);
    }

    /**
     * Step 3: Validate the verification code and finalize the email change.
     */
    public function confirmChange(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $pending = Cache::get("pending_email_change:{$user->id}");

        if (! $pending || now()->timestamp > ($pending['expires_at'] ?? 0)) {
            return response()->json([
                'message' => __('The verification request has expired or does not exist. Please request a new code.'),
            ], 422);
        }

        $attempts = ($pending['attempts'] ?? 0) + 1;
        if ($attempts > 5) {
            Cache::forget("pending_email_change:{$user->id}");
            Cache::forget("email_change_auth:{$user->id}");

            return response()->json([
                'message' => __('Too many invalid attempts. For your security, this verification request has been cancelled.'),
            ], 422);
        }

        $pending['attempts'] = $attempts;
        $remainingSeconds = max(1, ($pending['expires_at'] ?? now()->timestamp) - now()->timestamp);
        Cache::put("pending_email_change:{$user->id}", $pending, now()->addSeconds($remainingSeconds));

        $rawCode = (string) $request->input('code');
        $normalizedCode = preg_replace('/\D+/', '', $rawCode) ?? '';

        if (strlen($normalizedCode) !== 6 || ! Hash::check($normalizedCode, $pending['code_hash'])) {
            throw ValidationException::withMessages([
                'code' => [__('The verification code entered is incorrect.')],
            ]);
        }

        $newEmail = $pending['new_email'];

        // Ensure uniqueness once more before committing
        if (User::where('email', $newEmail)->where('id', '!=', $user->id)->exists()) {
            Cache::forget("pending_email_change:{$user->id}");

            return response()->json([
                'message' => __('This email address was recently taken by another account.'),
            ], 422);
        }

        $user->forceFill([
            'email' => $newEmail,
            'email_verified_at' => now(),
        ])->save();

        Cache::forget("pending_email_change:{$user->id}");
        Cache::forget("email_change_auth:{$user->id}");

        NotificationService::notifySecurity(
            $user,
            'Email Address Changed',
            'Your MarketPilot account email was successfully updated.',
            route('profile.edit')
        );

        return response()->json([
            'success' => true,
            'new_email' => $newEmail,
            'message' => __('Your email address has been successfully changed.'),
        ]);
    }

    /**
     * Resend a fresh verification code to the pending new email.
     */
    public function resendCode(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $pending = Cache::get("pending_email_change:{$user->id}");

        if (! $pending) {
            return response()->json([
                'message' => __('No active email change request found.'),
            ], 404);
        }

        if (isset($pending['resend_available_at']) && now()->timestamp < $pending['resend_available_at']) {
            $waitSec = $pending['resend_available_at'] - now()->timestamp;

            return response()->json([
                'message' => __("Please wait {$waitSec} seconds before requesting another code."),
            ], 429);
        }

        $code = (string) random_int(100000, 999999);
        $pending['code_hash'] = Hash::make($code);
        $pending['expires_at'] = now()->addMinutes(15)->timestamp;
        $pending['resend_available_at'] = now()->addSeconds(60)->timestamp;

        Cache::put("pending_email_change:{$user->id}", $pending, now()->addMinutes(15));

        try {
            Notification::route('mail', $pending['new_email'])->notify(
                new EmailChangeVerificationNotification($code, $pending['new_email'], $user)
            );
        } catch (\Throwable $e) {
            // continue
        }

        return response()->json([
            'success' => true,
            'message' => __('A fresh verification code has been sent to your new email.'),
        ]);
    }

    /**
     * Cancel an ongoing pending email change.
     */
    public function cancelChange(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        Cache::forget("pending_email_change:{$user->id}");
        Cache::forget("email_change_auth:{$user->id}");

        return response()->json([
            'success' => true,
            'message' => __('Email change request cancelled.'),
        ]);
    }

    /**
     * Mask an email address for privacy-safe UI display (e.g. "n•••••@gmail.com").
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return '••••••@••••••';
        }

        $name = $parts[0];
        $domain = $parts[1];
        $firstChar = mb_substr($name, 0, 1);

        return $firstChar.'•••••@'.$domain;
    }
}
