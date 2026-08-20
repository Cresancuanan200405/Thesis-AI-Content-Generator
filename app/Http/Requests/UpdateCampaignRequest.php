<?php

namespace App\Http\Requests;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];
        if ($this->has('product_id')) {
            $merge['product_id'] = $this->filled('product_id') ? (int) $this->input('product_id') : null;
        }
        if ($this->has('event_id')) {
            $merge['event_id'] = $this->filled('event_id') ? (int) $this->input('event_id') : null;
        }
        if ($this->has('start_date')) {
            $merge['start_date'] = $this->filled('start_date') ? $this->input('start_date') : null;
        }
        if ($this->has('end_date')) {
            $merge['end_date'] = $this->filled('end_date') ? $this->input('end_date') : null;
        }
        if (! empty($merge)) {
            $this->merge($merge);
        }
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'product_id' => ['nullable', 'exists:products,id'],
            'event_id' => ['nullable', 'exists:events,id'],
            'objective' => ['nullable', 'string', 'max:2000'],
            'target_audience' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:draft,scheduled,active,completed'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();

            if (! $user) {
                return;
            }

            $campaign = $this->route('campaign');

            if ($campaign && ! $user->can('update', $campaign)) {
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
        });
    }
}
