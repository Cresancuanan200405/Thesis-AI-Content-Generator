<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class SaveBrandOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'logo' => ['nullable', File::image()->max(2048)],
            'primary_color' => ['nullable', 'string', 'nullable', 'regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'accent_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/'],
            'brand_tone' => ['nullable', 'array'],
            'brand_tone.*' => ['string', 'max:255'],
            'typography' => ['nullable', 'string', 'max:255'],
            'brand_guidelines' => ['nullable', 'string', 'max:2000'],
            'visual_preferences' => ['nullable', 'string', 'max:2000'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }
}
