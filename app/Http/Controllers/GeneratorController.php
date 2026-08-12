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
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class GeneratorController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        /** @var Business|null $business */
        $business = $user?->business()->with('brandKit')->first();
        /** @var Collection<int, Product> $products */
        $products = $business?->products()->orderBy('name')->get() ?? collect();
        /** @var Campaign|null $campaign */
        $campaign = null;

        if ($request->filled('campaign')) {
            $campaign = $user?->campaigns()->with(['product', 'event', 'business'])->whereKey($request->input('campaign'))->first();
        }

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user?->id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get();

        return Inertia::render('generator/index', [
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
                'event_id' => $campaign->event_id,
            ] : null,
            'brand' => $business?->brandKit ? [
                'brand_tone' => $this->decodeJsonList($business->brandKit->brand_tone),
                'visual_preferences' => $business->brandKit->visual_preferences,
                'brand_guidelines' => $business->brandKit->brand_guidelines,
                'primary_color' => $business->brandKit->primary_color,
                'secondary_color' => $business->brandKit->secondary_color,
                'accent_color' => $business->brandKit->accent_color,
            ] : [
                'brand_tone' => [],
                'visual_preferences' => '',
                'brand_guidelines' => '',
                'primary_color' => '#111827',
                'secondary_color' => '#F59E0B',
                'accent_color' => '#E5E7EB',
            ],
            'products' => $products->map(fn ($product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
            ])->values()->all(),
            'events' => $events->map(fn (Event $event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('Y-m-d'),
                'type' => $event->type,
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
