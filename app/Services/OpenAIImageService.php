<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            Log::info('OpenAI API key is not configured yet. Generating high-resolution commercial mockup visual.');

            return app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
        }

        // -----------------------------------------------------------------
        // Attempt 1: OpenAI Image Generation (DALL-E 3 / GPT Image models)
        // -----------------------------------------------------------------
        $imagePath = $this->tryDallEImageGeneration($apiKey, $prompt, $options);
        if ($imagePath !== null) {
            return $imagePath;
        }

        // -----------------------------------------------------------------
        // Attempt 2: OpenAI GPT-4o / GPT-4o-mini Creative SVG Generation
        // -----------------------------------------------------------------
        $aiVisualPath = $this->tryOpenAiSvgGeneration($apiKey, $prompt, $options);
        if ($aiVisualPath !== null) {
            return $aiVisualPath;
        }

        // -----------------------------------------------------------------
        // Fallback: Local High-Resolution Mockup Visual
        // -----------------------------------------------------------------
        return app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
    }

    /**
     * Generate an image with OpenAI Image Models.
     */
    protected function tryDallEImageGeneration(string $apiKey, string $prompt, array $options): ?string
    {
        $requestedModel = $options['image_model'] ?? config('services.openai.image_model', 'dall-e-3');
        $model = match ($requestedModel) {
            'gpt-image-1-mini', 'gpt-image-1', 'chatgpt-image-latest', 'gpt-image-1.5', 'gpt-image-2' => 'dall-e-3',
            default => $requestedModel,
        };
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';

        // Map aspect ratio to supported DALL-E dimensions
        $size = match ($aspectRatio) {
            '16:9' => $model === 'dall-e-3' ? '1792x1024' : '1024x1024',
            '9:16' => $model === 'dall-e-3' ? '1024x1792' : '1024x1024',
            default => '1024x1024',
        };

        $quality = config('services.openai.quality', 'standard');
        $fullPrompt = $this->buildCommercialPrompt($prompt, $options);

        try {
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
                'response_format' => 'b64_json',
            ];

            if ($model === 'dall-e-3') {
                $payload['quality'] = $quality;
            }

            $response = Http::withHeaders($headers)
                ->timeout(60)
                ->post('https://api.openai.com/v1/images/generations', $payload);

            if ($response->successful()) {
                $data = $response->json();
                $b64 = $data['data'][0]['b64_json'] ?? null;
                $url = $data['data'][0]['url'] ?? null;

                $binary = null;
                if (! empty($b64)) {
                    $binary = base64_decode($b64);
                } elseif (! empty($url)) {
                    $imgRes = Http::timeout(30)->get($url);
                    if ($imgRes->successful()) {
                        $binary = $imgRes->body();
                    }
                }

                if (! empty($binary)) {
                    $filename = 'designs/openai_'.Str::uuid().'.png';
                    Storage::disk('public')->put($filename, $binary);
                    Log::info("OpenAI DALL-E visual generated successfully ({$model}): {$filename}");

                    return $filename;
                }
            } else {
                Log::warning('OpenAI DALL-E image generation request failed: '.$response->body());
            }
        } catch (Exception $e) {
            Log::warning('OpenAI DALL-E generation exception: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Generate an advanced SVG design using OpenAI Chat Completions (GPT-4o / GPT-4o-mini).
     */
    protected function tryOpenAiSvgGeneration(string $apiKey, string $prompt, array $options): ?string
    {
        $model = config('services.openai.chat_model', 'gpt-4o-mini');
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';

        [$width, $height] = match ($aspectRatio) {
            '9:16' => [1080, 1920],
            '16:9' => [1920, 1080],
            '4:5' => [1080, 1350],
            '4:3' => [1200, 900],
            default => [1024, 1024],
        };

        $systemPrompt = <<<PROMPT
You are a world-class graphic designer and SVG artist specializing in commercial advertising.
Generate a stunning, fully rendered SVG graphic for a commercial marketing advertisement.
OUTPUT ONLY RAW SVG CODE starting with `<svg viewBox="0 0 {$width} {$height}" xmlns="http://www.w3.org/2000/svg">` and ending with `</svg>`.
Do NOT wrap the output in markdown code blocks, backticks, or any conversational text.
Use rich gradients, drop shadows, crisp modern typography, elegant lighting layers, and polished commercial layouts.
PROMPT;

        $productName = $options['product_name'] ?? 'Product';
        $tagline = $options['tagline'] ?? '';
        $businessName = $options['business_name'] ?? 'Brand';

        $userPrompt = "Create a premium commercial marketing banner for:\n"
            ."Product: {$productName}\n"
            ."Business: {$businessName}\n"
            .($tagline ? "Tagline: {$tagline}\n" : '')
            ."Brief: {$prompt}\n"
            ."Dimensions: {$width}x{$height} (aspect ratio {$aspectRatio}).";

        try {
            $headers = [
                'Authorization' => 'Bearer '.$apiKey,
                'Content-Type' => 'application/json',
            ];

            if ($org = config('services.openai.organization')) {
                $headers['OpenAI-Organization'] = $org;
            }

            $response = Http::withHeaders($headers)
                ->timeout(45)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => $model,
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $userPrompt],
                    ],
                    'temperature' => 0.7,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $content = $data['choices'][0]['message']['content'] ?? '';

                // Extract SVG content
                if (preg_match('/<svg[\s\S]*?<\/svg>/i', $content, $matches)) {
                    $svgContent = $matches[0];
                    $filename = 'designs/openai_svg_'.Str::uuid().'.svg';
                    Storage::disk('public')->put($filename, $svgContent);
                    Log::info("OpenAI GPT SVG visual generated successfully: {$filename}");

                    return $filename;
                }
            }
        } catch (Exception $e) {
            Log::warning('OpenAI SVG generation exception: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Build an optimized, commercial prompt for OpenAI image generation.
     */
    protected function buildCommercialPrompt(string $prompt, array $options): string
    {
        $parts = [];
        $parts[] = 'Ultra-high-definition, commercial advertising photography.';

        if (! empty($options['product_name'])) {
            $parts[] = 'Hero subject: '.$options['product_name'].'.';
        }

        if (! empty($options['product_description'])) {
            $parts[] = 'Product details: '.$options['product_description'].'.';
        }

        if (! empty($options['business_name'])) {
            $parts[] = 'Brand: '.$options['business_name'].'.';
        }

        if (! empty($options['tagline'])) {
            $parts[] = 'Campaign message: "'.$options['tagline'].'".';
        }

        if (! empty($options['event_name'])) {
            $parts[] = 'Holiday / Event context: '.$options['event_name'].'.';
        }

        if (! empty($options['render_style'])) {
            $renderStyleDesc = match ($options['render_style']) {
                'Studio Product Still' => 'Render style: Studio Product Still — forces sharp focus, clean solid backdrops, and balanced high-end studio lighting.',
                'Cinematic Marketing' => 'Render style: Cinematic Marketing — adds dynamic volumetric lighting, dramatic depth of field, and a premium editorial look.',
                'Lifestyle Capture' => 'Render style: Lifestyle Capture — simulates realistic environmental context and natural lighting as if taken by a professional on location.',
                'Minimalist Graphic Vec' => 'Render style: Minimalist Graphic Vector — simplifies elements into modern flat illustrations, stark layouts, and sharp vector geometries.',
                default => 'Render style: '.$options['render_style'].'.',
            };
            $parts[] = $renderStyleDesc;
        }

        $parts[] = 'Creative direction: '.$prompt;
        $parts[] = 'Lighting: Professional studio lighting, soft shadows, sharp focus, 8k resolution, vibrant commercial aesthetics, award-winning advertising quality.';

        return implode(' ', $parts);
    }
}
