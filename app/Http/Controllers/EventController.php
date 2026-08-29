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
                ->whereNotIn('id', $userDesignEventIds);
        }

        $events = $query->get();

        return Inertia::render('calendar/index', [
            'events' => $events->map(function (Event $event) use ($userDesignEventIds): array {
                $eventDate = $event->getAttributeValue('date');
                $eventDateStr = $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null;
                $hasDesign = in_array((int) $event->id, $userDesignEventIds, true);
                $isMissed = $eventDateStr && $eventDateStr < now()->toDateString() && ! $hasDesign;

                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDateStr,
                    'type' => $event->type,
                    'category' => $event->category ?? $event->type,
                    'is_long_weekend' => (bool) $event->is_long_weekend,
                    'long_weekend_details' => $event->long_weekend_details,
                    'shifted_from_date' => $event->shifted_from_date instanceof CarbonInterface ? $event->shifted_from_date->format('Y-m-d') : null,
                    'proclamation_no' => $event->proclamation_no,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                    'has_design' => $hasDesign,
                    'is_missed' => $isMissed,
                    'show_url' => route('events.show', $event),
                ];
            })->values()->all(),
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
            $query->whereDate('date', '<', now()->toDateString())
                ->whereNotIn('id', $userDesignEventIds);
        }

        $events = $query->get();

        return response()->json([
            'year' => $year,
            'events' => $events->map(function (Event $event) use ($userDesignEventIds): array {
                $eventDate = $event->getAttributeValue('date');
                $eventDateStr = $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null;
                $hasDesign = in_array((int) $event->id, $userDesignEventIds, true);
                $isMissed = $eventDateStr && $eventDateStr < now()->toDateString() && ! $hasDesign;

                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDateStr,
                    'type' => $event->type,
                    'category' => $event->category ?? $event->type,
                    'is_long_weekend' => (bool) $event->is_long_weekend,
                    'long_weekend_details' => $event->long_weekend_details,
                    'shifted_from_date' => $event->shifted_from_date instanceof CarbonInterface ? $event->shifted_from_date->format('Y-m-d') : null,
                    'proclamation_no' => $event->proclamation_no,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                    'has_design' => $hasDesign,
                    'is_missed' => $isMissed,
                ];
            })->values()->all(),
        ]);
    }

    public function store(StoreEventRequest $request): RedirectResponse|JsonResponse
    {
        $eventDate = $request->getDate();
        $eventType = $request->getType();

        // Check for duplicates: user_id + date + name
        $duplicate = Event::where('user_id', $request->user()->id)
            ->where('date', $eventDate)
            ->where('name', trim($request->input('name')))
            ->exists();

        if ($duplicate) {
            $error = 'You already have an event with this name on this date.';

            // Return JSON for AJAX requests
            if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
                return response()->json(
                    ['message' => $error, 'errors' => ['name' => [$error]]],
                    422,
                );
            }

            return back()->withErrors(['name' => $error]);
        }

        $event = $request->user()->events()->create([
            'name' => trim($request->input('name')),
            'description' => $request->input('description'),
            'date' => $eventDate,
            'type' => $eventType,
            'is_global' => false,
        ]);

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->header('Accept') === 'application/json') {
            $eventDate = $event->getAttributeValue('date');

            return response()->json([
                'message' => 'Event created successfully.',
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                    'type' => $event->type,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                ],
            ], 201);
        }

        return redirect()->route('calendar.index')->with('success', 'Event created successfully.');
    }

    public function show(Event $event): Response
    {
        $this->authorize('view', $event);

        $eventDate = $event->getAttributeValue('date');
        $createdAt = $event->getAttributeValue('created_at');

        return Inertia::render('events/show', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                'type' => $event->type,
                'is_global' => (bool) $event->is_global,
                'created_at' => $createdAt instanceof CarbonInterface ? $createdAt->format('M j, Y') : null,
                'show_url' => route('events.show', $event),
                'calendar_url' => route('calendar.index'),
            ],
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): RedirectResponse
    {
        $this->authorize('update', $event);

        $existingDate = $event->getAttributeValue('date');

        $event->update([
            'name' => $request->input('name', $event->name),
            'description' => $request->input('description', $event->description),
            'date' => $request->input('start_date', $existingDate instanceof CarbonInterface ? $existingDate->format('Y-m-d') : null),
            'type' => $request->input('type', $event->type),
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event updated successfully.');
    }

    public function destroy(Event $event): RedirectResponse
    {
        $this->authorize('delete', $event);

        $event->delete();

        return redirect()->route('calendar.index')->with('success', 'Event deleted successfully.');
    }
}
