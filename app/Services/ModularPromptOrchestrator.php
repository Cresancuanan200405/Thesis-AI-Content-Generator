<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Str;

class ModularPromptOrchestrator
{
    public function __construct(
        protected ?IndustryCategoryArtDirectionService $artDirectionService = null,
    ) {
        $this->artDirectionService = $artDirectionService ?? app(IndustryCategoryArtDirectionService::class);
    }

    /**
     * Build a structured, modular prompt respecting strict priority rules and aspect-ratio composition profiles.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function orchestrate(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $modules = [];
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';

        // ---------------------------------------------------------------------
        // ROOT OBJECTIVE & ANTI-LOGO MANDATE
        // ---------------------------------------------------------------------
        $modules[] = "CREATE: A professional commercial marketing advertisement.\n• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.";

        // ---------------------------------------------------------------------
        // PRIORITY 1: PRIMARY PRODUCT IMAGE & PRODUCT PRESERVATION MODULE
        // ---------------------------------------------------------------------
        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';
        $category = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? '';

        $hasImageInput = ! empty($options['reference_image_path']) || ! empty($options['product_image_url']);
        $imageModel = $options['image_model'] ?? 'gpt-image-2';
        $isFlagship = $imageModel === 'gpt-image-2';

        if ($hasImageInput) {
            $modules[] = "PRIMARY PRODUCT IMAGE:\nUse the supplied catalog product image as the primary visual source of truth for {$productName}. (REFERENCE PRODUCT PRESERVATION MODE)";

            $preservationInstructions = "PRODUCT PRESERVATION:\nPreserve the recognizable identity of the actual supplied product, including when applicable: shape, proportions, container, glassware, packaging, labels, visible branding, colors, distinctive textures, liquid layers, toppings, and physical accessories. Do not reconstruct or invent a replacement product. Creative changes should primarily affect the environment, lighting, atmosphere, background, props, composition, and campaign presentation surrounding the product.";

            if (! $isFlagship) {
                $preservationInstructions .= "\n• STRICT PRESERVATION RULE: The input image is the immutable physical product. Do NOT redraw, restyle, distort, or re-render the catalog item. Maintain exact container geometry, liquid layering, and label details.";
            }

            $modules[] = $preservationInstructions;
        } else {
            $productInfo = "PRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):\n• Reference Image Available: NO (Generative Commercial Scene Mode)\n• Target Product: {$productName}".($productDesc ? " — {$productDesc}" : '').($category ? " (Category: {$category})" : '')."\n• GENERATIVE SCENE DIRECTIVE: Synthesize an authentic, photorealistic commercial product representation of {$productName} integrated naturally as the centerpiece of a COMPLETE MARKETING ADVERTISEMENT SCENE. Do NOT generate an isolated product cutout or plain empty background. Render the full environment, background, atmospheric lighting, contextual props, and commercial visual storytelling as directed by the creative brief below.";
            $modules[] = $productInfo;
        }

        // Supporting Product Metadata (Vision analysis) — Supplemental only
        if (! empty($visionBlueprint['product_identity'])) {
            $modules[] = "SUPPORTING PRODUCT METADATA (SUPPLEMENTAL):\n• Observed Characteristics: {$visionBlueprint['product_identity']}\n• IMPORTANT: The supplied product image is the primary visual source of truth. Supporting product metadata is supplemental and must not override, replace, reinterpret, or contradict the supplied product image.";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 2: USER SCENE / VISUAL DIRECTION
        // ---------------------------------------------------------------------
        $userScenePrompt = null;
        if (! empty($options['scene_prompt'])) {
            $userScenePrompt = trim((string) $options['scene_prompt']);
        } elseif (! empty($options['image_prompt'])) {
            $userScenePrompt = trim((string) $options['image_prompt']);
        } elseif (! empty($options['user_prompt'])) {
            $raw = trim((string) $options['user_prompt']);
            if (Str::contains($raw, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
                if (preg_match('/• Specific User Instructions:\s*(.+)$/m', $raw, $matches)) {
                    $userScenePrompt = trim($matches[1]);
                }
            } else {
                $userScenePrompt = $raw;
            }
        } elseif (! empty($options['notes'])) {
            $userScenePrompt = trim((string) $options['notes']);
        }

        if (! empty($userScenePrompt) && ! Str::startsWith($userScenePrompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
            $modules[] = "USER SCENE / VISUAL DIRECTION:\n{$userScenePrompt}\n• PRIMARY SCENE INSTRUCTION: Fulfill this specific scene setting, props, environment, and visual atmosphere while keeping {$productName} as the focal centerpiece.";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 3: FINAL MARKETING COPY — MUST APPEAR VISIBLY IN THE IMAGE
        // ---------------------------------------------------------------------
        $includeBusinessName = array_key_exists('include_business_name', $options)
            ? (bool) $options['include_business_name']
            : (! array_key_exists('business_name', $options) || ! empty($options['business_name']));

        $brandName = null;
        if ($includeBusinessName) {
            $brandName = ! empty($options['business_name']) ? trim((string) $options['business_name']) : ($business->name ?? null);
        }

        $copyLines = [];
        $copyLines[] = "• Hero Product: \"{$productName}\"";

        if ($brandName) {
            $copyLines[] = "• BUSINESS / SHOP NAME: \"{$brandName}\"";
            $copyLines[] = '  - Business Name Requirement: MUST appear visibly in the generated image as clean, readable commercial typography.';
            $copyLines[] = "  - Exact Spelling: \"{$brandName}\" (maintain exact spelling, casing, and characters verbatim; do not abbreviate or rewrite).";
            $copyLines[] = '  - Designed Brand Typography: Render as professionally designed commercial brand typography (e.g., refined editorial, modern bold display, elegant serif, or modern sans-serif tailored to the business category and brand tone). NEVER render as unstyled plain body text, default browser text, or tiny metadata.';
            $copyLines[] = '  - Typography Only: Render as readable text typography. DO NOT transform into a logo, emblem, badge, cup/bean icon, watermark, or brand symbol.';
        } else {
            $copyLines[] = '• BUSINESS / SHOP NAME: Disabled. Do not render any business name, logo, or brand mark in the image.';
        }

        if (! empty($options['price'])) {
            $rawPrice = trim((string) $options['price']);
            $copyLines[] = "• PRICE: \"{$rawPrice}\"";
            $copyLines[] = "  - Price Requirement: MUST appear visibly in the image with crisp, legible typography maintaining the exact currency symbol and digits ({$rawPrice}).";
        }

        $normalizedTagline = TaglineNormalizationService::normalize($options['tagline'] ?? null);
        if ($normalizedTagline !== null) {
            $copyLines[] = "• TAGLINE: \"{$normalizedTagline}\"";
            $copyLines[] = '  - Tagline Requirement: MUST appear visibly in the image as commercial headline/supporting copy.';
            $copyLines[] = "  - Strict Verbatim Rule: Use the exact wording \"{$normalizedTagline}\". Do not paraphrase, rewrite, shorten, expand, or invent additional wording.";
            $copyLines[] = '  - Designed Advertising Typography: Render the tagline as a professionally art-directed advertising typography element (e.g., bold celebratory headline, high-impact display, dimensional promotional typography, or sophisticated editorial lettering matched to the campaign goal). NEVER render as plain unstyled paragraph copy.';
        }

        $copyLines[] = '• COPY RENDERING RULES:';
        $copyLines[] = '  - All enabled copy elements above MUST be visibly rendered in the final image as integrated commercial typography.';
        $copyLines[] = '  - Content is fixed and immutable; visual typographic styling and artistic layout are creatively art-directed.';
        $copyLines[] = '  - Composition-Aware Placement: Dynamically place typography in available negative-space regions relative to the product silhouette, lighting, and aspect ratio. Do NOT place text arbitrarily or cover the primary product, packaging, or labels.';
        $copyLines[] = '  - Typographic Hierarchy & Spacing: Maintain intentional visual rhythm and scale distinction between Headline/Tagline, Business Name, and Price. Prevent typography elements from colliding or stacking into an unreadable block.';
        $copyLines[] = '  - Contrast & Readability: Ensure crisp legibility against the scene environment using natural tonal contrast, soft contact shadows, or subtle dimensional separation without generic UI boxes.';
        $copyLines[] = '  - Do not omit, duplicate, or hallucinate additional copy.';
        $copyLines[] = '  - Place copy in the designated copy zones inside the invisible safe area.';

        $modules[] = "FINAL MARKETING COPY — MUST APPEAR VISIBLY IN THE IMAGE:\n".implode("\n", $copyLines);

        // ---------------------------------------------------------------------
        // PRIORITY 4: CAMPAIGN MODULE
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
        // PRIORITY 5: EVENT / PHILIPPINE HOLIDAY MODULE (STRUCTURED DIRECTION)
        // ---------------------------------------------------------------------
        if (! empty($options['event_name'])) {
            $eventDirection = $this->resolveStructuredEventDirection($options['event_name'], $productName, $aspectRatio);
            $modules[] = "EVENT DIRECTION:\n{$eventDirection}\n• Subordination rule: Event elements provide contextual atmosphere and holiday mood; they must complement {$productName} and must not erase the user's explicit scene prompt or product identity.";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 6: INDUSTRY & CATEGORY ART DIRECTION MODULE
        // ---------------------------------------------------------------------
        $industry = $options['business_industry'] ?? $business->industry ?? 'General';
        $businessCategory = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? 'General';

        $artDirectionData = $this->artDirectionService->resolveArtDirection((string) $industry, (string) $businessCategory, $productName);
        $modules[] = $this->artDirectionService->formatForPrompt($artDirectionData, $productName);

        // ---------------------------------------------------------------------
        // PRIORITY 7: BUSINESS CONTEXT & BRAND IDENTITY MODULE
        // ---------------------------------------------------------------------
        $businessDesc = ! empty($options['business_description']) ? trim((string) $options['business_description']) : ($business->description ?? null);
        $businessCategoryForContext = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? $industry;

        if ($brandName || $businessDesc || ($businessCategoryForContext && $businessCategoryForContext !== 'General')) {
            $bizContextLines = [];
            if ($brandName) {
                $bizContextLines[] = "• Business Name: {$brandName}";
            }
            if ($businessDesc) {
                $bizContextLines[] = "• Business Description: {$businessDesc}";
            }
            if ($businessCategoryForContext && $businessCategoryForContext !== 'General') {
                $bizContextLines[] = "• Business Category: {$businessCategoryForContext}";
            }
            $bizContextLines[] = '• Instruction: Use the business description only as contextual information for visual generation. Use it to improve the authenticity, relevance, environment, supporting props, materials, styling, and commercial presentation of the generated advertisement. Do not render the business description as visible text in the image. Do not invent slogans, claims, logos, emblems, or branding from the description.';

            $modules[] = "BUSINESS CONTEXT:\n".implode("\n", $bizContextLines);
        }

        if ($brandName) {
            $brandLines = [
                "BUSINESS / SHOP: \"{$brandName}\"".($industry && $industry !== 'General' ? " ({$industry})" : ''),
                "• Exact Text & Spelling: Render the exact business name \"{$brandName}\" as visible text integrated naturally into the overall advertisement composition.",
                '• Creative Typographic Integration: Visually integrate the name into the creative design using elegant, bold, modern, premium, playful, handwritten, editorial, or stylized typography harmonized with the Brand Tone, colors, lighting, atmosphere, and Render Style. Creative typography treatments and decorative design accents (such as decorative lines, shapes, flourishes, patterns, textures, shadows, or lighting highlights around the text) are permitted and encouraged so the typography feels naturally designed as part of the advertisement.',
                '• Composition-Aware Brand Placement: Position the business name in an intentional negative-space zone (e.g. upper safe zone or refined brand header region) with deliberate hierarchy that balances the hero product and campaign tagline without visual crowding.',
                '• STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name. DO NOT create a coffee cup logo, coffee bean logo, café icon, crown, badge, seal, crest, monogram, mascot, watermark, or brand symbol. DO NOT place the name inside a logo-shaped mark or invent a graphical brand identity. Decorative elements surrounding the name are allowed but must remain purely decorative design elements and must NOT form a recognizable logo, emblem, icon, or brand mark.',
            ];
            $modules[] = "BRAND IDENTITY:\n".implode("\n", $brandLines);
        } else {
            $modules[] = "BRAND IDENTITY:\n• Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.";
        }

        $brandTone = $options['brand_tone'] ?? [];
        if (is_string($brandTone)) {
            $brandTone = explode(',', $brandTone);
        }
        $brandTone = array_filter((array) $brandTone);
        if (! empty($brandTone)) {
            $toneDesc = implode(', ', $brandTone);
            $modules[] = "BRAND TONE:\n{$toneDesc} (calibrate visual personality and lighting mood without overriding product fidelity or replacing requested physical scenes with arbitrary party props)";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 8: RENDER STYLE MODULE (EXACTLY ONE ACTIVE STYLE)
        // ---------------------------------------------------------------------
        $renderStyle = $options['render_style'] ?? 'Studio Product Still';
        $renderStyleSpec = $this->resolveRenderStyleSpec($renderStyle);
        $modules[] = "RENDER STYLE:\n{$renderStyleSpec}";

        // ---------------------------------------------------------------------
        // PRIORITY 9: VISUAL THEME MODULE
        // ---------------------------------------------------------------------
        $visualTheme = $options['visual_theme'] ?? [];
        if (is_string($visualTheme)) {
            $visualTheme = explode(',', $visualTheme);
        }
        $visualTheme = array_filter((array) $visualTheme);
        if (! empty($visualTheme)) {
            $themeDesc = implode(', ', $visualTheme);
            $modules[] = "VISUAL THEME:\n{$themeDesc} (enrich background environment with harmonious props that complement the user scene)";
        }

        // ---------------------------------------------------------------------
        // PRIORITY 10: RESPONSIVE COMPOSITION PROFILE & INVISIBLE SAFE AREA
        // ---------------------------------------------------------------------
        $compositionProfile = $this->resolveCompositionProfile($aspectRatio, $productName, $options);

        $compLines = [
            $compositionProfile,
            "• Keep {$productName} visually dominant with realistic contact shadows and natural environmental integration.",
            '• Maintain visual hierarchy: Product as primary focal centerpiece, environmental styling and props subordinate.',
            '• Composition-Aware Typographic Placement: Intelligently anchor typography into negative space regions corresponding to the aspect ratio format. Prevent text from covering the physical product, packaging labels, faces, or essential scene details.',
            '• INVISIBLE SAFE AREA: The 20% safe margin is an internal, invisible layout constraint only. Keep all important visual subjects, focal elements, and textual regions comfortably inside the designated inner safe area.',
            '• OUTPUT CLEANLINESS & FORBIDDEN ELEMENTS (CRITICAL): The safe margin must NEVER appear in the final artwork. DO NOT render safe-margin boundaries, dotted or dashed borders, frames, guides, grids, rulers, crop marks, alignment marks, measurement indicators, percentage labels, technical annotations, "20% SAFE MARGIN", "SAFE MARGIN", or any production/layout instructions.',
            '• FINISHED COMMERCIAL ADVERTISEMENT: The final image must look like a finished professional commercial advertisement, not a design template, production proof, wireframe, or editing canvas.',
        ];

        $modules[] = "COMPOSITION & SAFE MARGINS (INVISIBLE SAFE AREA & OUTPUT CLEANLINESS):\n".implode("\n", $compLines);

        // ---------------------------------------------------------------------
        // OUTPUT MODULE & FINAL INSTRUCTION
        // ---------------------------------------------------------------------
        $priorityEnforcement = $hasImageInput
            ? 'The supplied catalog product image is the primary visual source of truth. Product preservation overrides lower-priority styling. Do not replace the supplied product with a newly invented product.'
            : 'Fulfill the full commercial advertising scene with product fidelity and user scene direction prioritized over subordinate styling.';

        $modules[] = "OUTPUT & SAFETY RULES:\n• Framing: Format intentionally for {$aspectRatio} canvas.\n• Invisible Safe Area: Compose key visual and text regions inside the designated safe area with negative space along borders, without rendering visible lines or border guides.\n• Composition-Aware Typography: Professionally design Business Name and Tagline typography with deliberate negative-space placement, high contrast, and clear visual hierarchy without covering the product or using unstyled plain body text.\n• Output Cleanliness: Deliver a pristine, finished professional commercial advertisement with zero template artifacts, wireframes, or annotations.\n• No Logos/Emblems: No logos, emblems, badges, or invented branding symbols.\n• PRIORITY ENFORCEMENT: {$priorityEnforcement}";

        return implode("\n\n", $modules);
    }

    /**
     * Resolve responsive composition profile tailored specifically for the selected aspect ratio.
     *
     * @param  array<string, mixed>  $options
     */
    public function resolveCompositionProfile(string $aspectRatio, string $productName, array $options = []): string
    {
        return match ($aspectRatio) {
            '1:1' => "RESPONSIVE COMPOSITION PROFILE: 1:1 SQUARE COMMERCIAL ADVERTISEMENT\n"
                ."• Orientation: Symmetrical, balanced square canvas.\n"
                ."• Preferred Product Region: Center or slightly offset focal region with balanced visual weight on left and right.\n"
                ."• Product Occupancy & Scale: Prominent focal centerpiece occupying approximately 40%–55% of the canvas area. Maintain realistic physical scale and contact shadows without edge cramping.\n"
                ."• Preferred Copy Region: Compact horizontal or balanced stacked arrangement in the upper/lower safe zones. Avoid excessive vertical stacking.\n"
                ."• Supporting Props & Depth: Subordinate framing props distributed with bilateral harmony around {$productName}.\n"
                ."• Negative-Space Strategy: Balanced 360-degree breathing room around key elements. Comfortable distance from all 4 borders.\n"
                .'• Design Intent: Intentionally designed specifically for a balanced 1:1 square canvas.',

            '9:16' => "RESPONSIVE COMPOSITION PROFILE: 9:16 MOBILE VERTICAL COMMERCIAL ADVERTISEMENT\n"
                ."• Orientation: Tall smartphone mobile-first canvas (Story / Reel / TikTok format).\n"
                ."• Preferred Product Region: Central or lower-central region with commanding vertical presence.\n"
                ."• Product Occupancy & Scale: Vertical dominance occupying approximately 35%–50% of the canvas height. DO NOT squeeze a landscape composition into 9:16.\n"
                ."• Preferred Copy Region: Upper region dedicated to headline and business name typography. Lower-middle region reserved for price and tagline. Clear vertical visual hierarchy: Headline → Hero Product → Tagline/Price with generous vertical spacing.\n"
                ."• Supporting Props & Depth: Vertical environmental depth (e.g., rising steam, tall architectural backdrop, vertical light rays) that reinforces {$productName} without competing.\n"
                ."• Negative-Space Strategy: Clean vertical breathing room in the upper and lower thirds. Keep critical elements comfortably away from extreme top and bottom edges.\n"
                .'• Design Intent: Intentionally designed specifically for a tall 9:16 mobile vertical advertisement.',

            '16:9' => "RESPONSIVE COMPOSITION PROFILE: 16:9 WIDE LANDSCAPE COMMERCIAL ADVERTISEMENT\n"
                ."• Orientation: Wide horizontal commercial banner canvas.\n"
                ."• Preferred Product Region: Lateral placement (golden ratio left or right third) taking full advantage of the horizontal width. DO NOT place every element in the dead center.\n"
                ."• Product Occupancy & Scale: Realistic commercial scale occupying approximately 30%–45% of the horizontal canvas width. DO NOT enlarge {$productName} unnecessarily just to fill empty space. DO NOT squeeze a portrait layout into 16:9.\n"
                ."• Preferred Copy Region: Opposite lateral third dedicated to marketing copy, headline, tagline, and price with natural horizontal separation.\n"
                ."• Supporting Props & Depth: Expansive horizontal environmental storytelling (countertops, natural background scenery, deep architectural perspective, soft lateral bokeh).\n"
                ."• Negative-Space Strategy: Generous horizontal negative space separating product and copy, creating premium editorial breathing room.\n"
                .'• Design Intent: Intentionally designed specifically for a wide 16:9 landscape advertisement.',

            '4:5' => "RESPONSIVE COMPOSITION PROFILE: 4:5 PORTRAIT SOCIAL MEDIA ADVERTISEMENT\n"
                ."• Orientation: Social-media-friendly portrait canvas (Instagram/Facebook Feed format).\n"
                ."• Preferred Product Region: Central or lower-central area with prominent visual dominance.\n"
                ."• Product Occupancy & Scale: High-impact centerpiece occupying approximately 45%–60% of the canvas height.\n"
                ."• Preferred Copy Region: Vertical hierarchy with comfortable horizontal breathing room. Headline in upper area, price and tagline comfortably positioned without overcrowding the lower canvas.\n"
                ."• Supporting Props & Depth: Natural, balanced distribution of props around {$productName} anchor without cluttering the bottom area.\n"
                ."• Negative-Space Strategy: Generous horizontal margin breathing room and uncluttered borders. Avoid excessive empty space.\n"
                .'• Design Intent: Intentionally designed specifically for a 4:5 social media portrait advertisement.',

            '4:3' => "RESPONSIVE COMPOSITION PROFILE: 4:3 STANDARD LANDSCAPE COMMERCIAL ADVERTISEMENT\n"
                ."• Orientation: Balanced traditional landscape canvas (Display Ads & Content format).\n"
                ."• Preferred Product Region: Dominant focal centerpiece with balanced left/right or slight asymmetric placement.\n"
                ."• Product Occupancy & Scale: Moderately wide commercial staging occupying approximately 35%–50% of the canvas width.\n"
                ."• Preferred Copy Region: Balanced lateral or upper-corner marketing copy with ample breathing room. Avoid making composition too wide or too sparse.\n"
                ."• Supporting Props & Depth: Contextual props providing depth and staging without overwhelming {$productName}.\n"
                ."• Negative-Space Strategy: Traditional advertising negative space with clean separation between hero product, copy, and background.\n"
                .'• Design Intent: Intentionally designed specifically for a 4:3 commercial advertisement.',

            default => "RESPONSIVE COMPOSITION PROFILE: {$aspectRatio} COMMERCIAL ADVERTISEMENT\n"
                ."• Maintain {$productName} as the focal centerpiece with balanced visual weight and clean breathing room.\n"
                ."• Design Intent: Intentionally designed for {$aspectRatio} format.",
        };
    }

    /**
     * Resolve structured direction for Philippine holidays / commercial events with aspect-ratio awareness.
     */
    protected function resolveStructuredEventDirection(string $eventName, string $productName, string $aspectRatio = '1:1'): string
    {
        $lower = strtolower($eventName);

        $spatialNote = match ($aspectRatio) {
            '9:16' => '• Spatial Staging: Vertical seasonal storytelling with celebratory accents distributed along vertical safe zones.',
            '16:9' => '• Spatial Staging: Wide horizontal environmental storytelling with expansive atmospheric festive depth.',
            '4:5' => '• Spatial Staging: Portrait social media festive staging with balanced celebratory props around hero anchor.',
            '4:3' => '• Spatial Staging: Balanced traditional landscape holiday staging with clean prop depth.',
            default => '• Spatial Staging: Compact balanced framing with harmonious seasonal accents framing the product.',
        };

        if (Str::contains($lower, ['new year', '1.1'])) {
            return "Event: {$eventName}\n• Mood: Celebratory premium & fresh beginnings\n• Environment: Modern commercial product setting with festive atmosphere\n• Lighting: Bright polished studio lighting with subtle golden highlights\n• Decorative direction: Minimal celebratory ribbons and refined sparkle particles\n{$spatialNote}\n• Marketing intent: New Year promotional launch";
        }

        if (Str::contains($lower, ['valentine', '2.2', 'love'])) {
            return "Event: {$eventName}\n• Mood: Romantic, warm & elegant\n• Environment: Intimate lifestyle or polished studio setting\n• Lighting: Soft warm diffused lighting with gentle rosy or amber undertones\n• Decorative direction: Tasteful romantic accents, soft petals or subtle satin textures\n{$spatialNote}\n• Marketing intent: Valentine's gifting and special feature";
        }

        if (Str::contains($lower, ['summer', '3.3', '4.4'])) {
            return "Event: {$eventName}\n• Mood: Vibrant, energetic & refreshing\n• Environment: Bright sun-drenched outdoor or modern lifestyle setting\n• Lighting: High-key natural sunlight with crisp natural shadows\n• Decorative direction: Summer breeze, tropical or cool condensation accents\n{$spatialNote}\n• Marketing intent: Summer season feature";
        }

        if (Str::contains($lower, ['mother', 'father', '5.5', '6.6'])) {
            return "Event: {$eventName}\n• Mood: Warm, heartwarming & appreciative\n• Environment: Cozy family dining or premium gifting presentation\n• Lighting: Warm golden hour or gentle morning window light\n• Decorative direction: Elegant gift wrapping, subtle floral or rustic accents\n{$spatialNote}\n• Marketing intent: Appreciation holiday feature";
        }

        if (Str::contains($lower, ['independence', 'heroes', 'bonifacio', 'rizal', 'kagitingan'])) {
            return "Event: {$eventName}\n• Mood: Proud, vibrant & celebratory Philippine cultural heritage\n• Environment: Contemporary Filipino aesthetic or clean commercial space\n• Lighting: Natural, warm and heroic side illumination\n• Decorative direction: Subtle festive native textures, elegant sunburst or ribbon motifs\n{$spatialNote}\n• Marketing intent: National holiday celebration feature";
        }

        if (Str::contains($lower, ['christmas', 'pasko', '12.12', 'ber month', '9.9', '10.10', '11.11'])) {
            return "Event: {$eventName}\n• Mood: Festive, joyful & generous holiday spirit\n• Environment: Warm cozy holiday setting or luxury festive showcase\n• Lighting: Warm ambient bokeh glow and rich holiday lighting\n• Decorative direction: Subtle pine sprigs, golden ornaments, celebratory confetti\n{$spatialNote}\n• Marketing intent: Peak holiday mega sale & gifting";
        }

        return "Event: {$eventName}\n• Mood: Festive commercial celebration\n• Environment: Polished commercial product staging\n• Lighting: Clean commercial studio lighting with soft contact shadows\n• Decorative direction: Subtle thematic accents that complement {$productName}\n{$spatialNote}\n• Marketing intent: Special event promotion";
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
