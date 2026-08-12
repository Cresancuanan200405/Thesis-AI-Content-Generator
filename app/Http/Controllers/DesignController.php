<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
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
    public function __construct(protected DesignRegenerationService $designRegenerationService) {}

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
                'event_name' => $design->event?->name,
                'tagline' => $design->tagline,
                'status' => $design->status,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $this->imageUrl($design),
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
