<?php

namespace App\Http\Controllers;

use App\Models\Design;
use App\Services\DesignRegenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class DesignController extends Controller
{
    public function __construct(protected DesignRegenerationService $designRegenerationService)
    {
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = $user->designs()
            ->with(['event', 'product', 'business', 'campaign'])
            ->latest();

        $search = trim((string) $request->string('search'));
        $productId = $request->input('product_id');
        $campaignId = $request->input('campaign_id');
        $eventId = $request->input('event_id');
        $sort = $request->input('sort', 'newest');

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

        $designs = $query->paginate(12)->withQueryString();
        $events = $user->events()->orderBy('date')->get();
        $products = $user->business?->products()->orderBy('name')->get() ?? collect();
        $campaigns = $user->campaigns()->orderBy('start_date')->get();

        return Inertia::render('designs/index', [
            'designs' => $designs->through(fn (Design $design) => [
                'id' => $design->id,
                'product_name' => $design->product_name,
                'campaign_name' => $design->campaign?->name,
                'event_name' => $design->event?->name,
                'tagline' => $design->tagline,
                'status' => $design->status,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
                'show_url' => route('designs.show', $design),
            ]),
            'events' => $events->map(fn ($event) => [
                'id' => $event->id,
                'name' => $event->name,
            ])->values()->all(),
            'products' => $products->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
            ])->values()->all(),
            'campaigns' => $campaigns->map(fn ($campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
            ])->values()->all(),
            'filters' => [
                'search' => $search,
                'product_id' => (string) ($productId ?? ''),
                'campaign_id' => (string) ($campaignId ?? ''),
                'event_id' => (string) ($eventId ?? ''),
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
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
                'download_url' => route('designs.download', $design),
                'prompt' => $design->prompt,
                'generation_metadata' => $design->generation_metadata,
            ],
        ]);
    }

    public function download(Design $design)
    {
        $this->authorize('download', $design);

        if (! $design->generated_image_path || ! Storage::disk('public')->exists($design->generated_image_path)) {
            abort(404, 'The requested design image is no longer available.');
        }

        return Storage::disk('public')->download($design->generated_image_path, $design->product_name.'.png');
    }

    public function regenerate(Design $design)
    {
        $this->authorize('regenerate', $design);

        try {
            $newDesign = $this->designRegenerationService->regenerate($design);
        } catch (RuntimeException $exception) {
            return redirect()->route('designs.index')->with('error', 'Unable to regenerate the design right now.');
        }

        return redirect()->route('designs.show', $newDesign)->with('success', 'Design regenerated successfully.');
    }

    public function destroy(Design $design)
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

        return Storage::disk('public')->url($design->generated_image_path);
    }
}
