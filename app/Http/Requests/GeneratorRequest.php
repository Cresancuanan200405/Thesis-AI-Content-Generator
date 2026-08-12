<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class GeneratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['nullable', 'exists:products,id'],
            'event_id' => ['nullable', 'exists:events,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'marketing_goal' => ['required', 'string', 'max:2000'],
            'content_style' => ['nullable', 'array'],
            'content_style.*' => ['string', 'max:255'],
            'brand_tone' => ['nullable', 'array'],
            'brand_tone.*' => ['string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_mode' => ['nullable', 'in:auto,manual,ask_me'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'unique_selling_point' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'reference_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function withValidator($validator): void
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
                $event = \App\Models\Event::query()->whereKey($this->input('event_id'))->first();

                if (! $event || (! $event->is_global && $event->user_id !== $user->id)) {
                    $validator->errors()->add('event_id', 'The selected event does not belong to your account or it is not a valid global event.');
                }
            }
        });
    }
}
