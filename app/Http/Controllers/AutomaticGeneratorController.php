<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesGeneratorContext;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use App\Services\NotificationService;
use App\Services\OpenAIImageService;
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
        ModularPromptOrchestrator $promptOrchestrator
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
            'tagline' => ['nullable', 'string', 'max:255'],
            'user_instruction' => ['nullable', 'string', 'max:4000'],
            'image_prompt' => ['nullable', 'string', 'max:4000'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'previous_concepts' => ['nullable', 'array'],
            'previous_concepts.*' => ['string', 'max:500'],
            'include_business_name' => ['nullable', 'boolean'],
            'image_model' => ['nullable', 'string', 'max:50'],
            'image_quality' => ['nullable', 'string', 'in:low,medium,high'],
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
                    $pos = array_search($p->id, $catalogProductIds, true);

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
        $imageModel = $validated['image_model'] ?? 'gpt-image-2';
        $imageQuality = $validated['image_quality'] ?? 'medium';
        $includeBusinessName = filter_var($validated['include_business_name'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $businessName = $includeBusinessName ? $business->name : null;

        // Primary catalog product for reference preservation
        $primaryProduct = $catalogProducts->first();
        $event = $campaign->event;

        $userTagline = ! empty($validated['tagline']) ? trim((string) $validated['tagline']) : null;
        $userPrompt = ! empty($validated['user_instruction'])
            ? trim((string) $validated['user_instruction'])
            : (! empty($validated['image_prompt']) ? trim((string) $validated['image_prompt']) : null);

        // Stage 1: Autonomous Creative Direction (Tagline, Concept, Strategy, Visual Prompt)
        try {
            $creativeResult = $promptService->generate($user, $campaign, $business, [
                'generation_mode' => 'automatic',
                'require_tagline' => true,
                'tagline' => $userTagline,
                'user_instruction' => $userPrompt,
                'previous_concepts' => $validated['previous_concepts'] ?? [],
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

        $generatedTagline = $userTagline ?: ($creativeResult['tagline'] ?? null);
        $creativeConcept = $creativeResult['creative_concept'] ?? null;
        $visualStrategy = $creativeResult['visual_strategy'] ?? null;
        $conceptScene = $userPrompt ?: $creativeResult['visual_prompt'];

        // Stage 2: Unified Production Prompt Orchestration with ModularPromptOrchestrator
        $referenceImagePath = $primaryProduct?->image_path;
        $productImageUrl = $primaryProduct?->image_path ? Storage::url($primaryProduct->image_path) : null;

        $orchestratedOptions = [
            'generation_mode' => 'automatic',
            'product_name' => $primaryProduct?->name ?? 'Featured Product',
            'product_description' => $primaryProduct?->description,
            'product_category' => $business->category,
            'business_category' => $business->category,
            'product_image_url' => $productImageUrl,
            'campaign_name' => $campaign->name,
            'campaign_objective' => $campaign->objective,
            'event_name' => $event?->name,
            'price' => $primaryProduct?->price,
            'brand_tone' => [],
            'visual_theme' => [],
            'render_style' => 'Automatic Commercial Art Direction',
            'tagline' => $generatedTagline,
            'tagline_mode' => 'ai',
            'aspect_ratio' => $aspectRatio,
            'image_model' => $imageModel,
            'image_quality' => $imageQuality,
            'include_business_name' => $includeBusinessName,
            'business_name' => $businessName,
            'business_industry' => $business->industry,
            'business_description' => $business->description,
            'business_usp' => $business->unique_selling_point,
            'business_content_style' => $business->content_style,
            'business_marketing_prefs' => $business->marketing_preferences,
            'reference_image_path' => $referenceImagePath,
            'scene_prompt' => $conceptScene,
            'user_prompt' => $conceptScene,
            'notes' => null,
        ];

        $productionVisualPrompt = $promptOrchestrator->orchestrate($orchestratedOptions, $business);

        // Stage 3: Immediate Downstream Image Generation
        try {
            $generatedImagePath = $openAIService->generate($productionVisualPrompt, $orchestratedOptions);

            $blueprint = $openAIService->getLastReferenceBlueprint();
            $genMeta = $openAIService->getLastGenerationMetadata();

            $previewData = [
                'image_url' => Storage::url($generatedImagePath),
                'generated_image_path' => $generatedImagePath,
                'prompt' => $productionVisualPrompt,
                'visual_prompt' => $productionVisualPrompt,
                'tagline' => $generatedTagline,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'product_name' => $primaryProduct?->name ?? 'Featured Product',
                'product_id' => $primaryProduct?->id,
                'price' => $primaryProduct?->price,
                'render_style' => 'Automatic Commercial Art Direction',
                'aspect_ratio' => $aspectRatio,
                'image_model' => $imageModel,
                'image_quality' => $imageQuality,
                'reference_blueprint' => $blueprint,
                'generation_meta' => $genMeta,
            ];

            return response()->json(array_merge([
                'success' => true,
                'message' => 'Visual creative generated successfully.',
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
