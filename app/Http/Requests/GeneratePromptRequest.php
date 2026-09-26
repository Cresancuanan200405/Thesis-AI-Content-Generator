<?php

namespace App\Http\Requests;

use App\Models\Campaign;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class GeneratePromptRequest extends FormRequest
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
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'generation_mode' => ['nullable', 'string', 'in:automatic,manual'],
            'previous_concepts' => ['nullable', 'array'],
            'previous_concepts.*' => ['string', 'max:2000'],
            'catalog_product_ids' => ['nullable', 'array'],
            'catalog_product_ids.*' => ['integer', 'exists:products,id'],
            'custom_products' => ['nullable', 'array'],
            'custom_products.*.name' => ['required_with:custom_products', 'string', 'max:255'],
            'custom_products.*.price' => ['nullable', 'string', 'max:50'],
            'user_instruction' => ['nullable', 'string', 'max:1000'],
            'render_style' => ['nullable', 'string', 'max:255'],
            'design_treatment' => ['nullable', 'string', 'max:100'],
            'copy_emphasis' => ['nullable', 'string', 'max:100'],
            'visual_theme' => ['nullable'],
            'brand_tone' => ['nullable'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'require_tagline' => ['nullable', 'boolean'],
            'include_tagline' => ['nullable', 'boolean'],
            'include_prices' => ['nullable', 'boolean'],
            'target' => ['nullable', 'string', 'max:50'],
            'include_business_name' => ['nullable', 'boolean'],
            'has_reference_image' => ['nullable', 'boolean'],
            'event_id' => ['nullable', 'exists:events,id'],
            'show_event_text' => ['nullable', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();

            if (! $user) {
                return;
            }

            // 1. Campaign Ownership & Tenant Isolation
            $campaign = Campaign::query()->whereKey($this->input('campaign_id'))->first();
            if (! $campaign || $campaign->user_id !== $user->id) {
                $validator->errors()->add('campaign_id', 'The selected campaign does not belong to your account.');

                return;
            }

            // 2. Campaign Event Preservation (Read-Only Context)
            // Client cannot substitute a different event than what is linked to the campaign
            if ($this->filled('event_id')) {
                $requestedEventId = (int) $this->input('event_id');
                $campaignEventId = $campaign->event_id ? (int) $campaign->event_id : null;

                if ($requestedEventId !== $campaignEventId) {
                    $validator->errors()->add('event_id', 'Campaign events are read-only campaign context and cannot be modified.');
                }
            }

            // 3. Product Ownership & Tenant Isolation
            $businessId = $user->business()->value('id');
            $catalogIds = $this->input('catalog_product_ids', []);

            if (! empty($catalogIds) && is_array($catalogIds)) {
                $products = Product::query()->whereIn('id', $catalogIds)->get();

                foreach ($products as $prod) {
                    if ($prod->business_id !== $businessId) {
                        $validator->errors()->add('catalog_product_ids', 'One or more selected products do not belong to your business.');
                        break;
                    }
                }
            }
        });
    }
}
