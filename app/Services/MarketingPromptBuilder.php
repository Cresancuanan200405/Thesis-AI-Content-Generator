<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Product;

class MarketingPromptBuilder
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function build(array $payload, Business $business): string
    {
        $contentStyle = is_array($payload['content_style'] ?? null) ? array_values($payload['content_style']) : [];
        $brandTone = is_array($payload['brand_tone'] ?? null) ? array_values($payload['brand_tone']) : [];

        $productName = 'Custom product';
        $product = null;

        if (! empty($payload['product_id'])) {
            $product = Product::query()->whereKey($payload['product_id'])->first();
            if ($product) {
                $productName = $product->name;
            }
        }

        $lines = [
            'Create a marketing asset for the following brief.',
            'Business: '.$business->name,
            'Industry: '.($business->industry ?? 'General'),
            'Category: '.($business->category ?? 'General'),
            'PRODUCT: '.$productName,
            'Name: '.$productName,
            'Description: '.($product ? $product->description : 'No product description provided.'),
            'Price: '.($product ? '$'.number_format((float) $product->price, 2, '.', ',') : '$0.00'),
            'Marketing goal: '.($payload['marketing_goal'] ?? 'Increase awareness and engagement'),
            'Content style: '.($contentStyle ? implode(', ', $contentStyle) : 'Not specified'),
            'Brand tone: '.($brandTone ? implode(', ', $brandTone) : 'Not specified'),
            'Target audience: '.($payload['target_audience'] ?? $business->target_audience ?? 'General audience'),
            'Unique selling point: '.($payload['unique_selling_point'] ?? $business->unique_selling_point ?? 'Strong value proposition'),
        ];

        if (! empty($payload['campaign_name'] ?? null)) {
            $lines[] = 'Campaign name: '.$payload['campaign_name'];
        }

        if (! empty($payload['campaign_objective'] ?? null)) {
            $lines[] = 'Campaign objective: '.$payload['campaign_objective'];
        }

        if (! empty($payload['campaign_target_audience'] ?? null)) {
            $lines[] = 'Campaign target audience: '.$payload['campaign_target_audience'];
        }

        if (! empty($payload['tagline'] ?? null)) {
            $lines[] = 'Tagline: '.$payload['tagline'];
        }

        if (! empty($payload['notes'] ?? null)) {
            $lines[] = 'Additional notes: '.$payload['notes'];
        }

        if (! empty($business->brandKit)) {
            $brandKit = $business->brandKit;
            $colorLines = [];

            if (! empty($brandKit->primary_color)) {
                $colorLines[] = 'Primary: '.$brandKit->primary_color;
            }
            if (! empty($brandKit->secondary_color)) {
                $colorLines[] = 'Secondary: '.$brandKit->secondary_color;
            }
            if (! empty($brandKit->accent_color)) {
                $colorLines[] = 'Accent: '.$brandKit->accent_color;
            }

            if (! empty($colorLines)) {
                $lines[] = 'Brand colors: '.implode('; ', $colorLines);
            }

            if (! empty($brandKit->typography)) {
                $lines[] = 'Typography: '.$brandKit->typography;
            }

            $visualPreferences = $brandKit->visual_preferences;
            if (is_array($visualPreferences)) {
                $visualPreferences = implode(', ', $visualPreferences);
            }

            $lines[] = 'Brand guidelines: '.($brandKit->brand_guidelines ?: 'Follow brand consistency');
            $lines[] = 'Visual preferences: '.($visualPreferences ?: 'Clean, modern layout');
        }

        return implode("\n", $lines);
    }
}
