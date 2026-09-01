<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeneratorRequest as StoreGeneratorRequest;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingPromptBuilder;
use App\Services\NotificationService;
use App\Services\OpenAIImageService;
use App\Services\PhilippineHolidayService;
use App\Services\TaglineNormalizationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class GeneratorController extends Controller
{
    public function index(Request $request, PhilippineHolidayService $holidayService): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user?->business()->first();
        /** @var Collection<int, Product> $products */
        $products = $business?->products()->orderBy('name')->get() ?? collect();
        /** @var Campaign|null $campaign */
        $campaign = null;

        $campaignId = $request->input('campaign_id') ?: $request->input('campaign');
        if ($campaignId) {
            $campaign = $user?->campaigns()->with(['product', 'event', 'business'])->whereKey($campaignId)->first();
        }

        // Sync holidays for current year and upcoming 2 years
        foreach ([now()->year, now()->year + 1, now()->year + 2] as $year) {
            try {
                $holidayService->ensureYearSynced((int) $year);
            } catch (\Exception $e) {
                Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
            }
        }

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user?->id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get();

        $campaigns = $user?->campaigns()->with(['event', 'product'])->orderByDesc('created_at')->get() ?? collect();

        return Inertia::render('generator/index', [
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'industry' => $business->industry,
                'category' => $business->category,
                'description' => $business->description,
                'target_audience' => $business->target_audience,
                'unique_selling_point' => $business->unique_selling_point,
                'content_style' => $this->decodeJsonList($business->content_style),
                'default_tagline_behavior' => $business->default_tagline_behavior,
            ] : null,
            'campaign' => $campaign ? [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'objective' => $campaign->objective,
                'target_audience' => $campaign->target_audience,
                'product_id' => $campaign->product_id,
                'product_name' => $campaign->product?->name,
                'event_id' => $campaign->event_id,
                'event_name' => $campaign->event?->name,
            ] : null,
            'initial_campaign_id' => $campaign?->id ? (string) $campaign->id : ($request->input('campaign_id') ?: $request->input('campaign')),
            'initial_event_id' => $request->input('event_id') ?: $request->input('event') ?: ($campaign?->event_id ? (string) $campaign->event_id : null),
            'initial_product_name' => $request->input('product_name') ?: $request->input('product') ?: $campaign?->product?->name,
            'campaigns' => $campaigns->map(fn (Campaign $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status,
                'event_id' => $c->event_id,
                'event_name' => $c->event?->name,
                'product_id' => $c->product_id,
                'product_name' => $c->product?->name,
                'target_audience' => $c->target_audience,
                'objective' => $c->objective,
                'start_date' => $c->start_date?->format('Y-m-d'),
                'end_date' => $c->end_date?->format('Y-m-d'),
            ])->values()->all(),
            'products' => $products->map(fn ($product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? asset('storage/'.$product->image_path) : null,
            ])->values()->all(),
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('Y-m-d'),
                'type' => $event->type,
                'category' => $event->category ?? $event->type,
                'is_long_weekend' => (bool) $event->is_long_weekend,
                'long_weekend_details' => $event->long_weekend_details,
                'proclamation_no' => $event->proclamation_no,
            ])->values()->all(),
        ]);
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
            $referenceImagePath = $request->file('reference_image')->store('generation-requests', 'public');
        }

        // Resolve product details for context
        /** @var Product|null $product */
        $product = ! empty($payload['product_id']) ? Product::query()->where('id', $payload['product_id'])->first() : null;
        /** @var Campaign|null $campaign */
        $campaign = ! empty($payload['campaign_id']) ? Campaign::query()->where('id', $payload['campaign_id'])->first() : null;
        /** @var Event|null $event */
        $event = ! empty($payload['event_id']) ? Event::query()->where('id', $payload['event_id'])->first() : null;

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
        $productImageUrl = $product?->image_path ? asset('storage/'.$product->image_path) : null;

        $prompt = app(MarketingPromptBuilder::class)->build($payload, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $payload['campaign_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'event_id' => $payload['event_id'] ?? null,
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
                // Step 1 — Product & Campaign
                'product_name' => $payload['product_name'],
                'product_description' => $product?->description,
                'product_category' => $product?->category ?? $business->category,
                'business_category' => $business->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign?->name,
                'campaign_objective' => $campaign?->objective,
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
                'image_model' => $payload['image_model'] ?? 'gpt-image-2',

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
                route('generator.index'),
                ['error' => $exception->getMessage()]
            );

            return redirect()->route('generator.index')->with('error', 'Your design could not be generated right now. Please try again.');
        }

        $generationRequest->update([
            'status' => 'completed',
        ]);

        Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $payload['campaign_id'] ?? null,
            'event_id' => $payload['event_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
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
                    'model' => $payload['image_model'] ?? 'gpt-image-2',
                    'quality' => $payload['image_quality'] ?? 'medium',
                    'render_style' => $payload['render_style'] ?? 'Studio Product Still',
                    'aspect_ratio' => $payload['aspect_ratio'] ?? '1:1',
                    'business_name' => $businessName,
                    'generation_mode' => $referenceImagePath ? 'PRODUCT_REFERENCE' : 'CREATIVE_GENERATION',
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

        return redirect()->route('generator.index')->with('success', 'Your marketing asset has been generated.');
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
            'product_name' => ['required', 'string', 'max:255'],
            'image_prompt' => ['nullable', 'string'],
        ]);

        $referenceImagePath = null;
        if ($request->hasFile('reference_image')) {
            $referenceImagePath = $request->file('reference_image')->store('generation-requests', 'public');
        }

        /** @var Product|null $product */
        $product = $request->filled('product_id') ? Product::query()->where('id', $request->input('product_id'))->first() : null;
        /** @var Campaign|null $campaign */
        $campaign = $request->filled('campaign_id') ? Campaign::query()->where('id', $request->input('campaign_id'))->first() : null;
        /** @var Event|null $event */
        $event = $request->filled('event_id') ? Event::query()->where('id', $request->input('event_id'))->first() : null;

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
        $productImageUrl = $product?->image_path ? asset('storage/'.$product->image_path) : null;
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
                'product_name' => (string) $request->input('product_name'),
                'product_description' => $product?->description,
                'product_category' => $product?->category ?? $business->category,
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
                'image_model' => $request->input('image_model', 'gpt-image-2'),
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
                'image_url' => asset('storage/'.$generatedImagePath),
                'generated_image_path' => $generatedImagePath,
                'prompt' => $prompt,
                'product_name' => $request->input('product_name'),
                'tagline' => $normalizedTagline,
                'price' => $request->input('price'),
                'render_style' => $request->input('render_style', 'Studio Product Still'),
                'aspect_ratio' => $request->input('aspect_ratio', '1:1'),
                'image_model' => $request->input('image_model', 'gpt-image-2'),
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
                route('generator.index'),
                ['error' => $e->getMessage()]
            );

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Your visual creative could not be synthesized right now. Please try again.',
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
