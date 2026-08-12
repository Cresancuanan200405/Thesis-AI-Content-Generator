<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class OpenAIImageService
{
    public function generate(string $prompt): string
    {
        $apiKey = config('services.openai.api_key');

        if (blank($apiKey)) {
            throw new RuntimeException('OpenAI image generation is not configured.');
        }

        $response = Http::withToken($apiKey)
            ->acceptJson()
            ->timeout(60)
            ->post('https://api.openai.com/v1/images/generations', [
                'model' => config('services.openai.model', 'gpt-image-1'),
                'prompt' => $prompt,
                'size' => config('services.openai.size', '1024x1024'),
                'quality' => config('services.openai.quality', 'high'),
                'response_format' => config('services.openai.format', 'b64_json'),
            ]);

        if ($response->failed()) {
            throw new RuntimeException('OpenAI image generation failed. Please try again.');
        }

        $payload = $response->json('data');

        if (! is_array($payload) || empty($payload[0]['b64_json'])) {
            throw new RuntimeException('OpenAI returned an invalid image payload.');
        }

        $imageContent = base64_decode($payload[0]['b64_json'], true);

        if ($imageContent === false) {
            throw new RuntimeException('OpenAI returned an unreadable image payload.');
        }

        $path = 'generated-images/'.now()->format('Y/m/d').'/'.md5($prompt.time()).'.png';

        Storage::disk('public')->put($path, $imageContent);

        return $path;
    }
}
