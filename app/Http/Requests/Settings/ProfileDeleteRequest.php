<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileDeleteRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->user();

        // If the user does not have a usable password (e.g. Google OAuth account),
        // require explicit permanent deletion confirmation keyword rather than an unusable local password.
        if ($user && ! $user->hasUsablePassword()) {
            return [
                'confirmation' => ['required', 'string', 'in:DELETE'],
            ];
        }

        return [
            'password' => $this->currentPasswordRules(),
            'confirmation' => ['nullable', 'string', 'in:DELETE'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'confirmation.required' => __('Please type DELETE to confirm permanent account deletion.'),
            'confirmation.in' => __('Please type DELETE to confirm permanent account deletion.'),
        ];
    }
}
