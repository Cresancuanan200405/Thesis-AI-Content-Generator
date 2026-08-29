<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCampaignRequest;
use App\Http\Requests\UpdateCampaignRequest;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        // Automatically archive completed campaigns older than 2 days
        $twoDaysAgo = now()->subDays(2);
        $user->campaigns()
            ->where('status', 'completed')
            ->where(function ($q) use ($twoDaysAgo) {
                $q->where('end_date', '<=', $twoDaysAgo->toDateString())
                    ->orWhere(function ($sub) use ($twoDaysAgo) {
                        $sub->whereNull('end_date')
                            ->where('updated_at', '<=', $twoDaysAgo);
                    });
            })
            ->update(['status' => 'archived']);

        $user->campaigns()
            ->where('status', 'completed')
            ->whereHas('event', function ($query) use ($twoDaysAgo) {
                $query->where('date', '<=', $twoDaysAgo->toDateString());
            })
            ->update(['status' => 'archived']);

        $query = $user->campaigns()
            ->with(['business', 'event', 'product', 'designs'])
            ->latest('updated_at');

        $search = $request->query('search', '');
        if (! is_string($search)) {
            $search = '';
        }
        $search = trim($search);

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('objective', 'like', "%{$search}%")
                    ->orWhere('target_audience', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        /** @var LengthAwarePaginator<int, Campaign> $campaigns */
        $campaigns = $query->paginate(12)->withQueryString();

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get()
            ->map(fn ($event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date?->format('Y-m-d'),
                'type' => $event->type,
            ])
            ->values()
            ->all();

        $allUserCampaigns = $user->campaigns();

        return Inertia::render('campaigns/index', [
            'campaigns' => $campaigns->through(function ($campaign, int $key): array {
                /** @var Campaign $campaign */
                $startDate = $campaign->getAttributeValue('start_date');
                $endDate = $campaign->getAttributeValue('end_date');

                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'description' => $campaign->description,
                    'status' => $campaign->status,
                    'objective' => $campaign->objective,
                    'product_id' => $campaign->product_id,
                    'event_id' => $campaign->event_id,
                    'product_name' => $campaign->product?->name,
                    'event_name' => $campaign->event?->name,
                    'start_date' => $startDate instanceof CarbonInterface ? $startDate->format('Y-m-d') : null,
                    'end_date' => $endDate instanceof CarbonInterface ? $endDate->format('Y-m-d') : null,
                    'design_count' => $campaign->designs->count(),
                    'designs' => $campaign->designs->map(fn (Design $design): array => [
                        'id' => $design->id,
                        'product_name' => $design->product_name,
                        'image_url' => $design->generated_image_path ? asset('storage/'.$design->generated_image_path) : null,
                        'download_url' => route('designs.download', $design),
                    ])->values()->all(),
                    'show_url' => route('campaigns.show', $campaign),
                    'generator_url' => route('generator.index', array_filter([
                        'campaign_id' => $campaign->id,
                        'event_id' => $campaign->event_id,
                        'product_name' => $campaign->product?->name,
                    ])),
                ];
            })->values()->all(),
            'events' => $events,
            'stats' => [
                'total' => (clone $allUserCampaigns)->count(),
                'active' => (clone $allUserCampaigns)->where('status', 'active')->count(),
                'scheduled' => (clone $allUserCampaigns)->where('status', 'scheduled')->count(),
                'completed' => (clone $allUserCampaigns)->where('status', 'completed')->count(),
                'archived' => (clone $allUserCampaigns)->where('status', 'archived')->count(),
                'designs' => $user->designs()->whereNotNull('campaign_id')->count(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $status ?? '',
            ],
            'pagination' => [
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
                'per_page' => $campaigns->perPage(),
                'total' => $campaigns->total(),
            ],
        ]);
    }

    public function show(Request $request, Campaign $campaign): Response
    {
        $this->authorize('view', $campaign);

        $campaign->load(['product', 'event', 'business', 'designs']);

        /** @var User|null $user */
        $user = $request->user() ?? $campaign->user;

        $startDate = $campaign->getAttributeValue('start_date');
        $endDate = $campaign->getAttributeValue('end_date');

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $campaign->user_id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get()
            ->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('Y-m-d'),
                'type' => $event->type,
            ])->values()->all();

        $availableDesigns = [];
        if ($campaign->event_id && $user) {
            $availableDesigns = $user->designs()
                ->where('event_id', $campaign->event_id)
                ->where(function ($q) use ($campaign) {
                    $q->whereNull('campaign_id')
                        ->orWhere('campaign_id', '!=', $campaign->id);
                })
                ->latest()
                ->get()
                ->map(fn (Design $d): array => [
                    'id' => $d->id,
                    'product_name' => $d->product_name,
                    'event_id' => $d->event_id,
                    'event_name' => $d->event?->name,
                    'is_matching_event' => true,
                    'image_url' => $d->generated_image_path ? asset('storage/'.$d->generated_image_path) : null,
                    'created_at' => $d->created_at->format('M d, Y'),
                ])->values()->all();
        }

        return Inertia::render('campaigns/show', [
            'events' => $events,
            'available_designs' => $availableDesigns,
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'description' => $campaign->description,
                'status' => $campaign->status,
                'objective' => $campaign->objective,
                'target_audience' => $campaign->target_audience,
                'product_id' => $campaign->product_id,
                'event_id' => $campaign->event_id,
                'product_name' => $campaign->product?->name,
                'event_name' => $campaign->event?->name,
                'start_date' => $startDate instanceof CarbonInterface ? $startDate->format('Y-m-d') : null,
                'end_date' => $endDate instanceof CarbonInterface ? $endDate->format('Y-m-d') : null,
                'designs' => $campaign->designs->map(fn (Design $design): array => [
                    'id' => $design->id,
                    'product_name' => $design->product_name,
                    'tagline' => $design->tagline,
                    'prompt' => $design->prompt,
                    'price' => $design->price,
                    'content_style' => $design->content_style,
                    'brand_tone' => $design->brand_tone,
                    'status' => $design->status,
                    'is_favorite' => (bool) $design->is_favorite,
                    'image_url' => $design->generated_image_path ? asset('storage/'.$design->generated_image_path) : null,
                    'download_url' => route('designs.download', $design),
                ])->values()->all(),
                'generator_url' => route('generator.index', array_filter([
                    'campaign_id' => $campaign->id,
                    'event_id' => $campaign->event_id,
                    'product_name' => $campaign->product?->name,
                ])),
            ],
        ]);
    }

    public function attachDesigns(Request $request, Campaign $campaign): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('update', $campaign);

        if (empty($campaign->event_id)) {
            return back()->withErrors(['design_ids' => 'This campaign is not associated with an event/holiday. Only event-specific campaigns can attach visuals.']);
        }

        $request->validate([
            'design_ids' => ['required', 'array'],
            'design_ids.*' => ['integer', 'exists:designs,id'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $updatedCount = $user->designs()
            ->whereIn('id', $request->input('design_ids'))
            ->where('event_id', $campaign->event_id)
            ->update([
                'campaign_id' => $campaign->id,
            ]);

        if ($updatedCount === 0) {
            return back()->withErrors(['design_ids' => 'Only designs specifically created for this campaign\'s event/holiday can be added.']);
        }

        return back()->with('success', 'Visuals successfully added to campaign.');
    }

    public function store(StoreCampaignRequest $request): \Symfony\Component\HttpFoundation\Response
    {
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

        $startDate = $request->input('start_date') ?: now()->toDateString();
        $endDate = $request->input('end_date') ?: $startDate;

        $campaign = $user->campaigns()->create([
            'business_id' => $businessId,
            'product_id' => $request->input('product_id') ?: null,
            'event_id' => $request->input('event_id') ?: null,
            'name' => $request->input('name'),
            'description' => $request->input('description') ?: null,
            'objective' => $request->input('objective') ?: ('Campaign for '.$request->input('name')),
            'target_audience' => $request->input('target_audience') ?: null,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $request->input('status', 'active') ?: 'active',
        ]);

        if ($request->filled('design_id')) {
            $design = Design::query()
                ->where('user_id', $user->id)
                ->whereKey($request->input('design_id'))
                ->first();

            if ($design) {
                $design->update([
                    'campaign_id' => $campaign->id,
                    'event_id' => $design->event_id ?: $campaign->event_id,
                ]);
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'start_date' => $campaign->start_date?->format('Y-m-d'),
                    'end_date' => $campaign->end_date?->format('Y-m-d'),
                    'show_url' => route('campaigns.show', $campaign),
                ],
                'message' => 'Campaign created successfully.',
            ]);
        }

        return redirect()->route('campaigns.index')->with('success', 'Campaign created successfully.');
    }

    public function update(UpdateCampaignRequest $request, Campaign $campaign): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('update', $campaign);

        $existingStartDate = $campaign->getAttributeValue('start_date');
        $existingEndDate = $campaign->getAttributeValue('end_date');

        $campaign->update([
            'product_id' => $request->has('product_id') ? $request->input('product_id') : $campaign->product_id,
            'event_id' => $request->has('event_id') ? $request->input('event_id') : $campaign->event_id,
            'name' => $request->input('name', $campaign->name),
            'description' => $request->has('description') ? $request->input('description') : $campaign->description,
            'objective' => $request->has('objective') ? $request->input('objective') : $campaign->objective,
            'target_audience' => $request->has('target_audience') ? $request->input('target_audience') : $campaign->target_audience,
            'start_date' => $request->has('start_date') ? $request->input('start_date') : ($existingStartDate instanceof CarbonInterface ? $existingStartDate->format('Y-m-d') : null),
            'end_date' => $request->has('end_date') ? $request->input('end_date') : ($existingEndDate instanceof CarbonInterface ? $existingEndDate->format('Y-m-d') : null),
            'status' => $request->input('status', $campaign->status),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'status' => $campaign->status,
                    'start_date' => $campaign->start_date?->format('Y-m-d'),
                    'end_date' => $campaign->end_date?->format('Y-m-d'),
                    'objective' => $campaign->objective,
                    'description' => $campaign->description,
                    'target_audience' => $campaign->target_audience,
                ],
                'message' => 'Campaign updated successfully.',
            ]);
        }

        return redirect()->back(fallback: route('campaigns.index'))->with('success', 'Campaign updated successfully.');
    }

    public function destroy(Campaign $campaign): RedirectResponse
    {
        $this->authorize('delete', $campaign);

        $user = auth()->user();
        $campaignName = $campaign->name;

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campaign deleted successfully.');
    }

    public function archive(Request $request, Campaign $campaign): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('update', $campaign);

        $campaign->update(['status' => 'archived']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Campaign archived successfully.',
            ]);
        }

        return redirect()->back(fallback: route('campaigns.index'))->with('success', 'Campaign archived successfully.');
    }

    public function unarchive(Request $request, Campaign $campaign): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('update', $campaign);

        $campaign->update(['status' => 'active']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Campaign restored to active successfully.',
            ]);
        }

        return redirect()->back(fallback: route('campaigns.index'))->with('success', 'Campaign restored to active successfully.');
    }
}
