<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class OpenAIImageService
{
    /**
     * @var array<string, mixed>|null
     */
    protected ?array $lastReferenceBlueprint = null;

    /**
     * @var array<string, mixed>|null
     */
    protected ?array $lastGenerationMetadata = null;

    public function __construct(
        protected ReferenceImageAnalyzer $referenceAnalyzer,
        protected OpenAIModelRegistry $modelRegistry,
        protected ModularPromptOrchestrator $promptOrchestrator
    ) {}

    /**
     * Generate a marketing visual using the Product-First OpenAI pipeline.
     *
     * @param  array{
     *     product_name?: string|null,
     *     product_description?: string|null,
     *     product_category?: string|null,
     *     product_image_url?: string|null,
     *     campaign_name?: string|null,
     *     campaign_objective?: string|null,
     *     tagline?: string|null,
     *     brand_tone?: string|array<int, string>|null,
     *     visual_theme?: string|array<int, string>|null,
     *     event_name?: string|null,
     *     price?: string|float|int|null,
     *     include_business_name?: bool|null,
     *     business_name?: string|null,
     *     business_industry?: string|null,
     *     aspect_ratio?: string|null,
     *     image_model?: string|null,
     *     image_quality?: string|null,
     *     reference_image_path?: string|null,
     *     generation_mode?: string|null,
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

        return $this->executeProductFirstGeneration($apiKey, $prompt, $options);
    }

    /**
     * Get the latest reference design blueprint extracted by Vision (supporting metadata).
     *
     * @return array<string, mixed>|null
     */
    public function getLastReferenceBlueprint(): ?array
    {
        return $this->lastReferenceBlueprint;
    }

    /**
     * Get metadata of the latest generation execution.
     *
     * @return array<string, mixed>|null
     */
    public function getLastGenerationMetadata(): ?array
    {
        return $this->lastGenerationMetadata;
    }

    /**
     * Execute the Product-First Image Generation with the selected model.
     */
    protected function executeProductFirstGeneration(string $apiKey, string $userPrompt, array $options): string
    {
        $startTime = microtime(true);
        $this->lastReferenceBlueprint = null;
        $requestedModel = $options['image_model'] ?? 'gpt-image-2';
        $modelSpec = $this->modelRegistry->getModel($requestedModel);
        $apiModel = $modelSpec['api_model_id'];
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $generationMode = $options['generation_mode'] ?? 'PRODUCT_PRESERVING';

        // 1. Resolve Aspect Ratio to supported dimensions
        $size = match ($aspectRatio) {
            '16:9', '4:3' => in_array($apiModel, ['gpt-image-2', 'chatgpt-image-latest', 'gpt-image-1.5', 'gpt-image-1', 'dall-e-3'], true) ? '1792x1024' : '1024x1024',
            '9:16', '4:5' => in_array($apiModel, ['gpt-image-2', 'chatgpt-image-latest', 'gpt-image-1.5', 'gpt-image-1', 'dall-e-3'], true) ? '1024x1792' : '1024x1024',
            default => '1024x1024',
        };

        // 2. Vision Analysis as Supporting Metadata (Does NOT replace the actual image)
        $referenceImagePath = $options['reference_image_path'] ?? null;
        $visionBlueprint = null;
        if (! empty($referenceImagePath) && Storage::disk('public')->exists($referenceImagePath)) {
            $visionBlueprint = $this->referenceAnalyzer->analyze($referenceImagePath);
            $this->lastReferenceBlueprint = $visionBlueprint;
        }

        // 3. Modular Prompt Orchestration with strict priority
        $orchestratedOptions = array_merge($options, [
            'user_prompt' => $userPrompt,
            'aspect_ratio' => $aspectRatio,
        ]);
        $fullPrompt = $this->promptOrchestrator->orchestrate($orchestratedOptions, null, $visionBlueprint);

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
        ];
        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        // 4. Primary Image Input Execution Pipeline
        $binary = null;
        $generationMethod = 'text_to_image';

        $hasImageInput = ! empty($referenceImagePath) && Storage::disk('public')->exists($referenceImagePath);

        if ($hasImageInput && $modelSpec['supports_image_input']) {
            try {
                $fullDiskPath = Storage::disk('public')->path($referenceImagePath);
                $fileContents = file_get_contents($fullDiskPath);
                $fileName = basename($referenceImagePath);

                // Send actual product image as multipart file to OpenAI Image Edits API
                $response = Http::withHeaders($headers)
                    ->timeout(90)
                    ->attach('image', $fileContents, $fileName)
                    ->post('https://api.openai.com/v1/images/edits', [
                        'model' => $apiModel,
                        'prompt' => Str::limit($fullPrompt, 3900),
                        'n' => 1,
                        'size' => $size,
                    ]);

                if ($response->successful()) {
                    $binary = $this->extractBinaryFromResponse($response->json());
                    $generationMethod = 'image_to_image_edit';
                } else {
                    Log::info("OpenAI image edit fallback triggered: {$response->body()}");
                }
            } catch (Exception $e) {
                Log::warning("OpenAI image edit attempt exception: {$e->getMessage()}");
            }
        }

        // 5. Fallback or Direct Text-to-Image Generation if edit endpoint not applicable
        if (empty($binary)) {
            $payload = [
                'model' => $apiModel,
                'prompt' => $apiModel === 'dall-e-3' ? Str::limit($fullPrompt, 4000) : $fullPrompt,
                'n' => 1,
                'size' => $size,
            ];

            if ($apiModel === 'dall-e-3' && ($options['image_quality'] ?? '') === 'high') {
                $payload['quality'] = 'hd';
            }

            $response = Http::withHeaders(array_merge($headers, ['Content-Type' => 'application/json']))
                ->timeout(90)
                ->post('https://api.openai.com/v1/images/generations', $payload);

            if (! $response->successful()) {
                $errorBody = $response->json();
                $errorMessage = $errorBody['error']['message'] ?? ('OpenAI generation failed (HTTP '.$response->status().').');
                Log::error('OpenAI image generation error: '.$errorMessage);

                throw new RuntimeException($errorMessage);
            }

            $binary = $this->extractBinaryFromResponse($response->json());
            $generationMethod = 'text_to_image_fidelity';
        }

        if (empty($binary)) {
            throw new RuntimeException('Failed to process image data from OpenAI response.');
        }

        // 6. Save image to disk
        $filename = 'designs/openai_'.Str::uuid().'.png';
        Storage::disk('public')->put($filename, $binary);

        $duration = round(microtime(true) - $startTime, 2);
        $modelPolicy = $this->modelRegistry->getModelPolicy($requestedModel);

        $this->lastGenerationMetadata = [
            'model' => $apiModel,
            'model_name' => $modelSpec['display_name'],
            'is_recommended' => (bool) ($modelSpec['is_recommended'] ?? false),
            'product_preservation_capability' => $modelPolicy['product_preservation_capability'],
            'generation_method' => $generationMethod,
            'generation_mode' => $generationMode,
            'size' => $size,
            'aspect_ratio' => $aspectRatio,
            'prompt' => $fullPrompt,
            'prompt_version' => 'marketing-pipeline-v1',
            'product_preserved' => $hasImageInput && (bool) ($modelSpec['supports_image_input'] ?? false),
            'supports_image_editing' => (bool) ($modelSpec['supports_image_editing'] ?? false),
            'business_name' => $options['business_name'] ?? null,
            'duration_seconds' => $duration,
            'status' => 'completed',
            'timestamp' => now()->toIso8601String(),
        ];

        Log::info("OpenAI image generated successfully ({$apiModel} via {$generationMethod}): {$filename}");

        return $filename;
    }

    /**
     * Extract binary image from API response JSON.
     */
    protected function extractBinaryFromResponse(array $data): ?string
    {
        $b64 = $data['data'][0]['b64_json'] ?? null;
        $url = $data['data'][0]['url'] ?? null;

        if (! empty($b64)) {
            return base64_decode($b64);
        }

        if (! empty($url)) {
            $imgRes = Http::timeout(60)->get($url);
            if ($imgRes->successful()) {
                return $imgRes->body();
            }
        }

        return null;
    }

    /**
     * Build the commercial prompt using the Modular Prompt Orchestrator.
     */
    public function buildCommercialPrompt(string $prompt, array $options): string
    {
        $referenceImagePath = $options['reference_image_path'] ?? null;
        $visionBlueprint = null;
        if (! empty($referenceImagePath) && Storage::disk('public')->exists($referenceImagePath)) {
            $visionBlueprint = $this->referenceAnalyzer->analyze($referenceImagePath);
            $this->lastReferenceBlueprint = $visionBlueprint;
        }

        $orchestratedOptions = array_merge($options, [
            'user_prompt' => $prompt,
        ]);

        return $this->promptOrchestrator->orchestrate($orchestratedOptions, null, $visionBlueprint);
    }
}
