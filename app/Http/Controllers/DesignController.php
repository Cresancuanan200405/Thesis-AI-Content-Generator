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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

        $status = strtolower(trim((string) $request->input('status', 'all')));
        if ($status === 'draft' || $status === 'drafts') {
            $query->where('status', Design::STATUS_DRAFT);
        } elseif ($status === 'final' || $status === 'finals') {
            $query->whereIn('status', [Design::STATUS_FINAL, Design::STATUS_COMPLETED]);
        }

        $statusCounts = [
            'all' => $user->designs()->count(),
            'drafts' => $user->designs()->where('status', Design::STATUS_DRAFT)->count(),
            'final' => $user->designs()->whereIn('status', [Design::STATUS_FINAL, Design::STATUS_COMPLETED])->count(),
        ];

        /** @var LengthAwarePaginator<int, Design> $designs */
        $designs = $query->paginate(18)->withQueryString();
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
                'image_model' => $design->generation_metadata['model'] ?? 'gpt-image-2',
                'image_quality' => $design->generation_metadata['quality'] ?? 'medium',
                'generation_metadata' => $design->generation_metadata,
                'status' => $design->status,
                'is_draft' => $design->isDraft(),
                'is_favorite' => (bool) $design->is_favorite,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
                'download_url' => route('designs.download', $design),
                'show_url' => route('designs.show', $design),
                'generator_url' => route(
                    (($design->generation_metadata['mode'] ?? null) === 'manual') ? 'generator.manual.index' : 'generator.automatic.index',
                    array_filter([
                        'campaign_id' => $design->campaign_id,
                        'draft_id' => $design->id,
                        'origin' => 'designs',
                    ])
                ),
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
            'status_counts' => $statusCounts,
            'filters' => [
                'search' => $search,
                'categories' => $selectedCategories,
                'category' => implode(',', $selectedCategories),
                'period' => $period,
                'favorites' => $favorites,
                'sort' => $sort,
                'status' => $status,
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
            $businessName = $request->filled('business_name') ? trim((string) $request->input('business_name')) : ($business->name ?? 'Brand');
        }
        $aspectRatio = (string) ($request->input('aspect_ratio') ?? '1:1');
        $normalizedTagline = TaglineNormalizationService::normalize($request->input('tagline'));

        // Resolve product image URL (for reference when product chosen from catalog)
        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : null;

        $prompt = (string) ($request->input('prompt') ?? $request->input('image_prompt') ?? ('Marketing visual for '.$request->input('product_name')));

        $catalogProductIds = collect($request->input('catalog_product_ids', []))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($catalogProductIds) && $request->filled('product_id')) {
            $catalogProductIds = [(int) $request->input('product_id')];
        }

        $catalogProducts = empty($catalogProductIds)
            ? collect()
            : Product::query()
                ->where('business_id', $businessId)
                ->whereIn('id', $catalogProductIds)
                ->get()
                ->sortBy(function (Product $p) use ($catalogProductIds) {
                    $strIds = array_map('strval', $catalogProductIds);
                    $pos = array_search((string) $p->id, $strIds, true);

                    return $pos === false ? 999 : $pos;
                })
                ->values();

        $customProducts = $request->input('custom_products', []);
        $referenceImagePaths = $request->input('reference_image_paths', []);
        if (empty($referenceImagePaths) && $referenceImagePath) {
            $referenceImagePaths = [$referenceImagePath];
        }

        $includePrices = $request->has('include_prices')
            ? filter_var($request->input('include_prices'), FILTER_VALIDATE_BOOLEAN)
            : true;

        $totalProductCount = $catalogProducts->count() + count($customProducts);
        $isMultiProduct = $totalProductCount > 1;

        $incomingMeta = [];
        if ($request->filled('generation_metadata')) {
            $rawMeta = $request->input('generation_metadata');
            if (is_string($rawMeta)) {
                $decoded = json_decode($rawMeta, true);
                if (is_array($decoded)) {
                    $incomingMeta = $decoded;
                }
            } elseif (is_array($rawMeta)) {
                $incomingMeta = $rawMeta;
            }
        }

        if (empty($customProducts) && ! empty($incomingMeta['custom_products']) && is_array($incomingMeta['custom_products'])) {
            $customProducts = $incomingMeta['custom_products'];
        }

        $pricesMap = [];
        if ($includePrices) {
            if (! empty($incomingMeta['prices']) && is_array($incomingMeta['prices'])) {
                $pricesMap = $incomingMeta['prices'];
            }
            foreach ($catalogProducts as $cp) {
                if ($cp->price !== null && $cp->price !== '') {
                    $pricesMap[(string) $cp->id] = (string) $cp->price;
                    $pricesMap[$cp->name] = (string) $cp->price;
                }
            }
            foreach ($customProducts as $cIdx => $cProd) {
                $cName = is_array($cProd) ? ($cProd['name'] ?? null) : ($cProd->name ?? null);
                $cPrice = is_array($cProd) ? ($cProd['price'] ?? null) : ($cProd->price ?? null);
                if (! empty($cName) && ! empty($cPrice)) {
                    $pricesMap["custom_{$cIdx}"] = (string) $cPrice;
                    $pricesMap[$cName] = (string) $cPrice;
                }
            }
        }

        $targetStatus = $request->input('status', Design::STATUS_COMPLETED);

        $existingDesign = null;
        if ($request->filled('design_id')) {
            $existingDesign = $user->designs()->whereKey($request->input('design_id'))->first();
        }
        if (! $existingDesign && $request->filled('generated_image_path')) {
            $existingDesign = $user->designs()->where('generated_image_path', (string) $request->input('generated_image_path'))->first();
        }

        if ($request->filled('generated_image_path')) {
            $generatedImagePath = (string) $request->input('generated_image_path');
        } else {
            $generatedImagePath = $this->openAIImageService->generate($prompt, [
                // Step 1 — Product & Campaign
                'product_name' => $catalogProducts->first() ? $catalogProducts->first()->name : (string) $request->input('product_name'),
                'product_description' => $product?->description,
                'product_category' => $business?->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaign?->name,
                'campaign_objective' => $campaign?->objective,
                'event_name' => $event?->name,
                'price' => ($isMultiProduct || ! $includePrices) ? null : ($catalogProducts->first() ? $catalogProducts->first()->price : $request->input('price')),
                'prices' => $isMultiProduct ? $pricesMap : null,
                'include_prices' => $includePrices,
                'catalog_products' => $catalogProducts,
                'custom_products' => $customProducts,

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
                'business_target_audience' => $business?->target_audience,
                'business_content_style' => $business?->content_style,
                'business_marketing_prefs' => $business?->marketing_preferences,

                // Reference image (uploaded file or catalog product image)
                'reference_image_path' => $referenceImagePath,
                'reference_image_paths' => $referenceImagePaths,
                'scene_prompt' => $request->input('image_prompt') ?: $request->input('prompt') ?: $request->input('scene_prompt'),
                'user_prompt' => $request->input('image_prompt') ?: $request->input('prompt') ?: $request->input('scene_prompt'),
            ]);
        }

        $creativeConcept = $request->input('creative_concept', $incomingMeta['creative_concept'] ?? null);
        $visualStrategy = $request->input('visual_strategy', $incomingMeta['visual_strategy'] ?? null);
        $designTreatment = $request->input('design_treatment', $incomingMeta['design_treatment'] ?? 'Auto');
        $copyEmphasis = $request->input('copy_emphasis', $incomingMeta['copy_emphasis'] ?? 'Balanced');
        $creativeFingerprint = $request->input('creative_fingerprint', $incomingMeta['creative_fingerprint'] ?? null);
        $generationMode = $request->input('generation_mode', $incomingMeta['generation_mode'] ?? 'automatic');
        $imageModel = $request->input('image_model', $incomingMeta['model'] ?? 'gpt-image-2');
        $imageQuality = $request->input('image_quality', $incomingMeta['quality'] ?? 'medium');
        $includeTagline = $request->has('include_tagline')
            ? filter_var($request->input('include_tagline'), FILTER_VALIDATE_BOOLEAN)
            : (! empty($normalizedTagline));

        $scenePrompt = $request->input('scene_prompt') ?? $request->input('image_prompt') ?? ($incomingMeta['scene_prompt'] ?? null);
        $userPrompt = $request->input('user_prompt') ?? $request->input('image_prompt') ?? ($incomingMeta['user_prompt'] ?? null);

        $mergedMetadata = array_merge(
            [
                'source' => 'openai',
                'model' => $imageModel,
                'model_name' => 'GPT-Image-2',
                'generation_method' => $referenceImagePath ? 'image_to_image_edit' : 'text_to_image',
                'generation_mode' => $generationMode,
                'prompt_version' => 'marketing-pipeline-v1',
                'product_preserved' => (bool) $referenceImagePath,
                'quality' => $imageQuality,
                'render_style' => $request->input('render_style', 'Studio Product Still'),
                'design_treatment' => $designTreatment,
                'copy_emphasis' => $copyEmphasis,
                'include_tagline' => $includeTagline,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'creative_fingerprint' => $creativeFingerprint,
                'business_name' => $businessName,
                'aspect_ratio' => $aspectRatio,
                'include_prices' => $includePrices,
                'prices' => ! empty($pricesMap) ? $pricesMap : ($incomingMeta['prices'] ?? null),
                'catalog_product_ids' => $catalogProductIds,
                'custom_products' => $customProducts,
                'reference_image_paths' => $referenceImagePaths,
                'scene_prompt' => $scenePrompt,
                'user_prompt' => $userPrompt,
                'prompt' => $prompt,
                'status' => 'completed',
            ],
            $incomingMeta,
            $this->openAIImageService->getLastGenerationMetadata() ?: [],
            [
                'catalog_product_ids' => $catalogProductIds,
                'custom_products' => $customProducts,
                'reference_image_paths' => $referenceImagePaths,
                'include_prices' => $includePrices,
                'prices' => ! empty($pricesMap) ? $pricesMap : ($incomingMeta['prices'] ?? null),
                'design_treatment' => $designTreatment,
                'copy_emphasis' => $copyEmphasis,
                'include_tagline' => $includeTagline,
                'creative_fingerprint' => $creativeFingerprint,
                'creative_concept' => $creativeConcept,
                'visual_strategy' => $visualStrategy,
                'generation_mode' => $generationMode,
                'prompt' => $prompt,
            ]
        );

        if ($existingDesign) {
            if ($existingDesign->isFinal() && in_array($targetStatus, [Design::STATUS_FINAL, Design::STATUS_COMPLETED], true)) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'design' => [
                            'id' => $existingDesign->id,
                            'product_name' => $existingDesign->product_name,
                            'tagline' => $existingDesign->tagline,
                            'status' => $existingDesign->status,
                            'image_url' => $this->imageUrl($existingDesign),
                            'show_url' => route('designs.show', $existingDesign),
                        ],
                        'message' => 'Design is already saved in My Designs.',
                    ]);
                }

                return redirect()->route('designs.show', $existingDesign)->with('info', 'Design is already saved in My Designs.');
            }

            $existingDesign->update([
                'status' => $targetStatus,
                'campaign_id' => $request->input('campaign_id') ?: $existingDesign->campaign_id,
                'event_id' => $request->input('event_id') ?: $existingDesign->event_id,
                'product_id' => $request->input('product_id') ?: $existingDesign->product_id,
                'product_name' => $request->input('product_name') ?: $existingDesign->product_name,
                'prompt' => $prompt ?: $existingDesign->prompt,
                'price' => $includePrices ? ($catalogProducts->first()?->price ?? ($request->filled('price') ? $request->input('price') : $existingDesign->price)) : null,
                'brand_tone' => $brandTone ?: $existingDesign->brand_tone,
                'visual_theme' => $visualTheme ?: $existingDesign->visual_theme,
                'tagline' => $normalizedTagline ?: $existingDesign->tagline,
                'tagline_mode' => $request->input('tagline_mode', $existingDesign->tagline_mode),
                'reference_image_path' => $referenceImagePath ?: $existingDesign->reference_image_path,
                'generated_image_path' => $generatedImagePath ?: $existingDesign->generated_image_path,
                'generation_metadata' => ! empty($mergedMetadata) ? array_merge($existingDesign->generation_metadata ?? [], $mergedMetadata) : $existingDesign->generation_metadata,
            ]);

            $message = $targetStatus === Design::STATUS_DRAFT
                ? 'Draft saved'
                : 'Design finalized and saved to My Designs.';

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'design' => [
                        'id' => $existingDesign->id,
                        'product_name' => $existingDesign->product_name,
                        'tagline' => $existingDesign->tagline,
                        'status' => $existingDesign->status,
                        'image_url' => $this->imageUrl($existingDesign),
                        'show_url' => route('designs.show', $existingDesign),
                    ],
                    'message' => $message,
                ]);
            }

            return redirect()->route('designs.show', $existingDesign)->with('success', $message);
        }

        $design = $user->designs()->create([
            'business_id' => $businessId,
            'campaign_id' => $request->input('campaign_id'),
            'event_id' => $request->input('event_id'),
            'product_id' => $request->input('product_id'),
            'product_name' => $request->input('product_name'),
            'prompt' => $prompt,
            'price' => $includePrices ? ($catalogProducts->first()?->price ?? $request->input('price')) : null,
            'brand_tone' => $brandTone,
            'visual_theme' => $visualTheme,
            'tagline' => $normalizedTagline,
            'tagline_mode' => $request->input('tagline_mode', 'ai'),
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => $mergedMetadata,
            'status' => $targetStatus,
        ]);

        $message = $targetStatus === Design::STATUS_DRAFT
            ? 'Draft saved'
            : 'Design saved to My Designs.';

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
                'message' => $message,
            ]);
        }

        return redirect()->route('designs.show', $design)->with('success', $message);
    }

    public function finalize(Request $request, Design $design): SymfonyResponse
    {
        $this->authorize('update', $design);

        $design->update(['status' => Design::STATUS_FINAL]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'design' => [
                    'id' => $design->id,
                    'product_name' => $design->product_name,
                    'status' => $design->status,
                    'image_url' => $this->imageUrl($design),
                    'show_url' => route('designs.show', $design),
                ],
                'message' => 'Design finalized and saved to My Designs.',
            ]);
        }

        return back()->with('success', 'Design finalized and saved to My Designs.');
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
                'business_industry' => $design->business->industry ?? $design->user?->business?->industry,
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

    public function regenerate(Request $request, Design $design): RedirectResponse|JsonResponse
    {
        $this->authorize('regenerate', $design);

        /** @var User $user */
        $user = $request->user();
        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user && $user->hasReachedAiBudgetLimit($budgetLimit)) {
            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual regeneration is disabled.',
                ], 403);
            }

            return redirect()->route('designs.index')->with('error', 'You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual regeneration is disabled.');
        }

        try {
            $newDesign = $this->designRegenerationService->regenerate($design);
        } catch (RuntimeException $exception) {
            $isMultiRefFailure = Str::contains($exception->getMessage(), 'Multiple product reference generation could not be completed');
            $status = $isMultiRefFailure ? 422 : 500;
            $metadata = $this->openAIImageService->getLastGenerationMetadata()
                ?: $this->designRegenerationService->getLastGenerationMetadata()
                ?: [];

            if ($isMultiRefFailure) {
                $attempted = $metadata['attempted_reference_count']
                    ?? (count($design->generation_metadata['catalog_product_ids'] ?? []) ?: count($design->generation_metadata['reference_image_paths'] ?? []) ?: 2);
                $metadata = array_merge([
                    'generation_method' => 'multi_image_to_image_failed',
                    'attempted_reference_count' => $attempted,
                    'actual_reference_count' => 0,
                    'fallback_reason' => $exception->getMessage(),
                    'fallback_used' => false,
                    'fallback_state' => 'multi_image_failed',
                ], $metadata);
            }

            if ($request->expectsJson() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $exception->getMessage() ?: 'Unable to regenerate the design right now.',
                    'generation_method' => $metadata['generation_method'] ?? 'failed',
                    'attempted_reference_count' => $metadata['attempted_reference_count'] ?? 0,
                    'actual_reference_count' => $metadata['actual_reference_count'] ?? 0,
                    'fallback_reason' => $metadata['fallback_reason'] ?? $exception->getMessage(),
                    'metadata' => $metadata,
                ], $status);
            }

            return redirect()->route('designs.index')->with('error', $exception->getMessage() ?: 'Unable to regenerate the design right now.');
        }

        if ($request->expectsJson() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Design regenerated successfully.',
                'design' => $newDesign,
                'preview' => [
                    'image_url' => Storage::url($newDesign->generated_image_path),
                    'generated_image_path' => $newDesign->generated_image_path,
                    'product_name' => $newDesign->product_name,
                    'tagline' => $newDesign->tagline,
                    'price' => $newDesign->price,
                    'prompt' => $newDesign->prompt,
                    'aspect_ratio' => $newDesign->generation_metadata['aspect_ratio'] ?? '1:1',
                    'generation_meta' => $newDesign->generation_metadata,
                ],
            ]);
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

        return back(fallback: route('designs.index'))->with('success', 'Design deleted successfully.');
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
