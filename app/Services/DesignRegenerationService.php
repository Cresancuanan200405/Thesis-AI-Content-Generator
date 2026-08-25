<?php

namespace App\Services;

use App\Models\Design;
use App\Models\GenerationRequest;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class DesignRegenerationService
{
    public function __construct(
        protected MarketingPromptBuilder $marketingPromptBuilder,
        protected OpenAIImageService $openAIImageService,
    ) {}

    public function regenerate(Design $design): Design
    {
        $user = $design->user;

        if ($user && $user->hasReachedAiBudgetLimit(20.00)) {
            throw new RuntimeException('You have reached your $20.00 AI generation limit quota. Visual regeneration is disabled.');
        }

        $business = $design->business ?? $user->business()->firstOrFail();
        $campaign = $design->campaign;

        $brandTone = $this->normalizeList($design->brand_tone);
        $contentStyle = $this->normalizeList($design->visual_theme);

        $payload = [
            'campaign_id' => $design->campaign_id,
            'event_id' => $design->event_id,
            'product_id' => $design->product_id,
            'product_name' => $design->product_name,
            'marketing_goal' => $campaign && $campaign->objective ? $campaign->objective : 'Refresh the existing marketing asset for this product',
            'content_style' => $contentStyle,
            'brand_tone' => $brandTone,
            'tagline' => $design->tagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'target_audience' => $campaign && $campaign->target_audience ? $campaign->target_audience : $business->target_audience,
            'unique_selling_point' => $business->unique_selling_point,
            'notes' => 'Regenerated from design #'.$design->id.'. Preserve the original concept while creating a refreshed version.',
        ];

        $prompt = $this->marketingPromptBuilder->build($payload, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'product_id' => $design->product_id,
            'event_id' => $design->event_id,
            'product_name' => $design->product_name,
            'marketing_goal' => $payload['marketing_goal'],
            'content_style' => $contentStyle,
            'brand_tone' => $brandTone,
            'tagline' => $design->tagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'target_audience' => $payload['target_audience'],
            'unique_selling_point' => $business->unique_selling_point,
            'notes' => $payload['notes'],
            'prompt' => $prompt,
            'status' => 'processing',
        ]);

        try {
            $generatedImagePath = $this->openAIImageService->generate($prompt, [
                'product_name' => $design->product_name,
                'tagline' => $design->tagline,
                'brand_tone' => $brandTone,
                'visual_theme' => $contentStyle,
                'event_name' => $design->event?->name,
                'price' => $design->price,
                'aspect_ratio' => '1:1',
            ]);
        } catch (RuntimeException $exception) {
            Log::error('Design regeneration failed.', [
                'user_id' => $user->id,
                'design_id' => $design->id,
                'generation_request_id' => $generationRequest->id,
                'error' => $exception->getMessage(),
            ]);

            $generationRequest->update([
                'status' => 'failed',
                'notes' => 'Your design could not be regenerated right now. Please try again.',
            ]);

            throw $exception;
        }

        $generationRequest->update([
            'status' => 'completed',
        ]);

        return Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'event_id' => $design->event_id,
            'product_id' => $design->product_id,
            'product_name' => $design->product_name,
            'prompt' => $prompt,
            'brand_tone' => $design->brand_tone,
            'visual_theme' => $design->visual_theme,
            'tagline' => $design->tagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'reference_image_path' => $design->reference_image_path,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => [
                'source' => 'openai',
                'model' => config('services.openai.image_model', 'dall-e-3'),
                'regenerated_from_design_id' => $design->id,
                'generation_request_id' => $generationRequest->id,
            ],
            'status' => 'completed',
        ]);
    }

    /**
     * @return array<int, string>
     */
    protected function normalizeList(mixed $value): array
    {
        if (is_array($value)) {
            return array_values($value);
        }

        if (is_string($value) && trim($value) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $value))));
        }

        return [];
    }
}
