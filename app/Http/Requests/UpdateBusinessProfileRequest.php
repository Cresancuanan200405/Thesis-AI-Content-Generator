<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessProfileRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:3000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif,svg', 'max:5120'],
            'remove_logo' => ['nullable', 'boolean'],
        ];
    }
}
