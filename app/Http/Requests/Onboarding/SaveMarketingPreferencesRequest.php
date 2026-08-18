<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;

class SaveMarketingPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'target_audience' => ['nullable', 'string', 'max:2000'],
            'unique_selling_point' => ['nullable', 'string', 'max:2000'],
            'content_style' => ['nullable', 'array'],
            'content_style.*' => ['string', 'max:255'],
            'default_tagline_behavior' => ['nullable', 'string', 'max:255'],
            'marketing_preferences' => ['nullable', 'array'],
            'marketing_preferences.*' => ['string', 'max:255'],
        ];
    }
}
