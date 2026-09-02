<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class GeneratorRequest extends FormRequest
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
            'product_id' => ['nullable', 'exists:products,id'],
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'event_id' => ['required', 'exists:events,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'marketing_goal' => ['required', 'string', 'max:2000'],
            'content_style' => ['nullable', 'array'],
            'content_style.*' => ['string', 'max:255'],
            'brand_tone' => ['nullable', 'array'],
            'brand_tone.*' => ['string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_mode' => ['nullable', 'in:auto,manual,ask_me'],
            'unique_selling_point' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'prompt' => ['nullable', 'string', 'max:4000'],
            'image_prompt' => ['nullable', 'string', 'max:4000'],
            'scene_prompt' => ['nullable', 'string', 'max:4000'],
            'user_prompt' => ['nullable', 'string', 'max:4000'],
            'product_description' => ['nullable', 'string', 'max:4000'],
            'visual_theme' => ['nullable'],
            'visual_theme.*' => ['string', 'max:255'],
            'render_style' => ['nullable', 'string', 'max:255'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'image_model' => ['nullable', 'string', 'max:50'],
            'image_quality' => ['nullable', 'string', 'in:low,medium,high'],
            'include_business_name' => ['nullable', 'boolean'],
            'business_name' => ['nullable', 'string', 'max:255'],
            'reference_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
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
                    $validator->errors()->add('event_id', 'The selected event does not belong to your account or it is not a valid global event.');
                }
            }
        });
    }
}
