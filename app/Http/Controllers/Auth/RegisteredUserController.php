<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Services\PendingOnboardingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegisteredUserController extends Controller
{
    use PasswordValidationRules;

    public function store(Request $request, PendingOnboardingService $pendingService): RedirectResponse
    {
        $input = $request->all();
        $username = trim((string) ($input['username'] ?? ''));

        Validator::make($input, [
            'username' => [
                'required',
                'string',
                'max:255',
                'min:3',
                'unique:users,username',
                'regex:/^[A-Za-z0-9._-]+$/',
            ],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
        ], [
            'username.regex' => 'Username may only contain letters, numbers, dots, underscores, and dashes.',
        ])->validate();

        $normalizedUsername = strtolower($username);
        $normalizedEmail = strtolower(trim((string) $input['email']));

        $pendingService->startFromRegistration([
            'username' => $normalizedUsername,
            'email' => $normalizedEmail,
            'password' => $input['password'],
        ], $request);

        $message = 'Account created successfully. Please verify your email to continue onboarding.';

        return redirect()->route('verification.notice')
            ->with('success', $message)
            ->with('toast', [
                'type' => 'success',
                'message' => $message,
            ]);
    }
}
