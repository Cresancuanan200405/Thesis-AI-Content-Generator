<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class DesignRegenerationService
{
    public function __construct(
        protected MarketingPromptBuilder $marketingPromptBuilder,
        protected OpenAIImageService $openAIImageService,
        protected ModularPromptOrchestrator $promptOrchestrator,
        protected MarketingDesignSystem $designSystem,
    ) {}

    public function regenerate(Design $design): Design
    {
        $user = $design->user;

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user && $user->hasReachedAiBudgetLimit($budgetLimit)) {
            throw new RuntimeException('You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual regeneration is disabled.');
        }

        $business = $design->business ?? $user->business()->firstOrFail();
        $meta = (array) ($design->generation_metadata ?? []);
        $generationMode = (string) ($meta['generation_mode'] ?? 'automatic');

        // 1. Recover Product Details & Reference Image
        $catalogProductIds = collect($meta['catalog_product_ids'] ?? [])
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($catalogProductIds) && $design->product_id) {
            $catalogProductIds = [(int) $design->product_id];
        }

        $catalogProducts = empty($catalogProductIds)
            ? collect()
            : Product::query()
                ->where('business_id', $business->id)
                ->whereIn('id', $catalogProductIds)
                ->get()
                ->sortBy(function (Product $p) use ($catalogProductIds) {
                    $pos = array_search($p->id, $catalogProductIds, true);

                    return $pos === false ? 999 : $pos;
                })
                ->values();

        $customProducts = $meta['custom_products'] ?? [];

        /** @var Product|null $product */
        $product = $catalogProducts->first()
            ?: ($design->product_id ? ($design->product ?? Product::query()->where('id', $design->product_id)->first()) : null);

        $productName = $design->product_name ?: ($product->name ?? 'Product');
        $productDescription = $product->description ?? $meta['product_description'] ?? null;

        $includePrices = array_key_exists('include_prices', $meta) ? (bool) $meta['include_prices'] : true;

        $numericPrice = $design->price;
        $priceForPrompt = null;
        if ($includePrices) {
            if (! empty($meta['price'])) {
                $priceForPrompt = (string) $meta['price'];
            } elseif ($numericPrice !== null && $numericPrice !== '') {
                $priceForPrompt = '₱'.number_format((float) $numericPrice, 2, '.', ',');
            } elseif ($product && $product->price > 0) {
                $priceForPrompt = '₱'.number_format((float) $product->price, 2, '.', ',');
            }
        }
        $dbPrice = $numericPrice ?: ($product->price ?? ($priceForPrompt ? (float) preg_replace('/[^0-9.]/', '', $priceForPrompt) : null));

        $referenceImagePath = $design->reference_image_path ?? $product->image_path ?? null;
        $referenceImagePaths = $catalogProducts
            ->pluck('image_path')
            ->filter()
            ->values()
            ->all();

        if (! empty($meta['reference_image_paths']) && is_array($meta['reference_image_paths'])) {
            foreach ($meta['reference_image_paths'] as $p) {
                if (! empty($p) && ! in_array($p, $referenceImagePaths, true)) {
                    $referenceImagePaths[] = $p;
                }
            }
        }

        if (empty($referenceImagePaths) && $referenceImagePath) {
            $referenceImagePaths = [$referenceImagePath];
        }

        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : ($referenceImagePath ? Storage::url($referenceImagePath) : null);

        // 2. Recover Campaign Details
        /** @var Campaign|null $campaign */
        $campaign = null;
        if ($design->campaign_id) {
            $campaign = $design->campaign ?? Campaign::query()->where('id', $design->campaign_id)->first();
        }
        $campaignName = $campaign->name ?? $meta['campaign_name'] ?? null;
        $campaignObjective = $campaign->objective ?? $meta['campaign_objective'] ?? $meta['marketing_goal'] ?? 'Refresh the existing marketing asset for this product';

        // 3. Recover Event Details
        /** @var Event|null $event */
        $event = null;
        if ($design->event_id) {
            $event = $design->event ?? Event::query()->where('id', $design->event_id)->first();
        }
        $eventName = $event->name ?? $meta['event_name'] ?? null;

        // 4. Recover Style, Brand Tone, Render Style & Visual Theme
        $brandTone = $this->normalizeList($design->brand_tone ?? $meta['brand_tone'] ?? []);
        $contentStyle = $this->normalizeList($design->visual_theme ?? $meta['visual_theme'] ?? $meta['content_style'] ?? []);
        $renderStyle = (string) ($meta['render_style'] ?? 'Studio Product Still');
        $designTreatment = $this->designSystem->validateDesignTreatment($meta['design_treatment'] ?? 'Auto');
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($meta['copy_emphasis'] ?? 'Balanced');
        $typographyLayout = $meta['typography_layout'] ?? null;
        $compositionType = $meta['composition_type'] ?? null;
        $cameraViewpoint = $meta['camera_viewpoint'] ?? null;
        $lightingProfile = $meta['lighting_profile'] ?? null;
        $sceneFamily = $meta['scene_family'] ?? null;
        $environmentFamily = $meta['environment_family'] ?? null;
        $propProfile = $meta['prop_profile'] ?? null;
        $creativeConcept = $meta['creative_concept'] ?? null;
        $visualStrategy = $meta['visual_strategy'] ?? null;
        $creativeFingerprint = $meta['creative_fingerprint'] ?? null;
        $aspectRatio = (string) ($meta['aspect_ratio'] ?? '1:1');
        $imageModel = 'gpt-image-2';
        $imageQuality = (string) ($meta['quality'] ?? $meta['image_quality'] ?? 'medium');

        // 5. Recover Business Identity & Copy Settings
        $includeBusinessName = array_key_exists('include_business_name', $meta)
            ? (bool) $meta['include_business_name']
            : (! array_key_exists('business_name', $meta) || ! empty($meta['business_name']));
        $businessName = $includeBusinessName ? ($meta['business_name'] ?? $business->name) : null;

        // 6. Recover Exact Scene / Visual Prompt
        $scenePrompt = $this->extractScenePrompt($design);

        // 7. Recover Authoritative Tagline & Mode (Preserve exact saved tagline; do not invent replacement)
        $includeTagline = array_key_exists('include_tagline', $meta)
            ? (bool) $meta['include_tagline']
            : (! empty($design->tagline) || ($design->tagline_mode ?? null) !== 'none');
        $sourceTagline = $design->tagline ?: ($meta['tagline'] ?? null);
        $normalizedTagline = $includeTagline && $sourceTagline ? TaglineNormalizationService::normalize($sourceTagline) : null;
        $taglineMode = $includeTagline ? ($design->tagline_mode ?? $meta['tagline_mode'] ?? 'ai') : 'none';

        // 8. Build Complete Multi-Product Compositor Contract
        $primaryProductContract = null;
        if ($product) {
            $primaryProductContract = [
                'name' => $product->name,
                'price' => $includePrices ? ($meta['primary_product']['price'] ?? $product->price) : null,
            ];
        } elseif (! empty($productName)) {
            $primaryProductContract = [
                'name' => $productName,
                'price' => $includePrices ? ($meta['price'] ?? $numericPrice ?? null) : null,
            ];
        }

        $coFeaturedProductsContract = [];
        if ($catalogProducts && $catalogProducts->count() > 1) {
            foreach ($catalogProducts->slice(1) as $cp) {
                $coFeaturedProductsContract[] = [
                    'name' => $cp->name,
                    'price' => $includePrices ? $cp->price : null,
                ];
            }
        }
        foreach ($customProducts as $custom) {
            $cName = is_array($custom) ? ($custom['name'] ?? null) : ($custom->name ?? null);
            $cPrice = is_array($custom) ? ($custom['price'] ?? null) : ($custom->price ?? null);
            if (! empty($cName)) {
                $coFeaturedProductsContract[] = [
                    'name' => $cName,
                    'price' => $includePrices ? $cPrice : null,
                ];
            }
        }

        $pricesContract = [];
        if ($includePrices) {
            if (! empty($meta['prices']) && is_array($meta['prices'])) {
                $pricesContract = $meta['prices'];
            } else {
                if ($primaryProductContract && ! empty($primaryProductContract['price'])) {
                    $pricesContract[$primaryProductContract['name']] = $primaryProductContract['price'];
                }
                foreach ($coFeaturedProductsContract as $cfp) {
                    if (! empty($cfp['price'])) {
                        $pricesContract[$cfp['name']] = $cfp['price'];
                    }
                }
                if (empty($pricesContract) && ! empty($priceForPrompt)) {
                    $pricesContract[$productName] = $priceForPrompt;
                }
            }
        }

        // 9. Derive Meaningful Visual Variation (Part S)
        // PRESERVE: selected products, copy settings, campaign/event relevance, manual controls, aspect ratio.
        // CHANGE: composition, camera, lighting, props, environmental arrangement.
        $recentFingerprint = [
            'scene_family' => $sceneFamily,
            'environment_family' => $environmentFamily,
            'composition_type' => $compositionType,
            'camera_viewpoint' => $cameraViewpoint,
            'lighting_profile' => $lightingProfile,
            'prop_profile' => $propProfile,
        ];

        $variationCore = $this->designSystem->deriveDiverseVisualCore(
            $recentFingerprint,
            [$recentFingerprint],
            [
                'category' => $business->category,
                'render_style' => $renderStyle,
                'design_treatment' => $designTreatment,
                'aspect_ratio' => $aspectRatio,
                'product_count' => max(1, count($catalogProductIds) + count($customProducts)),
            ]
        );

        $varCompositionType = $variationCore['composition_type'] ?? $compositionType;
        $varCameraViewpoint = $variationCore['camera_viewpoint'] ?? $cameraViewpoint;
        $varLightingProfile = $variationCore['lighting_profile'] ?? $lightingProfile;
        $varSceneFamily = $variationCore['scene_family'] ?? $sceneFamily;
        $varEnvironmentFamily = $variationCore['environment_family'] ?? $environmentFamily;
        $varPropProfile = $variationCore['prop_profile'] ?? $propProfile;

        // Build Complete Generation Options with Authoritative State
        $options = [
            'generation_mode' => $generationMode,
            'is_variation' => true,
            'source_design_id' => $design->id,
            'deterministic_compositing' => true,
            'business' => $business,
            'business_name' => $businessName,
            'include_business_name' => $includeBusinessName,
            'business_industry' => $business->industry,
            'business_description' => $business->description,
            'business_usp' => $business->unique_selling_point,
            'business_target_audience' => $business->target_audience,
            'business_content_style' => $business->content_style,
            'business_marketing_prefs' => $business->marketing_preferences,
            'product_name' => $productName,
            'product_description' => $productDescription,
            'product_category' => $business->category,
            'business_category' => $business->category,
            'product_image_url' => $productImageUrl,
            'campaign_name' => $campaignName,
            'campaign_objective' => $campaignObjective,
            'event_name' => $eventName,
            'price' => $includePrices ? ($priceForPrompt ?? $primaryProductContract['price'] ?? null) : null,
            'include_prices' => $includePrices,
            'tagline' => $normalizedTagline,
            'include_tagline' => $includeTagline,
            'tagline_mode' => $taglineMode,
            'catalog_products' => $catalogProducts,
            'catalog_product_ids' => $catalogProductIds,
            'custom_products' => $customProducts,
            'primary_product' => $primaryProductContract,
            'co_featured_products' => $coFeaturedProductsContract,
            'prices' => $pricesContract,
            'brand_tone' => $brandTone,
            'visual_theme' => $contentStyle,
            'render_style' => $renderStyle,
            'design_treatment' => $designTreatment,
            'copy_emphasis' => $copyEmphasis,
            'typography_layout' => $typographyLayout,
            'composition_type' => $varCompositionType,
            'camera_viewpoint' => $varCameraViewpoint,
            'lighting_profile' => $varLightingProfile,
            'scene_family' => $varSceneFamily,
            'environment_family' => $varEnvironmentFamily,
            'prop_profile' => $varPropProfile,
            'creative_concept' => $creativeConcept,
            'visual_strategy' => $visualStrategy,
            'creative_fingerprint' => $creativeFingerprint,
            'aspect_ratio' => $aspectRatio,
            'image_model' => $imageModel,
            'image_quality' => $imageQuality,
            'reference_image_path' => $referenceImagePath,
            'reference_image_paths' => $referenceImagePaths,
            'scene_prompt' => $scenePrompt,
            'user_prompt' => $scenePrompt ?: ($design->prompt ?? $productName),
            'notes' => $scenePrompt ?: ('Regenerated variation of '.$productName),
        ];

        // 10. Orchestrate Production Visual Prompt with ModularPromptOrchestrator
        $prompt = $this->promptOrchestrator->orchestrate($options, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'product_id' => $design->product_id,
            'event_id' => $design->event_id,
            'product_name' => $productName,
            'marketing_goal' => $campaignObjective,
            'content_style' => $contentStyle,
            'brand_tone' => $brandTone,
            'tagline' => $normalizedTagline,
            'tagline_mode' => $taglineMode,
            'unique_selling_point' => $business->unique_selling_point,
            'notes' => $options['notes'],
            'prompt' => $prompt,
            'status' => 'processing',
        ]);

        try {
            $generatedImagePath = $this->openAIImageService->generate($prompt, $options);
        } catch (RuntimeException $exception) {
            Log::error('Design regeneration failed.', [
                'user_id' => $user->id,
                'design_id' => $design->id,
                'generation_request_id' => $generationRequest->id,
                'error' => $exception->getMessage(),
            ]);

            $generationRequest->update([
                'status' => 'failed',
                'notes' => 'Your design could not be regenerated right now: '.$exception->getMessage(),
            ]);

            throw $exception;
        }

        $generationRequest->update([
            'status' => 'completed',
        ]);

        $lastMeta = $this->openAIImageService->getLastGenerationMetadata() ?: [];

        return Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'event_id' => $design->event_id,
            'product_id' => $design->product_id,
            'product_name' => $productName,
            'prompt' => $lastMeta['prompt'] ?? $prompt,
            'price' => $includePrices ? $dbPrice : null,
            'brand_tone' => implode(', ', $brandTone),
            'visual_theme' => implode(', ', $contentStyle),
            'tagline' => $normalizedTagline,
            'tagline_mode' => $taglineMode,
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => array_merge(
                $lastMeta,
                [
                    'source' => 'openai',
                    'model' => $imageModel,
                    'model_name' => ($imageModel === 'gpt-image-2' || ! $imageModel) ? 'GPT-Image-2' : $imageModel,
                    'source_design_id' => $design->id,
                    'regenerated_from_design_id' => $design->id,
                    'generation_method' => $lastMeta['generation_method'] ?? (! empty($referenceImagePaths) ? (count($referenceImagePaths) > 1 ? 'multi_image_to_image_edit' : 'image_to_image_edit') : 'text_to_image'),
                    'generation_mode' => $generationMode,
                    'prompt_version' => 'marketing-pipeline-v2',
                    'complete_gpt_design' => true,
                    'product_preserved' => in_array($lastMeta['generation_method'] ?? '', ['image_to_image_edit', 'multi_image_to_image_edit'], true),
                    'reference_image_used' => in_array($lastMeta['generation_method'] ?? '', ['image_to_image_edit', 'multi_image_to_image_edit'], true),
                    'reference_image_count' => count($referenceImagePaths),
                    'attempted_reference_count' => $lastMeta['attempted_reference_count'] ?? count($referenceImagePaths),
                    'actual_reference_count' => $lastMeta['actual_reference_count'] ?? count($referenceImagePaths),
                    'fallback_used' => $lastMeta['fallback_used'] ?? false,
                    'fallback_reason' => $lastMeta['fallback_reason'] ?? null,
                    'quality' => $imageQuality,
                    'render_style' => $renderStyle,
                    'design_treatment' => $designTreatment,
                    'copy_emphasis' => $copyEmphasis,
                    'typography_layout' => $typographyLayout,
                    'composition_type' => $varCompositionType,
                    'camera_viewpoint' => $varCameraViewpoint,
                    'lighting_profile' => $varLightingProfile,
                    'scene_family' => $varSceneFamily,
                    'environment_family' => $varEnvironmentFamily,
                    'prop_profile' => $varPropProfile,
                    'creative_concept' => $creativeConcept,
                    'visual_strategy' => $visualStrategy,
                    'creative_fingerprint' => $creativeFingerprint,
                    'include_tagline' => $includeTagline,
                    'tagline' => $normalizedTagline,
                    'tagline_mode' => $taglineMode,
                    'include_business_name' => $includeBusinessName,
                    'business_name' => $businessName,
                    'scene_prompt' => $scenePrompt,
                    'aspect_ratio' => $aspectRatio,
                    'include_prices' => $includePrices,
                    'catalog_product_ids' => $catalogProductIds,
                    'custom_products' => $customProducts,
                    'reference_image_paths' => $referenceImagePaths,
                    'primary_product' => $primaryProductContract,
                    'co_featured_products' => $coFeaturedProductsContract,
                    'prices' => $pricesContract,
                    'authoritative_text_layers' => $lastMeta['authoritative_text_layers'] ?? [],
                    'text_layers_rendered' => $lastMeta['text_layers_rendered'] ?? [],
                    'deterministic_text_compositing' => (bool) ($lastMeta['deterministic_text_compositing'] ?? false),
                    'diversity_fingerprint' => [
                        'scene_family' => $varSceneFamily,
                        'environment_family' => $varEnvironmentFamily,
                        'composition_type' => $varCompositionType,
                        'camera_viewpoint' => $varCameraViewpoint,
                        'lighting_profile' => $varLightingProfile,
                        'prop_profile' => $varPropProfile,
                    ],
                    'variation_source' => $design->id,
                    'status' => 'completed',
                ]
            ),
            'status' => 'completed',
        ]);
    }

    public function getLastGenerationMetadata(): ?array
    {
        return $this->openAIImageService->getLastGenerationMetadata();
    }

    /**
     * Extract original scene prompt from metadata, request notes, or prompt text.
     */
    protected function extractScenePrompt(Design $design): ?string
    {
        $meta = (array) ($design->generation_metadata ?? []);

        if (! empty($meta['scene_prompt'])) {
            return trim((string) $meta['scene_prompt']);
        }

        if (! empty($meta['user_prompt'])) {
            $raw = trim((string) $meta['user_prompt']);
            if (! Str::startsWith($raw, 'PROMOTIONAL ADVERTISEMENT BRIEF:') && ! Str::startsWith($raw, 'CREATE:')) {
                return $raw;
            }
        }

        if (! empty($meta['image_prompt'])) {
            return trim((string) $meta['image_prompt']);
        }

        if (! empty($meta['generation_request_id'])) {
            $generationRequest = GenerationRequest::query()->find($meta['generation_request_id']);
            if ($generationRequest) {
                $reqNotes = trim((string) ($generationRequest->notes ?? ''));
                if (! empty($reqNotes) && ! Str::startsWith($reqNotes, 'Regenerated from design #')) {
                    return $reqNotes;
                }
            }
        }

        if (! empty($design->prompt)) {
            if (preg_match('/• Specific User Instructions:\s*(.+)$/m', $design->prompt, $matches)) {
                $matched = trim($matches[1]);
                if (! Str::startsWith($matched, 'Regenerated from design #')) {
                    return $matched;
                }
            }

            if (! Str::startsWith($design->prompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:') && ! Str::startsWith($design->prompt, 'CREATE:')) {
                return trim($design->prompt);
            }
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    protected function normalizeList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && trim($value) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $value))));
        }

        return [];
    }
}
