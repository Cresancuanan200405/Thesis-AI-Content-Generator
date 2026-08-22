<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GeminiImageService
{
    /**
     * Generate a marketing image asset using Gemini AI based on studio input.
     *
     * @param  array{
     *     product_name?: string|null,
     *     product_description?: string|null,
     *     product_category?: string|null,
     *     campaign_name?: string|null,
     *     campaign_objective?: string|null,
     *     tagline?: string|null,
     *     brand_tone?: string|array<int, string>|null,
     *     visual_theme?: string|array<int, string>|null,
     *     event_name?: string|null,
     *     price?: string|float|int|null,
     *     include_logo?: bool|null,
     *     business_name?: string|null,
     *     aspect_ratio?: string|null,
     *     reference_image_path?: string|null,
     * }  $options
     * @return string Relative storage path in public disk
     */
    public function generate(string $prompt, array $options = []): string
    {
        @set_time_limit(120);
        @ini_set('max_execution_time', '120');

        $apiKey = config('services.gemini.api_key');

        if (blank($apiKey)) {
            Log::warning('Gemini API key is not configured. Falling back to local visual generator.');

            return app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
        }

        // -----------------------------------------------------------------
        // Attempt 1: Gemini Real Raster Image Generation (paid-tier)
        // -----------------------------------------------------------------
        $imagePath = $this->tryDirectRasterImageGeneration($apiKey, $prompt, $options);
        if ($imagePath !== null) {
            return $imagePath;
        }

        // -----------------------------------------------------------------
        // Attempt 2: Advanced Photorealistic SVG via Gemini Text Model
        // -----------------------------------------------------------------
        $aiVisualPath = $this->tryAdvancedSvgGeneration($apiKey, $prompt, $options);
        if ($aiVisualPath !== null) {
            return $aiVisualPath;
        }

        // -----------------------------------------------------------------
        // Fallback: Local mockup
        // -----------------------------------------------------------------
        return app(MockupImageService::class)->generate(array_merge($options, ['prompt' => $prompt]));
    }

    /**
     * Attempt real raster image generation using Gemini image models.
     * Requires a paid-tier API key. Gracefully skips on quota errors.
     */
    protected function tryDirectRasterImageGeneration(string $apiKey, string $prompt, array $options): ?string
    {
        $imageModels = [
            'gemini-3.1-flash-lite-image',
            'gemini-3.1-flash-image',
            'gemini-3-pro-image',
            'gemini-2.5-flash-image',
        ];

        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $fullPrompt = $this->buildPhotoRealisticPrompt($prompt, $options);

        $parts = [];

        // Include reference image if available (multimodal)
        $refPath = $options['reference_image_path'] ?? null;
        if ($refPath && Storage::disk('public')->exists($refPath)) {
            $refBytes = Storage::disk('public')->get($refPath);
            if ($refBytes) {
                $refExt = strtolower(pathinfo($refPath, PATHINFO_EXTENSION));
                $mime = match ($refExt) {
                    'jpg', 'jpeg' => 'image/jpeg',
                    'webp' => 'image/webp',
                    'png' => 'image/png',
                    default => null,
                };
                if ($mime !== null) {
                    $parts[] = [
                        'inlineData' => [
                            'mimeType' => $mime,
                            'data' => base64_encode($refBytes),
                        ],
                    ];
                }
            }
        }

        $parts[] = ['text' => $fullPrompt];

        foreach ($imageModels as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

                $response = Http::withHeaders([
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                    ->timeout(55)
                    ->post($url, [
                        'contents' => [['parts' => $parts]],
                        'generationConfig' => [
                            'responseModalities' => ['IMAGE', 'TEXT'],
                        ],
                    ]);

                if ($response->status() === 429) {
                    // Quota exhausted for this model — try next
                    Log::debug("Gemini image model {$model} quota exhausted, trying next.");

                    continue;
                }

                if ($response->successful()) {
                    $responseParts = $response->json('candidates.0.content.parts') ?? [];
                    foreach ($responseParts as $part) {
                        if (! empty($part['inlineData']['data'])) {
                            $mimeType = $part['inlineData']['mimeType'] ?? 'image/png';
                            $ext = (str_contains($mimeType, 'jpeg') || str_contains($mimeType, 'jpg')) ? 'jpg' : 'png';
                            $imageBytes = base64_decode($part['inlineData']['data'], true);

                            if ($imageBytes !== false && strlen($imageBytes) > 1000) {
                                $dateFolder = now()->format('Y/m/d');
                                $filename = 'generated-images/'.$dateFolder.'/'.Str::uuid()->toString().'.'.$ext;
                                Storage::disk('public')->put($filename, $imageBytes);
                                Log::info("Gemini raster image generated with {$model}: {$filename}");

                                return $filename;
                            }
                        }
                    }
                }
            } catch (Exception $e) {
                Log::debug("Gemini image model {$model} error: ".$e->getMessage());
            }
        }

        return null;
    }

    /**
     * Build a comprehensive photorealistic image generation prompt from all studio inputs.
     * Used for both raster image models and as context for SVG generation.
     */
    protected function buildPhotoRealisticPrompt(string $userPrompt, array $options): string
    {
        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';
        $productCat = $options['product_category'] ?? '';
        $campaignName = $options['campaign_name'] ?? '';
        $campaignObj = $options['campaign_objective'] ?? '';
        $eventName = $options['event_name'] ?? '';
        $rawPrice = $options['price'] ?? '';
        $price = ! empty($rawPrice) ? '₱'.number_format((float) preg_replace('/[^0-9.]/', '', (string) $rawPrice), 2) : '';
        $brandTone = is_array($options['brand_tone'] ?? null)
            ? implode(', ', $options['brand_tone'])
            : (string) ($options['brand_tone'] ?? 'Modern, Premium');
        $visualTheme = is_array($options['visual_theme'] ?? null)
            ? implode(', ', $options['visual_theme'])
            : (string) ($options['visual_theme'] ?? 'Product-focused');
        $tagline = $options['tagline'] ?? '';
        $businessName = $options['business_name'] ?? '';
        $businessIndustry = $options['business_industry'] ?? '';
        $businessDesc = $options['business_description'] ?? '';
        $targetAudience = $options['business_target_audience'] ?? '';
        $usp = $options['business_usp'] ?? '';
        $productImageUrl = $options['product_image_url'] ?? '';

        $priceText = $price ? ", price {$price}" : '';
        $eventText = $eventName ? " for {$eventName}" : '';
        $taglineText = $tagline ? ", tagline: \"{$tagline}\"" : '';
        $brandText = $businessName ? ", brand: {$businessName}" : '';
        $industryText = $businessIndustry ? " (industry: {$businessIndustry})" : '';
        $uspText = $usp ? " USP: {$usp}." : '';
        $audienceText = $targetAudience ? " Target audience: {$targetAudience}." : '';
        $refNote = $productImageUrl ? ' Use the provided reference product image to understand the product packaging, colors, and branding.' : '';

        $includeLogo = (bool) ($options['include_logo'] ?? false);

        return "Professional commercial advertising photograph: {$productName}{$brandText}{$industryText}{$eventText}{$taglineText}{$priceText}. "
            ."Product category: {$productCat}. {$productDesc}. {$uspText}{$audienceText}"
            ."{$userPrompt}. "
            ."Brand tone: {$brandTone}. Visual style: {$visualTheme}. Campaign: {$campaignName} - {$campaignObj}. "
            ."Business context: {$businessDesc}."
            .$refNote
            .($includeLogo ? ' Include the brand logo subtly in the top-left corner of the image, well-balanced with generous padding, like a professional print advertisement watermark. The logo must not obstruct the main product or typography.' : '')
            .' Ultra-realistic studio product photography, dramatic cinematic lighting, floating particles or product elements,'
            .' premium advertising composition, sharp detail, 8K resolution, award-winning commercial photography quality,'
            .' dark moody background with vibrant accent lighting.'
            .' The image should look like a professional advertisement from a world-class creative agency.';
    }

    /**
     * Advanced SVG generation using Gemini text model.
     * Produces photorealistic-looking SVG compositions using SVG filters, gradients,
     * perspective, and intricate layout matching the product category and brand tone.
     */
    protected function tryAdvancedSvgGeneration(string $apiKey, string $prompt, array $options): ?string
    {
        $flashModels = [
            'gemini-3.1-flash-lite',
            'gemini-3.6-flash',
            'gemini-3.5-flash',
            'gemini-3.7-flash',
        ];

        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        [$viewWidth, $viewHeight] = match ($aspectRatio) {
            '9:16' => [1080, 1920],
            '16:9' => [1920, 1080],
            '4:5' => [1080, 1350],
            '4:3' => [1200, 900],
            default => [1024, 1024],
        };

        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';
        $productCat = $options['product_category'] ?? '';
        $eventName = $options['event_name'] ?? '';
        $rawPrice = $options['price'] ?? '';
        $price = ! empty($rawPrice) ? '₱'.number_format((float) preg_replace('/[^0-9.]/', '', (string) $rawPrice), 2) : '';
        $brandTone = is_array($options['brand_tone'] ?? null)
            ? implode(', ', $options['brand_tone'])
            : (string) ($options['brand_tone'] ?? 'Modern, Premium');
        $visualTheme = is_array($options['visual_theme'] ?? null)
            ? implode(', ', $options['visual_theme'])
            : (string) ($options['visual_theme'] ?? 'Product-focused, Commercial');
        $tagline = $options['tagline'] ?? '';
        $businessName = $options['business_name'] ?? '';
        $businessIndustry = $options['business_industry'] ?? '';
        $businessDesc = $options['business_description'] ?? '';
        $targetAudience = $options['business_target_audience'] ?? '';
        $usp = $options['business_usp'] ?? '';
        $includeLogo = (bool) ($options['include_logo'] ?? false);
        $campaignName = $options['campaign_name'] ?? '';
        $campaignObj = $options['campaign_objective'] ?? '';
        $productImageUrl = $options['product_image_url'] ?? '';
        $hasReferenceImage = ! empty($options['reference_image_path']) || ! empty($productImageUrl);

        // Detect color palette from brand tone and category
        $colorPalette = $this->deriveColorPalette($brandTone, $productCat, $eventName);

        // Build onboarding context lines
        $onboardingContext = '';
        if ($businessIndustry || $businessDesc || $targetAudience || $usp) {
            $onboardingContext = "\n=== BRAND & BUSINESS CONTEXT (from Onboarding) ===\n";
            if ($businessIndustry) {
                $onboardingContext .= "Industry: \"{$businessIndustry}\"\n";
            }
            if ($businessDesc) {
                $onboardingContext .= "Business Description: \"{$businessDesc}\"\n";
            }
            if ($targetAudience) {
                $onboardingContext .= "Target Audience: \"{$targetAudience}\"\n";
            }
            if ($usp) {
                $onboardingContext .= "Unique Selling Proposition: \"{$usp}\"\n";
            }
        }

        $refImageNote = $hasReferenceImage
            ? "\n⚠️ REFERENCE IMAGE PROVIDED: A product/reference image has been attached. You MUST use it to:\n"
                ."  - Match the product packaging shape, colors, and branding EXACTLY as shown in the reference.\n"
                ."  - Recreate the product in your SVG illustration using the visual details from the image.\n"
                ."  - The product illustration in your SVG must visually match the reference image composition.\n"
            : '';

        $systemPrompt = <<<SYSTEM_PROMPT
You are a world-class AI Art Director and Creative Director at a top-tier advertising agency (think Ogilvy, BBDO, Wieden+Kennedy).
Your specialization is creating STUNNING, PHOTOREALISTIC-LOOKING marketing visuals in SVG format that rival agency-quality print and digital advertisements.

Reference quality: Think cinematic product photography like Nike Air Jordan ads, Coca-Cola holiday campaigns, Lay's product shots with exploding chips, Apple product launch visuals.

=== CAMPAIGN BRIEF ===
Product: "{$productName}"
Category: "{$productCat}"
Description: "{$productDesc}"
Event/Occasion: "{$eventName}"
Campaign: "{$campaignName}" — Objective: "{$campaignObj}"
Tagline: "{$tagline}"
Price: "{$price}"
Brand: "{$businessName}"
Brand Tone: "{$brandTone}"
Visual Style: "{$visualTheme}"
Creative Direction: "{$prompt}"
{$onboardingContext}{$refImageNote}
=== CANVAS ===
viewBox="0 0 {$viewWidth} {$viewHeight}" width="{$viewWidth}" height="{$viewHeight}"
Aspect ratio: {$aspectRatio}

=== COLOR PALETTE GUIDANCE ===
Primary colors: {$colorPalette['primary']}
Accent colors: {$colorPalette['accent']}
Background mood: {$colorPalette['background']}

=== CRITICAL TECHNICAL REQUIREMENTS ===

1. OUTPUT: Return ONLY the raw `<svg ...>...</svg>` markup. NO markdown, NO backticks, NO explanations whatsoever.

2. PHOTOREALISTIC TECHNIQUES — use ALL of these SVG techniques to create depth and realism:

   LIGHTING & ATMOSPHERE:
   - Use `<feDiffuseLighting>` and `<feSpecularLighting>` filters for realistic 3D lighting on product surfaces
   - Add `<feGaussianBlur>` for depth-of-field blur effects on background elements
   - Create dramatic spotlight beams with angled linear gradients at low opacity (0.05-0.2)
   - Add volumetric glow halos with large radial gradients (stop-opacity 0.3 → 0)
   - Layer multiple overlapping glow effects at different scales for depth

   PRODUCT REPRESENTATION:
   - Create a detailed, dimensional product illustration that clearly represents the product category: "{$productCat}"
   - If a reference image was attached, replicate the product's visual appearance faithfully: shape, colors, logo placement, packaging style
   - Use perspective transforms with `transform="skewX(-5) skewY(2)"` for 3D depth
   - Add surface reflections as semi-transparent white gradients (opacity 0.05-0.15)
   - Show packaging, texture, and brand elements with multiple layered shapes and rounded corners
   - Use `<feTurbulence>` filter for realistic texture on packaging surfaces
   - Add realistic drop shadows with `<feDropShadow>` or `<feGaussianBlur>` + offset rect

   DRAMATIC BACKGROUND:
   - Multi-layer background: base color → mid-tone radial glow → dark vignette overlay
   - Scattered particle effects: small circles (r=2-8, opacity 0.3-0.7) at varied positions
   - Geometric accent shapes (diagonal lines, angular frames) at very low opacity (0.05-0.1)
   - Ground reflection/surface using a semi-transparent gradient rect at the bottom

   TYPOGRAPHY HIERARCHY (professional ad layout):
   - HEADLINE (product name): font-size="7%" of canvas height, font-weight="900", letter-spacing="0.05em"
   - Use gradient fills on headline text via `<linearGradient>` referenced with `fill="url(#textGrad)"`
   - SUBHEADLINE (tagline): font-size="3%" font-style="italic" font-weight="500" letter-spacing="0.1em"
   - TARGET AUDIENCE note: tailor design aesthetics for: "{$targetAudience}"
   - USP HIGHLIGHT: if space allows, add a small accent line with the USP: "{$usp}"
   - EVENT BADGE: pill-shaped `<rect rx="999">` with gradient fill, drop shadow, uppercase text
   - PRICE CTA: high-contrast badge with contrasting border, bold price text + "ORDER NOW" / "SHOP NOW"
   - Brand watermark (top corner): business name "{$businessName}" in small elegant text

   FLOATING ELEMENTS (dynamic energy):
   - Scattered product-related particles (chips, coffee beans, bubbles, petals based on category)
   - 5-12 floating accent shapes at varied sizes, rotations, and opacities (0.4-0.9)
   - Motion blur lines suggesting movement using `<line>` with low opacity

3. LAYOUT STRUCTURE (top to bottom for {$aspectRatio}):
   - Top 15%: Event badge + brand name
   - Top 20-50%: Product illustration (centered, large, dominating)
   - Middle: Headline typography
   - Lower section: Tagline + USP + price CTA
   - Very bottom: Subtle decorative line / footer accent

4. QUALITY RULES:
   - ALL text must use: font-family="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
   - Text that goes outside bounds MUST use clipPath to prevent overflow
   - Minimum 2 `<defs>` filter definitions for visual realism
   - Minimum 4 gradient definitions (background, product, text, CTA)
   - The visual MUST fill the entire {$viewWidth}x{$viewHeight} canvas completely
   - No blank/empty space — every area should have visual interest
SYSTEM_PROMPT;

        // Add logo placement instructions when the user has opted in
        if ($includeLogo) {
            $systemPrompt .= <<<'LOGO_PROMPT'

=== BRAND LOGO PLACEMENT (MANDATORY — user enabled "Include Brand Logo") ===
A brand logo image has been provided as a reference. You MUST incorporate the brand logo into the visual:
   - POSITION: Place the logo in the TOP-LEFT corner of the design, with generous padding (5-8% from edges).
   - SIZE: The logo should be proportional — roughly 8-12% of the canvas width. Never make it too large or obtrusive.
   - STYLE: Render it as a small, elegant brand mark. If the logo is text-based, use the brand name in a refined typeface.
   - CONTRAST: Ensure the logo contrasts clearly against the background. Add a subtle drop shadow or a semi-transparent backdrop pill (rounded rect) behind it if needed.
   - BALANCE: The logo must feel naturally integrated — like a professional print ad watermark, not a pasted sticker.
   - DO NOT place the logo over the main product illustration or key typography.
LOGO_PROMPT;
        }

        // Build parts — inject reference images (product catalog or uploaded) + logo
        $parts = [];

        // Helper to push an image from the public disk into multimodal parts
        $pushImage = function (string $diskPath) use (&$parts): void {
            if (! Storage::disk('public')->exists($diskPath)) {
                return;
            }
            $bytes = Storage::disk('public')->get($diskPath);
            if (! $bytes) {
                return;
            }
            $ext = strtolower(pathinfo($diskPath, PATHINFO_EXTENSION));
            $mime = match ($ext) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                'png' => 'image/png',
                default => null,
            };
            if ($mime !== null) {
                $parts[] = ['inlineData' => ['mimeType' => $mime, 'data' => base64_encode($bytes)]];
            }
        };

        // 1. Reference image (uploaded file or product catalog image)
        $refPath = $options['reference_image_path'] ?? null;
        if ($refPath) {
            $pushImage($refPath);
        }

        // 2. Business logo (if "include_logo" is enabled and logo_path is set)
        $logoPath = $options['logo_path'] ?? null;
        if ($logoPath) {
            $pushImage($logoPath);
        }

        $parts[] = ['text' => $systemPrompt];

        foreach ($flashModels as $model) {
            try {
                $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

                $response = Http::withHeaders([
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                    ->timeout(25)
                    ->post($url, [
                        'contents' => [['parts' => $parts]],
                        'generationConfig' => [
                            'temperature' => 0.5,
                            'maxOutputTokens' => 8192,
                        ],
                    ]);

                if ($response->status() === 429) {
                    Log::debug("Gemini SVG model {$model} quota exhausted, trying next.");

                    continue;
                }

                if ($response->successful()) {
                    $rawText = $response->json('candidates.0.content.parts.0.text') ?? '';

                    // Extract SVG content — match the full SVG block
                    if (preg_match('/<svg[\s\S]*?<\/svg>/i', $rawText, $matches)) {
                        $svgContent = trim($matches[0]);

                        // Validate minimum quality: must have defs, filters, or gradients
                        if (strlen($svgContent) < 800) {
                            Log::debug("Gemini SVG from {$model} too small ({".strlen($svgContent).'} chars), retrying.');

                            continue;
                        }

                        $dateFolder = now()->format('Y/m/d');
                        $filename = 'generated-images/'.$dateFolder.'/'.Str::uuid()->toString().'.svg';

                        Storage::disk('public')->put($filename, $svgContent);
                        Log::info("Advanced SVG visual generated with Gemini ({$model}), size=".strlen($svgContent).": {$filename}");

                        return $filename;
                    }
                }
            } catch (Exception $e) {
                Log::debug("Gemini SVG generation on {$model} failed: ".$e->getMessage());
            }
        }

        return null;
    }

    /**
     * Derive a color palette matching the brand tone, product category, and event.
     *
     * @return array{primary: string, accent: string, background: string}
     */
    protected function deriveColorPalette(string $brandTone, string $category, string $event): array
    {
        $tone = strtolower($brandTone);
        $cat = strtolower($category);
        $evt = strtolower($event);

        // Event-driven overrides
        if (str_contains($evt, 'christmas') || str_contains($evt, 'noel')) {
            return ['primary' => '#C41E3A, #2D6A2D', 'accent' => '#FFD700, #FFFFFF', 'background' => 'deep forest green to crimson'];
        }
        if (str_contains($evt, 'valentine') || str_contains($evt, 'love')) {
            return ['primary' => '#E91E63, #FF4081', 'accent' => '#FFB6C1, #FFFFFF', 'background' => 'deep rose to burgundy'];
        }
        if (str_contains($evt, 'summer') || str_contains($evt, 'beach')) {
            return ['primary' => '#FF6B35, #F7C59F', 'accent' => '#00B4D8, #FFD600', 'background' => 'warm sunset gradient'];
        }
        if (str_contains($evt, 'halloween')) {
            return ['primary' => '#FF6B1A, #1A1A2E', 'accent' => '#FF9900, #8B5CF6', 'background' => 'deep black to dark purple'];
        }
        if (str_contains($evt, 'pasko') || str_contains($evt, 'fiesta') || str_contains($evt, 'philippines')) {
            return ['primary' => '#0038A8, #FCD116', 'accent' => '#CE1126, #FFFFFF', 'background' => 'deep blue to navy'];
        }

        // Brand tone driven
        if (str_contains($tone, 'luxury') || str_contains($tone, 'premium') || str_contains($tone, 'elegant')) {
            return ['primary' => '#C9A84C, #1A1A2E', 'accent' => '#F5E6C8, #FFFFFF', 'background' => 'rich near-black to deep navy'];
        }
        if (str_contains($tone, 'bold') || str_contains($tone, 'energetic') || str_contains($tone, 'vibrant')) {
            return ['primary' => '#FF3D00, #D50000', 'accent' => '#FFD600, #FFFFFF', 'background' => 'deep charcoal to dark red'];
        }
        if (str_contains($tone, 'warm') || str_contains($tone, 'friendly') || str_contains($tone, 'playful')) {
            return ['primary' => '#FF7043, #FF5722', 'accent' => '#FFD54F, #FFFFFF', 'background' => 'warm deep amber to brown'];
        }
        if (str_contains($tone, 'fresh') || str_contains($tone, 'natural') || str_contains($tone, 'organic')) {
            return ['primary' => '#2E7D32, #1B5E20', 'accent' => '#A5D6A7, #F1F8E9', 'background' => 'deep forest green'];
        }
        if (str_contains($tone, 'minimal') || str_contains($tone, 'clean') || str_contains($tone, 'modern')) {
            return ['primary' => '#212121, #424242', 'accent' => '#00BCD4, #FFFFFF', 'background' => 'near black to dark slate'];
        }

        // Category-driven fallback
        if (str_contains($cat, 'food') || str_contains($cat, 'snack') || str_contains($cat, 'chip')) {
            return ['primary' => '#BF360C, #E64A19', 'accent' => '#FFB300, #FFECB3', 'background' => 'dark charcoal to deep brown'];
        }
        if (str_contains($cat, 'beverage') || str_contains($cat, 'drink') || str_contains($cat, 'coffee')) {
            return ['primary' => '#3E2723, #5D4037', 'accent' => '#D4AF37, #FFF8E1', 'background' => 'deep espresso brown'];
        }
        if (str_contains($cat, 'beauty') || str_contains($cat, 'skincare') || str_contains($cat, 'cosmetic')) {
            return ['primary' => '#880E4F, #AD1457', 'accent' => '#F8BBD9, #FCE4EC', 'background' => 'deep mauve to dark rose'];
        }
        if (str_contains($cat, 'fashion') || str_contains($cat, 'clothing') || str_contains($cat, 'apparel')) {
            return ['primary' => '#1A237E, #283593', 'accent' => '#FFFFFF, #C5CAE9', 'background' => 'deep midnight blue'];
        }
        if (str_contains($cat, 'tech') || str_contains($cat, 'electronics') || str_contains($cat, 'gadget')) {
            return ['primary' => '#0D47A1, #1565C0', 'accent' => '#00E5FF, #FFFFFF', 'background' => 'deep space black'];
        }

        // Default: modern dark premium
        return ['primary' => '#1A1A2E, #16213E', 'accent' => '#E94560, #FFFFFF', 'background' => 'ultra-dark midnight gradient'];
    }
}
