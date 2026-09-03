<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDesignRequest;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\OpenAIImageService;
use App\Services\TaglineNormalizationService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class DesignController extends Controller
{
    public function __construct(
        protected DesignRegenerationService $designRegenerationService,
        protected OpenAIImageService $openAIImageService
    ) {}

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $query = $user->designs()
            ->with(['event', 'product', 'business', 'campaign'])
            ->latest();

        $search = trim((string) $request->query('search', ''));
        $productId = $request->input('product_id');
        $campaignId = $request->input('campaign_id');
        $eventId = $request->input('event_id');
        $period = $request->input('period', 'all');
        $sort = $request->input('sort', 'newest');
        $favorites = $request->boolean('favorites') || $request->input('favorite') === '1' || $request->input('favorite') === 'true';

        $rawCategories = $request->input('categories') ?? $request->input('category');
        $selectedCategories = [];
        if (is_array($rawCategories)) {
            $selectedCategories = array_values(array_filter(array_map('trim', $rawCategories)));
        } elseif (is_string($rawCategories) && trim($rawCategories) !== '') {
            $selectedCategories = array_values(array_filter(array_map('trim', explode(',', $rawCategories))));
        }

        if (! empty($selectedCategories)) {
            $query->where(function ($q) use ($selectedCategories) {
                foreach ($selectedCategories as $cat) {
                    if ($cat === 'has_campaign' || $cat === 'with_campaign') {
                        $q->orWhereNotNull('campaign_id');
                    } elseif ($cat === 'no_campaign' || $cat === 'standalone') {
                        $q->orWhereNull('campaign_id');
                    } elseif ($cat === 'events_only' || $cat === 'has_event') {
                        $q->orWhereNotNull('event_id');
                    } elseif (str_starts_with($cat, 'campaign:')) {
                        $cId = (int) substr($cat, 9);
                        $q->orWhere('campaign_id', $cId);
                    } elseif (str_starts_with($cat, 'event:')) {
                        $eId = (int) substr($cat, 6);
                        $q->orWhere('event_id', $eId);
                    } elseif (str_starts_with($cat, 'product:')) {
                        $pId = (int) substr($cat, 8);
                        $q->orWhere('product_id', $pId);
                    }
                }
            });
        }

        if ($favorites) {
            $query->where('is_favorite', true);
        }

        if ($period === 'today') {
            $query->whereDate('created_at', today());
        } elseif ($period === 'week' || $period === '7days') {
            $query->where('created_at', '>=', now()->subDays(7));
        } elseif ($period === 'month') {
            $query->where('created_at', '>=', now()->startOfMonth());
        } elseif ($period === '30days') {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('product_name', 'like', "%{$search}%")
                    ->orWhere('tagline', 'like', "%{$search}%")
                    ->orWhere('prompt', 'like', "%{$search}%")
                    ->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('campaign', fn ($campaignQuery) => $campaignQuery->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('event', fn ($eventQuery) => $eventQuery->where('name', 'like', "%{$search}%"));
            });
        }

        if ($productId) {
            $query->where('product_id', $productId)
                ->whereHas('product', fn ($productQuery) => $productQuery->where('business_id', $user->business?->id));
        }

        if ($campaignId) {
            $query->where('campaign_id', $campaignId);
        }

        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        if ($sort === 'oldest') {
            $query->oldest();
        } else {
            $query->latest();
        }

        /** @var LengthAwarePaginator<int, Design> $designs */
        $designs = $query->paginate(12)->withQueryString();
        /** @var Collection<int, Event> $events */
        $events = $user->events()->orderBy('date')->get();
        /** @var Collection<int, Product> $products */
        $products = $user->business?->products()->orderBy('name')->get() ?? collect();
        /** @var Collection<int, Campaign> $campaigns */
        $campaigns = $user->campaigns()->orderBy('start_date')->get();

        return Inertia::render('designs/index', [
            'designs' => $designs->through(fn (Design $design, int $key): array => [
                'id' => $design->id,
                'product_name' => $design->product_name,
                'campaign_name' => $design->campaign?->name,
                'campaign_id' => $design->campaign_id,
                'event_name' => $design->event?->name,
                'event_id' => $design->event_id,
                'tagline' => $design->tagline,
                'prompt' => $design->prompt,
                'aspect_ratio' => $design->aspect_ratio ?? ($design->generation_metadata['aspect_ratio'] ?? '1:1'),
                'content_style' => $design->content_style ?? $design->visual_theme,
                'visual_theme' => $design->visual_theme ?? $design->content_style,
                'brand_tone' => $design->brand_tone,
                'render_style' => $design->generation_metadata['render_style'] ?? null,
                'image_model' => $design->generation_metadata['model'] ?? 'gpt-image-1',
                'image_quality' => $design->generation_metadata['quality'] ?? 'medium',
                'generation_metadata' => $design->generation_metadata,
                'status' => $design->status,
                'is_favorite' => (bool) $design->is_favorite,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
                'download_url' => route('designs.download', $design),
                'show_url' => route('designs.show', $design),
            ]),
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
            ])->values()->all(),
            'products' => $products->map(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
            ])->values()->all(),
            'campaigns' => $campaigns->map(fn ($campaign): array => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'event_id' => $campaign->event_id,
            ])->values()->all(),
            'filters' => [
                'search' => $search,
                'categories' => $selectedCategories,
                'category' => implode(',', $selectedCategories),
                'period' => $period,
                'favorites' => $favorites,
                'sort' => $sort,
            ],
            'pagination' => [
                'current_page' => $designs->currentPage(),
                'last_page' => $designs->lastPage(),
                'per_page' => $designs->perPage(),
                'total' => $designs->total(),
            ],
        ]);
    }

    public function store(StoreDesignRequest $request): SymfonyResponse
    {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        /** @var User $user */
        $user = $request->user();

        $businessId = $user->business()->value('id');
        if (! $businessId) {
            $business = $user->business()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => ($user->name ?: 'My').' Business',
                    'industry' => 'Retail',
                    'category' => 'Retail & E-commerce',
                ]
            );
            $businessId = $business->id;
        }

        $brandTone = $request->input('brand_tone');
        if (is_array($brandTone)) {
            $brandTone = implode(', ', $brandTone);
        }

        $visualTheme = $request->input('visual_theme') ?? $request->input('content_style');
        if (is_array($visualTheme)) {
            $visualTheme = implode(', ', $visualTheme);
        }

        $referenceImagePath = null;
        if ($request->hasFile('reference_image')) {
            $referenceImagePath = $request->file('reference_image')->store('generation-requests');
        }

        /** @var Product|null $product */
        $product = null;
        if ($request->filled('product_id')) {
            $product = Product::query()->where('id', $request->input('product_id'))->first();
            if ($product && $product->image_path) {
                $referenceImagePath = $referenceImagePath ?: $product->image_path;
            }
        }

        /** @var Campaign|null $campaign */
        $campaign = null;
        if ($request->filled('campaign_id')) {
            $campaign = Campaign::query()->where('id', $request->input('campaign_id'))->first();
        }

        /** @var Event|null $event */
        $event = null;
        if ($request->filled('event_id')) {
            $event = Event::query()->where('id', $request->input('event_id'))->first();
        }

        $business = $user->business;
        $includeBusinessName = $request->has('include_business_name')
            ? filter_var($request->input('include_business_name'), FILTER_VALIDATE_BOOLEAN)
            : true;

        $businessName = null;
        if ($includeBusinessName) {
            $businessName = $request->filled('business_name') ? trim((string) $request->input('business_name')) : ($business?->name ?? 'Brand');
        }
        $aspectRatio = (string) ($request->input('aspect_ratio') ?? '1:1');
        $normalizedTagline = TaglineNormalizationService::normalize($request->input('tagline'));

        // Resolve product image URL (for reference when product chosen from catalog)
        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : null;

        $prompt = (string) ($request->input('prompt') ?? $request->input('image_prompt') ?? ('Marketing visual for '.$request->input('product_name')));

        if ($request->filled('generated_image_path')) {
            $generatedImagePath = (string) $request->input('generated_image_path');
        } else {
            $generatedImagePath = $this->openAIImageService->generate($prompt, [
                // Step 1 — Product & Campaign
                'product_name' => (string) $request->input('product_name'),
                'product_description' => $product?->description,
                'product_category' => $business?->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign?->name,
                'campaign_objective' => $campaign?->objective,
                'event_name' => $event?->name,
                'price' => $request->input('price'),

                // Step 2 — Style & Tone
                'brand_tone' => $brandTone,
                'visual_theme' => $visualTheme,

                'render_style' => $request->input('render_style', 'Studio Product Still'),
                'image_model' => $request->input('image_model', 'gpt-image-2'),

                // Step 3 — Canvas
                'tagline' => $normalizedTagline,
                'tagline_mode' => $request->input('tagline_mode', 'ai'),
                'aspect_ratio' => $aspectRatio,

                // Onboarding / Business Context
                'business_name' => $businessName,
                'business_industry' => $business?->industry,
                'business_description' => $business?->description,
                'business_usp' => $business?->unique_selling_point,
                'business_content_style' => $business?->content_style,
                'business_marketing_prefs' => $business?->marketing_preferences,

                // Reference image (uploaded file or catalog product image)
                'reference_image_path' => $referenceImagePath,
                'scene_prompt' => $request->input('image_prompt') ?: $request->input('prompt') ?: $request->input('scene_prompt'),
                'user_prompt' => $request->input('image_prompt') ?: $request->input('prompt') ?: $request->input('scene_prompt'),
            ]);
        }

        $design = $user->designs()->create([
            'business_id' => $businessId,
            'campaign_id' => $request->input('campaign_id'),
            'event_id' => $request->input('event_id'),
            'product_id' => $request->input('product_id'),
            'product_name' => $request->input('product_name'),
            'prompt' => $prompt,
            'price' => $request->input('price'),
            'brand_tone' => $brandTone,
            'visual_theme' => $visualTheme,
            'tagline' => $normalizedTagline,
            'tagline_mode' => $request->input('tagline_mode', 'ai'),
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => array_merge(
                [
                    'source' => 'openai',
                    'model' => $request->input('image_model') ?: config('services.openai.image_model', 'gpt-image-2'),
                    'model_name' => ($request->input('image_model') === 'gpt-image-2' || ! $request->input('image_model')) ? 'GPT-Image-2' : $request->input('image_model'),
                    'generation_method' => $referenceImagePath ? 'image_to_image_edit' : 'text_to_image',
                    'generation_mode' => 'PRODUCT_PRESERVING',
                    'prompt_version' => 'marketing-pipeline-v1',
                    'product_preserved' => (bool) $referenceImagePath,
                    'quality' => $request->input('image_quality', 'medium'),
                    'render_style' => $request->input('render_style', 'Studio Product Still'),
                    'business_name' => $businessName,
                    'aspect_ratio' => $aspectRatio,
                    'status' => 'completed',
                ],
                $this->openAIImageService->getLastGenerationMetadata() ?: []
            ),
            'status' => 'completed',
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'design' => [
                    'id' => $design->id,
                    'product_name' => $design->product_name,
                    'tagline' => $design->tagline,
                    'status' => $design->status,
                    'image_url' => $this->imageUrl($design),
                    'show_url' => route('designs.show', $design),
                ],
                'message' => 'Design saved to My Designs.',
            ]);
        }

        return redirect()->route('designs.show', $design)->with('success', 'Design saved to My Designs.');
    }

    public function attachCampaign(Request $request, Design $design): SymfonyResponse
    {
        $this->authorize('update', $design);

        $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $campaign = $user->campaigns()->findOrFail($request->input('campaign_id'));

        if (empty($design->event_id) || empty($campaign->event_id) || (int) $design->event_id !== (int) $campaign->event_id) {
            $errorMessage = 'Visuals can only be added to a campaign specifically created for the same event/holiday.';
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                ], 422);
            }

            return back()->withErrors(['campaign_id' => $errorMessage]);
        }

        $design->update([
            'campaign_id' => $campaign->id,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Design attached to campaign successfully.',
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                ],
                'design' => [
                    'id' => $design->id,
                    'campaign_id' => $campaign->id,
                ],
            ]);
        }

        return back()->with('success', 'Design attached to campaign successfully.');
    }

    public function toggleFavorite(Request $request, Design $design): SymfonyResponse
    {
        $this->authorize('update', $design);

        $design->update([
            'is_favorite' => ! $design->is_favorite,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_favorite' => (bool) $design->is_favorite,
                'message' => $design->is_favorite ? 'Design added to favorites.' : 'Design removed from favorites.',
            ]);
        }

        return back()->with('success', $design->is_favorite ? 'Design added to favorites.' : 'Design removed from favorites.');
    }

    public function show(Design $design): Response
    {
        $this->authorize('view', $design);

        $design->load(['event', 'product', 'business', 'campaign']);

        return Inertia::render('designs/show', [
            'design' => [
                'id' => $design->id,
                'product_name' => $design->product_name,
                'business_name' => $design->business?->name,
                'business_industry' => $design->business?->industry ?? $design->user?->business?->industry,
                'campaign_name' => $design->campaign?->name,
                'event_name' => $design->event?->name,
                'brand_tone' => $design->brand_tone,
                'visual_theme' => $design->visual_theme,
                'tagline' => $design->tagline,
                'status' => $design->status,
                'is_favorite' => (bool) $design->is_favorite,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
                'download_url' => route('designs.download', $design),
                'prompt' => $design->prompt,
                'generation_metadata' => $design->generation_metadata,
            ],
        ]);
    }

    public function download(Design $design): SymfonyResponse
    {
        $this->authorize('download', $design);

        if (! $design->generated_image_path || ! Storage::exists($design->generated_image_path)) {
            abort(404, 'The requested design image is no longer available.');
        }

        return Storage::download(
            $design->generated_image_path,
            $design->product_name.'.png'
        );
    }

    public function regenerate(Request $request, Design $design): RedirectResponse
    {
        $this->authorize('regenerate', $design);

        /** @var User $user */
        $user = $request->user();
        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user && $user->hasReachedAiBudgetLimit($budgetLimit)) {
            return redirect()->route('designs.index')->with('error', 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual regeneration is disabled.');
        }

        try {
            $newDesign = $this->designRegenerationService->regenerate($design);
        } catch (RuntimeException $exception) {
            return redirect()->route('designs.index')->with('error', $exception->getMessage() ?: 'Unable to regenerate the design right now.');
        }

        return redirect()->route('designs.show', $newDesign)->with('success', 'Design regenerated successfully.');
    }

    public function destroy(Design $design): RedirectResponse
    {
        $this->authorize('delete', $design);

        if ($design->generated_image_path && Storage::exists($design->generated_image_path)) {
            Storage::delete($design->generated_image_path);
        }

        $design->delete();

        return redirect()->route('designs.index')->with('success', 'Design deleted successfully.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:designs,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $designs = $user->designs()->whereIn('id', $request->input('ids'))->get();
        $count = $designs->count();

        if ($count === 0) {
            return redirect()->route('designs.index')->with('info', 'No designs were selected for deletion.');
        }

        foreach ($designs as $design) {
            if ($design->generated_image_path && Storage::exists($design->generated_image_path)) {
                Storage::delete($design->generated_image_path);
            }
            $design->delete();
        }

        return redirect()->route('designs.index')->with('success', "{$count} designs deleted successfully.");
    }

    protected function imageUrl(Design $design): ?string
    {
        if (! $design->generated_image_path) {
            return null;
        }

        return Storage::url($design->generated_image_path);
    }
}
