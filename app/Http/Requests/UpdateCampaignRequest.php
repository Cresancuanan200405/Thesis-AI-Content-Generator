<?php

namespace App\Http\Requests;

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
            'name' => ['required', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
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
        });
    }
}
