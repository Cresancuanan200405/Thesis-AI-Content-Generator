<?php

namespace App\Services;

use App\Models\Business;

class ImageCompositorService
{
    /**
     * Build an exact deterministic vector compositing overlay.
     *
     * @param  array{
     *     width?: int,
     *     height?: int,
     *     product_name?: string|null,
     *     price?: string|null,
     *     tagline?: string|null,
     *     logo_path?: string|null,
     *     business_name?: string|null,
     *     include_logo?: bool|null,
     *     aspect_ratio?: string|null,
     * }  $params
     */
    public function generateCompositingManifest(array $params, ?Business $business = null): array
    {
        $aspectRatio = $params['aspect_ratio'] ?? '1:1';
        [$width, $height] = match ($aspectRatio) {
            '16:9' => [1792, 1024],
            '9:16' => [1024, 1792],
            default => [1024, 1024],
        };

        // Enforce 20% safe margin
        $safeMarginX = (int) round($width * 0.20);
        $safeMarginY = (int) round($height * 0.20);
        $safeWidth = $width - ($safeMarginX * 2);
        $safeHeight = $height - ($safeMarginY * 2);

        $price = ! empty($params['price']) ? trim((string) $params['price']) : null;
        $tagline = ! empty($params['tagline']) ? trim((string) $params['tagline']) : null;
        $productName = $params['product_name'] ?? 'Product';
        $brandName = $params['business_name'] ?? $business?->name ?? 'Brand';

        $logoUrl = null;
        if (! empty($params['include_logo']) && ! empty($params['logo_path'])) {
            $logoUrl = asset('storage/'.$params['logo_path']);
        }

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
                'logo_url' => $logoUrl,
            ],
        ];
    }
}
