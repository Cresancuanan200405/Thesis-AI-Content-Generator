<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        $message = 'Account created successfully. Please verify your email to continue onboarding.';

        if ($request->wantsJson()) {
            return new JsonResponse('', 201);
        }

        return redirect()->intended(Fortify::redirects('register'))
            ->with('success', $message)
            ->with('toast', [
                'type' => 'success',
                'message' => $message,
            ]);
    }
}
