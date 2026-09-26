<?php

namespace App\Http\Requests;

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Storage;

class StoreDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $cleanPrice = null;
        if ($this->filled('price')) {
            $rawPrice = (string) $this->input('price');
            $numeric = preg_replace('/[^0-9.]/', '', $rawPrice);
            $cleanPrice = $numeric !== '' ? (float) $numeric : null;
        }

        $merges = [
            'price' => $cleanPrice,
            'event_id' => $this->filled('event_id') ? (int) $this->input('event_id') : null,
            'product_id' => $this->filled('product_id') ? (int) $this->input('product_id') : null,
            'campaign_id' => $this->filled('campaign_id') ? (int) $this->input('campaign_id') : null,
        ];

        if ($this->filled('design_id')) {
            $existing = Design::find($this->input('design_id'));
            if ($existing) {
                if (! $this->filled('campaign_id') && $existing->campaign_id) {
                    $merges['campaign_id'] = $existing->campaign_id;
                }
                if (! $this->filled('product_name') && $existing->product_name) {
                    $merges['product_name'] = $existing->product_name;
                }
            }
        }

        if ($this->has('include_prices')) {
            $merges['include_prices'] = filter_var($this->input('include_prices'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($this->has('include_tagline')) {
            $merges['include_tagline'] = filter_var($this->input('include_tagline'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($this->has('include_business_name')) {
            $merges['include_business_name'] = filter_var($this->input('include_business_name'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($this->has('custom_products') && is_array($this->input('custom_products'))) {
            $cleaned = [];
            foreach ($this->input('custom_products') as $item) {
                if (is_array($item)) {
                    if (isset($item['price']) && $item['price'] !== null && $item['price'] !== '') {
                        $raw = (string) $item['price'];
                        $num = preg_replace('/[^0-9.]/', '', $raw);
                        $item['price'] = $num !== '' ? (float) $num : null;
                    }
                    $cleaned[] = $item;
                }
            }
            $merges['custom_products'] = $cleaned;
        }

        $this->merge($merges);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'product_name' => ['required', 'string', 'max:255'],
            'prompt' => ['nullable', 'string', 'max:32000'],
            'image_prompt' => ['nullable', 'string', 'max:32000'],
            'scene_prompt' => ['nullable', 'string', 'max:32000'],
            'user_prompt' => ['nullable', 'string', 'max:32000'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'event_id' => ['nullable', 'exists:events,id'],
            'product_id' => ['nullable', 'exists:products,id'],
            'catalog_product_ids' => ['nullable', 'array'],
            'catalog_product_ids.*' => ['integer', 'exists:products,id'],
            'custom_products' => ['nullable', 'array'],
            'custom_products.*.name' => ['required_with:custom_products', 'string', 'max:255'],
            'custom_products.*.price' => ['nullable', 'numeric', 'min:0'],
            'custom_products.*.description' => ['nullable', 'string', 'max:1000'],
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'brand_tone' => ['nullable'],
            'brand_tone.*' => ['string', 'max:255'],
            'visual_theme' => ['nullable'],
            'visual_theme.*' => ['string', 'max:255'],
            'content_style' => ['nullable'],
            'content_style.*' => ['string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_mode' => ['nullable', 'string', 'max:50'],
            'include_tagline' => ['nullable', 'boolean'],
            'include_prices' => ['nullable', 'boolean'],
            'image_model' => ['nullable', 'string', 'max:50'],
            'image_quality' => ['nullable', 'string', 'in:low,medium,high'],
            'include_business_name' => ['nullable', 'boolean'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'aspect_ratio' => ['nullable', 'string', 'in:1:1,9:16,16:9,4:5,4:3'],
            'reference_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'reference_image_paths' => ['nullable', 'array'],
            'reference_image_paths.*' => ['string', 'max:500'],
            'generated_image_path' => ['nullable', 'string', 'max:500'],
            'render_style' => ['nullable', 'string', 'max:100'],
            'design_treatment' => ['nullable', 'string', 'max:100'],
            'copy_emphasis' => ['nullable', 'string', 'max:100'],
            'typography_layout' => ['nullable', 'string', 'max:100'],
            'composition_type' => ['nullable', 'string', 'max:100'],
            'camera_viewpoint' => ['nullable', 'string', 'max:100'],
            'lighting_profile' => ['nullable', 'string', 'max:100'],
            'scene_family' => ['nullable', 'string', 'max:100'],
            'environment_family' => ['nullable', 'string', 'max:100'],
            'prop_profile' => ['nullable', 'string', 'max:100'],
            'creative_concept' => ['nullable', 'string', 'max:2000'],
            'visual_strategy' => ['nullable', 'string', 'max:2000'],
            'creative_fingerprint' => ['nullable', 'string', 'max:100'],
            'generation_mode' => ['nullable', 'string', 'max:50'],
            'generation_metadata' => ['nullable'],
            'status' => ['nullable', 'string', 'in:draft,final,completed'],
            'design_id' => ['nullable', 'integer', 'exists:designs,id'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();

            if (! $user) {
                return;
            }

            $businessId = $user->business()->value('id');

            if ($this->filled('product_id')) {
                $product = Product::query()->whereKey($this->input('product_id'))->first();

                if (! $product || $product->business_id !== $businessId) {
                    $validator->errors()->add('product_id', 'The selected product does not belong to your business.');
                }
            }

            if ($this->filled('catalog_product_ids')) {
                $catalogIds = array_filter((array) $this->input('catalog_product_ids'));
                if (! empty($catalogIds)) {
                    $foreignProductsCount = Product::query()
                        ->whereIn('id', $catalogIds)
                        ->where('business_id', '!=', $businessId)
                        ->count();

                    if ($foreignProductsCount > 0) {
                        $validator->errors()->add('catalog_product_ids', 'One or more selected products do not belong to your business.');
                    }
                }
            }

            if ($this->filled('event_id')) {
                $event = Event::query()->whereKey($this->input('event_id'))->first();

                if (! $event || (! $event->is_global && $event->user_id !== $user->id)) {
                    $validator->errors()->add('event_id', 'The selected event must be either a global event or one of your own events.');
                }
            }

            if ($this->filled('campaign_id')) {
                $campaign = Campaign::query()->whereKey($this->input('campaign_id'))->first();

                if (! $campaign || $campaign->user_id !== $user->id) {
                    $validator->errors()->add('campaign_id', 'The selected campaign does not belong to your account.');
                }
            }

            if ($this->filled('design_id')) {
                $design = Design::query()->whereKey($this->input('design_id'))->first();

                if (! $design || $design->user_id !== $user->id) {
                    $validator->errors()->add('design_id', 'The specified design does not belong to your account.');
                }
            }

            if ($this->filled('generated_image_path')) {
                $path = (string) $this->input('generated_image_path');

                if (str_contains($path, '..') || str_starts_with($path, '/') || str_starts_with($path, '\\')) {
                    $validator->errors()->add('generated_image_path', 'The generated image path is invalid.');
                } elseif (! str_starts_with($path, 'designs/') && ! str_starts_with($path, 'generation-requests/')) {
                    $validator->errors()->add('generated_image_path', 'The generated image path must reside in an authorized designs directory.');
                } elseif (! Storage::exists($path)) {
                    $validator->errors()->add('generated_image_path', 'The specified generated image file could not be found in storage.');
                }
            }
        });
    }
}
