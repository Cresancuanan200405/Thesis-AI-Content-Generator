<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MockupImageService
{
    /**
     * Generate an SVG mockup visual and store it in public disk.
     *
     * @param  array{
     *     product_name: string,
     *     tagline?: string|null,
     *     brand_tone?: string|array<int, string>|null,
     *     visual_theme?: string|array<int, string>|null,
     *     event_name?: string|null,
     *     price?: string|float|int|null,
     *     include_logo?: bool|null,
     *     business_name?: string|null,
     *     aspect_ratio?: string|null,
     * } $data
     * @return string Relative path in public storage disk
     */
    public function generate(array $data): string
    {
        $productName = htmlspecialchars((string) ($data['product_name'] ?? 'Marketing Asset'), ENT_QUOTES, 'UTF-8');
        $tagline = htmlspecialchars((string) ($data['tagline'] ?? ''), ENT_QUOTES, 'UTF-8');
        $eventName = htmlspecialchars((string) ($data['event_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $price = ! empty($data['price']) ? '₱'.number_format((float) $data['price'], 2) : '';

        $tones = is_array($data['brand_tone'] ?? null)
            ? implode(' • ', $data['brand_tone'])
            : (string) ($data['brand_tone'] ?? '');
        $tones = htmlspecialchars($tones, ENT_QUOTES, 'UTF-8');

        $themes = is_array($data['visual_theme'] ?? null)
            ? implode(' • ', $data['visual_theme'])
            : (string) ($data['visual_theme'] ?? 'AI Powered');
        $businessName = htmlspecialchars((string) ($data['business_name'] ?? 'AI MARKETING AUTOMATION'), ENT_QUOTES, 'UTF-8');
        $brandWatermark = 'BUSINESS: '.$businessName;

        $aspectRatio = (string) ($data['aspect_ratio'] ?? '1:1');

        [$width, $height, $cardX, $cardY, $cardW, $cardH, $boxX, $boxY, $boxW, $boxH, $boxCx, $bottomY] = match ($aspectRatio) {
            '9:16' => [1080, 1920, 72, 96, 936, 1728, 120, 360, 840, 1180, 420, 1620],
            '16:9' => [1920, 1080, 96, 72, 1728, 936, 180, 190, 1560, 580, 780, 840],
            '4:5' => [1080, 1350, 72, 80, 936, 1190, 120, 240, 840, 780, 420, 1100],
            '4:3' => [1200, 900, 72, 60, 1056, 780, 132, 170, 936, 490, 468, 710],
            default => [1024, 1024, 72, 72, 880, 880, 132, 210, 760, 520, 380, 790],
        };

        $uniqueId = Str::uuid()->toString();
        $filename = 'designs/mockup_'.$uniqueId.'.svg';

        $eventBadgeMarkup = $eventName !== '' ? <<<EVENT
        <g transform="translate({$cardW} - 220, {$cardY} + 36)">
            <rect x="0" y="0" width="200" height="36" rx="18" fill="rgba(236, 72, 153, 0.15)" stroke="rgba(236, 72, 153, 0.3)" stroke-width="1"/>
            <text x="100" y="23" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#fbcfe8">{$eventName}</text>
        </g>
EVENT : '';

        $taglineMarkup = $tagline !== '' ? <<<TAGLINE
        <text x="{$boxCx}" y="280" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#94a3b8">
            "{$tagline}"
        </text>
TAGLINE : '';

        $priceMarkup = $price !== '' ? <<<PRICE
        <text x="{$boxCx}" y="350" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="700" fill="#38bdf8">
            {$price}
        </text>
PRICE : '';

        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$width} {$height}" width="{$width}" height="{$height}">
    <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="50%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#311042"/>
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.08)"/>
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.02)"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="50%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
        <radialGradient id="glow1" cx="20%" cy="20%" r="60%">
            <stop offset="0%" stop-color="rgba(99, 102, 241, 0.35)"/>
            <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <radialGradient id="glow2" cx="80%" cy="80%" r="60%">
            <stop offset="0%" stop-color="rgba(236, 72, 153, 0.25)"/>
            <stop offset="100%" stop-color="transparent"/>
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
        </pattern>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000" flood-opacity="0.5"/>
        </filter>
    </defs>

    <!-- Background -->
    <rect width="{$width}" height="{$height}" fill="url(#bgGrad)"/>
    <rect width="{$width}" height="{$height}" fill="url(#glow1)"/>
    <rect width="{$width}" height="{$height}" fill="url(#glow2)"/>
    <rect width="{$width}" height="{$height}" fill="url(#grid)"/>

    <!-- Decorative Top Bar -->
    <rect x="0" y="0" width="{$width}" height="8" fill="url(#accentGrad)"/>

    <!-- Main Content Container -->
    <rect x="{$cardX}" y="{$cardY}" width="{$cardW}" height="{$cardH}" rx="32" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="1.5" filter="url(#shadow)"/>

    <!-- Top Badge -->
    <g transform="translate({$cardX} + 40, {$cardY} + 36)">
        <rect x="0" y="0" width="220" height="36" rx="18" fill="rgba(99, 102, 241, 0.2)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1"/>
        <circle cx="18" cy="18" r="4" fill="#a855f7"/>
        <text x="32" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#c7d2fe" letter-spacing="1.5">MARKETING DESIGN</text>
    </g>

    {$eventBadgeMarkup}

    <!-- Center Product Visual Card -->
    <g transform="translate({$boxX}, {$boxY})">
        <!-- Inner Graphic Box -->
        <rect x="0" y="0" width="{$boxW}" height="{$boxH}" rx="24" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>

        <!-- Abstract Decorative Shapes inside Card -->
        <circle cx="{$boxW} - 140" cy="120" r="160" fill="url(#glow2)"/>
        <circle cx="140" cy="{$boxH} - 120" r="140" fill="url(#glow1)"/>

        <!-- Center Icon / Sparkle -->
        <g transform="translate({$boxCx} - 25, 110)">
            <rect x="0" y="0" width="50" height="50" rx="14" fill="url(#accentGrad)"/>
            <path d="M 25 14 L 27 22 L 35 25 L 27 28 L 25 36 L 23 28 L 15 25 L 23 22 Z" fill="#ffffff"/>
        </g>

        <!-- Product Name -->
        <text x="{$boxCx}" y="220" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="#ffffff" letter-spacing="-0.5">
            {$productName}
        </text>

        {$taglineMarkup}

        {$priceMarkup}

        <!-- Theme & Style Badges -->
        <g transform="translate({$boxCx}, {$boxH} - 70)">
            <text x="0" y="0" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#a5b4fc" letter-spacing="1">
                STYLE: {$themes} • RATIO: {$aspectRatio}
            </text>
        </g>
    </g>

    <!-- Bottom Footer Meta -->
    <g transform="translate({$cardX} + 40, {$bottomY})">
        <text x="0" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#64748b">
            BRAND TONE: <tspan fill="#cbd5e1" font-weight="600">{$tones}</tspan>
        </text>
        <text x="{$cardW} - 80" y="40" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#a855f7">
            {$brandWatermark}
        </text>
    </g>
</svg>
SVG;

        Storage::disk('public')->put($filename, $svg);

        return $filename;
    }
}
