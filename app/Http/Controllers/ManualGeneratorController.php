<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesGeneratorContext;
use App\Http\Requests\SuggestTaglineRequest;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingPromptBuilder;
use App\Services\NotificationService;
use App\Services\OpenAIImageService;
use App\Services\PhilippineHolidayService;
use App\Services\TaglineNormalizationService;
use App\Services\VisualPromptGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ManualGeneratorController extends Controller
{
    use ResolvesGeneratorContext;

    /**
     * Display the Manual AI Marketing Studio view.
     */
    public function index(Request $request, PhilippineHolidayService $holidayService): Response|RedirectResponse
    {
        $props = $this->resolveGeneratorViewProps($request, $holidayService);

        if ($props instanceof RedirectResponse) {
            return $props;
        }

        return Inertia::render('generator/manual', $props);
    }

    /**
     * Generate visual creative preview via Manual Creative Controls.
     */
    public function generate(Request $request, OpenAIImageService $openAIService, MarketingPromptBuilder $promptBuilder): JsonResponse
    {
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

        /** @var Business|null $business */
        $business = $user->business()->first();
        if (! $business) {
            return response()->json([
                'success' => false,
                'message' => 'Business profile is required before generating marketing visuals.',
            ], 422);
        }

        $validated = $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
            'product_name' => ['required', 'string', 'max:255'],
            'product_id' => ['nullable', 'exists:products,id'],
            'event_id' => ['nullable', 'exists:events,id'],
            'image_prompt' => ['nullable', 'string', 'max:4000'],
            'scene_prompt' => ['nullable', 'string', 'max:4000'],
            'prompt' => ['nullable', 'string', 'max:4000'],
            'price' => ['nullable'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'tagline_mode' => ['nullable', 'string', 'in:ai,custom,manual,none'],
            'aspect_ratio' => ['nullable', 'string', 'max:20'],
            'render_style' => ['nullable', 'string', 'max:100'],
            'brand_tone' => ['nullable'],
            'content_style' => ['nullable'],
            'visual_theme' => ['nullable'],
            'include_business_name' => ['nullable', 'boolean'],
            'business_name' => ['nullable', 'string', 'max:150'],
            'image_model' => ['nullable', 'string', 'max:50'],
            'image_quality' => ['nullable', 'string', 'in:low,medium,high'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'reference_image' => ['nullable', 'image', 'max:10240'],
        ]);

        /** @var Campaign|null $campaign */
        $campaign = $user->campaigns()->whereKey($validated['campaign_id'])->first();
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
        $product = ! empty($validated['product_id'])
            ? Product::query()->where('business_id', $business->id)->where('id', $validated['product_id'])->first()
            : $campaign->product;

        /** @var Event|null $event */
        $event = ! empty($validated['event_id'])
            ? Event::query()->where('id', $validated['event_id'])->first()
            : $campaign->event;

        if (! $referenceImagePath && $product?->image_path) {
            $referenceImagePath = $product->image_path;
        }

        $includeBusinessName = filter_var($validated['include_business_name'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $businessName = null;
        if ($includeBusinessName) {
            $businessName = ! empty($validated['business_name'])
                ? trim((string) $validated['business_name'])
                : $business->name;
        }

        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : null;
        $normalizedTagline = TaglineNormalizationService::normalize($validated['tagline'] ?? null);

        $previewPayload = $request->all();
        $previewPayload['tagline'] = $normalizedTagline;
        $previewPayload['include_business_name'] = $includeBusinessName;
        $previewPayload['business_name'] = $businessName;

        $prompt = (string) ($validated['image_prompt'] ?? $validated['scene_prompt'] ?? $validated['prompt'] ?? $promptBuilder->build($previewPayload, $business));

        try {
            $brandTone = $validated['brand_tone'] ?? [];
            if (is_string($brandTone)) {
                $brandTone = explode(',', $brandTone);
            }

            $visualTheme = $validated['content_style'] ?? $validated['visual_theme'] ?? [];
            if (is_string($visualTheme)) {
                $visualTheme = explode(',', $visualTheme);
            }

            $generatedImagePath = $openAIService->generate($prompt, [
                'generation_mode' => 'manual',
                'product_name' => (string) $validated['product_name'],
                'product_description' => $product?->description,
                'product_category' => $business->category,
                'business_category' => $business->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign->name,
                'campaign_objective' => $campaign->objective,
                'event_name' => $event?->name,
                'price' => $validated['price'] ?? null,
                'brand_tone' => $brandTone,
                'visual_theme' => $visualTheme,
                'render_style' => $validated['render_style'] ?? 'Studio Product Still',
                'tagline' => $normalizedTagline,
                'tagline_mode' => $validated['tagline_mode'] ?? 'ai',
                'aspect_ratio' => $validated['aspect_ratio'] ?? '1:1',
                'image_model' => $validated['image_model'] ?? 'gpt-image-2',
                'business_name' => $businessName,
                'business_industry' => $business->industry,
                'business_description' => $business->description,
                'business_usp' => $business->unique_selling_point,
                'business_content_style' => $business->content_style,
                'business_marketing_prefs' => $business->marketing_preferences,
                'reference_image_path' => $referenceImagePath,
                'scene_prompt' => $validated['image_prompt'] ?? $validated['scene_prompt'] ?? $validated['prompt'] ?? $validated['notes'] ?? null,
                'user_prompt' => $validated['image_prompt'] ?? $validated['scene_prompt'] ?? $validated['prompt'] ?? $validated['notes'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $blueprint = $openAIService->getLastReferenceBlueprint();
            $genMeta = $openAIService->getLastGenerationMetadata();

            $previewData = [
                'image_url' => Storage::url($generatedImagePath),
                'generated_image_path' => $generatedImagePath,
                'prompt' => $prompt,
                'visual_prompt' => $prompt,
                'product_name' => $validated['product_name'],
                'product_id' => $product?->id,
                'tagline' => $normalizedTagline,
                'price' => $validated['price'] ?? null,
                'render_style' => $validated['render_style'] ?? 'Studio Product Still',
                'aspect_ratio' => $validated['aspect_ratio'] ?? '1:1',
                'image_model' => $validated['image_model'] ?? 'gpt-image-2',
                'image_quality' => $validated['image_quality'] ?? 'medium',
                'reference_blueprint' => $blueprint,
                'generation_meta' => $genMeta,
            ];

            return response()->json(array_merge([
                'success' => true,
                'message' => 'Visual creative generated successfully.',
                'preview' => $previewData,
            ], $previewData));
        } catch (\Throwable $e) {
            Log::error('Manual visual creative generation failed: '.$e->getMessage());

            NotificationService::notifyAi(
                $user,
                'AI Generation Failed',
                'Your visual creative could not be synthesized: '.($e->getMessage() ?: 'An unexpected error occurred during generation.'),
                route('campaigns.generator', $campaign),
                ['error' => $e->getMessage()]
            );

            return response()->json([
                'success' => false,
                'message' => 'Visual generation failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Suggest an AI-generated marketing tagline tailored to the campaign and product context.
     */
    public function suggestTagline(
        SuggestTaglineRequest $request,
        VisualPromptGeneratorService $promptService
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user->hasReachedAiBudgetLimit($budgetLimit)) {
            return response()->json([
                'success' => false,
                'quota_exceeded' => true,
                'message' => 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Tagline generation is disabled.',
            ], 403);
        }

        /** @var Campaign $campaign */
        $campaign = $user->campaigns()->with(['event'])->whereKey($request->input('campaign_id'))->firstOrFail();
        /** @var Business|null $business */
        $business = $user->business()->first();

        $catalogIds = $request->input('catalog_product_ids', []);
        $catalogProducts = ! empty($catalogIds) && is_array($catalogIds)
            ? Product::query()->whereIn('id', $catalogIds)->where('business_id', $business?->id)->get()
            : collect();

        if ($catalogProducts->isEmpty() && $campaign->product_id) {
            $campaignProduct = Product::query()->where('id', $campaign->product_id)->where('business_id', $business?->id)->first();
            if ($campaignProduct) {
                $catalogProducts = collect([$campaignProduct]);
            }
        }

        try {
            $tagline = $promptService->generateTagline($user, $campaign, $business, [
                'catalog_products' => $catalogProducts,
                'custom_products' => $request->input('custom_products', []),
                'product_name' => $request->input('product_name'),
                'render_style' => $request->input('render_style'),
                'visual_theme' => $request->input('visual_theme') ?: $request->input('content_style'),
                'brand_tone' => $request->input('brand_tone'),
                'user_instruction' => $request->input('user_instruction') ?: $request->input('scene_prompt') ?: $request->input('notes'),
                'notes' => $request->input('notes'),
            ]);

            return response()->json([
                'success' => true,
                'tagline' => $tagline,
                'message' => 'AI Tagline generated successfully.',
            ]);
        } catch (\Throwable $e) {
            Log::error('AI Tagline suggestion failed: '.$e->getMessage(), [
                'campaign_id' => $campaign->id,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => "We couldn't generate a tagline right now. Please try again.",
            ], 500);
        }
    }
}
