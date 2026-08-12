<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCampaignRequest;
use App\Http\Requests\UpdateCampaignRequest;
use App\Models\Campaign;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function index(Request $request): Response
    {
        $query = $request->user()->campaigns()
            ->with(['business', 'event', 'product', 'designs'])
            ->latest('updated_at');

        if ($search = $request->string('search')->trim()) {
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('objective', 'like', "%{$search}%")
                    ->orWhere('target_audience', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $campaigns = $query->paginate(12)->withQueryString();

        return Inertia::render('campaigns/index', [
            'campaigns' => $campaigns->through(fn (Campaign $campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'description' => $campaign->description,
                'status' => $campaign->status,
                'objective' => $campaign->objective,
                'target_audience' => $campaign->target_audience,
                'product_name' => $campaign->product?->name,
                'event_name' => $campaign->event?->name,
                'start_date' => $campaign->start_date?->format('Y-m-d'),
                'end_date' => $campaign->end_date?->format('Y-m-d'),
                'design_count' => $campaign->designs()->count(),
                'show_url' => route('campaigns.show', $campaign),
            ])->values()->all(),
            'filters' => [
                'search' => $search ?? '',
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

        return Inertia::render('campaigns/show', [
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
                'start_date' => $campaign->start_date?->format('Y-m-d'),
                'end_date' => $campaign->end_date?->format('Y-m-d'),
                'designs' => $campaign->designs->map(fn ($design) => [
                    'id' => $design->id,
                    'product_name' => $design->product_name,
                    'tagline' => $design->tagline,
                    'status' => $design->status,
                    'image_url' => $design->generated_image_path ? asset('storage/'.$design->generated_image_path) : null,
                ])->values()->all(),
                'generator_url' => route('generator.index', ['campaign' => $campaign->id]),
            ],
        ]);
    }

    public function store(StoreCampaignRequest $request)
    {
        $user = $request->user();

        $campaign = $user->campaigns()->create([
            'business_id' => $user->business?->id,
            'product_id' => $request->input('product_id'),
            'event_id' => $request->input('event_id'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'objective' => $request->input('objective'),
            'target_audience' => $request->input('target_audience'),
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'status' => $request->input('status', 'draft'),
        ]);

        return redirect()->route('campaigns.index')->with('success', 'Campaign created successfully.');
    }

    public function update(UpdateCampaignRequest $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $campaign->update([
            'product_id' => $request->input('product_id', $campaign->product_id),
            'event_id' => $request->input('event_id', $campaign->event_id),
            'name' => $request->input('name', $campaign->name),
            'description' => $request->input('description', $campaign->description),
            'objective' => $request->input('objective', $campaign->objective),
            'target_audience' => $request->input('target_audience', $campaign->target_audience),
            'start_date' => $request->input('start_date', $campaign->start_date?->format('Y-m-d')),
            'end_date' => $request->input('end_date', $campaign->end_date?->format('Y-m-d')),
            'status' => $request->input('status', $campaign->status),
        ]);

        return redirect()->route('campaigns.index')->with('success', 'Campaign updated successfully.');
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campaign deleted successfully.');
    }
}
