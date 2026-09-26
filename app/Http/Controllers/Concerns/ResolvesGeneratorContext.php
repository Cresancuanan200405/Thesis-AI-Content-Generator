<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingDesignSystem;
use App\Services\PhilippineHolidayService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait ResolvesGeneratorContext
{
    /**
     * Resolve common generator view props or return a redirect response if invalid.
     *
     * @return array<string, mixed>|RedirectResponse
     */
    protected function resolveGeneratorViewProps(Request $request, PhilippineHolidayService $holidayService): array|RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        $draftId = $request->input('draft_id') ?: $request->input('design_id');
        /** @var Design|null $draft */
        $draft = null;
        if ($draftId) {
            $draft = $user->designs()->with(['product', 'event', 'campaign'])->whereKey($draftId)->first();
        }

        $campaignParam = $request->route('campaign');
        $campaignId = $campaignParam instanceof Campaign
            ? $campaignParam->id
            : ($campaignParam ?: ($request->input('campaign_id') ?: $request->input('campaign') ?: $draft?->campaign_id));

        if (! $campaignId) {
            return redirect()->route('campaigns.index')
                ->with('info', 'Please select or create a Campaign before generating AI marketing visuals.');
        }

        /** @var Campaign|null $campaign */
        $campaign = $user->campaigns()->with(['product', 'event', 'business'])->whereKey($campaignId)->first();

        if (! $campaign) {
            return redirect()->route('campaigns.index')
                ->with('error', 'The requested Campaign was not found or belongs to another business.');
        }

        /** @var Business|null $business */
        $business = $user->business()->first();
        /** @var Collection<int, Product> $products */
        $products = $business?->products()->orderBy('name')->get() ?? collect();

        // Sync holidays for current year and upcoming 2 years
        foreach ([now()->year, now()->year + 1, now()->year + 2] as $year) {
            try {
                $holidayService->ensureYearSynced((int) $year);
            } catch (\Exception $e) {
                Log::error("Failed to sync holidays for year {$year}: {$e->getMessage()}");
            }
        }

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user?->id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get();

        $campaigns = $user?->campaigns()->with(['event', 'product'])->orderByDesc('created_at')->get() ?? collect();

        $selectedEvent = $campaign?->event ?: $events->firstWhere('id', $request->input('event_id'));

        return [
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'industry' => $business->industry,
                'category' => $business->category,
                'description' => $business->description,
                'target_audience' => $business->target_audience,
                'unique_selling_point' => $business->unique_selling_point,
                'content_style' => $this->decodeJsonList($business->content_style),
                'default_tagline_behavior' => $business->default_tagline_behavior,
            ] : null,
            'campaign' => $campaign ? [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'objective' => $campaign->objective,
                'target_audience' => $campaign->target_audience,
                'product_id' => $campaign->product_id,
                'product_name' => $campaign->product?->name,
                'event_id' => $campaign->event_id,
                'event_name' => $campaign->event?->name,
            ] : null,
            'selectedEvent' => $selectedEvent ? [
                'id' => $selectedEvent->id,
                'name' => $selectedEvent->name,
                'date' => $selectedEvent->date?->format('Y-m-d'),
                'type' => $selectedEvent->type,
                'category' => $selectedEvent->category ?? $selectedEvent->type,
                'is_long_weekend' => (bool) $selectedEvent->is_long_weekend,
                'long_weekend_details' => $selectedEvent->long_weekend_details,
                'proclamation_no' => $selectedEvent->proclamation_no,
            ] : null,
            'initial_campaign_id' => $campaign?->id ? (string) $campaign->id : ($request->input('campaign_id') ?: $request->input('campaign')),
            'initial_event_id' => $request->input('event_id') ?: $request->input('event') ?: ($campaign?->event_id ? (string) $campaign->event_id : null),
            'initial_product_name' => $request->input('product_name') ?: $request->input('product') ?: $campaign?->product?->name,
            'campaigns' => $campaigns->map(fn (Campaign $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status,
                'event_id' => $c->event_id,
                'event_name' => $c->event?->name,
                'product_id' => $c->product_id,
                'product_name' => $c->product?->name,
                'target_audience' => $c->target_audience,
                'objective' => $c->objective,
                'start_date' => $c->start_date?->format('Y-m-d'),
                'end_date' => $c->end_date?->format('Y-m-d'),
            ])->values()->all(),
            'products' => $products->map(fn ($product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? Storage::url($product->image_path) : null,
            ])->values()->all(),
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('Y-m-d'),
                'type' => $event->type,
                'category' => $event->category ?? $event->type,
                'is_long_weekend' => (bool) $event->is_long_weekend,
                'long_weekend_details' => $event->long_weekend_details,
                'proclamation_no' => $event->proclamation_no,
            ])->values()->all(),
            'design_system' => app(MarketingDesignSystem::class)->getExportableTaxonomies(),
            'recent_fingerprints' => app(MarketingDesignSystem::class)->getRecentFingerprints($user, $business, 6),
            'initial_draft' => $draft ? [
                'id' => $draft->id,
                'product_name' => $draft->product_name,
                'product_id' => $draft->product_id,
                'campaign_id' => $draft->campaign_id,
                'event_id' => $draft->event_id,
                'prompt' => $draft->prompt,
                'price' => $draft->price ? (string) $draft->price : null,
                'brand_tone' => $draft->brand_tone,
                'visual_theme' => $draft->visual_theme,
                'tagline' => $draft->tagline,
                'tagline_mode' => $draft->tagline_mode,
                'aspect_ratio' => $draft->generation_metadata['aspect_ratio'] ?? null,
                'status' => $draft->status,
                'image_url' => $draft->generated_image_path ? Storage::url($draft->generated_image_path) : null,
                'generated_image_path' => $draft->generated_image_path,
                'generation_metadata' => $draft->generation_metadata,
            ] : null,
            'origin' => $request->input('origin'),
        ];
    }

    /**
     * Safely decodes a JSON list value into an array.
     */
    protected function decodeJsonList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return array_values($decoded);
            }

            return array_values(array_filter(array_map('trim', explode(',', $value))));
        }

        return [];
    }
}
