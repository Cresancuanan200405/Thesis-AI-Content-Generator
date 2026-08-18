<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDesignRequest;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\MockupImageService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DesignController extends Controller
{
    public function __construct(
        protected DesignRegenerationService $designRegenerationService,
        protected MockupImageService $mockupImageService
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
        $sort = $request->input('sort', 'newest');
        $favorites = $request->boolean('favorites') || $request->input('favorite') === '1' || $request->input('favorite') === 'true';

        if ($favorites) {
            $query->where('is_favorite', true);
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
                'price' => $design->price,
                'content_style' => $design->content_style,
                'brand_tone' => $design->brand_tone,
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
            ])->values()->all(),
            'filters' => [
                'search' => $search,
                'product_id' => (string) ($productId ?? ''),
                'campaign_id' => (string) ($campaignId ?? ''),
                'event_id' => (string) ($eventId ?? ''),
                'sort' => $sort,
                'favorites' => $favorites,
            ],
            'pagination' => [
                'current_page' => $designs->currentPage(),
                'last_page' => $designs->lastPage(),
                'per_page' => $designs->perPage(),
                'total' => $designs->total(),
            ],
        ]);
    }

    public function store(StoreDesignRequest $request): \Symfony\Component\HttpFoundation\Response
    {
        /** @var User $user */
        $user = $request->user();

        $businessId = $user->business()->value('id');
        if (! $businessId) {
            $business = $user->business()->firstOrCreate(
                ['user_id' => $user->id],
                ['name' => ($user->name ?: 'My').' Business']
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
            $referenceImagePath = $request->file('reference_image')->store('generation-requests', 'public');
        }

        $event = null;
        if ($request->filled('event_id')) {
            $event = Event::query()->find($request->input('event_id'));
        }

        $business = $user->business;
        $includeLogo = (bool) $request->boolean('include_logo', false);

        $generatedImagePath = $this->mockupImageService->generate([
            'product_name' => (string) $request->input('product_name'),
            'tagline' => $request->input('tagline'),
            'brand_tone' => $brandTone,
            'visual_theme' => $visualTheme,
            'event_name' => $event?->name,
            'price' => $request->input('price'),
            'include_logo' => $includeLogo,
            'business_name' => $business?->name,
        ]);

        $design = $user->designs()->create([
            'business_id' => $businessId,
            'campaign_id' => $request->input('campaign_id'),
            'event_id' => $request->input('event_id'),
            'product_id' => $request->input('product_id'),
            'product_name' => $request->input('product_name'),
            'prompt' => $request->input('prompt') ?? $request->input('image_prompt') ?? ('Design for '.$request->input('product_name')),
            'price' => $request->input('price'),
            'brand_tone' => $brandTone,
            'visual_theme' => $visualTheme,
            'tagline' => $request->input('tagline'),
            'tagline_mode' => $request->input('tagline_mode', 'ai'),
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => [
                'source' => 'mockup',
                'is_mockup' => true,
                'model' => 'mockup-generator-v1',
                'format' => 'svg',
                'include_logo' => $includeLogo,
            ],
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

    public function attachCampaign(Request $request, Design $design): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('update', $design);

        $request->validate([
            'campaign_id' => ['required', 'exists:campaigns,id'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $campaign = $user->campaigns()->findOrFail($request->input('campaign_id'));

        $design->update([
            'campaign_id' => $campaign->id,
            'event_id' => $design->event_id ?: $campaign->event_id,
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

    public function toggleFavorite(Request $request, Design $design): \Symfony\Component\HttpFoundation\Response
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

    public function download(Design $design): BinaryFileResponse
    {
        $this->authorize('download', $design);

        if (! $design->generated_image_path || ! Storage::disk('public')->exists($design->generated_image_path)) {
            abort(404, 'The requested design image is no longer available.');
        }

        return response()->download(
            Storage::disk('public')->path($design->generated_image_path),
            $design->product_name.'.png'
        );
    }

    public function regenerate(Design $design): RedirectResponse
    {
        $this->authorize('regenerate', $design);

        try {
            $newDesign = $this->designRegenerationService->regenerate($design);
        } catch (RuntimeException $exception) {
            return redirect()->route('designs.index')->with('error', 'Unable to regenerate the design right now.');
        }

        return redirect()->route('designs.show', $newDesign)->with('success', 'Design regenerated successfully.');
    }

    public function destroy(Design $design): RedirectResponse
    {
        $this->authorize('delete', $design);

        if ($design->generated_image_path && Storage::disk('public')->exists($design->generated_image_path)) {
            Storage::disk('public')->delete($design->generated_image_path);
        }

        $design->delete();

        return redirect()->route('designs.index')->with('success', 'Design deleted successfully.');
    }

    protected function imageUrl(Design $design): ?string
    {
        if (! $design->generated_image_path) {
            return null;
        }

        return asset('storage/'.$design->generated_image_path);
    }
}
