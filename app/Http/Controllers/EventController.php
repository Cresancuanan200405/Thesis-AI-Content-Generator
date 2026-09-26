<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use App\Models\User;
use App\Services\PhilippineHolidayService;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    public function index(Request $request, PhilippineHolidayService $holidayService): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filter = $request->input('filter', 'all');

        foreach ([now()->year - 1, now()->year, now()->year + 1, now()->year + 2] as $year) {
            try {
                $holidayService->ensureYearSynced((int) $year);
            } catch (\Exception $e) {
                Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
            }
        }

        $userDesignEventIds = $user->designs()
            ->whereNotNull('event_id')
            ->pluck('event_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->all();

        $userCampaignsByEvent = $user->campaigns()
            ->whereNotNull('event_id')
            ->where('status', '!=', 'archived')
            ->get(['id', 'event_id', 'name', 'status', 'start_date', 'end_date'])
            ->keyBy('event_id');

        $coveredEventIds = array_unique(array_merge($userDesignEventIds, $userCampaignsByEvent->keys()->map(fn ($id) => (int) $id)->all()));

        $query = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->orderBy('date');

        if ($filter === 'regular') {
            $query->where('category', 'regular');
        } elseif ($filter === 'special_non_working') {
            $query->where('category', 'special_non_working');
        } elseif ($filter === 'special_working') {
            $query->where('category', 'special_working');
        } elseif ($filter === 'islamic') {
            $query->where('category', 'islamic');
        } elseif ($filter === 'long_weekend') {
            $query->where('is_long_weekend', true);
        } elseif ($filter === 'holidays') {
            $query->whereIn('type', ['holiday', 'seasonal']);
        } elseif ($filter === 'commercial') {
            $query->where('type', 'commercial');
        } elseif ($filter === 'custom') {
            $query->where('type', 'custom');
        } elseif ($filter === 'missed') {
            $query->whereDate('date', '<', now()->toDateString())
                ->whereNotIn('id', $coveredEventIds);
        }

        $events = $query->get();

        $mappedEvents = $events->map(function (Event $event) use ($userDesignEventIds, $userCampaignsByEvent): array {
            $eventDate = $event->getAttributeValue('date');
            $eventDateStr = $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : ($eventDate ? Carbon::parse($eventDate)->format('Y-m-d') : null);
            $eventEndDate = $event->getAttributeValue('end_date');
            if ($eventEndDate instanceof CarbonInterface) {
                $eventEndDateStr = $eventEndDate->format('Y-m-d');
            } elseif (! empty($eventEndDate)) {
                $eventEndDateStr = Carbon::parse($eventEndDate)->format('Y-m-d');
            } else {
                $eventEndDateStr = $eventDateStr;
            }
            $campaign = $userCampaignsByEvent->get($event->id);
            $hasCampaign = $campaign !== null;

            // When a marketing campaign is attached, reflect the campaign's user-scheduled date range
            if ($hasCampaign && $campaign->start_date) {
                $cStart = $campaign->start_date instanceof CarbonInterface ? $campaign->start_date->format('Y-m-d') : Carbon::parse($campaign->start_date)->format('Y-m-d');
                $cEnd = $campaign->end_date ? ($campaign->end_date instanceof CarbonInterface ? $campaign->end_date->format('Y-m-d') : Carbon::parse($campaign->end_date)->format('Y-m-d')) : $cStart;

                $eventDateStr = $cStart;
                $eventEndDateStr = $cEnd;
            }

            $hasDesign = in_array((int) $event->id, $userDesignEventIds, true);
            $isMissed = $eventDateStr && $eventDateStr < now()->toDateString() && ! $hasCampaign && ! $hasDesign;

            return [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'date' => $eventDateStr,
                'start_date' => $eventDateStr,
                'end_date' => $eventEndDateStr,
                'type' => $event->type,
                'category' => $event->category ?? $event->type,
                'is_long_weekend' => (bool) $event->is_long_weekend,
                'long_weekend_details' => $event->long_weekend_details,
                'shifted_from_date' => $event->shifted_from_date instanceof CarbonInterface ? $event->shifted_from_date->format('Y-m-d') : null,
                'proclamation_no' => $event->proclamation_no,
                'is_global' => (bool) $event->is_global,
                'user_id' => $event->user_id,
                'has_design' => $hasDesign,
                'has_campaign' => $hasCampaign,
                'campaign_id' => $campaign?->id,
                'campaign_name' => $campaign?->name,
                'campaign_status' => $campaign?->status,
                'is_missed' => $isMissed,
                'show_url' => route('events.show', $event),
            ];
        });

        // Also include any General Campaigns (no event attached) as custom calendar schedule items
        $generalCampaigns = ($filter === 'all' || $filter === 'custom')
            ? $user->campaigns()
                ->whereNull('event_id')
                ->where('status', '!=', 'archived')
                ->get(['id', 'name', 'description', 'status', 'start_date', 'end_date', 'user_id'])
                ->map(function ($c): array {
                    $cStart = $c->start_date ? ($c->start_date instanceof CarbonInterface ? $c->start_date->format('Y-m-d') : Carbon::parse($c->start_date)->format('Y-m-d')) : now()->toDateString();
                    $cEnd = $c->end_date ? ($c->end_date instanceof CarbonInterface ? $c->end_date->format('Y-m-d') : Carbon::parse($c->end_date)->format('Y-m-d')) : $cStart;

                    return [
                        'id' => 'campaign-'.$c->id,
                        'name' => $c->name,
                        'description' => $c->description,
                        'date' => $cStart,
                        'start_date' => $cStart,
                        'end_date' => $cEnd,
                        'type' => 'custom',
                        'category' => 'custom',
                        'is_long_weekend' => false,
                        'long_weekend_details' => null,
                        'shifted_from_date' => null,
                        'proclamation_no' => null,
                        'is_global' => false,
                        'user_id' => $c->user_id,
                        'has_design' => false,
                        'has_campaign' => true,
                        'campaign_id' => $c->id,
                        'campaign_name' => $c->name,
                        'campaign_status' => $c->status,
                        'is_missed' => false,
                        'show_url' => route('campaigns.show', $c),
                    ];
                })
            : collect([]);

        return Inertia::render('calendar/index', [
            'events' => $mappedEvents->concat($generalCampaigns)->values()->all(),
            'upcoming_events' => Event::query()
                ->where(function ($q) use ($user): void {
                    $q->where('is_global', true)
                        ->orWhere('user_id', $user->id);
                })
                ->whereDate('date', '>=', now()->toDateString())
                ->orderBy('date', 'asc')
                ->take(6)
                ->get()
                ->map(function (Event $event): array {
                    $eventDate = $event->getAttributeValue('date');
                    $daysText = null;

                    if ($eventDate) {
                        $today = now()->startOfDay();
                        $target = Carbon::parse($eventDate)->startOfDay();
                        $diff = (int) $today->diffInDays($target, false);

                        $daysText = match (true) {
                            $diff === 0 => 'Today',
                            $diff === 1 => 'Tomorrow',
                            $diff > 1 => $diff.' days left',
                            default => 'Past',
                        };
                    }

                    return [
                        'id' => $event->id,
                        'name' => $event->name,
                        'raw_date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                        'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('M j, Y') : null,
                        'type' => $event->type,
                        'category' => $event->category ?? $event->type,
                        'is_long_weekend' => (bool) $event->is_long_weekend,
                        'long_weekend_details' => $event->long_weekend_details,
                        'proclamation_no' => $event->proclamation_no,
                        'days' => $daysText,
                    ];
                })
                ->values()->all(),
            'filter' => $filter,
        ]);
    }

    /**
     * Fetch events for a specific year (used by React calendar via AJAX).
     * Automatically syncs Philippine holidays if needed.
     */
    public function getYearEvents(Request $request, PhilippineHolidayService $holidayService): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $year = $request->input('year', now()->year);
        $filter = $request->input('filter', 'all');

        // Ensure Philippine holidays are synced for this year
        try {
            $holidayService->ensureYearSynced((int) $year);
        } catch (\Exception $e) {
            Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
        }

        $userDesignEventIds = $user->designs()
            ->whereNotNull('event_id')
            ->pluck('event_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->all();

        $userCampaignsByEvent = $user->campaigns()
            ->whereNotNull('event_id')
            ->get(['id', 'name', 'status', 'event_id'])
            ->keyBy('event_id');

        // Build query for events in the specified year
        $query = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->whereYear('date', $year)
            ->orderBy('date');

        // Apply filters
        if ($filter === 'regular') {
            $query->where('category', 'regular');
        } elseif ($filter === 'special_non_working') {
            $query->where('category', 'special_non_working');
        } elseif ($filter === 'special_working') {
            $query->where('category', 'special_working');
        } elseif ($filter === 'islamic') {
            $query->where('category', 'islamic');
        } elseif ($filter === 'long_weekend') {
            $query->where('is_long_weekend', true);
        } elseif ($filter === 'holidays') {
            $query->whereIn('type', ['holiday', 'seasonal']);
        } elseif ($filter === 'commercial') {
            $query->where('type', 'commercial');
        } elseif ($filter === 'custom') {
            $query->where('type', 'custom');
        } elseif ($filter === 'missed') {
            $coveredEventIds = array_unique(array_merge($userDesignEventIds, $userCampaignsByEvent->keys()->map(fn ($id) => (int) $id)->all()));
            $query->whereDate('date', '<', now()->toDateString())
                ->whereNotIn('id', $coveredEventIds);
        }

        $events = $query->get();

        return response()->json([
            'year' => $year,
            'events' => $events->map(function (Event $event) use ($userDesignEventIds, $userCampaignsByEvent): array {
                $eventDate = $event->getAttributeValue('date');
                $eventDateStr = $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null;
                $eventEndDate = $event->getAttributeValue('end_date');
                $eventEndDateStr = $eventEndDate instanceof CarbonInterface ? $eventEndDate->format('Y-m-d') : $eventDateStr;
                $hasDesign = in_array((int) $event->id, $userDesignEventIds, true);
                $campaign = $userCampaignsByEvent->get($event->id);
                $hasCampaign = $campaign !== null;
                $isMissed = $eventDateStr && $eventDateStr < now()->toDateString() && ! $hasDesign && ! $hasCampaign;

                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDateStr,
                    'start_date' => $eventDateStr,
                    'end_date' => $eventEndDateStr,
                    'type' => $event->type,
                    'category' => $event->category ?? $event->type,
                    'is_long_weekend' => (bool) $event->is_long_weekend,
                    'long_weekend_details' => $event->long_weekend_details,
                    'shifted_from_date' => $event->shifted_from_date instanceof CarbonInterface ? $event->shifted_from_date->format('Y-m-d') : null,
                    'proclamation_no' => $event->proclamation_no,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                    'has_design' => $hasDesign,
                    'has_campaign' => $hasCampaign,
                    'campaign_id' => $campaign?->id,
                    'campaign_name' => $campaign?->name,
                    'campaign_status' => $campaign?->status,
                    'is_missed' => $isMissed,
                ];
            })->values()->all(),
        ]);
    }

    public function manage(Request $request, PhilippineHolidayService $holidayService): Response
    {
        /** @var User $user */
        $user = $request->user();
        $typeFilter = $request->input('type', 'all');

        // Ensure Philippine holidays are synced for past, current, and upcoming years
        foreach ([now()->year - 1, now()->year, now()->year + 1, now()->year + 2] as $year) {
            try {
                $holidayService->ensureYearSynced((int) $year);
            } catch (\Exception $e) {
                Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
            }
        }

        $query = Event::query()
            ->where(fn ($q) => $q->where('user_id', $user->id)->orWhere('is_global', true))
            ->withCount('campaigns')
            ->orderBy('date', 'desc');

        if ($typeFilter === 'holiday') {
            $query->whereIn('type', ['holiday', 'seasonal']);
        } elseif ($typeFilter === 'commercial') {
            $query->where('type', 'commercial');
        } elseif ($typeFilter === 'custom') {
            $query->where('type', 'custom');
        }

        $userCampaignsByEvent = $user->campaigns()
            ->whereNotNull('event_id')
            ->where('status', '!=', 'archived')
            ->latest('updated_at')
            ->get(['id', 'event_id'])
            ->groupBy('event_id');

        $events = $query->get()->map(function (Event $event) use ($user, $userCampaignsByEvent): array {
            $eventDate = $event->getAttributeValue('date');
            $eventEndDate = $event->getAttributeValue('end_date');
            $startDateStr = $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : ($eventDate ? Carbon::parse($eventDate)->format('Y-m-d') : null);
            $endDateStr = $eventEndDate instanceof CarbonInterface ? $eventEndDate->format('Y-m-d') : ($eventEndDate ? Carbon::parse($eventEndDate)->format('Y-m-d') : $startDateStr);

            $canManage = ! $event->is_global && (int) $event->user_id === (int) $user->id;
            $linkedCampaigns = $userCampaignsByEvent->get($event->id);
            $latestCampaignId = $linkedCampaigns?->first()?->id;

            return [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'date' => $startDateStr,
                'start_date' => $startDateStr,
                'end_date' => $endDateStr,
                'type' => $event->type,
                'category' => $event->category ?? $event->type,
                'is_global' => (bool) $event->is_global,
                'is_long_weekend' => (bool) $event->is_long_weekend,
                'long_weekend_details' => $event->long_weekend_details,
                'can_edit' => $canManage,
                'can_delete' => $canManage && (int) $event->campaigns_count === 0,
                'campaigns_count' => (int) $event->campaigns_count,
                'has_campaign' => (int) $event->campaigns_count > 0,
                'latest_campaign_id' => $latestCampaignId,
                'show_url' => route('events.show', $event),
            ];
        });

        return Inertia::render('events/index', [
            'events' => $events->values()->all(),
            'filter' => $typeFilter,
            'current_year' => (int) now()->year,
            'selected_year' => $request->has('year') ? (string) $request->input('year') : (string) now()->year,
            'holiday_catalog' => [],
            'stats' => [
                'total' => $events->count(),
                'holidays' => $events->whereIn('type', ['holiday', 'seasonal'])->count(),
                'commercial' => $events->where('type', 'commercial')->count(),
                'custom' => $events->where('type', 'custom')->count(),
            ],
        ]);
    }

    public function store(StoreEventRequest $request, PhilippineHolidayService $holidayService): RedirectResponse|JsonResponse
    {
        $eventDate = $request->getDate();
        $eventEndDate = $request->getEndDate();
        $eventType = $request->getType();
        $rawName = $request->input('name');
        $normalizedName = trim((string) $rawName);
        $lowerNormalizedName = mb_strtolower($normalizedName);

        $existing = null;

        // 1. Philippine / System Holiday deduplication
        if ($eventType === 'holiday' || $eventType === 'seasonal') {
            try {
                $year = (int) Carbon::parse($eventDate)->year;
                $holidayService->ensureYearSynced($year);
            } catch (\Throwable $e) {
                Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
            }

            // Check if equivalent canonical global event already exists
            $existing = Event::query()
                ->where('is_global', true)
                ->whereDate('date', $eventDate)
                ->where(function ($q) use ($lowerNormalizedName, $normalizedName) {
                    $q->whereRaw('LOWER(TRIM(name)) = ?', [$lowerNormalizedName])
                        ->orWhere('name', $normalizedName)
                        ->orWhereRaw('LOWER(name) LIKE ?', ['%'.$lowerNormalizedName.'%'])
                        ->orWhereRaw('? LIKE LOWER(name)', [$lowerNormalizedName]);
                })
                ->first();

            // If an official global holiday exists on that date and type is holiday
            if (! $existing) {
                $existing = Event::query()
                    ->where('is_global', true)
                    ->whereDate('date', $eventDate)
                    ->whereIn('type', ['holiday', 'seasonal'])
                    ->first();
            }

            // Or if user already has an event on this date
            if (! $existing) {
                $existing = Event::query()
                    ->where('user_id', $request->user()->id)
                    ->whereDate('date', $eventDate)
                    ->where(function ($q) use ($lowerNormalizedName, $normalizedName) {
                        $q->whereRaw('LOWER(TRIM(name)) = ?', [$lowerNormalizedName])
                            ->orWhere('name', $normalizedName);
                    })
                    ->first();
            }
        } else {
            // 2. Marketing ('commercial') and Custom ('custom') events:
            // Check within current user/business scope + normalized event name + date
            $existing = Event::query()
                ->where('user_id', $request->user()->id)
                ->whereDate('date', $eventDate)
                ->where(function ($q) use ($lowerNormalizedName, $normalizedName) {
                    $q->whereRaw('LOWER(TRIM(name)) = ?', [$lowerNormalizedName])
                        ->orWhere('name', $normalizedName);
                })
                ->first();

            // Also check if an identical canonical global event exists on that date
            if (! $existing) {
                $existing = Event::query()
                    ->where('is_global', true)
                    ->whereDate('date', $eventDate)
                    ->where(function ($q) use ($lowerNormalizedName, $normalizedName) {
                        $q->whereRaw('LOWER(TRIM(name)) = ?', [$lowerNormalizedName])
                            ->orWhere('name', $normalizedName);
                    })
                    ->first();
            }
        }

        // If equivalent event already exists, reuse it idempotently without creating duplicate
        if ($existing) {
            $message = "{$existing->name} is already in your Event Bank.";

            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                $existingDate = $existing->getAttributeValue('date');
                $existingEndDate = $existing->getAttributeValue('end_date');

                return response()->json([
                    'message' => $message,
                    'already_exists' => true,
                    'event' => [
                        'id' => $existing->id,
                        'name' => $existing->name,
                        'description' => $existing->description,
                        'date' => $existingDate instanceof CarbonInterface ? $existingDate->format('Y-m-d') : ($existingDate ? Carbon::parse($existingDate)->format('Y-m-d') : null),
                        'start_date' => $existingDate instanceof CarbonInterface ? $existingDate->format('Y-m-d') : ($existingDate ? Carbon::parse($existingDate)->format('Y-m-d') : null),
                        'end_date' => $existingEndDate instanceof CarbonInterface ? $existingEndDate->format('Y-m-d') : ($existingEndDate ? Carbon::parse($existingEndDate)->format('Y-m-d') : null),
                        'type' => $existing->type,
                        'category' => $existing->category ?? $existing->type,
                        'is_global' => (bool) $existing->is_global,
                        'user_id' => $existing->user_id,
                    ],
                ], 200);
            }

            return redirect()->route('events.index')->with('info', $message);
        }

        // 3. Create new canonical user-owned event
        $event = $request->user()->events()->create([
            'name' => $normalizedName,
            'description' => $request->input('description'),
            'date' => $eventDate,
            'end_date' => $eventEndDate,
            'type' => $eventType,
            'category' => $request->input('category', $eventType),
            'is_global' => false,
        ]);

        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            $eventDate = $event->getAttributeValue('date');
            $eventEndDate = $event->getAttributeValue('end_date');

            return response()->json([
                'message' => 'Event created successfully.',
                'already_exists' => false,
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                    'start_date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                    'end_date' => $eventEndDate instanceof CarbonInterface ? $eventEndDate->format('Y-m-d') : ($eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null),
                    'type' => $event->type,
                    'category' => $event->category ?? $event->type,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                ],
            ], 201);
        }

        return redirect()->route('events.index')->with('success', 'Event created successfully.');
    }

    public function show(Event $event): Response
    {
        $this->authorize('view', $event);

        $eventDate = $event->getAttributeValue('date');
        $eventEndDate = $event->getAttributeValue('end_date');
        $createdAt = $event->getAttributeValue('created_at');

        return Inertia::render('events/show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                'start_date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                'end_date' => $eventEndDate instanceof CarbonInterface ? $eventEndDate->format('Y-m-d') : ($eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null),
                'type' => $event->type,
                'is_global' => (bool) $event->is_global,
                'created_at' => $createdAt instanceof CarbonInterface ? $createdAt->format('M j, Y') : null,
                'show_url' => route('events.show', $event),
                'calendar_url' => route('calendar.index'),
                'events_url' => route('events.index'),
            ],
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse|JsonResponse
    {
        $this->authorize('update', $event);

        $existingDate = $event->getAttributeValue('date');
        $startDate = $request->input('start_date', $existingDate instanceof CarbonInterface ? $existingDate->format('Y-m-d') : null);
        $endDate = $request->input('end_date', $startDate);

        $event->update([
            'name' => $request->input('name', $event->name),
            'description' => $request->input('description', $event->description),
            'date' => $startDate,
            'end_date' => $endDate,
            'type' => $request->input('type', $event->type),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Event updated successfully.', 'event' => $event]);
        }

        return redirect()->route('events.index')->with('success', 'Event updated successfully.');
    }

    public function destroy(Request $request, Event $event): RedirectResponse|JsonResponse
    {
        $this->authorize('delete', $event);

        if ($event->campaigns()->exists()) {
            $error = 'Cannot delete this event because it is linked to one or more campaigns.';
            if ($request->wantsJson()) {
                return response()->json(['message' => $error], 422);
            }

            return back()->with('error', $error);
        }

        $event->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Event deleted successfully.']);
        }

        return redirect()->route('events.index')->with('success', 'Event deleted successfully.');
    }
}
