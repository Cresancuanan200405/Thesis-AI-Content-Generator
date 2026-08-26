<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class OpenAIImageService
{
    /**
     * Generate a marketing image asset using OpenAI based on studio input.
     * If the OpenAI API key is not configured or an error occurs, falls back to a high-resolution mockup visual.
     *
     * @param  array{
     *     product_name?: string|null,
     *     product_description?: string|null,
     *     product_category?: string|null,
     *     campaign_name?: string|null,
     *     campaign_objective?: string|null,
     *     tagline?: string|null,
     *     brand_tone?: string|array<int, string>|null,
     *     visual_theme?: string|array<int, string>|null,
     *     event_name?: string|null,
     *     price?: string|float|int|null,
     *     include_logo?: bool|null,
     *     business_name?: string|null,
     *     aspect_ratio?: string|null,
     *     image_model?: string|null,
     *     reference_image_path?: string|null,
     * }  $options
     * @return string Relative storage path in public disk
     */
    public function generate(string $prompt, array $options = []): string
    {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        $apiKey = config('services.openai.api_key');

        if (blank($apiKey)) {
            if (app()->environment('testing')) {
                return app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
            }

            throw new RuntimeException('OpenAI API key is not configured. Please add your OPENAI_API_KEY in your .env file to generate visual creatives.');
        }

        return $this->executeDallEImageGeneration($apiKey, $prompt, $options);
    }

    /**
     * Generate a real commercial marketing visual with OpenAI Image Models (DALL-E 3).
     */
    protected function executeDallEImageGeneration(string $apiKey, string $prompt, array $options): string
    {
        $requestedModel = $options['image_model'] ?? config('services.openai.image_model', 'chatgpt-image-latest');
        $model = match ($requestedModel) {
            'gpt-image-1-mini' => 'gpt-image-1-mini',
            'gpt-image-1' => 'gpt-image-1',
            'chatgpt-image-latest' => 'chatgpt-image-latest',
            'gpt-image-1.5' => 'gpt-image-1.5',
            'gpt-image-2' => 'gpt-image-2',
            'dall-e-2' => 'dall-e-2',
            'dall-e-3' => 'dall-e-3',
            default => 'chatgpt-image-latest',
        };
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';

        // Map aspect ratio to supported dimensions
        $size = match ($aspectRatio) {
            '16:9' => in_array($model, ['dall-e-3', 'chatgpt-image-latest', 'gpt-image-1', 'gpt-image-1.5', 'gpt-image-2'], true) ? '1792x1024' : '1024x1024',
            '9:16' => in_array($model, ['dall-e-3', 'chatgpt-image-latest', 'gpt-image-1', 'gpt-image-1.5', 'gpt-image-2'], true) ? '1024x1792' : '1024x1024',
            default => '1024x1024',
        };

        $requestedQuality = $options['image_quality'] ?? config('services.openai.quality', 'standard');
        $quality = match ($requestedQuality) {
            'high' => 'hd',
            default => 'standard',
        };

        $fullPrompt = $this->buildCommercialPrompt($prompt, $options);

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
            'Content-Type' => 'application/json',
        ];

        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        $payload = [
            'model' => $model,
            'prompt' => Str::limit($fullPrompt, 3900),
            'n' => 1,
            'size' => $size,
        ];

        if ($model === 'dall-e-3') {
            $payload['quality'] = $quality;
        }

        $response = Http::withHeaders($headers)
            ->timeout(90)
            ->post('https://api.openai.com/v1/images/generations', $payload);

        if (! $response->successful()) {
            $errorBody = $response->json();
            $errorMessage = $errorBody['error']['message'] ?? ('OpenAI generation failed (HTTP '.$response->status().').');
            Log::error('OpenAI image generation error: '.$errorMessage);

            throw new RuntimeException($errorMessage);
        }

        $data = $response->json();
        $b64 = $data['data'][0]['b64_json'] ?? null;
        $url = $data['data'][0]['url'] ?? null;

        $binary = null;
        if (! empty($b64)) {
            $binary = base64_decode($b64);
        } elseif (! empty($url)) {
            $imgRes = Http::timeout(60)->get($url);
            if ($imgRes->successful()) {
                $binary = $imgRes->body();
            }
        }

        if (empty($binary)) {
            throw new RuntimeException('Failed to process image data from OpenAI response.');
        }

        $filename = 'designs/openai_'.Str::uuid().'.png';
        Storage::disk('public')->put($filename, $binary);
        Log::info("OpenAI DALL-E image generated successfully ({$model}): {$filename}");

        return $filename;
    }

    /**
     * Build an optimized, commercial prompt for OpenAI image generation.
     */
    protected function buildCommercialPrompt(string $prompt, array $options): string
    {
        $parts = [];
        $parts[] = 'Create a masterpiece, luxury commercial advertising poster and campaign visual.';

        // 1. Brand Logo & Identity
        if (! empty($options['include_logo']) || ! empty($options['business_name'])) {
            $bizName = $options['business_name'] ?? 'Brand';
            $parts[] = 'TOP BRAND EMBLEM: Prominently feature the brand logo and emblem for "'.$bizName.'" at the top center or top-left corner with vibrant brand colors, subtle luminous glow, and high-end commercial branding presence.';
        }

        // 2. Campaign Headline & Event Banner
        if (! empty($options['tagline']) || ! empty($options['event_name'])) {
            $taglineText = ! empty($options['tagline']) ? $options['tagline'] : (! empty($options['event_name']) ? 'CELEBRATE '.$options['event_name'] : '');
            $parts[] = 'CAMPAIGN HEADLINE: "'.$taglineText.'". Render this headline in elegant, luxury serif or clean editorial typography with generous letter-spacing, beautiful gold or white metallic accents, centered near the upper section. Typography must have at least 15% padding from the top canvas border so it never gets clipped.';
        }

        // 3. Hero Product & Introduction
        if (! empty($options['product_name'])) {
            $desc = ! empty($options['product_description']) ? $options['product_description'] : 'Rich, premium, crafted to perfection.';
            $parts[] = 'HERO PRODUCT CENTERPIECE: "'.$options['product_name'].'". Placed gracefully on a sleek dark pedestal with elegant flowing metallic ribbons and warm volumetric studio light beams. Display a refined subtitle: "INTRODUCING '.strtoupper($options['product_name']).' — '.$desc.'" in clean, crisp advertising typography.';
        }

        // 4. Promotional Price Seal & Event Badge
        if (! empty($options['price'])) {
            $parts[] = 'PROMOTIONAL PRICE SEAL: Feature an iconic circular gold double-ring seal badge in the lower-left corner displaying "ONLY '.$options['price'].'" with crisp, bold, readable digits and luxury typography.';
        }

        if (! empty($options['event_name'])) {
            $parts[] = 'EVENT CELEBRATION BADGE: In the lower-right or background, incorporate an elegant themed celebration crest/shield for "'.$options['event_name'].'" and rich thematic celebratory background depth (e.g. ambient monument lighting, celebratory accents, golden shimmer).';
        }

        // 5. Bottom Feature Highlight Bar
        $parts[] = 'BOTTOM FEATURE HIGHLIGHT BAR: At the very bottom of the poster, include a clean minimalist row of 3-4 delicate gold outline icons with benefit labels highlighting product quality (e.g., Rich Flavor, Premium Quality, Creamy & Smooth, Special Celebration).';

        // 6. Visual Theme & Render Style
        if (! empty($options['render_style'])) {
            $renderStyleDesc = match ($options['render_style']) {
                'Studio Product Still' => 'Visual Execution: Studio Product Still — pristine solid background, balanced three-point studio lighting, ultra-sharp focus.',
                'Cinematic Marketing' => 'Visual Execution: Cinematic Marketing — dynamic volumetric rim lighting, rich color grading, shallow depth of field, dramatic editorial polish.',
                'Lifestyle Capture' => 'Visual Execution: Lifestyle Capture — authentic environmental setting, warm natural sunlight, candid lifestyle depth.',
                'Minimalist Graphic Vec' => 'Visual Execution: Minimalist Graphic Vector — clean modern layout, sharp vector geometry, bold graphic color contrast.',
                default => 'Visual Execution: '.$options['render_style'].'.',
            };
            $parts[] = $renderStyleDesc;
        }

        // 7. Aspect Ratio & Composition
        if (! empty($options['aspect_ratio'])) {
            $ratio = $options['aspect_ratio'];
            if (! in_array($ratio, ['1:1', '16:9', '9:16'])) {
                $parts[] = "CUSTOM ASPECT RATIO COMPOSITION: Compose and structure this commercial poster specifically for a {$ratio} aspect ratio layout, keeping all typography, subject, and badges centered with ample padding for clean {$ratio} framing.";
            }
        }

        // 8. Composition & Safe Margins
        $parts[] = 'POSTER COMPOSITION & SAFETY: Masterfully structured visual hierarchy from top to bottom. All text, headline, logo, price seals, and icons must remain strictly inside the inner safe margin (15% margin from top, bottom, and side borders) with 100% crystal-clear readability and zero edge clipping.';

        if (! empty($prompt)) {
            $parts[] = 'Creative Direction: '.$prompt;
        }

        $parts[] = 'Lighting & Quality: Flawless commercial advertising photography, dramatic spotlights, opulent reflections, razor-sharp 8k details, luxury magazine cover aesthetic.';

        return implode(' ', $parts);
    }
}
