<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Str;

class ModularPromptOrchestrator
{
    public function __construct(
        protected ?IndustryCategoryArtDirectionService $artDirectionService = null,
        protected ?MarketingDesignSystem $designSystem = null,
    ) {
        $this->artDirectionService = $artDirectionService ?? app(IndustryCategoryArtDirectionService::class);
        $this->designSystem = $designSystem ?? app(MarketingDesignSystem::class);
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
        // 1. FINAL OUTPUT OBJECTIVE
        // ---------------------------------------------------------------------
        $modules[] = "FINAL OUTPUT OBJECTIVE:\n"
            ."• CREATE: A complete final professional commercial marketing advertisement.\n"
            ."• COMPLETE DESIGN MANDATE: GPT Image 2 is the final visual and typographic designer. Generate the complete finished artwork directly, seamlessly integrating all enabled marketing copy elements (Product Name, Price, Tagline, Business Name) into the final visual composition.\n"
            ."• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.\n"
            .'• FINISHED COMMERCIAL FINISH: Deliver a finished, polished commercial advertisement ready for immediate marketing publication. Do NOT produce a raw template, empty placeholder background, or editing canvas.';

        // ---------------------------------------------------------------------
        // 2. PRODUCT REFERENCES / PRODUCT MIX
        // ---------------------------------------------------------------------
        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';
        $category = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? '';

        $imageModel = $options['image_model'] ?? 'gpt-image-2';
        $isFlagship = $imageModel === 'gpt-image-2';

        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];

        // Resolve all catalog reference images for indexing
        $imageIndexedProducts = [];
        if (! empty($catalogProducts)) {
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $hasImg = is_array($prod) ? ! empty($prod['image_path']) : ! empty($prod->image_path);
                if ($hasImg) {
                    $imageIndexedProducts[] = [
                        'name' => $pName,
                        'role' => count($imageIndexedProducts) === 0 ? 'Primary catalog product' : 'Secondary catalog product',
                    ];
                }
            }
        }

        $hasImageInput = ! empty($options['reference_image_paths'])
            || ! empty($options['reference_image_path'])
            || ! empty($options['product_image_url'])
            || count($imageIndexedProducts) > 0;

        if ($hasImageInput) {
            if (count($imageIndexedProducts) > 1) {
                $imgIndexLines = ["PRODUCT / PRODUCT-MIX (PRODUCT FIDELITY & ANCHOR INTEGRATION):\nPRIMARY & REFERENCE PRODUCT IMAGES:"];
                foreach ($imageIndexedProducts as $i => $item) {
                    $imgNum = $i + 1;
                    $imgIndexLines[] = "REFERENCE IMAGE {$imgNum}:\nREFERENCE IMAGE {$imgNum} = {$item['name']} ({$item['role']})";
                }
                $imgIndexLines[] = "• MULTI-IMAGE COMPOSITION DIRECTIVE:\nUse all provided product images as the visual references for the selected products. Preserve the recognizable identity, packaging, proportions, colors, and physical characteristics of each product. Arrange the products together as a cohesive commercial composition. Do not replace, omit, or invent a different product for any supplied reference image.";
                $modules[] = implode("\n\n", $imgIndexLines);
            } else {
                $modules[] = "PRODUCT / PRODUCT-MIX (PRODUCT FIDELITY & ANCHOR INTEGRATION):\nPRIMARY PRODUCT IMAGE:\nUse the supplied catalog product image as the primary visual source of truth for {$productName}. (REFERENCE PRODUCT PRESERVATION MODE)";
            }

            $preservationInstructions = "PRODUCT PRESERVATION:\nPreserve the recognizable identity of the actual supplied product, including when applicable: shape, proportions, container, glassware, packaging, labels, visible branding, colors, distinctive textures, liquid layers, toppings, and physical accessories. Do not reconstruct or invent a replacement product. Creative changes should primarily affect the environment, lighting, atmosphere, background, props, composition, and campaign presentation surrounding the product.";

            if (! $isFlagship) {
                $preservationInstructions .= "\n• STRICT PRESERVATION RULE: The input image is the immutable physical product. Do NOT redraw, restyle, distort, or re-render the catalog item. Maintain exact container geometry, liquid layering, and label details.";
            }

            $modules[] = $preservationInstructions;
        } else {
            $productInfo = "PRODUCT / PRODUCT-MIX (PRODUCT FIDELITY & ANCHOR INTEGRATION):\nPRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):\n• Reference Image Available: NO (Generative Commercial Scene Mode)\n• Target Product: {$productName}".($productDesc ? " — {$productDesc}" : '').($category ? " (Category: {$category})" : '')."\n• GENERATIVE SCENE DIRECTIVE: Synthesize an authentic, photorealistic commercial product representation of {$productName} integrated naturally as the centerpiece of a COMPLETE MARKETING ADVERTISEMENT SCENE. Do NOT generate an isolated product cutout or plain empty background. Render the full environment, background, atmospheric lighting, contextual props, and commercial visual storytelling as directed by the creative brief below.";
            $modules[] = $productInfo;
        }

        // Supporting Product Metadata (Vision analysis) — Supplemental only
        if (! empty($visionBlueprint['product_identity'])) {
            $modules[] = "SUPPORTING PRODUCT METADATA (SUPPLEMENTAL):\n• Observed Characteristics: {$visionBlueprint['product_identity']}\n• IMPORTANT: The supplied product image is the primary visual source of truth. Supporting product metadata is supplemental and must not override, replace, reinterpret, or contradict the supplied product image.";
        }

        // ---------------------------------------------------------------------
        // 3. MULTI-PRODUCT COMPOSITION
        // ---------------------------------------------------------------------
        $secondaryCatalog = [];
        if (! empty($catalogProducts)) {
            $seenIds = [];
            $firstPassed = false;
            foreach ($catalogProducts as $prod) {
                $pId = is_array($prod) ? ($prod['id'] ?? null) : ($prod->id ?? null);
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pDesc = is_array($prod) ? ($prod['description'] ?? null) : $prod->description;

                $key = $pId ? "id_{$pId}" : "name_{$pName}";
                if (isset($seenIds[$key])) {
                    continue;
                }
                $seenIds[$key] = true;

                if (! $firstPassed) {
                    $firstPassed = true;

                    continue;
                }
                $secondaryCatalog[] = [
                    'name' => $pName,
                    'description' => $pDesc,
                ];
            }
        }

        $validCustom = [];
        if (! empty($customProducts) && is_array($customProducts)) {
            foreach ($customProducts as $cProd) {
                if (! empty($cProd['name'])) {
                    $validCustom[] = [
                        'name' => $cProd['name'],
                        'description' => $cProd['description'] ?? null,
                    ];
                }
            }
        }

        if (count($imageIndexedProducts) > 1 || ! empty($secondaryCatalog) || ! empty($validCustom)) {
            $multiLines = ["MULTI-PRODUCT COMPOSITION:\nCO-FEATURED PRODUCTS & SERVICES:\n• All selected catalog products must appear together in the same final marketing scene.\n• Preserve each supplied catalog product as a distinct physical item.\n• Do not omit secondary selected products.\n• Do not merge two products into one.\n• Do not substitute one selected product for another.\n• Do not create a generic replacement for a referenced product."];
            $multiLines[] = "• Primary Hero Product: {$productName} (Dominant focal centerpiece of the composition)";
            if (! empty($secondaryCatalog)) {
                $multiLines[] = '• Co-Featured Catalog Products:';
                foreach ($secondaryCatalog as $sProd) {
                    $sLine = "  - {$sProd['name']}";
                    if (! empty($sProd['description'])) {
                        $sLine .= " — {$sProd['description']}";
                    }
                    $multiLines[] = $sLine;
                }
            }
            if (! empty($validCustom)) {
                $multiLines[] = '• Custom Offerings / Services:';
                foreach ($validCustom as $cItem) {
                    $cLine = "  - {$cItem['name']}";
                    if (! empty($cItem['description'])) {
                        $cLine .= " — {$cItem['description']}";
                    }
                    $multiLines[] = $cLine;
                }
            }
            $multiLines[] = '• CO-PRESENCE MANDATE: All selected products and offerings listed above must be actively represented together in the commercial scene (e.g., grouped harmoniously on the countertop, table, or display surface as a cohesive commercial offering). Do not omit or substitute any selected item.';
            $modules[] = implode("\n", $multiLines);
        }

        // ---------------------------------------------------------------------
        // 4. USER OR AI CREATIVE DIRECTION
        // ---------------------------------------------------------------------
        $generationMode = ($options['generation_mode'] ?? 'manual') === 'automatic' ? 'automatic' : 'manual';
        $userScenePrompt = null;
        if (! empty($options['scene_prompt'])) {
            $userScenePrompt = trim((string) $options['scene_prompt']);
        } elseif (! empty($options['image_prompt'])) {
            $userScenePrompt = trim((string) $options['image_prompt']);
        } elseif (! empty($options['prompt'])) {
            $userScenePrompt = trim((string) $options['prompt']);
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

        if ($generationMode === 'automatic') {
            $autoLines = [];
            $autoLines[] = 'AUTOMATIC AI CREATIVE DIRECTION (Primary Campaign Concept & Visual Strategy):';
            if (! empty($options['creative_concept'])) {
                $autoLines[] = "• Creative Concept: {$options['creative_concept']}";
            }
            if (! empty($options['visual_strategy'])) {
                $autoLines[] = "• Visual Strategy: {$options['visual_strategy']}";
            }
            if (! empty($userScenePrompt) && ! Str::startsWith($userScenePrompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
                $autoLines[] = "• AI Visual Scene: {$userScenePrompt}";
            }
            $autoLines[] = "• PRIMARY CREATIVE SCENE: Realize this campaign-specific creative direction conceived by the AI Creative Director, tailored to the campaign objective, linked event, and industry standards while keeping {$productName} as the undisputed hero.";
            $modules[] = implode("\n", $autoLines);
        } else {
            if (! empty($userScenePrompt) && ! Str::startsWith($userScenePrompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
                $modules[] = "USER SCENE DIRECTION:\nUSER SCENE / VISUAL DIRECTION:\n• PRIMARY USER SCENE DIRECTION: {$userScenePrompt}\n• PRIMARY SCENE INSTRUCTION: Fulfill this specific scene setting, props, environment, and visual atmosphere with high authority while keeping {$productName} as the focal centerpiece. Do not replace with an autonomous AI concept.";
            } else {
                $modules[] = "USER SCENE DIRECTION:\nUSER SCENE / VISUAL DIRECTION:\n• PRIMARY USER SCENE DIRECTION: Standard commercial product presentation\n• PRIMARY SCENE INSTRUCTION: Present {$productName} in a clean, professional commercial setting reflecting the selected render style, design treatment, and brand tone.";
            }
        }

        // CREATIVE VARIATION DIRECTIVE
        if (! empty($options['is_variation'])) {
            $modules[] = "CREATIVE VARIATION DIRECTIVE:\n"
                ."• Synthesize a distinct creative variation of this marketing scene.\n"
                ."• Vary the composition, camera framing, lighting atmosphere, environmental arrangement, and supporting props to deliver a fresh aesthetic perspective.\n"
                ."• STRICT FIDELITY PRESERVATION: Preserve the exact identity, packaging, labels, colors, and physical attributes of all selected products.\n"
                .'• Maintain all designated marketing copy, brand tones, visual themes, safe margins, and negative space for final application text layers.';
        }

        // ---------------------------------------------------------------------
        // 5. DESIGN TREATMENT
        // ---------------------------------------------------------------------
        $designTreatment = $options['design_treatment'] ?? 'Classic';
        $treatmentDesc = $this->designSystem->resolveDesignTreatmentSpec($designTreatment);
        $modules[] = "DESIGN TREATMENT:\n• Selected Treatment: {$designTreatment}\n• Canonical Specification: {$treatmentDesc}\n• Design Execution: Establish intentional spatial structure, margins, and visual contrast reflecting this treatment.";

        // ---------------------------------------------------------------------
        // 6. COPY EMPHASIS
        // ---------------------------------------------------------------------
        $copyEmphasis = $options['copy_emphasis'] ?? 'Balanced';
        $emphasisDesc = $this->designSystem->resolveCopyEmphasisSpec($copyEmphasis);
        $modules[] = "COPY EMPHASIS:\n• Selected Emphasis: {$copyEmphasis}\n• Canonical Specification: {$emphasisDesc}\n• Emphasis Rule: Structure negative space and typography scale hierarchy according to this emphasis.";

        // ---------------------------------------------------------------------
        // 7. RENDER STYLE
        // ---------------------------------------------------------------------
        $renderStyle = $options['render_style'] ?? $options['content_style'] ?? 'Studio Product Still';
        $renderStyleSpec = $this->resolveRenderStyleSpec($renderStyle);
        $modules[] = "RENDER STYLE:\n{$renderStyleSpec}";

        // ---------------------------------------------------------------------
        // 8. VISUAL THEME
        // ---------------------------------------------------------------------
        $visualTheme = $options['visual_theme'] ?? [];
        if (is_string($visualTheme)) {
            $visualTheme = explode(',', $visualTheme);
        }
        $visualTheme = array_filter((array) $visualTheme);
        if (! empty($visualTheme)) {
            $themeLines = [];
            foreach ($visualTheme as $vt) {
                $spec = $this->designSystem->resolveVisualThemeSpec((string) $vt);
                $themeLines[] = "• {$vt}: {$spec}";
            }
            $themeDesc = implode(', ', $visualTheme);
            $modules[] = "VISUAL THEME:\n{$themeDesc} (enrich background environment with harmonious props that complement the user scene)\nCanonical Theme Staging:\n".implode("\n", $themeLines);
        }

        // ---------------------------------------------------------------------
        // 9. BRAND TONE
        // ---------------------------------------------------------------------
        $brandTone = $options['brand_tone'] ?? [];
        if (is_string($brandTone)) {
            $brandTone = explode(',', $brandTone);
        }
        $brandTone = array_filter((array) $brandTone);
        if (! empty($brandTone)) {
            $toneLines = [];
            foreach ($brandTone as $bt) {
                $spec = $this->designSystem->resolveBrandToneSpec((string) $bt);
                $toneLines[] = "• {$bt}: {$spec}";
            }
            $toneDesc = implode(', ', $brandTone);
            $modules[] = "BRAND IDENTITY:\nBRAND TONE:\n{$toneDesc} (calibrate visual personality and lighting mood without overriding product fidelity or replacing requested physical scenes with arbitrary party props)\nCanonical Tone Direction:\n".implode("\n", $toneLines);
        }

        // ---------------------------------------------------------------------
        // 10. CAMERA
        // ---------------------------------------------------------------------
        $cameraViewpoint = $options['camera_viewpoint'] ?? 'three-quarter';
        $camDesc = MarketingDesignSystem::CAMERA_VIEWPOINTS[$cameraViewpoint] ?? 'Elevated commercial studio angle displaying optimal product geometry and depth.';
        $modules[] = "CAMERA:\n• Camera Perspective: {$cameraViewpoint}\n• Canonical Specification: {$camDesc}";

        // ---------------------------------------------------------------------
        // 11. LIGHTING
        // ---------------------------------------------------------------------
        $lightingProfile = $options['lighting_profile'] ?? 'soft diffused';
        $lightDesc = MarketingDesignSystem::LIGHTING_PROFILES[$lightingProfile] ?? 'Controlled commercial softbox lighting with soft contact shadows and razor-sharp clarity.';
        $modules[] = "LIGHTING:\n• Lighting Profile: {$lightingProfile}\n• Canonical Specification: {$lightDesc}";

        // ---------------------------------------------------------------------
        // 12. ENVIRONMENT
        // ---------------------------------------------------------------------
        $environmentFamily = $options['environment_family'] ?? null;
        if ($environmentFamily) {
            $envDesc = MarketingDesignSystem::ENVIRONMENT_FAMILIES[$environmentFamily] ?? '';
            $modules[] = "ENVIRONMENT:\n• Environment Setting: {$environmentFamily}".($envDesc ? " ({$envDesc})" : '');
        }

        // ---------------------------------------------------------------------
        // 13. PROPS
        // ---------------------------------------------------------------------
        $propProfile = $options['prop_profile'] ?? null;
        $sceneFamily = $options['scene_family'] ?? null;
        $compositionType = $options['composition_type'] ?? null;

        if ($propProfile || $sceneFamily || $compositionType) {
            $stagingLines = [];
            if ($propProfile) {
                $propDesc = MarketingDesignSystem::PROP_PROFILES[$propProfile] ?? '';
                $stagingLines[] = "• Prop Staging Profile: {$propProfile}".($propDesc ? " ({$propDesc})" : '');
            }
            if ($sceneFamily) {
                $sceneDesc = MarketingDesignSystem::SCENE_FAMILIES[$sceneFamily] ?? '';
                $stagingLines[] = "• Scene Family: {$sceneFamily}".($sceneDesc ? " ({$sceneDesc})" : '');
            }
            if ($compositionType) {
                $compDesc = MarketingDesignSystem::COMPOSITION_TYPES[$compositionType] ?? '';
                $stagingLines[] = "• Composition Geometry: {$compositionType}".($compDesc ? " ({$compDesc})" : '');
            }
            $modules[] = "PROPS & SCENE STAGING:\n".implode("\n", $stagingLines);
        }

        // ---------------------------------------------------------------------
        // 14. CAMPAIGN
        // ---------------------------------------------------------------------
        if (! empty($options['campaign_name']) || ! empty($options['campaign_objective'])) {
            $campLines = [];
            if (! empty($options['campaign_name'])) {
                $campLines[] = "• Campaign: {$options['campaign_name']}";
            }
            if (! empty($options['campaign_objective'])) {
                $campLines[] = "• Goal: {$options['campaign_objective']}";
            }
            $modules[] = "CAMPAIGN / EVENT CONTEXT:\nCAMPAIGN:\n".implode("\n", $campLines);
        }

        // ---------------------------------------------------------------------
        // 15. EVENT
        // ---------------------------------------------------------------------
        if (! empty($options['event_name'])) {
            $eventDirection = $this->resolveStructuredEventDirection($options['event_name'], $productName, $aspectRatio);
            if ($generationMode === 'automatic') {
                $modules[] = "EVENT DIRECTION:\nEVENT DIRECTION (CREATIVE DRIVER):\n• ROLE: Creative Driver\n{$eventDirection}\n• Creative driver rule: Event and campaign objective actively guide thematic storytelling, festive styling, lighting, and props around {$productName}.";
            } else {
                $modules[] = "EVENT DIRECTION:\nEVENT DIRECTION (CONTEXTUAL):\n{$eventDirection}\n• Subordination rule: Event elements provide contextual atmosphere and holiday mood; they must complement {$productName} and must not erase the user's explicit scene prompt or product identity.";
            }
        }

        // ---------------------------------------------------------------------
        // 16. BUSINESS CONTEXT
        // ---------------------------------------------------------------------
        $industry = $options['business_industry'] ?? $business->industry ?? 'General';
        $businessCategory = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? 'General';

        $artDirectionData = $this->artDirectionService->resolveArtDirection((string) $industry, (string) $businessCategory, $productName);
        $modules[] = $this->artDirectionService->formatForPrompt($artDirectionData, $productName);

        $includeBusinessName = array_key_exists('include_business_name', $options)
            ? (bool) $options['include_business_name']
            : (! array_key_exists('business_name', $options) || ! empty($options['business_name']));

        $brandName = null;
        if ($includeBusinessName) {
            $brandName = ! empty($options['business_name']) ? trim((string) $options['business_name']) : ($business->name ?? null);
        }

        $businessDesc = ! empty($options['business_description']) ? trim((string) $options['business_description']) : ($business->description ?? null);
        $businessCategoryForContext = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? $industry;
        $businessUsp = ! empty($options['business_usp']) ? trim((string) $options['business_usp']) : ($business->unique_selling_point ?? null);
        $targetAudience = ! empty($options['business_target_audience']) ? trim((string) $options['business_target_audience']) : ($options['target_audience'] ?? $business->target_audience ?? null);

        if ($brandName || $businessDesc || $businessUsp || $targetAudience || ($businessCategoryForContext && $businessCategoryForContext !== 'General')) {
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
            if ($businessUsp) {
                $bizContextLines[] = "• Unique Selling Proposition: {$businessUsp}";
            }
            if ($targetAudience) {
                $bizContextLines[] = "• Target Audience: {$targetAudience}";
            }
            $bizContextLines[] = '• Instruction: Use the business description only as contextual commercial guidance for authentic staging, environment, supporting props, materials, styling, and tone. Do not render them as visible body copy, slogans, logos, emblems, or invented factual claims in the image.';

            $modules[] = "BUSINESS CONTEXT:\n".implode("\n", $bizContextLines);
        }

        // ---------------------------------------------------------------------
        // 17. MARKETING COPY — FINAL DESIGN TEXT (PART E)
        // ---------------------------------------------------------------------
        $includePrices = array_key_exists('include_prices', $options)
            ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN)
            : true;

        $includeTagline = array_key_exists('include_tagline', $options)
            ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN)
            : (($options['tagline_mode'] ?? null) !== 'none');

        $normalizedTagline = TaglineNormalizationService::normalize($options['tagline'] ?? null);

        $copyBlockLines = [
            "MARKETING COPY:\nMARKETING COPY — FINAL DESIGN TEXT:\nFINAL MARKETING COPY — MUST APPEAR VISIBLY IN THE IMAGE:\n",
            "PRODUCT NAME:\n\"{$productName}\"",
            "• Hero Product: \"{$productName}\"",
        ];

        if (! empty($secondaryCatalog)) {
            foreach ($secondaryCatalog as $sc) {
                $copyBlockLines[] = "• Co-Featured Product: \"{$sc['name']}\"";
            }
        }

        // PRICE BLOCK
        if ($includePrices) {
            $itemPrices = [];
            if (! empty($options['catalog_products'])) {
                foreach ($options['catalog_products'] as $prod) {
                    $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                    $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;
                    if ($pPrice !== null && $pPrice !== '') {
                        $fmt = is_numeric($pPrice) ? '₱'.number_format((float) $pPrice, 2) : (string) $pPrice;
                        $itemPrices[] = "{$pName}: {$fmt}";
                    }
                }
            }
            if (! empty($options['custom_products']) && is_array($options['custom_products'])) {
                foreach ($options['custom_products'] as $cProd) {
                    if (! empty($cProd['name']) && ! empty($cProd['price'])) {
                        $itemPrices[] = "{$cProd['name']}: {$cProd['price']}";
                    }
                }
            }
            if (empty($itemPrices) && ! empty($options['price'])) {
                $rawPrice = trim((string) $options['price']);
                $fmt = is_numeric($rawPrice) ? '₱'.number_format((float) $rawPrice, 2) : $rawPrice;
                $itemPrices[] = "{$productName}: {$fmt}";
            }

            $primaryPriceDisplay = null;
            if (! empty($options['price'])) {
                $rawP = trim((string) $options['price']);
                $primaryPriceDisplay = is_numeric($rawP) ? '₱'.number_format((float) $rawP, 2) : $rawP;
            } elseif (! empty($itemPrices)) {
                $primaryPriceDisplay = explode(': ', $itemPrices[0])[1] ?? null;
            }

            $copyBlockLines[] = '';
            $copyBlockLines[] = "PRICE:\n".($primaryPriceDisplay ? "\"{$primaryPriceDisplay}\"" : '');
            if ($primaryPriceDisplay) {
                $copyBlockLines[] = "MARKETING PRICE DISPLAY:\n• PRICE: \"{$primaryPriceDisplay}\"";
            }
            if (! empty($itemPrices)) {
                $copyBlockLines[] = '• Authoritative Prices: '.implode(' | ', $itemPrices);
            }
        } else {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE PRICES = FALSE:\nDo not render prices.\nSelected products MUST remain visually present.";
        }

        // TAGLINE BLOCK
        if ($includeTagline && $normalizedTagline !== null) {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "TAGLINE:\n\"{$normalizedTagline}\"";
            $copyBlockLines[] = "• TAGLINE: \"{$normalizedTagline}\"";
        } else {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE TAGLINE = FALSE:\nDo not render any tagline, headline, slogan, or substitute phrase.";
        }

        // BUSINESS NAME BLOCK
        if ($brandName) {
            $categorySuffix = ! empty($options['business_category'])
                ? " ({$options['business_category']})"
                : (! empty($business?->category)
                    ? " ({$business->category})"
                    : (! empty($options['business_industry']) ? " ({$options['business_industry']})" : ''));

            $copyBlockLines[] = '';
            $copyBlockLines[] = "BUSINESS NAME:\n\"{$brandName}\"";
            $copyBlockLines[] = "• BUSINESS / SHOP NAME: \"{$brandName}\"";
            $copyBlockLines[] = "BRAND IDENTITY:\n• BUSINESS / SHOP: \"{$brandName}\"{$categorySuffix}";
            $copyBlockLines[] = "• Render the exact business name \"{$brandName}\" as visible text integrated naturally into the overall advertisement composition.";
            $copyBlockLines[] = '• Creative Typographic Integration: Visually integrate the name into the creative design using elegant, bold, modern, premium, playful, handwritten, editorial, or stylized typography matching the design treatment and tone.';
            $copyBlockLines[] = '• STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name.';
            $copyBlockLines[] = '• DO NOT create a coffee cup logo, coffee bean logo, café icon, crown, badge, seal, crest, monogram, mascot, watermark, or brand symbol.';
        } else {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE BUSINESS NAME = FALSE:\nDo not render the business/shop name.";
            $copyBlockLines[] = '• Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.';
        }

        $copyBlockLines[] = '';
        $copyBlockLines[] = "COPY RULES:\n"
            ."• Render each enabled text element exactly as provided.\n"
            ."• Preserve spelling exactly.\n"
            ."• Preserve digits exactly.\n"
            ."• Preserve currency exactly.\n"
            ."• Do not paraphrase.\n"
            ."• Do not abbreviate.\n"
            ."• Do not invent alternative wording.\n"
            ."• Do not duplicate any text element.\n"
            ."• Do not generate additional marketing copy.\n"
            .'• Do not generate logos, emblems, badges, or watermarks.';

        $modules[] = implode("\n", $copyBlockLines);

        // ---------------------------------------------------------------------
        // 18. TYPOGRAPHY / COPY PLACEMENT (PART F)
        // ---------------------------------------------------------------------
        $typoPlacementLines = [
            'TYPOGRAPHY / COPY PLACEMENT (FINAL ARTWORK DESIGN):',
            '• COMPLETE DESIGN MANDATE: GPT Image 2 is the final visual and typographic designer. Determine the final typography, typographic personality, and layout hierarchy based on:',
            "  - Design Treatment: {$designTreatment} ({$treatmentDesc})",
            "  - Copy Emphasis: {$copyEmphasis} ({$emphasisDesc})",
            "  - Render Style: {$renderStyle}",
            '  - Brand Tone & Visual Theme',
            "  - Canvas Aspect Ratio: {$aspectRatio}",
            '  - Available negative space in the composition',
            "• Relative Text Scale & Hierarchy: Establish intentional scale hierarchy distinguishing Product Name, Tagline/Headline, Price, and Business Name according to {$copyEmphasis}.",
            "• Placement & Alignment: Position typography naturally into composition safe zones (e.g. upper safe zone, refined lateral column, or lower third) relative to {$productName}. Do NOT cover or crowd the primary product, packaging, or labels.",
            '• Typography Personality & Contrast: Use commercial advertising typography tailored to the brand tone and industry. Ensure crisp, high-contrast legibility against the scene background without generic UI boxes.',
            '• Spacing & Visual Rhythm: Prevent typography elements from colliding or stacking into an unreadable block. Keep comfortable breathing room between headline, price, and product.',
        ];
        $modules[] = implode("\n", $typoPlacementLines);

        // ---------------------------------------------------------------------
        // 19. ASPECT RATIO
        // ---------------------------------------------------------------------
        $compositionProfile = $this->resolveCompositionProfile($aspectRatio, $productName, $options);
        $compLines = [
            $compositionProfile,
            "• Keep {$productName} visually dominant with realistic contact shadows and natural environmental integration.",
            '• Maintain visual hierarchy: Product as primary focal centerpiece, environmental styling and props subordinate.',
            '• Composition-Aware Typographic Placement: Intelligently anchor typography into negative space regions corresponding to the aspect ratio format. Prevent text from covering the physical product, packaging labels, faces, or essential scene details.',
        ];
        $modules[] = "ASPECT RATIO & RESPONSIVE COMPOSITION:\nCOMPOSITION & SAFE MARGINS (INVISIBLE SAFE AREA & OUTPUT CLEANLINESS):\n".implode("\n", $compLines);

        // ---------------------------------------------------------------------
        // 20. NEGATIVE / EXCLUSION RULES
        // ---------------------------------------------------------------------
        $modules[] = "NEGATIVE / EXCLUSION RULES (OUTPUT & SAFETY RULES):\nOUTPUT & SAFETY RULES:\n"
            ."• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.\n"
            ."• INVISIBLE SAFE AREA: The 20% safe margin is an internal, invisible layout constraint only. Keep all important visual subjects, focal elements, and textual regions comfortably inside the designated inner safe area.\n"
            ."• OUTPUT CLEANLINESS & FORBIDDEN ELEMENTS (CRITICAL): The safe margin must NEVER appear in the final artwork. DO NOT render safe-margin boundaries, dotted or dashed borders, frames, guides, grids, rulers, crop marks, alignment marks, measurement indicators, percentage labels, technical annotations, \"20% SAFE MARGIN\", \"SAFE MARGIN\", or any production/layout instructions.\n"
            ."• DO NOT duplicate any text element.\n"
            ."• DO NOT generate additional marketing copy, body text, or slogans beyond the authorized marketing copy.\n"
            .'• FINISHED COMMERCIAL ADVERTISEMENT: The final image must look like a finished professional commercial advertisement, not a design template, production proof, wireframe, or editing canvas.';

        // ---------------------------------------------------------------------
        // 21. FINAL QUALITY RULES
        // ---------------------------------------------------------------------
        $priorityEnforcement = $hasImageInput
            ? 'The supplied catalog product image is the primary visual source of truth. Product preservation overrides lower-priority styling. Do not replace the supplied product with a newly invented product.'
            : 'Fulfill the full commercial advertising scene with product fidelity and user scene direction prioritized over subordinate styling.';

        $modules[] = "FINAL QUALITY RULES:\n"
            ."• Framing: Format intentionally for {$aspectRatio} canvas.\n"
            ."• Invisible Safe Area: Compose key visual and text regions inside the designated safe area with negative space along borders, without rendering visible lines or border guides.\n"
            ."• Composition-Aware Typography: Professionally design Business Name, Product Name, Price, and Tagline typography directly as integrated commercial design elements.\n"
            ."• Output Cleanliness: Deliver a pristine, finished professional commercial advertisement with zero template artifacts, wireframes, or annotations.\n"
            ."• No Logos/Emblems: No logos, emblems, badges, or invented branding symbols.\n"
            ."• PRIORITY ENFORCEMENT: {$priorityEnforcement}";

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
     * Resolve strict specification for the selected render style via MarketingDesignSystem.
     */
    protected function resolveRenderStyleSpec(string $renderStyle): string
    {
        return $this->designSystem->resolveRenderStyleSpec($renderStyle);
    }
}
