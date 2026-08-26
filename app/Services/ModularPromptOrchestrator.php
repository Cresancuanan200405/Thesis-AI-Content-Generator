<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Str;

class ModularPromptOrchestrator
{
    /**
     * Build a structured, modular prompt respecting strict priority rules.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function orchestrate(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $modules = [];

        // ---------------------------------------------------------------------
        // ROOT OBJECTIVE
        // ---------------------------------------------------------------------
        $modules[] = 'CREATE: A professional commercial marketing advertisement.';

        // ---------------------------------------------------------------------
        // PRIORITY 1: PRIMARY PRODUCT IMAGE & PRODUCT PRESERVATION MODULE
        // ---------------------------------------------------------------------
        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';

        $hasImageInput = ! empty($options['reference_image_path']) || ! empty($options['product_image_url']);

        if ($hasImageInput) {
            $modules[] = "PRIMARY PRODUCT IMAGE:\nUse the supplied catalog product image as the primary visual source of truth for {$productName}.";
            $modules[] = "PRODUCT PRESERVATION:\nPreserve the recognizable identity of the actual supplied product, including when applicable: shape, proportions, container, glassware, packaging, labels, visible branding, colors, distinctive textures, liquid layers, toppings, and physical accessories. Do not reconstruct or invent a replacement product. Creative changes should primarily affect the environment, lighting, atmosphere, background, props, composition, and campaign presentation surrounding the product.";
        } else {
            $modules[] = "PRODUCT:\n{$productName}".($productDesc ? " — {$productDesc}" : '');
        }

        // Supporting Product Metadata (Vision analysis) — Supplemental only
        if (! empty($visionBlueprint['product_identity'])) {
            $modules[] = "SUPPORTING PRODUCT METADATA (SUPPLEMENTAL):\n• Observed Characteristics: {$visionBlueprint['product_identity']}\n• IMPORTANT: The supplied product image is the primary visual source of truth. Supporting product metadata is supplemental and must not override, replace, reinterpret, or contradict the supplied product image.";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 2: MARKETING CONTENT MODULE (EXACT USER CONTENT)
        // ---------------------------------------------------------------------
        $contentLines = [];
        $contentLines[] = "• Product Name: {$productName}";

        if (! empty($options['price'])) {
            $rawPrice = trim((string) $options['price']);
            $contentLines[] = "• Price: {$rawPrice} (exact price value, maintain exact currency symbol and digits)";
        }

        if (! empty($options['tagline'])) {
            $rawTagline = trim((string) $options['tagline']);
            $contentLines[] = "• Tagline: \"{$rawTagline}\" (exact user tagline, do not alter or paraphrase)";
        }

        $modules[] = "MARKETING CONTENT:\n".implode("\n", $contentLines);

        // ---------------------------------------------------------------------
        // PRIORITY 3: CAMPAIGN MODULE
        // ---------------------------------------------------------------------
        if (! empty($options['campaign_name']) || ! empty($options['campaign_objective'])) {
            $campLines = [];
            if (! empty($options['campaign_name'])) {
                $campLines[] = "• Campaign: {$options['campaign_name']}";
            }
            if (! empty($options['campaign_objective'])) {
                $campLines[] = "• Goal: {$options['campaign_objective']}";
            }
            $modules[] = "CAMPAIGN:\n".implode("\n", $campLines);
        }

        // ---------------------------------------------------------------------
        // PRIORITY 4: EVENT / PHILIPPINE HOLIDAY MODULE (STRUCTURED DIRECTION)
        // ---------------------------------------------------------------------
        if (! empty($options['event_name'])) {
            $eventDirection = $this->resolveStructuredEventDirection($options['event_name'], $productName);
            $modules[] = "EVENT DIRECTION:\n{$eventDirection}";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 5: BRAND IDENTITY & BRAND TONE MODULE
        // ---------------------------------------------------------------------
        $brandName = $options['business_name'] ?? $business?->name;
        $industry = $options['business_industry'] ?? $business?->industry;
        if ($brandName) {
            $modules[] = "BRAND IDENTITY:\n{$brandName}".($industry ? " ({$industry})" : '');
        }

        $brandTone = $options['brand_tone'] ?? [];
        if (is_string($brandTone)) {
            $brandTone = explode(',', $brandTone);
        }
        $brandTone = array_filter((array) $brandTone);
        if (! empty($brandTone)) {
            $toneDesc = implode(', ', $brandTone);
            $modules[] = "BRAND TONE:\n{$toneDesc} (calibrate visual personality and lighting mood without overriding product fidelity)";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 6: RENDER STYLE MODULE (EXACTLY ONE ACTIVE STYLE)
        // ---------------------------------------------------------------------
        $renderStyle = $options['render_style'] ?? 'Studio Product Still';
        $renderStyleSpec = $this->resolveRenderStyleSpec($renderStyle);
        $modules[] = "RENDER STYLE:\n{$renderStyleSpec}";

        // ---------------------------------------------------------------------
        // PRIORITY 7: VISUAL THEME MODULE
        // ---------------------------------------------------------------------
        $visualTheme = $options['visual_theme'] ?? [];
        if (is_string($visualTheme)) {
            $visualTheme = explode(',', $visualTheme);
        }
        $visualTheme = array_filter((array) $visualTheme);
        if (! empty($visualTheme)) {
            $themeDesc = implode(', ', $visualTheme);
            $modules[] = "VISUAL THEME:\n{$themeDesc} (enrich background environment with harmonious props)";
        }

        // User explicit visual prompt / scene concept
        if (! empty($options['user_prompt']) && ! Str::contains($options['user_prompt'], 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
            $modules[] = "USER VISUAL PROMPT:\n{$options['user_prompt']}";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 8: COMPOSITION & SAFE MARGINS
        // ---------------------------------------------------------------------
        $compLines = [
            '• Keep the supplied product visually dominant with realistic contact shadows and natural environmental integration.',
            '• Maintain visual hierarchy: Product as primary focal centerpiece, environmental styling and props subordinate.',
            '• Leave appropriate negative space in the upper quadrant and margins for application-rendered typography, price callout, and branding.',
            '• Safe Margin: Adhere strictly to 20% safe-margin breathing room along canvas borders.',
        ];

        if (! empty($options['include_logo']) && $brandName) {
            $compLines[] = "• Leave clear negative space in the upper safe area for the authentic \"{$brandName}\" logo asset.";
        }

        $modules[] = "COMPOSITION & SAFE MARGINS:\n".implode("\n", $compLines);

        // ---------------------------------------------------------------------
        // OUTPUT MODULE & FINAL INSTRUCTION
        // ---------------------------------------------------------------------
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $modules[] = "OUTPUT & SAFETY RULES:\n• Framing: Format intentionally for {$aspectRatio} canvas.\n• Dynamic Safe Margin: Ensure no key elements, product borders, or copy bleed into the outer 20% perimeter.\n• PRIORITY ENFORCEMENT: The supplied catalog product image is the primary visual source of truth. Product preservation overrides lower-priority styling. Do not replace the supplied product with a newly invented product.";

        return implode("\n\n", $modules);
    }

    /**
     * Resolve structured direction for Philippine holidays / commercial events.
     */
    protected function resolveStructuredEventDirection(string $eventName, string $productName): string
    {
        $lower = strtolower($eventName);

        if (Str::contains($lower, ['new year', '1.1'])) {
            return "Event: {$eventName}\n• Mood: Celebratory premium & fresh beginnings\n• Environment: Modern commercial product setting with festive atmosphere\n• Lighting: Bright polished studio lighting with subtle golden highlights\n• Decorative direction: Minimal celebratory ribbons and refined sparkle particles\n• Marketing intent: New Year promotional launch";
        }

        if (Str::contains($lower, ['valentine', '2.2', 'love'])) {
            return "Event: {$eventName}\n• Mood: Romantic, warm & elegant\n• Environment: Intimate lifestyle or polished studio setting\n• Lighting: Soft warm diffused lighting with gentle rosy or amber undertones\n• Decorative direction: Tasteful romantic accents, soft petals or subtle satin textures\n• Marketing intent: Valentine's gifting and special feature";
        }

        if (Str::contains($lower, ['summer', '3.3', '4.4'])) {
            return "Event: {$eventName}\n• Mood: Vibrant, energetic & refreshing\n• Environment: Bright sun-drenched outdoor or modern lifestyle setting\n• Lighting: High-key natural sunlight with crisp natural shadows\n• Decorative direction: Summer breeze, tropical or cool condensation accents\n• Marketing intent: Summer season feature";
        }

        if (Str::contains($lower, ['mother', 'father', '5.5', '6.6'])) {
            return "Event: {$eventName}\n• Mood: Warm, heartwarming & appreciative\n• Environment: Cozy family dining or premium gifting presentation\n• Lighting: Warm golden hour or gentle morning window light\n• Decorative direction: Elegant gift wrapping, subtle floral or rustic accents\n• Marketing intent: Appreciation holiday feature";
        }

        if (Str::contains($lower, ['independence', 'heroes', 'bonifacio', 'rizal', 'kagitingan'])) {
            return "Event: {$eventName}\n• Mood: Proud, vibrant & celebratory Philippine cultural heritage\n• Environment: Contemporary Filipino aesthetic or clean commercial space\n• Lighting: Natural, warm and heroic side illumination\n• Decorative direction: Subtle festive native textures, elegant sunburst or ribbon motifs\n• Marketing intent: National holiday celebration feature";
        }

        if (Str::contains($lower, ['christmas', 'pasko', '12.12', 'ber month', '9.9', '10.10', '11.11'])) {
            return "Event: {$eventName}\n• Mood: Festive, joyful & generous holiday spirit\n• Environment: Warm cozy holiday setting or luxury festive showcase\n• Lighting: Warm ambient bokeh glow and rich holiday lighting\n• Decorative direction: Subtle pine sprigs, golden ornaments, celebratory confetti\n• Marketing intent: Peak holiday mega sale & gifting";
        }

        return "Event: {$eventName}\n• Mood: Festive commercial celebration\n• Environment: Polished commercial product staging\n• Lighting: Clean commercial studio lighting with soft contact shadows\n• Decorative direction: Subtle thematic accents that complement {$productName}\n• Marketing intent: Special event promotion";
    }

    /**
     * Resolve strict specification for the selected render style.
     */
    protected function resolveRenderStyleSpec(string $renderStyle): string
    {
        return match ($renderStyle) {
            'Studio Product Still' => "Studio Product Still\n• Product-focused commercial studio presentation\n• Controlled three-point studio lighting with razor-sharp product clarity\n• Clean neutral or premium backdrop with generous negative space\n• The product is unquestionably the dominant centerpiece",
            'Cinematic Marketing' => "Cinematic Marketing\n• Volumetric atmospheric rim lighting and rich color grading\n• Dramatic editorial depth of field\n• Cinematic visual storytelling with commercial advertising composition\n• The product remains in crystal-clear focus",
            'Lifestyle Capture' => "Lifestyle Capture\n• Realistic authentic contextual environment\n• Natural window sunlight with soft organic shadows\n• Candid lifestyle atmosphere and warm textures\n• The product remains clearly identifiable and prominent",
            'Minimalist Graphic', 'Minimalist Graphic Vec' => "Minimalist Graphic\n• Clean graphic composition with high negative space\n• Bold typography and sharp vector geometry\n• High-contrast color blocking and modern poster aesthetics\n• Product prominence with graphic advertising clarity",
            default => "{$renderStyle}\n• Professional commercial presentation with balanced lighting and clear product focus",
        };
    }
}
