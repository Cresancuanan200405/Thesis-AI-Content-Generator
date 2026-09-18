<?php

namespace App\Http\Requests\Onboarding;

use App\Services\PendingOnboardingService;
use Illuminate\Foundation\Http\FormRequest;

class SavePersonalOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->user() !== null) {
            return true;
        }

        return app(PendingOnboardingService::class)->getPendingOnboarding($this) !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:20'],
            'mobile_number' => ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'first_name.required' => 'First name is required to complete your personal profile.',
            'last_name.required' => 'Last name is required to complete your personal profile.',
        ];
    }
}
