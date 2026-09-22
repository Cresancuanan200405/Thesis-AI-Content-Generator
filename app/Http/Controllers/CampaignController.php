<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCampaignRequest;
use App\Http\Requests\UpdateCampaignRequest;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
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

        $view = $request->query('view', 'opportunities');
        if (! in_array($view, ['opportunities', 'hub'], true)) {
            $view = 'opportunities';
        }

        /** @var LengthAwarePaginator<int, Campaign> $campaigns */
        $campaigns = $query->paginate(12)->withQueryString();

        $today = now()->startOfDay();
        $accountFinalizedAt = $user->onboarding_completed_at ?? $user->created_at;
        $accountCreatedDate = $accountFinalizedAt?->copy()->startOfDay();
        $accountYear = (int) ($accountFinalizedAt ? $accountFinalizedAt->format('Y') : now()->format('Y'));

        $allEvents = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->whereYear('date', $accountYear)
            ->orderBy('date')
            ->get();

        $campaignsByEvent = $user->campaigns()
            ->whereNotNull('event_id')
            ->get()
            ->keyBy('event_id');

        $events = $allEvents->map(function (Event $event) use ($campaignsByEvent, $today, $accountCreatedDate): array {
            $campaign = $campaignsByEvent->get($event->id);
            $eventDate = $event->date?->startOfDay();
            $isPast = $eventDate ? $eventDate->lt($today) : false;
            $isUpcoming = $eventDate ? $eventDate->gte($today) : true;
            $hasCampaign = $campaign !== null;

            // Eligibility boundary for missed promotional opportunity:
            // Event must belong to account creation year (enforced by whereYear),
            // occurred on or after the account's finalized creation timestamp and has no campaign
            $isEligibleForMissed = $isPast && $accountCreatedDate !== null && $eventDate && $eventDate->gte($accountCreatedDate);
            $isMissed = $isEligibleForMissed && ! $hasCampaign;

            $diffInDays = $eventDate ? (int) $today->diffInDays($eventDate, false) : 0;
            $relativeTiming = null;
            if ($isUpcoming) {
                if ($diffInDays === 0) {
                    $relativeTiming = 'Today';
                } elseif ($diffInDays === 1) {
                    $relativeTiming = 'Tomorrow';
                } elseif ($diffInDays === 7) {
                    $relativeTiming = 'In 1 week';
                } elseif ($diffInDays === 14) {
                    $relativeTiming = 'In 2 weeks';
                } elseif ($diffInDays % 7 === 0 && $diffInDays <= 28) {
                    $weeks = (int) ($diffInDays / 7);
                    $relativeTiming = "In {$weeks} weeks";
                } else {
                    $relativeTiming = "In {$diffInDays} days";
                }
            }

            return [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date?->format('Y-m-d'),
                'date_formatted' => $event->date?->format('M j, Y'),
                'type' => $event->type,
                'category' => $event->category ?? $event->type,
                'description' => $event->description,
                'is_past' => $isPast,
                'is_upcoming' => $isUpcoming,
                'relative_timing' => $relativeTiming,
                'days_until' => $diffInDays,
                'has_campaign' => $hasCampaign,
                'campaign_id' => $campaign?->id,
                'campaign_name' => $campaign?->name,
                'campaign_status' => $campaign?->status,
                'is_eligible_for_missed' => $isEligibleForMissed,
                'is_missed' => $isMissed,
                'can_create_anyway' => $isPast && ! $hasCampaign,
                'show_url' => $campaign ? route('campaigns.show', $campaign) : null,
                'generator_url' => $campaign ? route('campaigns.generator', $campaign) : null,
            ];
        })->values()->all();

        $upcomingOpportunities = collect($events)
            ->where('is_upcoming', true)
            ->sortBy('date')
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
                        'image_url' => $design->generated_image_path ? Storage::url($design->generated_image_path) : null,
                        'download_url' => route('designs.download', $design),
                    ])->values()->all(),
                    'show_url' => route('campaigns.show', $campaign),
                    'generator_url' => route('campaigns.generator', $campaign),
                ];
            })->values()->all(),
            'account_year' => $accountYear,
            'campaign_year' => $accountYear,
            'currentCampaignYear' => $accountYear,
            'view' => $view,
            'events' => $events,
            'events_and_holidays' => $events,
            'upcoming_opportunities' => $upcomingOpportunities,
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
                'view' => $view,
            ],
            'pagination' => [
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
                'per_page' => $campaigns->perPage(),
                'total' => $campaigns->total(),
            ],
        ]);
    }

    public function show(Campaign $campaign): Response
    {
        $this->authorize('view', $campaign);

        $campaign->load(['product', 'event', 'designs' => fn ($query) => $query->latest()]);
        $startDate = $campaign->start_date;
        $endDate = $campaign->end_date;

        /** @var User $user */
        $user = auth()->user();
        $events = $user->events()->orderBy('date')->get();

        // Get designs for this business that are not yet assigned to any campaign
        $availableDesigns = [];
        if ($campaign->event_id) {
            $availableDesigns = $user->designs()
                ->whereNull('campaign_id')
                ->where(function ($query) use ($campaign) {
                    $query->where('event_id', $campaign->event_id)
                        ->orWhereNull('event_id');
                })
                ->latest()
                ->get()
                ->map(fn (Design $d): array => [
                    'id' => $d->id,
                    'product_name' => $d->product_name,
                    'event_id' => $d->event_id,
                    'event_name' => $d->event?->name,
                    'is_matching_event' => true,
                    'image_url' => $d->generated_image_path ? Storage::url($d->generated_image_path) : null,
                    'created_at' => $d->created_at->format('M d, Y'),
                ])->values()->all();
        }

        return Inertia::render('campaigns/show', [
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('Y-m-d'),
                'type' => $event->type,
            ])->values()->all(),
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
                    'image_url' => $design->generated_image_path ? Storage::url($design->generated_image_path) : null,
                    'download_url' => route('designs.download', $design),
                ])->values()->all(),
                'generator_url' => route('campaigns.generator', $campaign),
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

        $today = now()->startOfDay();
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->startOfDay();
        if ($end->lt($today)) {
            $lifecycleStatus = 'completed';
        } elseif ($start->gt($today)) {
            $lifecycleStatus = 'scheduled';
        } else {
            $lifecycleStatus = 'active';
        }
        $status = $request->input('status') ?: $lifecycleStatus;

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
            'status' => $status,
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

        $startDate = $request->has('start_date')
            ? $request->input('start_date')
            : ($existingStartDate instanceof CarbonInterface ? $existingStartDate->format('Y-m-d') : null);

        $endDate = $request->has('end_date')
            ? $request->input('end_date')
            : ($existingEndDate instanceof CarbonInterface ? $existingEndDate->format('Y-m-d') : null);

        $status = $campaign->status;
        if ($status !== 'archived' && $startDate && $endDate) {
            $today = now()->startOfDay();
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->startOfDay();
            if ($end->lt($today)) {
                $status = 'completed';
            } elseif ($start->gt($today)) {
                $status = 'scheduled';
            } else {
                $status = 'active';
            }
        }

        $campaign->update([
            'name' => $request->input('name', $campaign->name),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $status,
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
