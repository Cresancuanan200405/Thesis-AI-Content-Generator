<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Fortify;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return new JsonResponse(['message' => 'Signed in successfully.'], 200);
        }

        $user = $request->user();

        if ($user && ! $user->onboarding_completed) {
            return redirect()->route('onboarding.show');
        }

        if ($user && ! $user->hasCompletedPersonalInformation()) {
            return redirect()->route('profile.edit');
        }

        // NotificationService::recordLogin handles the authentic semantic in-app notification.
        return redirect()->intended(Fortify::redirects('login', '/dashboard'));
    }
}
