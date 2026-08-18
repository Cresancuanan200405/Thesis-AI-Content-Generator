<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'date' => ['required_without:start_date', 'nullable', 'date', 'after:today'],
            'start_date' => ['required_without:date', 'nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'type' => ['nullable', 'in:holiday,seasonal,commercial,custom'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');

            if ($startDate && $endDate && $endDate < $startDate) {
                $validator->errors()->add('end_date', 'The end date must be on or after the start date.');
            }
        });
    }

    /**
     * Get the date field, supporting both 'date' and 'start_date' inputs.
     */
    public function getDate(): string
    {
        return $this->input('date') ?? $this->input('start_date');
    }

    /**
     * Get the type, defaulting to 'custom' if not specified.
     */
    public function getType(): string
    {
        return $this->input('type', 'custom');
    }
}
