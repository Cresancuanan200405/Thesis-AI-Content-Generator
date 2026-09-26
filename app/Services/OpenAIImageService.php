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
        protected ModularPromptOrchestrator $promptOrchestrator,
        protected ImageCompositorService $compositor
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
                $rawMockup = app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
                $business = $options['business'] ?? (auth()->check() ? auth()->user()?->business : null);

                return $this->compositor->composite($rawMockup, $options, $business);
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
        $apiModel = OpenAIModelRegistry::DEFAULT_IMAGE_MODEL;
        $modelSpec = $this->modelRegistry->getModel($apiModel);
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $generationMode = $options['generation_mode'] ?? 'PRODUCT_PRESERVING';

        // 1. Resolve Aspect Ratio to GPT-Image-2 supported dimensions
        $size = match ($aspectRatio) {
            '16:9', '4:3' => '1792x1024',
            '9:16', '4:5' => '1024x1792',
            default => '1024x1024',
        };

        // 2. Resolve Reference Images & Vision Blueprint
        $referenceImagePaths = $options['reference_image_paths'] ?? [];
        if (empty($referenceImagePaths) && ! empty($options['reference_image_path'])) {
            $referenceImagePaths = [$options['reference_image_path']];
        }
        if (! empty($options['catalog_products'])) {
            foreach ($options['catalog_products'] as $prod) {
                $imgPath = is_array($prod) ? ($prod['image_path'] ?? null) : $prod->image_path;
                if (! empty($imgPath) && ! in_array($imgPath, $referenceImagePaths, true)) {
                    $referenceImagePaths[] = $imgPath;
                }
            }
        }

        $validReferenceImages = [];
        foreach ($referenceImagePaths as $idx => $rPath) {
            if (! empty($rPath) && Storage::exists($rPath)) {
                $validReferenceImages[] = [
                    'path' => $rPath,
                    'filename' => basename($rPath),
                    'contents' => Storage::get($rPath),
                    'index' => $idx + 1,
                ];
            }
        }

        $primaryReference = $validReferenceImages[0] ?? null;
        $referenceImagePath = $primaryReference['path'] ?? ($options['reference_image_path'] ?? null);

        $visionBlueprint = null;
        if (! empty($referenceImagePath) && Storage::exists($referenceImagePath)) {
            $visionBlueprint = $this->referenceAnalyzer->analyze($referenceImagePath);
            $this->lastReferenceBlueprint = $visionBlueprint;
        }

        $business = $options['business'] ?? null;
        if (! $business && auth()->check()) {
            $business = auth()->user()?->business;
        }

        // 3. Modular Prompt Orchestration with strict priority (Exact Single Pass Guard)
        $isAlreadyOrchestrated = Str::startsWith($userPrompt, 'FINAL MARKETING DESIGN TASK');
        if ($isAlreadyOrchestrated) {
            $fullPrompt = $userPrompt;
        } else {
            $orchestratedOptions = array_merge($options, [
                'deterministic_compositing' => true,
                'user_prompt' => $userPrompt,
                'aspect_ratio' => $aspectRatio,
                'image_model' => $apiModel,
                'reference_image_paths' => array_column($validReferenceImages, 'path'),
                'reference_image_path' => $referenceImagePath,
            ]);
            $fullPrompt = $this->promptOrchestrator->orchestrate($orchestratedOptions, $business, $visionBlueprint);
        }

        $headers = [
            'Authorization' => 'Bearer '.$apiKey,
        ];
        if ($org = config('services.openai.organization')) {
            $headers['OpenAI-Organization'] = $org;
        }

        // 4. Primary Image Input Execution Pipeline (Product Reference Images -> /v1/images/edits)
        $binary = null;
        $generationMethod = 'text_to_image';
        $fallbackUsed = false;
        $fallbackReason = null;

        $hasImageInput = ! empty($validReferenceImages);

        if ($hasImageInput) {
            try {
                if (count($validReferenceImages) > 1) {
                    // Multi-image edit pipeline with all preserved reference images in order A then B
                    $req = Http::withHeaders($headers)->timeout(90);
                    foreach ($validReferenceImages as $refImg) {
                        $req->attach('image[]', $refImg['contents'], $refImg['filename']);
                    }
                    $response = $req->post('https://api.openai.com/v1/images/edits', [
                        'model' => $apiModel,
                        'prompt' => $fullPrompt,
                        'n' => 1,
                        'size' => $size,
                    ]);

                    if ($response->successful()) {
                        $binary = $this->extractBinaryFromResponse($response->json());
                        $generationMethod = 'multi_image_to_image_edit';
                    } else {
                        $errorBody = $response->json();
                        $apiError = $errorBody['error']['message'] ?? ('HTTP '.$response->status().': '.$response->body());
                        Log::warning("OpenAI multi-image edit failed: {$apiError}");

                        // Part I: Multi-image failure cannot silently downgrade 3 -> 2 or 2 -> 1, or become single-product success
                        $this->lastGenerationMetadata = [
                            'generation_method' => 'multi_image_to_image_failed',
                            'attempted_reference_count' => count($validReferenceImages),
                            'actual_reference_count' => 0,
                            'fallback_reason' => $apiError,
                            'fallback_used' => false,
                            'fallback_state' => 'multi_image_failed',
                            'api_request_id' => $response->header('x-request-id'),
                        ];
                        throw new RuntimeException("Multiple product reference generation could not be completed. OpenAI API returned: {$apiError}");
                    }
                } else {
                    // Single reference image
                    $response = Http::withHeaders($headers)
                        ->timeout(90)
                        ->attach('image', $primaryReference['contents'], $primaryReference['filename'])
                        ->post('https://api.openai.com/v1/images/edits', [
                            'model' => $apiModel,
                            'prompt' => $fullPrompt,
                            'n' => 1,
                            'size' => $size,
                        ]);

                    if ($response->successful()) {
                        $binary = $this->extractBinaryFromResponse($response->json());
                        $generationMethod = 'image_to_image_edit';
                    } else {
                        $fallbackUsed = true;
                        $fallbackReason = $response->json('error.message') ?? 'OpenAI image edit endpoint failed; generated from creative text prompt.';
                        Log::info("OpenAI image edit fallback triggered: {$response->body()}");
                    }
                }
            } catch (Exception $e) {
                if (count($validReferenceImages) > 1) {
                    $this->lastGenerationMetadata = [
                        'generation_method' => 'multi_image_to_image_failed',
                        'attempted_reference_count' => count($validReferenceImages),
                        'actual_reference_count' => 0,
                        'fallback_reason' => $e->getMessage(),
                        'fallback_used' => false,
                        'fallback_state' => 'multi_image_failed',
                    ];
                    if (str_starts_with($e->getMessage(), 'Multiple product reference generation could not be completed')) {
                        throw $e;
                    }
                    throw new RuntimeException("Multiple product reference generation could not be completed. Error: {$e->getMessage()}", 0, $e);
                }
                $fallbackUsed = true;
                $fallbackReason = $e->getMessage();
                Log::warning("OpenAI image edit attempt exception: {$e->getMessage()}");
            }
        }

        // 5. Direct Text-to-Image Generation (or text fallback if edit failed) — Always GPT-Image-2
        if (empty($binary)) {
            $payload = [
                'model' => $apiModel,
                'prompt' => $fullPrompt,
                'n' => 1,
                'size' => $size,
            ];

            if (($options['image_quality'] ?? '') === 'high') {
                $payload['quality'] = 'high';
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
            $generationMethod = $fallbackUsed ? 'text_to_image_fallback' : 'text_to_image_fidelity';
        }

        if (empty($binary)) {
            throw new RuntimeException('Failed to process image data from OpenAI response.');
        }

        // 6. Save final GPT Image 2 design to disk
        // GPT Image 2 is the final visual designer; save returned design directly as the production asset
        $finalFilename = 'designs/design_'.Str::uuid().'.png';
        Storage::put($finalFilename, $binary);

        // 7. Non-destructive diagnostics, safe-area calculations, and layout metadata via ImageCompositorService
        // Part G & V: GPT Image 2 generates the COMPLETE FINAL MARKETING DESIGN directly.
        // Raster compositing is NOT executed over the design in normal production to avoid duplicate/blurry text overlay.
        $manifest = $this->compositor->generateCompositingManifest($options, $business);

        $legacyRasterComposite = (bool) ($options['legacy_raster_composite'] ?? false);
        if ($legacyRasterComposite) {
            $finalFilename = $this->compositor->composite($finalFilename, $options, $business);
            $compositorResult = $this->compositor->getLastCompositingResult();
        } else {
            $visibleLayers = [];
            if (! empty($manifest['exact_content']['product_name'])) {
                $visibleLayers[] = 'product_name';
            }
            if (! empty($manifest['exact_content']['brand_name'])) {
                $visibleLayers[] = 'business_name';
            }
            if (! empty($manifest['exact_content']['tagline'])) {
                $visibleLayers[] = 'tagline';
            }
            if (! empty($manifest['exact_content']['price']) || ! empty($manifest['exact_content']['prices'])) {
                $visibleLayers[] = 'price';
            }

            $compositorResult = [
                'manifest' => $manifest,
                'raster_modified' => false,
                'engine' => 'gpt_image_native_typography',
                'path' => $finalFilename,
                'authoritative_copy' => array_filter($manifest['exact_content'], fn ($v) => $v !== null && $v !== '' && $v !== []),
                'visible_layers' => $visibleLayers,
                'text_layers_rendered' => $visibleLayers,
                'fallback_state' => 'none',
                'treatment' => $manifest['treatment'] ?? ($options['design_treatment'] ?? 'Classic'),
                'emphasis' => $manifest['emphasis'] ?? ($options['copy_emphasis'] ?? 'Balanced'),
                'aspect_ratio' => $manifest['canvas']['aspect_ratio'] ?? ($options['aspect_ratio'] ?? '1:1'),
                'layout_properties' => $manifest['layout_properties'] ?? [],
                'compositing_bypassed' => true,
                'production_pipeline' => 'gpt_image_complete_design',
            ];
        }

        $duration = round(microtime(true) - $startTime, 2);
        $modelPolicy = $this->modelRegistry->getModelPolicy($apiModel);

        $resolvedGenerationMode = $hasImageInput
            ? ($fallbackUsed ? 'TEXT_TO_IMAGE_FALLBACK' : 'PRODUCT_REFERENCE')
            : 'CREATIVE_GENERATION';

        // Part W — Structured generation metadata
        $productNames = ! empty($options['catalog_products'])
            ? collect($options['catalog_products'])->map(fn ($p) => is_array($p) ? ($p['name'] ?? null) : ($p->name ?? null))->filter()->values()->all()
            : array_values(array_filter([$options['product_name'] ?? null]));

        $prices = ! empty($options['prices'])
            ? array_values($options['prices'])
            : array_values(array_filter([$options['price'] ?? null]));

        $authoritativeCopy = [
            'product_names' => $productNames,
            'prices' => $prices,
            'tagline' => $options['tagline'] ?? null,
            'business_name' => $options['business_name'] ?? ($business?->name ?? null),
        ];

        $copyVisibility = [
            'include_product_name' => (bool) ($options['include_product_name'] ?? true),
            'include_prices' => (bool) ($options['include_prices'] ?? true),
            'include_tagline' => (bool) ($options['include_tagline'] ?? true),
            'include_business_name' => (bool) ($options['include_business_name'] ?? true),
        ];

        $diversityFingerprint = [
            'scene_family' => $options['scene_family'] ?? null,
            'environment_family' => $options['environment_family'] ?? null,
            'composition_type' => $options['composition_type'] ?? null,
            'camera_viewpoint' => $options['camera_viewpoint'] ?? null,
            'lighting_profile' => $options['lighting_profile'] ?? null,
            'prop_profile' => $options['prop_profile'] ?? null,
        ];

        $creativeDirection = [
            'concept' => $options['creative_concept'] ?? null,
            'design_treatment' => $options['design_treatment'] ?? null,
            'copy_emphasis' => $options['copy_emphasis'] ?? null,
            'render_style' => $options['render_style'] ?? null,
            'visual_themes' => $options['visual_theme'] ?? [],
            'brand_tones' => $options['brand_tone'] ?? [],
            'visual_strategy' => $options['visual_strategy'] ?? null,
            'scene_direction' => $options['scene_direction'] ?? null,
            'visual_composition' => $options['visual_composition'] ?? null,
            'lighting' => $options['lighting'] ?? null,
            'camera' => $options['camera'] ?? null,
            'environment' => $options['environment'] ?? null,
            'props' => $options['props'] ?? null,
        ];

        $this->lastGenerationMetadata = [
            'model' => $apiModel,
            'model_name' => $modelSpec['display_name'],
            'is_recommended' => true,
            'product_preservation_capability' => $modelPolicy['product_preservation_capability'],
            'generation_method' => $generationMethod,
            'generation_mode' => $resolvedGenerationMode,
            'size' => $size,
            'aspect_ratio' => $aspectRatio,
            'prompt' => $fullPrompt,
            'prompt_version' => 'marketing-pipeline-v2',
            'complete_gpt_design' => true,
            'creative_direction' => $creativeDirection,
            'authoritative_copy' => $authoritativeCopy,
            'copy_visibility' => $copyVisibility,
            'diversity_fingerprint' => $diversityFingerprint,
            'reference_images' => array_column($validReferenceImages, 'path'),
            'variation_source' => $options['source_design_id'] ?? null,
            'product_preserved' => in_array($generationMethod, ['image_to_image_edit', 'multi_image_to_image_edit'], true),
            'reference_image_used' => in_array($generationMethod, ['image_to_image_edit', 'multi_image_to_image_edit'], true),
            'image_inputs_count' => count($validReferenceImages),
            'attempted_reference_count' => count($validReferenceImages),
            'actual_reference_count' => in_array($generationMethod, ['multi_image_to_image_edit'], true) ? count($validReferenceImages) : (in_array($generationMethod, ['image_to_image_edit'], true) ? 1 : 0),
            'reference_image_paths' => array_column($validReferenceImages, 'path'),
            'fallback_used' => $fallbackUsed,
            'fallback_reason' => $fallbackReason,
            'supports_image_editing' => true,
            'prices' => $options['prices'] ?? null,
            'business_name' => $options['business_name'] ?? null,
            'ai_visual_generation' => [
                'success' => true,
                'model' => $apiModel,
                'generation_method' => $generationMethod,
                'duration_seconds' => $duration,
            ],
            'deterministic_text_compositing' => (bool) ($compositorResult['raster_modified'] ?? false),
            'compositor_engine' => $compositorResult['engine'] ?? 'none',
            'authoritative_text_layers' => $compositorResult['authoritative_copy'] ?? [],
            'text_layers_rendered' => $compositorResult['text_layers_rendered'] ?? [],
            'fallback_state' => $compositorResult['fallback_state'] ?? 'none',
            'deterministic_text_composited' => (bool) ($compositorResult['raster_modified'] ?? false),
            'compositor_result' => $compositorResult,
            'duration_seconds' => $duration,
            'status' => 'completed',
            'timestamp' => now()->toIso8601String(),
        ];

        Log::info("OpenAI image generated successfully ({$apiModel} via {$generationMethod}): {$finalFilename}");

        return $finalFilename;
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
    public function buildCommercialPrompt(string $prompt, array $options, ?Business $business = null): string
    {
        $referenceImagePath = $options['reference_image_path'] ?? null;
        $visionBlueprint = null;
        if (! empty($referenceImagePath) && Storage::exists($referenceImagePath)) {
            $visionBlueprint = $this->referenceAnalyzer->analyze($referenceImagePath);
            $this->lastReferenceBlueprint = $visionBlueprint;
        }

        $business = $business ?? ($options['business'] ?? null);
        if (! $business && auth()->check()) {
            $business = auth()->user()?->business;
        }

        $orchestratedOptions = array_merge($options, [
            'user_prompt' => $prompt,
        ]);

        return $this->promptOrchestrator->orchestrate($orchestratedOptions, $business, $visionBlueprint);
    }
}
