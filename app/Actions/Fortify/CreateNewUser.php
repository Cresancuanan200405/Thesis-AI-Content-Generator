<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\User;
use App\Notifications\WelcomeEmailNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
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

        $user = User::create([
            'name' => $normalizedUsername,
            'username' => $normalizedUsername,
            'email' => strtolower(trim((string) $input['email'])),
            'password' => $input['password'],
            'onboarding_completed' => false,
            'onboarding_completed_at' => null,
        ]);

        try {
            $user->notify(new WelcomeEmailNotification);
        } catch (\Throwable $e) {
            Log::warning('Welcome email notification could not be sent: '.$e->getMessage());
        }

        return $user;
    }
}
