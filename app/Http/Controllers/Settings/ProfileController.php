<?php

namespace App\Http\Controllers\Settings;

use App\Concerns\InteractsWithUserSessions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class ProfileController extends Controller
{
    use InteractsWithUserSessions;

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $pendingChange = Cache::get("pending_email_change:{$user->id}");

        $props = [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'hasPassword' => filled($user->password),
            'providerName' => $user->provider_name,
            'twoFactorEnabled' => $user->hasEnabledTwoFactorAuthentication(),
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
            'sessions' => $this->getSessions($request),
            'hasPendingEmailChange' => ! empty($pendingChange),
            'pendingEmail' => $pendingChange['new_email'] ?? null,
        ];

        return Inertia::render('settings/profile', $props);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        unset($validated['email']); // Email changes must go through the secure email change flow

        $request->user()->fill($validated);
        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit')->with('success', 'Profile updated successfully.');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
