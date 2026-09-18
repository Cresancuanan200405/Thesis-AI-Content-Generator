<?php

namespace App\Http\Requests;

use App\Services\IndustryCategoryArtDirectionService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBusinessProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', Rule::in(IndustryCategoryArtDirectionService::getIndustries())],
            'category' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (! empty($value)) {
                        $industry = $this->input('industry');
                        if ($industry && ! IndustryCategoryArtDirectionService::isValidCombination($industry, $value)) {
                            $fail("The selected category is invalid for the {$industry} industry.");
                        }
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:3000'],
            'business_address' => ['nullable', 'string', 'max:500'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city_municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'registration_type' => ['nullable', 'string', 'max:255'],
            'registration_number' => ['nullable', 'string', 'max:255'],
            'business_permit_number' => ['nullable', 'string', 'max:255'],
            'registration_permit_date' => ['nullable', 'date'],
            'business_registration_document_path' => ['nullable', 'string', 'max:255'],
        ];
    }
}
