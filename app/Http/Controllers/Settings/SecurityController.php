<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class SecurityController extends Controller
{
    /**
     * Show the user's security settings page.
     */
    public function edit(TwoFactorAuthenticationRequest $request): Response
    {
        $props = [
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'sessions' => $this->getSessions($request),
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $request->ensureStateIsValid();

            $props['twoFactorEnabled'] = $request->user()->hasEnabledTwoFactorAuthentication();
            $props['requiresConfirmation'] = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm');
        }

        return Inertia::render('settings/security', $props);
    }

    /**
     * Update the user's password.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->update([
            'password' => $request->password,
        ]);

        NotificationService::notifySecurity(
            $request->user(),
            'Password Changed',
            'Your account password was successfully updated.',
            route('security.edit')
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return back()->with('success', 'Password updated successfully.');
    }

    /**
     * Log out from other browser sessions.
     */
    public function destroyOtherSessions(Request $request): RedirectResponse
    {
        if (! Hash::check($request->input('password'), $request->user()->password)) {
            throw ValidationException::withMessages([
                'password' => [__('This password does not match our records.')],
            ]);
        }

        Auth::logoutOtherDevices($request->input('password'));

        if (config('session.driver') === 'database') {
            DB::table('sessions')
                ->where('user_id', $request->user()->getAuthIdentifier())
                ->where('id', '!=', $request->session()->getId())
                ->delete();
        }

        NotificationService::notifySecurity(
            $request->user(),
            'Other Sessions Terminated',
            'All other active browser sessions were logged out.',
            route('security.edit')
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Logged out of other browser sessions.')]);

        return back()->with('success', 'Logged out of other browser sessions successfully.');
    }

    /**
     * Get active browser sessions for the user.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getSessions(Request $request): array
    {
        if (config('session.driver') !== 'database') {
            return [];
        }

        $sessions = DB::table('sessions')
            ->where('user_id', $request->user()->getAuthIdentifier())
            ->orderBy('last_activity', 'desc')
            ->get();

        return $sessions->map(function ($session) use ($request) {
            $agent = $this->createAgent($session->user_agent);

            return [
                'id' => $session->id,
                'ip_address' => $session->ip_address,
                'is_current_device' => $session->id === $request->session()->getId(),
                'platform' => $agent['platform'],
                'browser' => $agent['browser'],
                'is_desktop' => $agent['is_desktop'],
                'last_active' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
            ];
        })->toArray();
    }

    /**
     * Parse simple user agent metadata.
     *
     * @return array{platform: string, browser: string, is_desktop: bool}
     */
    protected function createAgent(?string $userAgent): array
    {
        if (empty($userAgent)) {
            return [
                'platform' => 'Unknown Platform',
                'browser' => 'Unknown Browser',
                'is_desktop' => true,
            ];
        }

        $platform = 'Unknown Platform';
        if (str_contains($userAgent, 'Windows')) {
            $platform = 'Windows';
        } elseif (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS X')) {
            $platform = 'macOS';
        } elseif (str_contains($userAgent, 'Linux')) {
            $platform = 'Linux';
        } elseif (str_contains($userAgent, 'Android')) {
            $platform = 'Android';
        } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $platform = 'iOS';
        }

        $browser = 'Unknown Browser';
        if (str_contains($userAgent, 'Chrome') && ! str_contains($userAgent, 'Edg')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Safari') && ! str_contains($userAgent, 'Chrome')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Edg')) {
            $browser = 'Edge';
        }

        $isDesktop = ! (str_contains($userAgent, 'Mobile') || str_contains($userAgent, 'Android') || str_contains($userAgent, 'iPhone'));

        return [
            'platform' => $platform,
            'browser' => $browser,
            'is_desktop' => $isDesktop,
        ];
    }
}
