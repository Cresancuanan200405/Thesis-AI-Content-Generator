<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Product;

class MarketingPromptBuilder
{
    /**
     * Build the user content brief from form payload and business information.
     *
     * @param  array<string, mixed>  $payload
     */
    public function build(array $payload, Business $business): string
    {
        $contentStyle = is_array($payload['content_style'] ?? null) ? array_values($payload['content_style']) : [];
        $brandTone = is_array($payload['brand_tone'] ?? null) ? array_values($payload['brand_tone']) : [];

        $productName = $payload['product_name'] ?? 'Product';
        $product = null;

        if (! empty($payload['product_id'])) {
            $product = Product::query()->whereKey($payload['product_id'])->first();
            if ($product && empty($payload['product_name'])) {
                $productName = $product->name;
            }
        }

        $includePrices = array_key_exists('include_prices', $payload) ? (bool) $payload['include_prices'] : true;

        $price = null;
        if ($includePrices) {
            $price = ! empty($payload['price'])
                ? $payload['price']
                : ($product && $product->price > 0 ? '₱'.number_format((float) $product->price, 2, '.', ',') : null);
        }

        $lines = [];
        $lines[] = 'PROMOTIONAL ADVERTISEMENT BRIEF:';
        $lines[] = '• Hero Product: '.$productName;

        $desc = $payload['product_description'] ?? ($product ? $product->description : null);
        if (! empty($desc)) {
            $lines[] = '• Description: '.$desc;
        }

        if ($includePrices && ! empty($price)) {
            $lines[] = '• Price: '.$price;
        }

        // Additional catalog products
        if (! empty($payload['catalog_products'])) {
            $secondaryProducts = collect($payload['catalog_products'])
                ->filter(fn ($p) => ($p->id ?? null) !== ($product?->id))
                ->values();

            foreach ($secondaryProducts as $sec) {
                $pName = $sec->name ?? ($sec['name'] ?? 'Product');
                $pPrice = $includePrices && ! empty($sec->price ?? ($sec['price'] ?? null)) ? ' (₱'.number_format((float) ($sec->price ?? $sec['price']), 2).')' : '';
                $lines[] = '• Co-Featured Product: '.$pName.$pPrice;
            }
        }

        // Custom products
        if (! empty($payload['custom_products']) && is_array($payload['custom_products'])) {
            foreach ($payload['custom_products'] as $cp) {
                $cpName = $cp['name'] ?? 'Custom Item';
                $cpPrice = $includePrices && ! empty($cp['price']) ? ' (₱'.number_format((float) $cp['price'], 2).')' : '';
                $lines[] = '• Custom Item: '.$cpName.$cpPrice;
            }
        }

        if (! empty($payload['event_name'] ?? null)) {
            $lines[] = '• Event/Holiday: '.$payload['event_name'];
        }

        $normalizedTagline = TaglineNormalizationService::normalize($payload['tagline'] ?? null);
        if ($normalizedTagline !== null) {
            $lines[] = '• Headline/Tagline: "'.$normalizedTagline.'"';
        }

        if (! empty($payload['campaign_name'] ?? null)) {
            $lines[] = '• Campaign: '.$payload['campaign_name'];
        }

        $includeBusinessName = array_key_exists('include_business_name', $payload)
            ? (bool) $payload['include_business_name']
            : (! array_key_exists('business_name', $payload) || ! empty($payload['business_name']));

        if ($includeBusinessName) {
            $businessName = ! empty($payload['business_name']) ? trim((string) $payload['business_name']) : $business->name;
            if ($businessName) {
                $lines[] = '• Business / Shop: '.$businessName.($business->industry ? ' ('.$business->industry.')' : '');
            }
        }

        if (! empty($contentStyle)) {
            $lines[] = '• Content Style Tags: '.implode(', ', $contentStyle);
        }

        if (! empty($brandTone)) {
            $lines[] = '• Brand Tone: '.implode(', ', $brandTone);
        }

        $sceneInstruction = $payload['image_prompt'] ?? $payload['scene_prompt'] ?? $payload['notes'] ?? null;
        if (! empty($sceneInstruction)) {
            $lines[] = '• Specific User Instructions: '.$sceneInstruction;
        }

        return implode("\n", $lines);
    }
}
