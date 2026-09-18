<?php

namespace App\Http\Controllers\Settings;

use App\Concerns\InteractsWithUserSessions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use App\Services\NotificationService;
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
    use InteractsWithUserSessions;

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
}
