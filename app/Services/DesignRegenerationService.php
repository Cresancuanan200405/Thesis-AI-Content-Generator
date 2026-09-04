<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

        $budgetLimit = (float) config('services.openai.budget_limit', 10.00);
        if ($user && $user->hasReachedAiBudgetLimit($budgetLimit)) {
            throw new RuntimeException('You have reached your $'.number_format($budgetLimit, 2).' AI generation limit quota. Visual regeneration is disabled.');
        }

        $business = $design->business ?? $user->business()->firstOrFail();
        $meta = (array) ($design->generation_metadata ?? []);

        // 1. Recover Product Details & Reference Image
        /** @var Product|null $product */
        $product = null;
        if ($design->product_id) {
            $product = $design->product ?? Product::query()->where('id', $design->product_id)->first();
        }

        $productName = $design->product_name ?: ($product->name ?? 'Product');
        $productDescription = $product->description ?? $meta['product_description'] ?? null;

        $numericPrice = $design->price;
        $priceForPrompt = null;
        if (! empty($meta['price'])) {
            $priceForPrompt = (string) $meta['price'];
        } elseif ($numericPrice !== null && $numericPrice !== '') {
            $priceForPrompt = '₱'.number_format((float) $numericPrice, 2, '.', ',');
        } elseif ($product && $product->price > 0) {
            $priceForPrompt = '₱'.number_format((float) $product->price, 2, '.', ',');
        }
        $dbPrice = $numericPrice ?: ($product->price ?? ($priceForPrompt ? (float) preg_replace('/[^0-9.]/', '', $priceForPrompt) : null));

        $referenceImagePath = $design->reference_image_path ?? $product->image_path ?? null;
        $productImageUrl = $product?->image_path ? Storage::url($product->image_path) : ($referenceImagePath ? Storage::url($referenceImagePath) : null);

        // 2. Recover Campaign Details
        /** @var Campaign|null $campaign */
        $campaign = null;
        if ($design->campaign_id) {
            $campaign = $design->campaign ?? Campaign::query()->where('id', $design->campaign_id)->first();
        }
        $campaignName = $campaign->name ?? $meta['campaign_name'] ?? null;
        $campaignObjective = $campaign->objective ?? $meta['campaign_objective'] ?? $meta['marketing_goal'] ?? 'Refresh the existing marketing asset for this product';

        // 3. Recover Event Details
        /** @var Event|null $event */
        $event = null;
        if ($design->event_id) {
            $event = $design->event ?? Event::query()->where('id', $design->event_id)->first();
        }
        $eventName = $event->name ?? $meta['event_name'] ?? null;

        // 4. Recover Style, Brand Tone, Render Style & Visual Theme
        $brandTone = $this->normalizeList($design->brand_tone ?? $meta['brand_tone'] ?? []);
        $contentStyle = $this->normalizeList($design->visual_theme ?? $meta['visual_theme'] ?? $meta['content_style'] ?? []);
        $renderStyle = (string) ($meta['render_style'] ?? 'Studio Product Still');
        $aspectRatio = (string) ($meta['aspect_ratio'] ?? '1:1');
        $imageModel = (string) ($meta['model'] ?? $meta['image_model'] ?? config('services.openai.image_model', 'gpt-image-2'));
        $imageQuality = (string) ($meta['quality'] ?? $meta['image_quality'] ?? 'medium');

        // 5. Recover Business / Shop Identity & Settings (Resolved directly from business record)
        $includeBusinessName = array_key_exists('include_business_name', $meta)
            ? (bool) $meta['include_business_name']
            : (! array_key_exists('business_name', $meta) || ! empty($meta['business_name']));
        $businessName = $includeBusinessName ? $business->name : null;

        // 6. Recover Exact Scene / Visual Prompt
        $scenePrompt = $this->extractScenePrompt($design);
        $normalizedTagline = TaglineNormalizationService::normalize($design->tagline);

        // 7. Build Complete Promotional Advertisement Brief using MarketingPromptBuilder
        $payload = [
            'campaign_id' => $design->campaign_id,
            'campaign_name' => $campaignName,
            'event_id' => $design->event_id,
            'event_name' => $eventName,
            'product_id' => $design->product_id,
            'product_name' => $productName,
            'product_description' => $productDescription,
            'price' => $priceForPrompt,
            'marketing_goal' => $campaignObjective,
            'content_style' => $contentStyle,
            'brand_tone' => $brandTone,
            'render_style' => $renderStyle,
            'tagline' => $normalizedTagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'unique_selling_point' => $business->unique_selling_point,
            'include_business_name' => $includeBusinessName,
            'business_name' => $businessName,
            'image_prompt' => $scenePrompt,
            'scene_prompt' => $scenePrompt,
            'notes' => $scenePrompt ?: ('Regenerated variation of '.$productName),
        ];

        $prompt = $this->marketingPromptBuilder->build($payload, $business);

        $generationRequest = GenerationRequest::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'product_id' => $design->product_id,
            'event_id' => $design->event_id,
            'product_name' => $productName,
            'marketing_goal' => $payload['marketing_goal'],
            'content_style' => $contentStyle,
            'brand_tone' => $brandTone,
            'tagline' => $normalizedTagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'unique_selling_point' => $business->unique_selling_point,
            'notes' => $payload['notes'],
            'prompt' => $prompt,
            'status' => 'processing',
        ]);

        try {
            $generatedImagePath = $this->openAIImageService->generate($prompt, [
                // Step 1 — Product & Campaign
                'product_name' => $productName,
                'product_description' => $productDescription,
                'product_category' => $business->category,
                'business_category' => $business->category,
                'product_image_url' => $productImageUrl,
                'campaign_name' => $campaignName,
                'campaign_objective' => $campaignObjective,
                'event_name' => $eventName,
                'price' => $priceForPrompt,

                // Step 2 — Style & Tone
                'brand_tone' => $brandTone,
                'visual_theme' => $contentStyle,
                'render_style' => $renderStyle,
                'image_model' => $imageModel,
                'image_quality' => $imageQuality,

                // Step 3 — Canvas
                'tagline' => $normalizedTagline,
                'tagline_mode' => $design->tagline_mode ?? 'ai',
                'aspect_ratio' => $aspectRatio,

                // Onboarding / Business Context
                'include_business_name' => $includeBusinessName,
                'business_name' => $businessName,
                'business_industry' => $business->industry,
                'business_description' => $business->description,
                'business_usp' => $business->unique_selling_point,
                'business_content_style' => $business->content_style,
                'business_marketing_prefs' => $business->marketing_preferences,

                // Reference image (uploaded file or catalog product image)
                'reference_image_path' => $referenceImagePath,
                'scene_prompt' => $scenePrompt,
                'user_prompt' => $scenePrompt ?: $prompt,
                'notes' => $scenePrompt ?: ('Regenerated variation of '.$productName),
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

        $lastMeta = $this->openAIImageService->getLastGenerationMetadata() ?: [];

        return Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'campaign_id' => $design->campaign_id,
            'event_id' => $design->event_id,
            'product_id' => $design->product_id,
            'product_name' => $productName,
            'prompt' => $prompt,
            'price' => $dbPrice,
            'brand_tone' => implode(', ', $brandTone),
            'visual_theme' => implode(', ', $contentStyle),
            'tagline' => $normalizedTagline,
            'tagline_mode' => $design->tagline_mode ?? 'auto',
            'reference_image_path' => $referenceImagePath,
            'generated_image_path' => $generatedImagePath,
            'generation_metadata' => array_merge(
                $lastMeta,
                [
                    'source' => 'openai',
                    'model' => $imageModel,
                    'model_name' => ($imageModel === 'gpt-image-2' || ! $imageModel) ? 'GPT-Image-2' : $imageModel,
                    'generation_method' => $referenceImagePath ? 'image_to_image_edit' : 'text_to_image',
                    'generation_mode' => 'PRODUCT_PRESERVING',
                    'prompt_version' => 'marketing-pipeline-v1',
                    'product_preserved' => (bool) ($lastMeta['product_preserved'] ?? (bool) $referenceImagePath),
                    'reference_image_used' => (bool) ($lastMeta['reference_image_used'] ?? (bool) $referenceImagePath),
                    'quality' => $imageQuality,
                    'render_style' => $renderStyle,
                    'include_business_name' => $includeBusinessName,
                    'business_name' => $businessName,
                    'scene_prompt' => $scenePrompt,
                    'aspect_ratio' => $aspectRatio,
                    'regenerated_from_design_id' => $design->id,
                    'generation_request_id' => $generationRequest->id,
                    'status' => 'completed',
                ]
            ),
            'status' => 'completed',
        ]);
    }

    /**
     * Extract original scene prompt from metadata, request notes, or prompt text.
     */
    protected function extractScenePrompt(Design $design): ?string
    {
        $meta = (array) ($design->generation_metadata ?? []);

        if (! empty($meta['scene_prompt'])) {
            return trim((string) $meta['scene_prompt']);
        }

        if (! empty($meta['user_prompt'])) {
            $raw = trim((string) $meta['user_prompt']);
            if (! Str::startsWith($raw, 'PROMOTIONAL ADVERTISEMENT BRIEF:') && ! Str::startsWith($raw, 'CREATE:')) {
                return $raw;
            }
        }

        if (! empty($meta['image_prompt'])) {
            return trim((string) $meta['image_prompt']);
        }

        if (! empty($meta['generation_request_id'])) {
            $generationRequest = GenerationRequest::query()->find($meta['generation_request_id']);
            if ($generationRequest) {
                $reqNotes = trim((string) ($generationRequest->notes ?? ''));
                if (! empty($reqNotes) && ! Str::startsWith($reqNotes, 'Regenerated from design #')) {
                    return $reqNotes;
                }
            }
        }

        if (! empty($design->prompt)) {
            if (preg_match('/• Specific User Instructions:\s*(.+)$/m', $design->prompt, $matches)) {
                $matched = trim($matches[1]);
                if (! Str::startsWith($matched, 'Regenerated from design #')) {
                    return $matched;
                }
            }

            if (! Str::startsWith($design->prompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:') && ! Str::startsWith($design->prompt, 'CREATE:')) {
                return trim($design->prompt);
            }
        }

        return null;
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
