<?php

namespace App\Services;

use App\Models\Business;

class ImageCompositorService
{
    /**
     * @var array<string, mixed>|null
     */
    protected ?array $lastCompositingResult = null;

    /**
     * Build an exact deterministic marketing compositing overlay manifest.
     *
     * @param  array{
     *     width?: int,
     *     height?: int,
     *     product_name?: string|null,
     *     price?: string|null,
     *     tagline?: string|null,
     *     business_name?: string|null,
     *     aspect_ratio?: string|null,
     * }  $params
     */
    public function generateCompositingManifest(array $params, ?Business $business = null): array
    {
        $aspectRatio = $params['aspect_ratio'] ?? '1:1';
        [$width, $height] = match ($aspectRatio) {
            '16:9' => [1792, 1024],
            '9:16' => [1024, 1792],
            '4:5' => [1024, 1280],
            '4:3' => [1365, 1024],
            default => [1024, 1024],
        };

        // Enforce 20% safe margin
        $safeMarginX = (int) round($width * 0.20);
        $safeMarginY = (int) round($height * 0.20);
        $safeWidth = $width - ($safeMarginX * 2);
        $safeHeight = $height - ($safeMarginY * 2);

        $price = ! empty($params['price']) ? trim((string) $params['price']) : null;
        $tagline = TaglineNormalizationService::normalize($params['tagline'] ?? null);
        $productName = $params['product_name'] ?? 'Product';
        $brandName = $params['business_name'] ?? $business?->name ?? 'Brand';

        return [
            'canvas' => [
                'width' => $width,
                'height' => $height,
                'aspect_ratio' => $aspectRatio,
            ],
            'safe_margins' => [
                'top' => $safeMarginY,
                'bottom' => $safeMarginY,
                'left' => $safeMarginX,
                'right' => $safeMarginX,
                'safe_width' => $safeWidth,
                'safe_height' => $safeHeight,
                'margin_percent' => 20,
            ],
            'exact_content' => [
                'product_name' => $productName,
                'price' => $price,
                'tagline' => $tagline,
                'brand_name' => $brandName,
            ],
        ];
    }

    /**
     * Get the last compositing result manifest.
     *
     * @return array<string, mixed>|null
     */
    public function getLastCompositingResult(): ?array
    {
        return $this->lastCompositingResult;
    }
}
