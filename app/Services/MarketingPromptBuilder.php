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

        $price = ! empty($payload['price'])
            ? $payload['price']
            : ($product && $product->price > 0 ? '$'.number_format((float) $product->price, 2, '.', ',') : null);

        $lines = [];
        $lines[] = 'PROMOTIONAL ADVERTISEMENT BRIEF:';
        $lines[] = '• Hero Product: '.$productName;

        $desc = $payload['product_description'] ?? ($product ? $product->description : null);
        if (! empty($desc)) {
            $lines[] = '• Description: '.$desc;
        }

        if (! empty($price)) {
            $lines[] = '• Price: '.$price;
        }

        if (! empty($payload['event_name'] ?? null)) {
            $lines[] = '• Event/Holiday: '.$payload['event_name'];
        }

        if (! empty($payload['tagline'] ?? null)) {
            $lines[] = '• Headline/Tagline: "'.$payload['tagline'].'"';
        }

        if (! empty($payload['campaign_name'] ?? null)) {
            $lines[] = '• Campaign: '.$payload['campaign_name'];
        }

        $lines[] = '• Brand: '.$business->name.($business->industry ? ' ('.$business->industry.')' : '');

        if (! empty($contentStyle)) {
            $lines[] = '• Content Style Tags: '.implode(', ', $contentStyle);
        }

        if (! empty($brandTone)) {
            $lines[] = '• Brand Tone: '.implode(', ', $brandTone);
        }

        if (! empty($payload['notes'] ?? null)) {
            $lines[] = '• Specific User Instructions: '.$payload['notes'];
        }

        return implode("\n", $lines);
    }
}
