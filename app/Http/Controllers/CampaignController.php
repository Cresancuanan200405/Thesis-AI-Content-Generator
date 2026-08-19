<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCampaignRequest;
use App\Http\Requests\UpdateCampaignRequest;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\User;
use App\Services\NotificationService;
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
                    'design_count' => $campaign->designs()->count(),
                    'show_url' => route('campaigns.show', $campaign),
                    'generator_url' => route('generator.index', ['campaign_id' => $campaign->id]),
                ];
            })->values()->all(),
            'events' => $events,
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

    public function show(Campaign $campaign): Response
    {
        $this->authorize('view', $campaign);

        $campaign->load(['product', 'event', 'business', 'designs']);

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

        return Inertia::render('campaigns/show', [
            'events' => $events,
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
                'generator_url' => route('generator.index', ['campaign' => $campaign->id]),
            ],
        ]);
    }

    public function store(StoreCampaignRequest $request): \Symfony\Component\HttpFoundation\Response
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

        $startDate = $request->input('start_date') ?: now()->toDateString();
        $endDate = $request->input('end_date') ?: $startDate;

        $campaign = $user->campaigns()->create([
            'business_id' => $businessId,
            'product_id' => $request->input('product_id'),
            'event_id' => $request->input('event_id'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'objective' => $request->input('objective') ?: ('Campaign for '.$request->input('name')),
            'target_audience' => $request->input('target_audience'),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'status' => $request->input('status', 'draft') ?: 'draft',
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

        NotificationService::notify(
            $user,
            'campaign_created',
            "Campaign Created: {$campaign->name}",
            "New campaign \"{$campaign->name}\" was successfully created.",
            route('campaigns.show', $campaign)
        );

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

        if ($user = $request->user()) {
            NotificationService::notify(
                $user,
                'campaign_updated',
                "Campaign Updated: {$campaign->name}",
                "Campaign \"{$campaign->name}\" details have been updated.",
                route('campaigns.show', $campaign)
            );
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

        if ($user) {
            NotificationService::notify(
                $user,
                'campaign_deleted',
                "Campaign Deleted: {$campaignName}",
                "Campaign \"{$campaignName}\" was deleted.",
                route('campaigns.index')
            );
        }

        return redirect()->route('campaigns.index')->with('success', 'Campaign deleted successfully.');
    }
}
