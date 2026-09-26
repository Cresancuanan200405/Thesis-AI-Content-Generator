<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesGeneratorContext;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use App\Services\NotificationService;
use App\Services\OpenAIImageService;
use App\Services\OpenAIModelRegistry;
use App\Services\PhilippineHolidayService;
use App\Services\VisualPromptGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AutomaticGeneratorController extends Controller
{
    use ResolvesGeneratorContext;

    /**
     * Display the Automatic AI Marketing Studio view.
     */
    public function index(Request $request, PhilippineHolidayService $holidayService): Response|RedirectResponse
    {
        $props = $this->resolveGeneratorViewProps($request, $holidayService);

        if ($props instanceof RedirectResponse) {
            return $props;
        }

        return Inertia::render('generator/automatic', $props);
    }

    /**
     * One-action automatic generation: derives tagline, concept, strategy, and prompt with AI,
     * and immediately invokes the downstream image generation pipeline in one continuous flow.
     */
    public function generate(
        Request $request,
        VisualPromptGeneratorService $promptService,
        OpenAIImageService $openAIService,
        ModularPromptOrchestrator $promptOrchestrator,
        MarketingDesignSystem $designSystem
    ): JsonResponse {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user->hasReachedAiBudgetLimit($budgetLimit)) {
            return response()->json([
                'success' => false,
                'quota_exceeded' => true,
                'message' => 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual generation is disabled.',
            ], 403);
        }

        $validated = $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'product_id' => ['nullable', 'exists:products,id'],
            'catalog_product_ids' => ['nullable', 'array'],
            'catalog_product_ids.*' => ['integer', 'exists:products,id'],
            'custom_products' => ['nullable', 'array'],
            'custom_products.*.name' => ['required', 'string', 'max:150'],
            'custom_products.*.price' => ['nullable'],
            'custom_products.*.description' => ['nullable', 'string', 'max:500'],
            'include_tagline' => ['nullable', 'boolean'],
            'include_prices' => ['nullable', 'boolean'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'user_instruction' => ['nullable', 'string', 'max:4000'],
            'image_prompt' => ['nullable', 'string', 'max:4000'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'previous_concepts' => ['nullable', 'array'],
            'previous_concepts.*' => ['string', 'max:500'],
            'include_business_name' => ['nullable', 'boolean'],
            'image_model' => ['nullable', 'string', 'max:50'],
            'image_quality' => ['nullable', 'string', 'in:low,medium,high'],
            'is_variation' => ['nullable', 'boolean'],
            'source_design_id' => ['nullable', 'integer'],
            'show_event_text' => ['nullable', 'boolean'],
            'design_treatment' => ['nullable', 'string', 'max:50'],
            'copy_emphasis' => ['nullable', 'string', 'max:50'],
            'render_style' => ['nullable', 'string', 'max:100'],
            'creative_concept' => ['nullable', 'string', 'max:500'],
            'visual_strategy' => ['nullable', 'string', 'max:500'],
        ]);

        /** @var Campaign|null $campaign */
        $campaign = $user->campaigns()->with(['event', 'product'])->whereKey($validated['campaign_id'])->first();
        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'The selected campaign does not belong to your account.',
            ], 422);
        }

        /** @var Business|null $business */
        $business = $user->business()->first();
        if (! $business) {
            return response()->json([
                'success' => false,
                'message' => 'Business profile is required before generating marketing visuals.',
            ], 422);
        }

        // Resolve catalog product IDs and deduplicate by stable ID
        $catalogProductIds = collect($validated['catalog_product_ids'] ?? [])
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($catalogProductIds) && ! empty($validated['product_id'])) {
            $catalogProductIds = [(int) $validated['product_id']];
        } elseif (empty($catalogProductIds) && $campaign->product_id) {
            $catalogProductIds = [(int) $campaign->product_id];
        }

        // Fetch authoritative catalog products belonging to this business
        $catalogProducts = empty($catalogProductIds)
            ? collect()
            : Product::query()
                ->where('business_id', $business->id)
                ->whereIn('id', $catalogProductIds)
                ->get()
                ->sortBy(function (Product $p) use ($catalogProductIds) {
                    $strIds = array_map('strval', $catalogProductIds);
                    $pos = array_search((string) $p->id, $strIds, true);

                    return $pos === false ? 999 : $pos;
                })
                ->values();

        if (! empty($validated['product_id']) && $catalogProducts->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'One or more selected products do not belong to your business.',
            ], 422);
        }

        $aspectRatio = $validated['aspect_ratio'] ?? '1:1';
        $imageModel = OpenAIModelRegistry::DEFAULT_IMAGE_MODEL;
        $imageQuality = $validated['image_quality'] ?? 'medium';
        $includeBusinessName = filter_var($validated['include_business_name'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $businessName = $includeBusinessName ? $business->name : null;
        $includeTagline = filter_var($validated['include_tagline'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $includePrices = filter_var($validated['include_prices'] ?? true, FILTER_VALIDATE_BOOLEAN);

        // Primary catalog product for reference preservation
        $primaryProduct = $catalogProducts->first();
        $event = $campaign->event;
        $showEventText = array_key_exists('show_event_text', $validated)
            ? filter_var($validated['show_event_text'], FILTER_VALIDATE_BOOLEAN)
            : ($event !== null);

        $userTagline = $includeTagline && ! empty($validated['tagline']) ? trim((string) $validated['tagline']) : null;
        $userPrompt = ! empty($validated['user_instruction'])
            ? trim((string) $validated['user_instruction'])
            : (! empty($validated['image_prompt']) ? trim((string) $validated['image_prompt']) : null);

        // Retrieve recent creative fingerprints for anti-repetition guidance
        $recentFingerprints = $designSystem->getRecentFingerprints($user, $business, 6);

        // Stage 1: Autonomous Creative Direction (Tagline, Concept, Strategy, Visual Prompt, Design System)
        try {
            $creativeResult = $promptService->generate($user, $campaign, $business, [
                'generation_mode' => 'automatic',
                'require_tagline' => $includeTagline,
                'include_tagline' => $includeTagline,
                'include_prices' => $includePrices,
                'show_event_text' => $showEventText,
                'event' => $event,
                'tagline' => $userTagline,
                'user_instruction' => $userPrompt,
                'previous_concepts' => $validated['previous_concepts'] ?? [],
                'recent_fingerprints' => $recentFingerprints,
                'catalog_products' => $catalogProducts,
                'custom_products' => $validated['custom_products'] ?? [],
                'aspect_ratio' => $aspectRatio,
                'include_business_name' => $includeBusinessName,
                'has_reference_image' => (bool) $primaryProduct?->image_path,
            ]);
        } catch (\Throwable $e) {
            Log::error('Automatic Creative Director generation failed: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => "We couldn't generate the creative concept and tagline right now: ".$e->getMessage(),
            ], 500);
        }

        $isVariation = filter_var($validated['is_variation'] ?? false, FILTER_VALIDATE_BOOLEAN);

        $generatedTagline = $includeTagline
            ? ($userTagline ?: ($creativeResult['tagline'] ?? null))
            : null;
        $creativeConcept = ($isVariation && ! empty($validated['creative_concept']))
            ? $validated['creative_concept']
            : ($creativeResult['creative_concept'] ?? null);
        $visualStrategy = ($isVariation && ! empty($validated['visual_strategy']))
            ? $validated['visual_strategy']
            : ($creativeResult['visual_strategy'] ?? null);
        $conceptScene = $userPrompt ?: $creativeResult['visual_prompt'];

        $designTreatment = ($isVariation && ! empty($validated['design_treatment']))
            ? $validated['design_treatment']
            : ($creativeResult['design_treatment'] ?? 'Auto');
        $copyEmphasis = ($isVariation && ! empty($validated['copy_emphasis']))
            ? $validated['copy_emphasis']
            : ($creativeResult['copy_emphasis'] ?? 'Balanced');
        $typographyLayout = $creativeResult['copy_layout'] ?? $creativeResult['typography_layout'] ?? null;
        $copyLayout = $typographyLayout;
        $productNameStyle = $creativeResult['product_name_style'] ?? null;
        $priceStyle = $creativeResult['price_style'] ?? null;
        $taglineStyle = $creativeResult['tagline_style'] ?? null;
        $textDepthMode = $creativeResult['text_depth_mode'] ?? null;
        $compositionType = $creativeResult['composition_type'] ?? null;
        $cameraViewpoint = $creativeResult['camera_viewpoint'] ?? null;
        $lightingProfile = $creativeResult['lighting_profile'] ?? null;
        $sceneFamily = $creativeResult['scene_family'] ?? null;
        $environmentFamily = $creativeResult['environment_family'] ?? null;
        $propProfile = $creativeResult['prop_profile'] ?? null;
        $visualWorldArchetype = $creativeResult['visual_world_archetype'] ?? null;
        $backgroundStyle = $creativeResult['background_style'] ?? null;
        $productArrangement = $creativeResult['product_arrangement'] ?? null;
        $visualTheme = $creativeResult['visual_theme'] ?? null;
        $brandTone = $creativeResult['brand_tone'] ?? null;

        $totalProductCount = $catalogProducts->count() + count($validated['custom_products'] ?? []);
        if ($totalProductCount > 1) {
            $productArrangement = MarketingDesignSystem::validateProductArrangement($productArrangement);
        } else {
            $productArrangement = $productArrangement ? MarketingDesignSystem::validateProductArrangement($productArrangement) : null;
        }

        $backgroundStyle = MarketingDesignSystem::validateBackgroundStyle($backgroundStyle);

        $visualWorldArchetype = $designSystem->validateVisualArchetype($visualWorldArchetype) ?? 'PREMIUM_STUDIO';

        if (empty($visualTheme)) {
            $visualTheme = $event ? 'Seasonal' : ($designTreatment === 'Editorial' ? 'Editorial' : 'Product-focused');
        }

        if (empty($brandTone)) {
            $brandTone = match ($designTreatment) {
                'Luxury' => 'Luxury',
                'Bold' => 'Bold',
                'Minimal' => 'Minimal',
                default => 'Professional',
            };
        }

        $renderStyle = ($isVariation && ! empty($validated['render_style']))
            ? $validated['render_style']
            : ($creativeResult['render_style'] ?? 'Automatic Commercial Art Direction');

        $context = [
            'industry' => $business->industry,
            'category' => $business->category,
            'aspect_ratio' => $aspectRatio,
            'product' => $primaryProduct?->name,
            'campaign' => $campaign->name,
            'event' => $event?->name,
        ];

        $attemptedCandidates = [];
        $rejectedCandidates = [];
        $currentCandidate = [
            'scene_family' => $sceneFamily,
            'environment_family' => $environmentFamily,
            'composition_type' => $compositionType,
            'camera_viewpoint' => $cameraViewpoint,
            'lighting_profile' => $lightingProfile,
            'prop_profile' => $propProfile,
            'copy_layout' => $copyLayout,
            'product_name_style' => $productNameStyle,
            'price_style' => $priceStyle,
            'tagline_style' => $taglineStyle,
            'text_depth_mode' => $textDepthMode,
            'visual_world_archetype' => $visualWorldArchetype,
            'background_style' => $backgroundStyle,
            'product_arrangement' => $productArrangement,
        ];
        $attemptedCandidates[] = $currentCandidate;

        $diversityEvaluation = $designSystem->evaluateVisualCoreDiversity($currentCandidate, $recentFingerprints);
        $retryCount = 0;
        $maxRetries = 2;
        $isDerived = false;

        // Bounded retry semantics: The retry count is bounded at two attempts;
        // generation proceeds only after an accepted candidate is obtained, otherwise the request fails explicitly.
        while (! $diversityEvaluation['is_allowed'] && $retryCount < $maxRetries) {
            $retryCount++;
            $rejectedCandidates[] = [
                'candidate' => $currentCandidate,
                'evaluation' => $diversityEvaluation,
                'retry_attempt' => $retryCount,
            ];
            Log::info("Automatic Creative Director proposal prohibited ({$diversityEvaluation['max_match_count']}/6 match). Regenerating/deriving candidate. Attempt: {$retryCount}");

            $fingerprintsToAvoid = array_merge($recentFingerprints, $attemptedCandidates);
            $currentCandidate = $designSystem->deriveDiverseVisualCore($currentCandidate, $fingerprintsToAvoid, $context);
            $attemptedCandidates[] = $currentCandidate;
            $diversityEvaluation = $designSystem->evaluateVisualCoreDiversity($currentCandidate, $recentFingerprints);
            $isDerived = true;
        }

        // Explicit Controlled Generation Failure Path
        if (! $diversityEvaluation['is_allowed']) {
            $rejectedCandidates[] = [
                'candidate' => $currentCandidate,
                'evaluation' => $diversityEvaluation,
                'retry_attempt' => $retryCount,
            ];
            Log::warning("Automatic Creative Director failed to produce an acceptable candidate after {$retryCount} retries. Generation rejected.");

            return response()->json([
                'success' => false,
                'message' => 'Unable to generate a sufficiently diverse creative concept within retry limits. The proposed visual staging was too similar to recent campaigns. Please adjust campaign settings or try again.',
                'generation_metadata' => [
                    'visual_core_diversity' => [
                        'attempted_candidates' => $attemptedCandidates,
                        'rejected_candidates' => $rejectedCandidates,
                        'final_accepted_candidate' => null,
                        'similarity_metrics' => $diversityEvaluation,
                        'diversity_result' => $diversityEvaluation,
                        'retry_count' => $retryCount,
                        'retry_limit' => $maxRetries,
                        'final_coherence_state' => 'prohibited_exhaustion',
                    ],
                ],
            ], 422);
        }

        // Apply final accepted candidate
        $sceneFamily = $currentCandidate['scene_family'];
        $environmentFamily = $currentCandidate['environment_family'];
        $compositionType = $currentCandidate['composition_type'];
        $cameraViewpoint = $currentCandidate['camera_viewpoint'];
        $lightingProfile = $currentCandidate['lighting_profile'];
        $propProfile = $currentCandidate['prop_profile'];
        $copyLayout = $currentCandidate['copy_layout'] ?? $copyLayout;
        $typographyLayout = $copyLayout;
        $productNameStyle = $currentCandidate['product_name_style'] ?? $productNameStyle;
        $priceStyle = $currentCandidate['price_style'] ?? $priceStyle;
        $taglineStyle = $currentCandidate['tagline_style'] ?? $taglineStyle;
        $textDepthMode = $currentCandidate['text_depth_mode'] ?? $textDepthMode;
        $visualWorldArchetype = $currentCandidate['visual_world_archetype'] ?? $visualWorldArchetype;
        $backgroundStyle = $currentCandidate['background_style'] ?? $backgroundStyle;
        $productArrangement = $currentCandidate['product_arrangement'] ?? $productArrangement;

        // If candidate was derived, rebuild coherent creative concept, visual strategy, and scene direction
        // to guarantee no contradiction between structured visual core and textual direction.
        if ($isDerived) {
            $coherentDirection = $designSystem->buildCoherentCreativeDirection(
                $currentCandidate,
                $primaryProduct?->name ?? 'Featured Product',
                $business->industry,
                $business->category,
                $event?->name
            );

            $creativeConcept = $coherentDirection['creative_concept'];
            $visualStrategy = $coherentDirection['visual_strategy'];
            $conceptScene = $coherentDirection['scene_prompt'];
        }

        // Stage 2: Unified Production Prompt Orchestration with ModularPromptOrchestrator
        $referenceImagePath = $primaryProduct?->image_path;
        $referenceImagePaths = $catalogProducts
            ->pluck('image_path')
            ->filter()
            ->values()
            ->all();
        $productImageUrl = $primaryProduct?->image_path ? Storage::url($primaryProduct->image_path) : null;

        // Build Complete Multi-Product Compositor Contract
        $primaryProductContract = null;
        if ($primaryProduct) {
            $primaryProductContract = [
                'name' => $primaryProduct->name,
                'price' => $includePrices ? $primaryProduct->price : null,
            ];
        } else {
            $primaryProductContract = [
                'name' => 'Featured Product',
                'price' => null,
            ];
        }

        $coFeaturedProductsContract = [];
        if ($catalogProducts->count() > 1) {
            foreach ($catalogProducts->slice(1) as $cp) {
                $coFeaturedProductsContract[] = [
                    'name' => $cp->name,
                    'price' => $includePrices ? $cp->price : null,
                ];
            }
        }
        foreach ($validated['custom_products'] ?? [] as $custom) {
            $cName = is_array($custom) ? ($custom['name'] ?? null) : ($custom->name ?? null);
            $cPrice = is_array($custom) ? ($custom['price'] ?? null) : ($custom->price ?? null);
            if (! empty($cName)) {
                $coFeaturedProductsContract[] = [
                    'name' => $cName,
                    'price' => $includePrices ? $cPrice : null,
                ];
            }
        }

        $totalProductCount = $catalogProducts->count() + count($validated['custom_products'] ?? []);
        $isMultiProduct = $totalProductCount > 1;

        $pricesContract = [];
        if ($includePrices) {
            if ($primaryProductContract && ! empty($primaryProductContract['price'])) {
                $pricesContract[$primaryProductContract['name']] = $primaryProductContract['price'];
                if ($primaryProduct) {
                    $pricesContract[(string) $primaryProduct->id] = $primaryProductContract['price'];
                }
            }
            if ($catalogProducts->count() > 1) {
                foreach ($catalogProducts->slice(1)->values() as $idx => $cp) {
                    $cPrice = $coFeaturedProductsContract[$idx]['price'] ?? null;
                    if (! empty($cPrice)) {
                        $pricesContract[$cp->name] = $cPrice;
                        $pricesContract[(string) $cp->id] = $cPrice;
                    }
                }
            }
            foreach ($validated['custom_products'] ?? [] as $cIdx => $custom) {
                $cName = is_array($custom) ? ($custom['name'] ?? null) : ($custom->name ?? null);
                $customOffset = ($catalogProducts ? max(0, $catalogProducts->count() - 1) : 0) + $cIdx;
                $cPrice = $coFeaturedProductsContract[$customOffset]['price'] ?? null;
                if (! empty($cName) && ! empty($cPrice)) {
                    $pricesContract[$cName] = $cPrice;
                    $pricesContract["custom_{$cIdx}"] = $cPrice;
                }
            }
        }

        $orchestratedOptions = [
            'generation_mode' => 'automatic',
            'is_variation' => $isVariation,
            'source_design_id' => $validated['source_design_id'] ?? null,
            'deterministic_compositing' => true,
            'business' => $business,
            'primary_product' => $primaryProductContract,
            'co_featured_products' => $coFeaturedProductsContract,
            'prices' => $isMultiProduct ? $pricesContract : null,
            'product_name' => $primaryProduct?->name ?? 'Featured Product',
            'product_description' => $primaryProduct?->description,
            'product_category' => $business->category,
            'business_category' => $business->category,
            'product_image_url' => $productImageUrl,
            'campaign_name' => $campaign->name,
            'campaign_objective' => $campaign->objective,
            'event_name' => $event?->name,
            'show_event_text' => $showEventText,
            'price' => ($isMultiProduct || ! $includePrices) ? null : $primaryProduct?->price,
            'include_prices' => $includePrices,
            'catalog_products' => $catalogProducts,
            'custom_products' => $validated['custom_products'] ?? [],
            'brand_tone' => array_filter([$brandTone]),
            'visual_theme' => array_filter([$visualTheme]),
            'visual_world_archetype' => $visualWorldArchetype,
            'background_style' => $backgroundStyle,
            'product_arrangement' => $productArrangement,
            'render_style' => $renderStyle,
            'design_treatment' => $designTreatment,
            'copy_emphasis' => $copyEmphasis,
            'typography_layout' => $typographyLayout,
            'copy_layout' => $copyLayout,
            'product_name_style' => $productNameStyle,
            'price_style' => $priceStyle,
            'tagline_style' => $taglineStyle,
            'text_depth_mode' => $textDepthMode,
            'creative_concept' => $creativeConcept,
            'visual_strategy' => $visualStrategy,
            'composition_type' => $compositionType,
            'camera_viewpoint' => $cameraViewpoint,
            'lighting_profile' => $lightingProfile,
            'scene_family' => $sceneFamily,
            'environment_family' => $environmentFamily,
            'prop_profile' => $propProfile,
            'tagline' => $generatedTagline,
            'include_tagline' => $includeTagline,
            'tagline_mode' => $includeTagline ? 'ai' : 'none',
            'aspect_ratio' => $aspectRatio,
            'image_model' => $imageModel,
            'image_quality' => $imageQuality,
            'include_business_name' => $includeBusinessName,
            'business_name' => $businessName,
            'business_industry' => $business->industry,
            'business_description' => $business->description,
            'business_usp' => $business->unique_selling_point,
            'business_target_audience' => $business->target_audience,
            'business_content_style' => $business->content_style,
            'business_marketing_prefs' => $business->marketing_preferences,
            'reference_image_path' => $referenceImagePath,
            'reference_image_paths' => $referenceImagePaths,
            'scene_prompt' => $conceptScene,
            'user_prompt' => $conceptScene,
            'notes' => null,
        ];

        $productionVisualPrompt = $promptOrchestrator->orchestrate($orchestratedOptions, $business);

        $creativeFingerprint = $designSystem->buildFingerprint([
            'creative_concept' => $creativeConcept,
            'scene_family' => $sceneFamily,
            'environment_family' => $environmentFamily,
            'composition_type' => $compositionType,
            'camera_viewpoint' => $cameraViewpoint,
            'lighting_profile' => $lightingProfile,
            'prop_profile' => $propProfile,
            'typography_layout' => $typographyLayout,
            'copy_layout' => $copyLayout,
            'product_name_style' => $productNameStyle,
            'price_style' => $priceStyle,
            'tagline_style' => $taglineStyle,
            'text_depth_mode' => $textDepthMode,
            'copy_emphasis' => $copyEmphasis,
            'design_treatment' => $designTreatment,
            'render_style' => $renderStyle,
            'aspect_ratio' => $aspectRatio,
            'visual_world_archetype' => $visualWorldArchetype,
            'background_style' => $backgroundStyle,
            'product_arrangement' => $productArrangement,
            'visual_theme' => $visualTheme,
            'brand_tone' => $brandTone,
        ]);

        // Stage 3: Immediate Downstream Image Generation
        try {
            $generatedImagePath = $openAIService->generate($productionVisualPrompt, $orchestratedOptions);

            $blueprint = $openAIService->getLastReferenceBlueprint();
            $genMeta = array_merge($openAIService->getLastGenerationMetadata() ?: [], [
                'creative_fingerprint' => $creativeFingerprint,
                'design_treatment' => $designTreatment,
                'copy_emphasis' => $copyEmphasis,
                'typography_layout' => $typographyLayout,
                'copy_layout' => $copyLayout,
                'product_name_style' => $productNameStyle,
                'price_style' => $priceStyle,
                'tagline_style' => $taglineStyle,
                'text_depth_mode' => $textDepthMode,
                'composition_type' => $compositionType,
                'camera_viewpoint' => $cameraViewpoint,
                'lighting_profile' => $lightingProfile,
                'scene_family' => $sceneFamily,
                'environment_family' => $environmentFamily,
                'prop_profile' => $propProfile,
                'visual_world_archetype' => $visualWorldArchetype,
                'background_style' => $backgroundStyle,
                'product_arrangement' => $productArrangement,
                'visual_theme' => $visualTheme,
                'brand_tone' => $brandTone,
                'show_event_text' => $showEventText,
                'visual_core_diversity' => [
                    'attempted_candidates' => $attemptedCandidates,
                    'rejected_candidates' => $rejectedCandidates,
                    'final_accepted_candidate' => $currentCandidate,
                    'similarity_metrics' => $diversityEvaluation,
                    'diversity_result' => $diversityEvaluation,
                    'retry_count' => $retryCount,
                    'retry_limit' => $maxRetries,
                    'final_coherence_state' => $isDerived ? 'derived_coherent' : 'original_accepted',
                ],
            ]);

            $previewData = [
                'image_url' => Storage::url($generatedImagePath),
                'generated_image_path' => $generatedImagePath,
                'prompt' => $productionVisualPrompt,
                'visual_prompt' => $productionVisualPrompt,
                'tagline' => $generatedTagline,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'design_treatment' => $designTreatment,
                'copy_emphasis' => $copyEmphasis,
                'typography_layout' => $typographyLayout,
                'copy_layout' => $copyLayout,
                'product_name_style' => $productNameStyle,
                'price_style' => $priceStyle,
                'tagline_style' => $taglineStyle,
                'text_depth_mode' => $textDepthMode,
                'creative_fingerprint' => $creativeFingerprint,
                'scene_family' => $sceneFamily,
                'environment_family' => $environmentFamily,
                'prop_profile' => $propProfile,
                'visual_world_archetype' => $visualWorldArchetype,
                'background_style' => $backgroundStyle,
                'product_arrangement' => $productArrangement,
                'visual_theme' => $visualTheme,
                'brand_tone' => $brandTone,
                'show_event_text' => $showEventText,
                'product_name' => $primaryProduct?->name ?? 'Featured Product',
                'product_id' => $primaryProduct?->id,
                'catalog_product_ids' => $catalogProducts->pluck('id')->all(),
                'custom_products' => $validated['custom_products'] ?? [],
                'reference_image_paths' => $referenceImagePaths,
                'price' => $includePrices ? $primaryProduct?->price : null,
                'include_prices' => $includePrices,
                'include_tagline' => $includeTagline,
                'render_style' => $renderStyle,
                'aspect_ratio' => $aspectRatio,
                'image_model' => $imageModel,
                'image_quality' => $imageQuality,
                'reference_blueprint' => $blueprint,
                'generation_meta' => $genMeta,
                'source_design_id' => $validated['source_design_id'] ?? null,
                'is_variation' => $isVariation,
                'primary_product' => $primaryProductContract,
                'co_featured_products' => $coFeaturedProductsContract,
                'prices' => $pricesContract,
            ];

            return response()->json(array_merge([
                'success' => true,
                'message' => 'Visual creative generated automatically.',
                'tagline' => $generatedTagline,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'design_treatment' => $designTreatment,
                'copy_emphasis' => $copyEmphasis,
                'creative_fingerprint' => $creativeFingerprint,
                'visual_prompt' => $productionVisualPrompt,
                'prompt' => $productionVisualPrompt,
                'include_tagline' => $includeTagline,
                'include_prices' => $includePrices,
                'preview' => $previewData,
            ], $previewData));
        } catch (\Throwable $e) {
            Log::error('Automatic visual generation image step failed: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            NotificationService::notifyAi(
                $user,
                'AI Generation Failed',
                'Your visual creative could not be synthesized: '.($e->getMessage() ?: 'An unexpected error occurred during generation.'),
                route('campaigns.generator', $campaign),
                ['error' => $e->getMessage()]
            );

            return response()->json([
                'success' => false,
                'message' => 'Image generation could not be completed. Your creative concept and prompt were preserved: '.$e->getMessage(),
                'tagline' => $generatedTagline,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'visual_prompt' => $productionVisualPrompt,
            ], 500);
        }
    }
}
