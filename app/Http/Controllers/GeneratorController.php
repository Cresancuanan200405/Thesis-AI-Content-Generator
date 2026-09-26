<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeneratePromptRequest;
use App\Http\Requests\GeneratorRequest as StoreGeneratorRequest;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingPromptBuilder;
use App\Services\ModularPromptOrchestrator;
use App\Services\NotificationService;
use App\Services\OpenAIImageService;
use App\Services\OpenAIModelRegistry;
use App\Services\TaglineNormalizationService;
use App\Services\VisualPromptGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class GeneratorController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $campaignParam = $request->route('campaign');
        $campaignId = $campaignParam instanceof Campaign
            ? $campaignParam->id
            : ($campaignParam ?: ($request->input('campaign_id') ?: $request->input('campaign')));

        if (! $campaignId) {
            return redirect()->route('campaigns.index')
                ->with('info', 'Please select or create a Campaign before generating AI marketing visuals.');
        }

        $params = $request->query();
        if ($campaignId && ! isset($params['campaign_id'])) {
            $params['campaign_id'] = (string) $campaignId;
        }

        return redirect()->route('generator.automatic.index', $params);
    }

    public function store(StoreGeneratorRequest $request): RedirectResponse
    {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        /** @var User $user */
        $user = $request->user();

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user->hasReachedAiBudgetLimit($budgetLimit)) {
            return redirect()->route('generator.index')->with('error', 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual generation is disabled.');
        }

        /** @var Business $business */
        $business = $user->business()->firstOrFail();
        $payload = $request->validated();
        $payload['tagline'] = TaglineNormalizationService::normalize($payload['tagline'] ?? null);

        $referenceImagePath = null;
        if ($request->hasFile('reference_image')) {
            $referenceImagePath = $request->file('reference_image')->store('generation-requests');
        }

        // Resolve campaign details for context
        /** @var Campaign $campaign */
        $campaign = $user->campaigns()->whereKey($payload['campaign_id'])->firstOrFail();
        /** @var Product|null $product */
        $product = ! empty($payload['product_id']) ? Product::query()->where('id', $payload['product_id'])->first() : $campaign->product;
        /** @var Event|null $event */
        $event = ! empty($payload['event_id']) ? Event::query()->where('id', $payload['event_id'])->first() : $campaign->event;

        if (! $referenceImagePath && $product?->image_path) {
            $referenceImagePath = $product->image_path;
        }

        $includeBusinessName = $request->has('include_business_name')
            ? filter_var($request->input('include_business_name'), FILTER_VALIDATE_BOOLEAN)
            : true;

        $businessName = null;
        if ($includeBusinessName) {
            $businessName = ! empty($payload['business_name']) ? trim((string) $payload['business_name']) : $business->name;
        }

        $payload['include_business_name'] = $includeBusinessName;
        $payload['business_name'] = $businessName;
        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : null;

        $prompt = app(MarketingPromptBuilder::class)->build($payload, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $campaign->id,
            'product_id' => $product?->id ?? ($payload['product_id'] ?? null),
            'event_id' => $event?->id ?? ($payload['event_id'] ?? null),
            'product_name' => $payload['product_name'],
            'marketing_goal' => $payload['marketing_goal'],
            'content_style' => $payload['content_style'] ?? [],
            'brand_tone' => $payload['brand_tone'] ?? [],
            'tagline' => $payload['tagline'] ?? null,
            'tagline_mode' => $payload['tagline_mode'] ?? 'auto',
            'unique_selling_point' => $payload['unique_selling_point'] ?? null,
            'reference_image_path' => $referenceImagePath,
            'notes' => $payload['notes'] ?? null,
            'prompt' => $prompt,
            'status' => 'processing',
        ]);

        $openAIService = app(OpenAIImageService::class);

        try {
            $generatedImagePath = $openAIService->generate($prompt, [
                'generation_mode' => $payload['generation_mode'] ?? 'manual',
                // Step 1 — Product & Campaign
                'product_name' => $payload['product_name'],
                'product_description' => $product?->description,
                'product_category' => $business->category,
                'business_category' => $business->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign->name,
                'campaign_objective' => $campaign->objective,
                'event_name' => $event?->name,
                'price' => $payload['price'] ?? null,

                // Step 2 — Style & Tone
                'brand_tone' => $payload['brand_tone'] ?? [],
                'visual_theme' => $payload['content_style'] ?? [],
                'render_style' => $payload['render_style'] ?? 'Studio Product Still',

                // Step 3 — Canvas
                'tagline' => $payload['tagline'] ?? null,
                'tagline_mode' => $payload['tagline_mode'] ?? 'ai',
                'aspect_ratio' => $payload['aspect_ratio'] ?? '1:1',
                'image_model' => OpenAIModelRegistry::DEFAULT_IMAGE_MODEL,

                // Onboarding / Business Context
                'business_name' => $businessName,
                'business_industry' => $business->industry,
                'business_description' => $business->description,
                'business_usp' => $business->unique_selling_point,
                'business_content_style' => $business->content_style,
                'business_marketing_prefs' => $business->marketing_preferences,

                // Reference image (uploaded file or catalog product image)
                'reference_image_path' => $referenceImagePath,
                'scene_prompt' => $payload['image_prompt'] ?? $payload['scene_prompt'] ?? $payload['prompt'] ?? $payload['notes'] ?? null,
                'user_prompt' => $payload['image_prompt'] ?? $payload['scene_prompt'] ?? $payload['prompt'] ?? $payload['notes'] ?? null,
                'notes' => $payload['notes'] ?? null,
            ]);
        } catch (RuntimeException $exception) {
            Log::error('OpenAI image generation failed.', [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'generation_request_id' => $generationRequest->id,
                'error' => $exception->getMessage(),
            ]);

            $generationRequest->update([
                'status' => 'failed',
                'notes' => 'Your design could not be generated right now. Please try again.',
            ]);

            NotificationService::notifyAi(
                $user,
                'AI Generation Failed',
                'Your design could not be generated: '.($exception->getMessage() ?: 'An unexpected error occurred during generation.'),
                route('campaigns.generator', $campaign),
                ['error' => $exception->getMessage()]
            );

            return redirect()->route('campaigns.generator', $campaign)->with('error', 'Your design could not be generated right now. Please try again.');
        }

        $generationRequest->update([
            'status' => 'completed',
        ]);

        Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $campaign->id,
            'event_id' => $event?->id ?? ($payload['event_id'] ?? null),
            'product_id' => $product?->id ?? ($payload['product_id'] ?? null),
            'product_name' => $payload['product_name'],
            'prompt' => $prompt,
            'price' => ! empty($payload['price']) ? (float) preg_replace('/[^0-9.]/', '', (string) $payload['price']) : null,
            'brand_tone' => $payload['brand_tone'] ? implode(', ', $payload['brand_tone']) : null,
            'visual_theme' => $payload['content_style'] ? implode(', ', $payload['content_style']) : null,
            'tagline' => $payload['tagline'] ?? null,
            'tagline_mode' => $payload['tagline_mode'] ?? 'auto',
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => array_merge(
                $openAIService->getLastGenerationMetadata() ?: [],
                [
                    'source' => 'openai',
                    'model' => OpenAIModelRegistry::DEFAULT_IMAGE_MODEL,
                    'quality' => $payload['image_quality'] ?? 'medium',
                    'render_style' => $payload['render_style'] ?? 'Studio Product Still',
                    'aspect_ratio' => $payload['aspect_ratio'] ?? '1:1',
                    'business_name' => $businessName,
                    'generation_mode' => $referenceImagePath ? 'PRODUCT_REFERENCE' : 'CREATIVE_GENERATION',
                    'creative_concept' => $payload['creative_concept'] ?? null,
                    'visual_strategy' => $payload['visual_strategy'] ?? null,
                    'product_preserved' => (bool) ($openAIService->getLastGenerationMetadata()['product_preserved'] ?? (bool) $referenceImagePath),
                    'reference_image_used' => (bool) ($openAIService->getLastGenerationMetadata()['reference_image_used'] ?? (bool) $referenceImagePath),
                    'prompt_version' => 'marketing-pipeline-v1',
                    'generation_meta' => $openAIService->getLastGenerationMetadata(),
                    'reference_blueprint' => $openAIService->getLastReferenceBlueprint(),
                    'generation_request_id' => $generationRequest->id,
                    'timestamp' => now()->toIso8601String(),
                ]
            ),
            'status' => 'completed',
        ]);

        return redirect()->route('campaigns.generator', $campaign)->with('success', 'Your marketing asset has been generated.');
    }

    /**
     * Generate visual creative preview without automatically creating a permanent Design record in My Designs.
     */
    public function generatePreview(Request $request, OpenAIImageService $openAIService, MarketingPromptBuilder $promptBuilder): JsonResponse
    {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        /** @var User $user */
        $user = $request->user();

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user->hasReachedAiBudgetLimit($budgetLimit)) {
            return response()->json([
                'success' => false,
                'quota_exceeded' => true,
                'message' => 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual generation is disabled.',
            ], 403);
        }

        /** @var Business $business */
        $business = $user->business()->firstOrFail();

        $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'image_prompt' => ['nullable', 'string'],
            'event_id' => ['nullable', 'exists:events,id'],
        ]);

        /** @var Campaign|null $campaign */
        $campaign = $user->campaigns()->whereKey($request->input('campaign_id'))->first();
        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'A valid owned Campaign is required before generating creative visuals.',
            ], 422);
        }

        $referenceImagePath = null;
        if ($request->hasFile('reference_image')) {
            $referenceImagePath = $request->file('reference_image')->store('generation-requests');
        }

        /** @var Product|null $product */
        $product = $request->filled('product_id') ? Product::query()->where('id', $request->input('product_id'))->first() : $campaign->product;
        /** @var Event|null $event */
        $event = $request->filled('event_id') ? Event::query()->where('id', $request->input('event_id'))->first() : $campaign->event;

        if (! $referenceImagePath && $product?->image_path) {
            $referenceImagePath = $product->image_path;
        }

        $includeBusinessName = $request->has('include_business_name')
            ? filter_var($request->input('include_business_name'), FILTER_VALIDATE_BOOLEAN)
            : true;

        $businessName = null;
        if ($includeBusinessName) {
            $businessName = $request->filled('business_name') ? trim((string) $request->input('business_name')) : $business->name;
        }
        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : null;
        $normalizedTagline = TaglineNormalizationService::normalize($request->input('tagline'));

        $previewPayload = $request->all();
        $previewPayload['tagline'] = $normalizedTagline;
        $previewPayload['include_business_name'] = $includeBusinessName;
        $previewPayload['business_name'] = $businessName;

        $prompt = (string) ($request->input('image_prompt') ?: $request->input('prompt') ?: $promptBuilder->build($previewPayload, $business));

        try {
            $brandTone = $request->input('brand_tone') ?? [];
            if (is_string($brandTone)) {
                $brandTone = explode(',', $brandTone);
            }
            $visualTheme = $request->input('content_style') ?? $request->input('visual_theme') ?? [];
            if (is_string($visualTheme)) {
                $visualTheme = explode(',', $visualTheme);
            }

            $generatedImagePath = $openAIService->generate($prompt, [
                'generation_mode' => $request->input('generation_mode', 'manual'),
                'product_name' => (string) $request->input('product_name'),
                'product_description' => $product?->description,
                'product_category' => $business->category,
                'business_category' => $business->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign?->name,
                'campaign_objective' => $campaign?->objective,
                'event_name' => $event?->name,
                'price' => $request->input('price'),
                'brand_tone' => $brandTone,
                'visual_theme' => $visualTheme,
                'render_style' => $request->input('render_style', 'Studio Product Still'),
                'tagline' => $normalizedTagline,
                'tagline_mode' => $request->input('tagline_mode', 'ai'),
                'aspect_ratio' => $request->input('aspect_ratio', '1:1'),
                'image_model' => OpenAIModelRegistry::DEFAULT_IMAGE_MODEL,
                'business_name' => $businessName,
                'business_industry' => $business->industry,
                'business_description' => $business->description,
                'business_usp' => $business->unique_selling_point,
                'business_content_style' => $business->content_style,
                'business_marketing_prefs' => $business->marketing_preferences,
                'reference_image_path' => $referenceImagePath,
                'scene_prompt' => $request->input('image_prompt') ?: $request->input('scene_prompt') ?: $request->input('prompt') ?: $request->input('notes'),
                'user_prompt' => $request->input('image_prompt') ?: $request->input('scene_prompt') ?: $request->input('prompt') ?: $request->input('notes'),
                'notes' => $request->input('notes'),
            ]);

            $blueprint = $openAIService->getLastReferenceBlueprint();
            $genMeta = $openAIService->getLastGenerationMetadata();

            return response()->json([
                'success' => true,
                'image_url' => Storage::url($generatedImagePath),
                'generated_image_path' => $generatedImagePath,
                'prompt' => $prompt,
                'product_name' => $request->input('product_name'),
                'tagline' => $normalizedTagline,
                'price' => $request->input('price'),
                'render_style' => $request->input('render_style', 'Studio Product Still'),
                'aspect_ratio' => $request->input('aspect_ratio', '1:1'),
                'image_model' => OpenAIModelRegistry::DEFAULT_IMAGE_MODEL,
                'image_quality' => $request->input('image_quality', 'medium'),
                'reference_blueprint' => $blueprint,
                'generation_meta' => $genMeta,
                'message' => 'Visual creative generated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('OpenAI image generation preview failed: '.$e->getMessage());

            NotificationService::notifyAi(
                $user,
                'AI Generation Failed',
                'Your visual creative could not be synthesized: '.($e->getMessage() ?: 'An unexpected error occurred during generation.'),
                route('campaigns.generator', $campaign),
                ['error' => $e->getMessage()]
            );

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Your visual creative could not be synthesized right now. Please try again.',
            ], 500);
        }
    }

    /**
     * Generate an AI-powered visual marketing prompt using GPT-5.6 Luna and OpenAI Responses API.
     */
    public function generatePrompt(
        GeneratePromptRequest $request,
        VisualPromptGeneratorService $promptService
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user->hasReachedAiBudgetLimit($budgetLimit)) {
            return response()->json([
                'success' => false,
                'quota_exceeded' => true,
                'message' => 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Prompt generation is disabled.',
            ], 403);
        }

        /** @var Campaign $campaign */
        $campaign = $user->campaigns()->with(['event'])->whereKey($request->input('campaign_id'))->firstOrFail();
        /** @var Business|null $business */
        $business = $user->business()->first();

        // Authoritative catalog products from database belonging to this business
        $catalogIds = $request->input('catalog_product_ids', []);
        $catalogProducts = ! empty($catalogIds) && is_array($catalogIds)
            ? Product::query()->whereIn('id', $catalogIds)->where('business_id', $business?->id)->get()
            : collect();

        // Fallback: if no catalog products explicitly passed, check if campaign has a linked product
        if ($catalogProducts->isEmpty() && $campaign->product_id) {
            $campaignProduct = Product::query()->where('id', $campaign->product_id)->where('business_id', $business?->id)->first();
            if ($campaignProduct) {
                $catalogProducts = collect([$campaignProduct]);
            }
        }

        $generationMode = $request->input('generation_mode') === 'automatic' ? 'automatic' : 'manual';
        $requireTagline = filter_var($request->input('require_tagline', false), FILTER_VALIDATE_BOOLEAN)
            || $request->input('target') === 'tagline'
            || $generationMode === 'automatic';

        $eventId = $request->input('event_id');
        $event = ! empty($eventId)
            ? Event::query()->where('id', $eventId)->first()
            : $campaign->event;

        $showEventText = $request->has('show_event_text')
            ? filter_var($request->input('show_event_text'), FILTER_VALIDATE_BOOLEAN)
            : ($event !== null);

        try {
            $result = $promptService->generate($user, $campaign, $business, [
                'generation_mode' => $generationMode,
                'require_tagline' => $requireTagline,
                'previous_concepts' => $request->input('previous_concepts', []),
                'catalog_products' => $catalogProducts,
                'custom_products' => $request->input('custom_products', []),
                'user_instruction' => $request->input('user_instruction') ?: $request->input('image_prompt') ?: $request->input('notes'),
                'render_style' => $request->input('render_style'),
                'design_treatment' => $request->input('design_treatment'),
                'copy_emphasis' => $request->input('copy_emphasis'),
                'visual_theme' => $request->input('visual_theme') ?: $request->input('content_style'),
                'brand_tone' => $request->input('brand_tone'),
                'aspect_ratio' => $request->input('aspect_ratio', '1:1'),
                'tagline' => $request->input('tagline'),
                'include_tagline' => $request->has('include_tagline') ? filter_var($request->input('include_tagline'), FILTER_VALIDATE_BOOLEAN) : null,
                'include_prices' => $request->has('include_prices') ? filter_var($request->input('include_prices'), FILTER_VALIDATE_BOOLEAN) : null,
                'include_business_name' => $request->input('include_business_name', true),
                'has_reference_image' => (bool) $request->input('has_reference_image', false),
                'event_id' => $event?->id,
                'event' => $event,
                'show_event_text' => $showEventText,
            ]);

            return response()->json([
                'success' => true,
                'tagline' => $result['tagline'] ?? null,
                'visual_prompt' => $result['visual_prompt'],
                'creative_concept' => $result['creative_concept'],
                'visual_strategy' => $result['visual_strategy'],
                'model' => $result['model'],
                'usage' => $result['usage'],
                'message' => 'Visual prompt generated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Visual prompt generation failed: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => "We couldn't generate the visual prompt right now. Please try again.",
            ], 500);
        }
    }

    /**
     * One-action automatic generation: derives tagline, concept, strategy, and prompt with AI,
     * and immediately invokes the downstream image generation pipeline in one continuous flow.
     */
    public function generateAutomatic(
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
        $imageModel = OpenAIModelRegistry::DEFAULT_IMAGE_MODEL;
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

    /**
     * @return string[]
     */
    private function decodeJsonList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return array_values($decoded);
            }
        }

        return [];
    }
}
