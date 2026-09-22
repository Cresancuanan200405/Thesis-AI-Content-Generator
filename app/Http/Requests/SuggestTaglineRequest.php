<?php

namespace App\Http\Requests;

use App\Models\Campaign;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class SuggestTaglineRequest extends FormRequest
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
            'catalog_product_ids' => ['nullable', 'array'],
            'catalog_product_ids.*' => ['integer', 'exists:products,id'],
            'custom_products' => ['nullable', 'array'],
            'custom_products.*.name' => ['required_with:custom_products', 'string', 'max:255'],
            'custom_products.*.price' => ['nullable', 'string', 'max:50'],
            'product_name' => ['nullable', 'string', 'max:255'],
            'user_instruction' => ['nullable', 'string'],
            'scene_prompt' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'render_style' => ['nullable', 'string', 'max:255'],
            'visual_theme' => ['nullable'],
            'brand_tone' => ['nullable'],
            'content_style' => ['nullable'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'include_business_name' => ['nullable', 'boolean'],
            'event_id' => ['nullable', 'exists:events,id'],
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
