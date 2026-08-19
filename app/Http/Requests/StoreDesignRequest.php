<?php

namespace App\Http\Requests;

use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreDesignRequest extends FormRequest
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
            'product_name' => ['required', 'string', 'max:255'],
            'prompt' => ['nullable', 'string', 'max:3000'],
            'image_prompt' => ['nullable', 'string', 'max:3000'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'event_id' => ['nullable', 'exists:events,id'],
            'product_id' => ['nullable', 'exists:products,id'],
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'brand_tone' => ['nullable'],
            'brand_tone.*' => ['string', 'max:255'],
            'visual_theme' => ['nullable'],
            'visual_theme.*' => ['string', 'max:255'],
            'content_style' => ['nullable'],
            'content_style.*' => ['string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_mode' => ['nullable', 'string', 'max:50'],
            'include_logo' => ['nullable', 'boolean'],
            'aspect_ratio' => ['nullable', 'string', 'in:1:1,9:16,16:9,4:5,4:3'],
            'reference_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:5120'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();

            if (! $user) {
                return;
            }

            if ($this->filled('product_id')) {
                $product = Product::query()->whereKey($this->input('product_id'))->first();

                if (! $product || $product->business_id !== $user->business()->value('id')) {
                    $validator->errors()->add('product_id', 'The selected product does not belong to your business.');
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
        });
    }
}
