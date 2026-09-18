<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\EmailChangeVerificationNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class EmailChangeController extends Controller
{
    /**
     * Step 1: Verify the authenticated user's current identity.
     */
    public function verifyIdentity(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

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
