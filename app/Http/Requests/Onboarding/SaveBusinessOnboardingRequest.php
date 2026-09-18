<?php

namespace App\Http\Requests\Onboarding;

use App\Services\IndustryCategoryArtDirectionService;
use App\Services\LegalDocumentService;
use App\Services\PendingOnboardingService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveBusinessOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->user() !== null) {
            return true;
        }

        return app(PendingOnboardingService::class)->getPendingOnboarding($this) !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', Rule::in(IndustryCategoryArtDirectionService::getIndustries())],
            'category' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    $industry = $this->input('industry');
                    if ($industry && ! IndustryCategoryArtDirectionService::isValidCombination($industry, $value)) {
                        $fail("The selected category is invalid for the {$industry} industry.");
                    }
                },
            ],
            'description' => ['nullable', 'string', 'max:2000'],
            'business_address' => ['nullable', 'string', 'max:500'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city_municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'registration_type' => ['nullable', 'string', 'max:255'],
            'registration_number' => ['nullable', 'string', 'max:255'],
            'business_permit_number' => ['nullable', 'string', 'max:255'],
            'registration_permit_date' => ['nullable', 'date'],
            'business_registration_document' => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg,webp', 'max:5120'],
            'business_registration_document_path' => ['nullable', 'string', 'max:255'],
            'sub_step' => ['nullable', 'integer', 'between:1,3'],
        ];

        if (! $this->has('sub_step') && $this->filled('description')) {
            $rules['terms_of_service'] = [$this->hasAccepted('terms_of_service') ? 'nullable' : 'required', 'accepted'];
            $rules['privacy_notice'] = [$this->hasAccepted('privacy_notice') ? 'nullable' : 'required', 'accepted'];
            $rules['content_ip_responsibility'] = [$this->hasAccepted('content_ip_responsibility') ? 'nullable' : 'required', 'accepted'];
            $rules['ai_content_responsibility'] = [$this->hasAccepted('ai_content_responsibility') ? 'nullable' : 'required', 'accepted'];
        } else {
            $rules['terms_of_service'] = ['sometimes', 'accepted'];
            $rules['privacy_notice'] = ['sometimes', 'accepted'];
            $rules['content_ip_responsibility'] = ['sometimes', 'accepted'];
            $rules['ai_content_responsibility'] = ['sometimes', 'accepted'];
        }

        return $rules;
    }

    protected function hasAccepted(string $docType): bool
    {
        if ($this->user()) {
            return $this->user()->legalAcceptances()
                ->where('document_type', $docType)
                ->where('document_version', LegalDocumentService::CURRENT_VERSION)
                ->exists();
        }

        $pending = app(PendingOnboardingService::class)->getPendingOnboarding($this);
        if ($pending) {
            $accepted = $pending->accepted_legal_documents ?? [];

            return in_array($docType, $accepted, true);
        }

        return false;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'terms_of_service.accepted' => 'You must accept the Terms of Service to continue.',
            'terms_of_service.required' => 'You must accept the Terms of Service to continue.',
            'privacy_notice.accepted' => 'You must accept the Privacy Notice to continue.',
            'privacy_notice.required' => 'You must accept the Privacy Notice to continue.',
            'content_ip_responsibility.accepted' => 'You must confirm Content and IP Responsibility to continue.',
            'content_ip_responsibility.required' => 'You must confirm Content and IP Responsibility to continue.',
            'ai_content_responsibility.accepted' => 'You must confirm AI-Generated Content Responsibility to continue.',
            'ai_content_responsibility.required' => 'You must confirm AI-Generated Content Responsibility to continue.',
        ];
    }
}
