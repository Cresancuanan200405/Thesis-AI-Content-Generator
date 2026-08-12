<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Models\Event;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filter = $request->input('filter', 'all');

        $query = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->orderBy('date');

        if ($filter === 'holidays') {
            $query->whereIn('type', ['holiday', 'seasonal']);
        } elseif ($filter === 'commercial') {
            $query->where('type', 'commercial');
        } elseif ($filter === 'custom') {
            $query->where('type', 'custom');
        }

        $events = $query->get();

        return Inertia::render('calendar/index', [
            'events' => $events->map(function (Event $event) {
                $eventDate = $event->getAttributeValue('date');

                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('Y-m-d') : null,
                    'type' => $event->type,
                    'is_global' => (bool) $event->is_global,
                    'user_id' => $event->user_id,
                    'show_url' => route('events.show', $event),
                ];
            })->values()->all(),
            'upcoming_events' => $events->filter(fn (Event $event) => $event->getAttributeValue('date') >= now()->toDateString())
                ->take(5)
                ->map(function (Event $event) {
                    $eventDate = $event->getAttributeValue('date');

                    return [
                        'id' => $event->id,
                        'name' => $event->name,
                        'date' => $eventDate instanceof CarbonInterface ? $eventDate->format('M j, Y') : null,
                        'type' => $event->type,
                        'days' => $eventDate ? now()->diffInDays($eventDate, false).' days left' : null,
                    ];
                })
                ->values()->all(),
            'filter' => $filter,
        ]);
    }

    public function store(StoreEventRequest $request)
    {
        $request->user()->events()->create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'date' => $request->input('start_date'),
            'type' => $request->input('type', 'custom'),
            'is_global' => false,
        ]);

        return redirect()->route('calendar.index')->with('success', 'Event created successfully.');
    }

    public function show(Event $event)
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

    public function update(UpdateEventRequest $request, Event $event)
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

    public function destroy(Event $event)
    {
        $this->authorize('delete', $event);

        $event->delete();

        return redirect()->route('calendar.index')->with('success', 'Event deleted successfully.');
    }
}
