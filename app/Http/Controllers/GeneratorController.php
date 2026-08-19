<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeneratorRequest as StoreGeneratorRequest;
use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingPromptBuilder;
use App\Services\OpenAIImageService;
use App\Services\PhilippineHolidayService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class GeneratorController extends Controller
{
    public function index(Request $request, PhilippineHolidayService $holidayService): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user?->business()->first();
        /** @var Collection<int, Product> $products */
        $products = $business?->products()->orderBy('name')->get() ?? collect();
        /** @var Campaign|null $campaign */
        $campaign = null;

        $campaignId = $request->input('campaign_id') ?: $request->input('campaign');
        if ($campaignId) {
            $campaign = $user?->campaigns()->with(['product', 'event', 'business'])->whereKey($campaignId)->first();
        }

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

        $campaigns = $user?->campaigns()->orderByDesc('created_at')->get() ?? collect();

        return Inertia::render('generator/index', [
            'business' => $business ? [
                'id' => $business->id,
                'name' => $business->name,
                'industry' => $business->industry,
                'category' => $business->category,
                'description' => $business->description,
                'target_audience' => $business->target_audience,
                'unique_selling_point' => $business->unique_selling_point,
                'logo_path' => $business->logo_path,
                'logo_url' => $business->logo_path ? asset('storage/'.$business->logo_path) : null,
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
            'initial_campaign_id' => $campaign?->id ? (string) $campaign->id : ($request->input('campaign_id') ?: $request->input('campaign')),
            'initial_event_id' => $request->input('event_id') ?: $request->input('event') ?: ($campaign?->event_id ? (string) $campaign->event_id : null),
            'initial_product_name' => $request->input('product_name') ?: $request->input('product') ?: $campaign?->product?->name,
            'campaigns' => $campaigns->map(fn (Campaign $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'status' => $c->status,
                'start_date' => $c->start_date?->format('Y-m-d'),
                'end_date' => $c->end_date?->format('Y-m-d'),
            ])->values()->all(),
            'products' => $products->map(fn ($product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'image_path' => $product->image_path,
                'image_url' => $product->image_path ? asset('storage/'.$product->image_path) : null,
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
        ]);
    }

    public function store(StoreGeneratorRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Business $business */
        $business = $user->business()->firstOrFail();
        $payload = $request->validated();

        $referenceImagePath = null;
        if ($request->hasFile('reference_image')) {
            $referenceImagePath = $request->file('reference_image')->store('generation-requests', 'public');
        }

        $prompt = app(MarketingPromptBuilder::class)->build($payload, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $payload['campaign_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'event_id' => $payload['event_id'] ?? null,
            'product_name' => $payload['product_name'],
            'marketing_goal' => $payload['marketing_goal'],
            'content_style' => $payload['content_style'] ?? [],
            'brand_tone' => $payload['brand_tone'] ?? [],
            'tagline' => $payload['tagline'] ?? null,
            'tagline_mode' => $payload['tagline_mode'] ?? 'auto',
            'target_audience' => $payload['target_audience'] ?? null,
            'unique_selling_point' => $payload['unique_selling_point'] ?? null,
            'reference_image_path' => $referenceImagePath,
            'notes' => $payload['notes'] ?? null,
            'prompt' => $prompt,
            'status' => 'processing',
        ]);

        try {
            $generatedImagePath = app(OpenAIImageService::class)->generate($prompt);
        } catch (RuntimeException $exception) {
            Log::error('OpenAI image generation failed.', [
                'user_id' => $user->id,
                'business_id' => $business->id,
                'generation_request_id' => $generationRequest->id,
                'error' => $exception->getMessage(),
            ]);

            $generationRequest->update([
                'status' => 'failed',
                'notes' => 'Your design could not be generated right now. Please try again.',
            ]);

            return redirect()->route('generator.index')->with('error', 'Your design could not be generated right now. Please try again.');
        }

        $generationRequest->update([
            'status' => 'completed',
        ]);

        Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $payload['campaign_id'] ?? null,
            'event_id' => $payload['event_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'product_name' => $payload['product_name'],
            'prompt' => $prompt,
            'brand_tone' => $payload['brand_tone'] ? implode(', ', $payload['brand_tone']) : null,
            'visual_theme' => $payload['content_style'] ? implode(', ', $payload['content_style']) : null,
            'tagline' => $payload['tagline'] ?? null,
            'tagline_mode' => $payload['tagline_mode'] ?? 'auto',
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => [
                'source' => 'openai',
                'model' => config('services.openai.model', 'gpt-image-1'),
                'size' => config('services.openai.size', '1024x1024'),
                'quality' => config('services.openai.quality', 'high'),
                'generation_request_id' => $generationRequest->id,
            ],
            'status' => 'completed',
        ]);

        return redirect()->route('generator.index')->with('success', 'Your marketing asset has been generated.');
    }

    /**
     * @return string[]
     */
    private function decodeJsonList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return array_values($decoded);
            }
        }

        return [];
    }
}
