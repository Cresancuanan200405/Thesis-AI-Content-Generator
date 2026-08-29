<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Laravel\Fortify\Fortify;

class LogoutResponse implements LogoutResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        $message = 'Your account was signed out successfully.';

        if ($request->wantsJson()) {
            return new JsonResponse(['message' => $message], 204);
        }

        return redirect(Fortify::redirects('logout', '/'))
            ->with('success', $message)
            ->with('toast', [
                'type' => 'success',
                'title' => 'Signed out successfully',
                'message' => $message,
            ]);
    }
}
