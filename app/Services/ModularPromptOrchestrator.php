<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Campaign;
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
     * Alias for orchestrate() to support prompt building interface.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function buildSystemPrompt(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        return $this->orchestrate($options, $business, $visionBlueprint);
    }

    /**
     * Build a structured, modular prompt respecting strict priority rules and aspect-ratio composition profiles.
     * Follows the 20-step production prompt structure for complete final marketing designs in GPT Image 2.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function orchestrate(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $generationMode = $options['generation_mode'] ?? null;
        if ($generationMode === 'manual') {
            return $this->orchestrateManualCampaignBrief($options, $business, $visionBlueprint);
        }

        if ($generationMode === 'automatic') {
            return $this->orchestrateAutomaticCampaignBrief($options, $business, $visionBlueprint);
        }

        return $this->orchestrateLegacyModules($options, $business, $visionBlueprint);
    }

    /**
     * Legacy orchestrator retaining technical 20-module expansion.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    protected function orchestrateLegacyModules(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $modules = [];
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $productName = $options['product_name'] ?? 'Product';
        $productDesc = $options['product_description'] ?? '';
        $category = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? '';

        $imageModel = $options['image_model'] ?? 'gpt-image-2';
        $isFlagship = $imageModel === 'gpt-image-2';
        $renderStyle = $options['render_style'] ?? $options['content_style'] ?? 'Studio Product Still';

        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];

        // Auto-resolve event_name from event model/array or campaign if missing
        if (empty($options['event_name'])) {
            if (! empty($options['event'])) {
                $options['event_name'] = is_array($options['event']) ? ($options['event']['name'] ?? null) : ($options['event']->name ?? null);
            } elseif (! empty($options['campaign']) && is_object($options['campaign']) && ! empty($options['campaign']->event)) {
                $options['event_name'] = $options['campaign']->event->name;
            }
        }

        // Resolve generation mode and user scene direction early
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
            } elseif (Str::startsWith($raw, 'FINAL MARKETING DESIGN TASK')) {
                if (preg_match('/• PRIMARY USER SCENE DIRECTION:\s*(.+)$/m', $raw, $matches)) {
                    $userScenePrompt = trim($matches[1]);
                } else {
                    $userScenePrompt = null;
                }
            } elseif (Str::startsWith($raw, 'Create a marketing image')) {
                if (preg_match('/Creative direction:\s*\n(.+?)(?=\n\n|\n[A-Z]|$)/s', $raw, $matches)) {
                    $userScenePrompt = trim($matches[1]);
                } else {
                    $userScenePrompt = null;
                }
            } else {
                $userScenePrompt = $raw;
            }
        } elseif (! empty($options['notes'])) {
            $userScenePrompt = trim((string) $options['notes']);
        }

        $isManualWithPrompt = ($generationMode === 'manual' && ! empty($userScenePrompt));

        // ---------------------------------------------------------------------
        // 1. FINAL MARKETING DESIGN TASK
        // ---------------------------------------------------------------------
        $taskLines = [
            'FINAL MARKETING DESIGN TASK (FINAL OUTPUT OBJECTIVE):',
            '• COMPLETE DESIGN MANDATE: GPT Image 2 is the final visual and typographic designer. Generate the complete finished artwork directly, seamlessly integrating all enabled marketing copy elements (Product Name, Price, Tagline, Business Name) into the final visual composition.',
        ];
        if ($isManualWithPrompt) {
            $taskLines[] = "• SUPREME USER CREATIVE AUTHORITY: In Manual Mode, the user's explicit creative direction in Section 4 is the supreme authority for scene, environment, materials, atmosphere, lighting, composition, camera viewpoint, and props. It strictly takes precedence over generic studio conventions, default centered layouts, or softbox lighting.";
        }
        $taskLines[] = '• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.';
        $modules[] = implode("\n", $taskLines);

        // ---------------------------------------------------------------------
        // 2. PRODUCT REFERENCES
        // ---------------------------------------------------------------------
        $attachedImagePaths = ! empty($options['reference_image_paths']) ? (array) $options['reference_image_paths'] : [];
        $imageIndexedProducts = [];
        if (! empty($catalogProducts)) {
            foreach ($catalogProducts as $prod) {
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $imgPath = is_array($prod) ? ($prod['image_path'] ?? null) : $prod->image_path;
                $pId = is_array($prod) ? ($prod['id'] ?? null) : ($prod->id ?? null);
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : ($prod->price ?? null);

                $hasImg = false;
                if (! empty($imgPath)) {
                    if (! empty($attachedImagePaths)) {
                        $hasImg = in_array($imgPath, $attachedImagePaths, true)
                            || in_array(basename($imgPath), array_map('basename', $attachedImagePaths), true);
                    } else {
                        $hasImg = true;
                    }
                }

                if ($hasImg) {
                    $rawPStr = ($pPrice !== null && $pPrice !== '') ? trim((string) $pPrice) : null;
                    $fmtPrice = $rawPStr !== null ? (is_numeric($rawPStr) ? '₱'.number_format((float) $rawPStr, 2) : (str_starts_with($rawPStr, '₱') ? $rawPStr : '₱'.ltrim($rawPStr))) : null;

                    $physicalDetails = $this->resolveProductPhysicalCharacteristics(
                        $prod,
                        $imgPath,
                        count($imageIndexedProducts) === 0 ? ($options['vision_blueprint'] ?? null) : null
                    );

                    $imageIndexedProducts[] = [
                        'id' => $pId,
                        'name' => $pName,
                        'price' => $fmtPrice,
                        'role' => count($imageIndexedProducts) === 0 ? 'Primary catalog product' : 'Secondary catalog product',
                        'physical_details' => $physicalDetails,
                    ];
                }
            }
        }

        $hasImageInput = ! empty($options['reference_image_paths'])
            || ! empty($options['reference_image_path'])
            || ! empty($options['product_image_url'])
            || count($imageIndexedProducts) > 0;

        $productRefLines = [];
        $productRefLines[] = "PRODUCT REFERENCES:\nPRODUCT / PRODUCT-MIX (PRODUCT FIDELITY & ANCHOR INTEGRATION):";

        if ($hasImageInput) {
            if (count($imageIndexedProducts) > 1) {
                $productRefLines[] = 'PRIMARY & REFERENCE PRODUCT IMAGES:';
                foreach ($imageIndexedProducts as $i => $item) {
                    $imgNum = $i + 1;
                    $pPriceStr = $item['price'] ? " | Exact Price: {$item['price']}" : '';
                    $pIdStr = $item['id'] ? " [Catalog ID: {$item['id']}]" : '';
                    $phys = $item['physical_details'] ?? 'Authentic physical appearance as shown in catalog reference image';
                    $productRefLines[] = "REFERENCE IMAGE {$imgNum}:\n"
                        ."REFERENCE IMAGE {$imgNum} = {$item['name']}{$pIdStr} ({$item['role']}{$pPriceStr})\n"
                        ."• Authoritative Identity Anchor: The physical product shown in Reference Image {$imgNum} is strictly \"{$item['name']}\".\n"
                        ."• PRODUCT VISUAL IDENTITY BINDING:\n"
                        ."  - Product Name: {$item['name']}\n"
                        .'  - Exact Price: '.($item['price'] ?? 'N/A')."\n"
                        .'  - Catalog ID: '.($item['id'] ?? 'N/A')."\n"
                        ."  - Concrete Physical Characteristics: {$phys}\n"
                        ."  - Exclusive Copy Binding: The product name \"{$item['name']}\" and exact price \"".($item['price'] ?? 'N/A').'" belong EXCLUSIVELY to this physical appearance.';
                }
                $productRefLines[] = "• MULTI-IMAGE COMPOSITION DIRECTIVE:\nUse all provided product images as the visual references for the selected products. Preserve the recognizable identity, packaging, proportions, colors, and physical characteristics of each product. Arrange the products together as a cohesive commercial composition. Do not replace, omit, or invent a different product for any supplied reference image.";
                $productRefLines[] = "• AUTHORITATIVE PRODUCT IDENTITY BINDING (CRITICAL RULE):\n  - Every catalog reference image is an independent, immutable product identity record.\n  - NEVER infer product identity or copy from canvas position, prominence, or size (\"looks larger, so must be Product 1\").\n  - Presentation freedom is NOT identity freedom: camera perspective, lighting, and staging may change freely, but Reference Image 1 remains strictly bound to Product 1's copy, and Reference Image 2 to Product 2's copy. No identity swapping under any circumstances.";
            } else {
                $productRefLines[] = "PRIMARY PRODUCT IMAGE:\nUse the supplied catalog product image as the primary visual source of truth for {$productName}. (REFERENCE PRODUCT PRESERVATION MODE)";
            }
            $productRefLines[] = "• PRODUCT IDENTITY VS. CAMERA PRESENTATION ROLE:\nThe supplied catalog product image is the authoritative reference for PRODUCT IDENTITY (what the product is: physical form, container, packaging, labels, branding, colors, and physical markings). The catalog image is NOT a mandatory camera angle, framing, or composition reference.";
        } else {
            $productRefLines[] = "PRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):\n• Reference Image Available: NO (Generative Commercial Scene Mode)\n• Target Product: {$productName}".($productDesc ? " — {$productDesc}" : '').($category ? " (Category: {$category})" : '')."\n• GENERATIVE SCENE DIRECTIVE: Synthesize an authentic, photorealistic commercial product representation of {$productName} integrated naturally as the centerpiece of a COMPLETE MARKETING ADVERTISEMENT SCENE. Do NOT generate an isolated product cutout or plain empty background. Render the full environment, background, atmospheric lighting, contextual props, and commercial visual storytelling as directed by the creative brief below.";
        }

        // Supporting Product Metadata (Vision analysis) — Supplemental only
        if (! empty($visionBlueprint['product_identity'])) {
            $productRefLines[] = "SUPPORTING PRODUCT METADATA (SUPPLEMENTAL):\n• Observed Characteristics: {$visionBlueprint['product_identity']}\n• IMPORTANT: The supplied product image is the primary visual source of truth. Supporting product metadata is supplemental and must not override, replace, reinterpret, or contradict the supplied product image.";
        }

        // Multi-Product composition breakdown if multiple items are present
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

        $totalProductCount = 1 + count($secondaryCatalog) + count($validCustom);
        $isMultiProduct = ($totalProductCount > 1 || count($imageIndexedProducts) > 1);

        $arrangementData = $this->designSystem->resolveProductArrangementStrategy(
            $totalProductCount,
            $renderStyle,
            $aspectRatio,
            $options['product_arrangement'] ?? null
        );
        $strategyName = $arrangementData['strategy'];
        $strategyDesc = $arrangementData['description'];
        $strategyGuidance = $arrangementData['guidance'];

        if ($isMultiProduct) {
            $multiLines = [
                "MULTI-PRODUCT COMPOSITION:\nCO-FEATURED PRODUCTS & SERVICES:\n• All selected catalog products must appear together in the same final marketing scene.\n• Preserve each supplied catalog product as a distinct physical item.",
                '• DISTINCT PHYSICAL PRODUCT INTEGRITY:',
                '  - Every selected product is an immutable, distinct physical item with its own container, form, and labels.',
                '  - Do NOT merge two or more products into a single combined item.',
                '  - Do NOT swap packaging, containers, labels, or branding between products.',
                '  - Do NOT omit any selected product from the composition.',
                '  - Do NOT duplicate one product to replace another.',
                '  - Avoid floating callout boxes, leader lines, dots, or UI cards pointing to products. Products must exist naturally as physical commercial objects.',
            ];

            // Product Hierarchy Breakdown (semantic roles without hardcoded positions)
            $multiLines[] = "• Primary Hero Product: {$productName}";
            $multiLines[] = '• PRODUCT HIERARCHY & ROLES:';
            $multiLines[] = "  - Primary / Hero Product: \"{$productName}\" — Commercial anchor product. Maintain natural relative scale and realistic proportions without forcing artificial physical size or dominance over companion items; allow visual composition to choose prominence naturally while preserving identity → copy mapping.";

            if ($totalProductCount === 2) {
                $secondName = ! empty($secondaryCatalog) ? $secondaryCatalog[0]['name'] : $validCustom[0]['name'];
                $secondDesc = ! empty($secondaryCatalog) ? ($secondaryCatalog[0]['description'] ?? null) : ($validCustom[0]['description'] ?? null);
                $descSuffix = $secondDesc ? " ({$secondDesc})" : '';
                $multiLines[] = "  - Secondary / Supporting Product: \"{$secondName}\"{$descSuffix} — Staged in deliberate visual dialogue with the hero, providing complementary commercial support with clear physical separation.";
            } elseif ($totalProductCount >= 3) {
                // Secondary
                $secondName = ! empty($secondaryCatalog) ? $secondaryCatalog[0]['name'] : ($validCustom[0]['name'] ?? 'Secondary Item');
                $secondDesc = ! empty($secondaryCatalog) ? ($secondaryCatalog[0]['description'] ?? null) : ($validCustom[0]['description'] ?? null);
                $descSuffix2 = $secondDesc ? " ({$secondDesc})" : '';
                $multiLines[] = "  - Secondary / Supporting Product: \"{$secondName}\"{$descSuffix2} — Supporting visual tier flanking, stepped, or layered in depth relative to the hero.";

                // Tertiary
                $thirdName = count($secondaryCatalog) > 1
                    ? $secondaryCatalog[1]['name']
                    : (! empty($validCustom) ? (count($secondaryCatalog) === 1 ? $validCustom[0]['name'] : ($validCustom[1]['name'] ?? 'Tertiary Item')) : 'Tertiary Item');
                $thirdDesc = count($secondaryCatalog) > 1
                    ? ($secondaryCatalog[1]['description'] ?? null)
                    : (! empty($validCustom) ? (count($secondaryCatalog) === 1 ? ($validCustom[0]['description'] ?? null) : ($validCustom[1]['description'] ?? null)) : null);
                $descSuffix3 = $thirdDesc ? " ({$thirdDesc})" : '';
                $multiLines[] = "  - Tertiary / Supporting Product: \"{$thirdName}\"{$descSuffix3} — Complementary supporting tier completing the commercial grouping with intentional depth and balance.";

                // Any additional (4+)
                $remainingItems = array_slice($secondaryCatalog, 2);
                foreach ($remainingItems as $remItem) {
                    $rDesc = ! empty($remItem['description']) ? " ({$remItem['description']})" : '';
                    $multiLines[] = "  - Additional Supporting Product: \"{$remItem['name']}\"{$rDesc} — Harmoniously integrated into the supporting product arrangement.";
                }
            }

            if (! empty($secondaryCatalog)) {
                $multiLines[] = '• Co-Featured Catalog Products:';
                foreach ($secondaryCatalog as $sProd) {
                    $sLine = "  - {$sProd['name']}";
                    if (! empty($sProd['description'])) {
                        $sLine .= ' — '.Str::limit($sProd['description'], 100);
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

            // Semantic Composition Strategy
            $multiLines[] = "• MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: {$strategyName} ({$strategyDesc})";
            $multiLines[] = "• STAGING MANDATE: DO NOT align products in a flat side-by-side row or generic horizontal line. STAGING MANDATE: DO NOT align products in a flat side-by-side row, generic horizontal line, or rigid grid. Stage all selected products together using an explicit {$strategyName} spatial relationship (e.g., primary hero product commanding foreground focus, companion items layered at deliberate depths or stepped pedestals with realistic contact shadows).";
            $multiLines[] = "• COMPOSITION GUIDANCE: {$strategyGuidance}";
            $multiLines[] = '• NATURAL COMPOSITION PROMINENCE: Allow the visual composition to choose prominence naturally between products according to realistic commercial scale. Do NOT force the smaller product to be an artificially dominant physical object merely because it is Product 1. Preserve the identity → copy mapping regardless of which product is larger, closer, or more prominent on the canvas.';

            // Canvas & Aspect Ratio Responsiveness (No Hardcoded Positions)
            $aspectRatioGuidance = match ($aspectRatio) {
                '9:16', '4:5' => 'For vertical canvas, utilize vertical depth planes, tiered surface heights, and foreground-to-background layering to showcase all items with distinct clearance rather than cramping them into a narrow horizontal line.',
                '16:9', '4:3' => 'For horizontal canvas, utilize lateral negative space, diagonal depth, and staggered staging to create a balanced commercial spread with generous breathing room, avoiding vertical stacking.',
                default => 'For square canvas, utilize a balanced, cohesive focal grouping with intentional depth layers, stepped surfaces, and comfortable spatial clearance around all items.',
            };
            $multiLines[] = "• CANVAS & ASPECT RATIO RESPONSIVENESS (NO HARDCODED POSITIONS): Do NOT hardcode fixed pixel coordinates, permanent left/center/right assignments, or rigid percentage boundaries. The composition must adapt organically to the {$aspectRatio} canvas: {$aspectRatioGuidance} The image model determines the best commercial arrangement within these creative parameters.";

            // User Composition Direction Precedence
            $multiLines[] = '• USER COMPOSITION DIRECTION PRECEDENCE: When the user\'s explicit creative direction in Section 4 specifies a spatial arrangement, product placement, or camera composition (e.g., "closest to camera", "triangular grouping", "staged on wooden blocks", "flat-lay overhead"), follow that directive as supreme creative authority over the system\'s default arrangement strategy. The system strategy serves as the structured fallback when user direction is open-ended.';

            // Phase A Identity vs Presentation in Multi-Product Staging
            $multiLines[] = '• PRODUCT IDENTITY VS. PRESENTATION IN MULTI-PRODUCT STAGING: Each referenced product\'s catalog image is the authoritative identity reference for WHAT that product is (physical form, container, packaging, labels, branding, colors, and markings). However, the catalog image does NOT dictate camera angle or isolated composition. Each product may be creatively rotated, reoriented, angled (e.g., three-quarter or eye-level), and staged with realistic contact shadows and depth relative to companion items.';
            $multiLines[] = '• MULTI-PRODUCT IDENTITY-TO-COPY INTEGRITY: Reference Image 1 remains bound to Product 1\'s copy, and Reference Image 2 to Product 2\'s copy without swapping.';

            $productRefLines[] = implode("\n", $multiLines);
        }

        $modules[] = implode("\n\n", $productRefLines);

        // ---------------------------------------------------------------------
        // 3. PRODUCT PRESERVATION REQUIREMENTS
        // ---------------------------------------------------------------------
        $preservationLines = [
            "PRODUCT PRESERVATION REQUIREMENTS:\nPRODUCT PRESERVATION:",
            '• PRESERVATION RULE: Preserve the recognizable identity of the actual supplied product, including when applicable: shape, proportions, container, glassware, packaging, labels, visible branding, colors, distinctive textures, liquid layers, toppings, and physical accessories. Do not reconstruct or invent a replacement product. Creative changes should primarily affect the environment, lighting, atmosphere, background, props, composition, and campaign presentation surrounding the product.',
            '• PRODUCT IDENTITY VS. PRODUCT PRESENTATION (CONTROLLED CAMERA FREEDOM):',
            '  - Authoritative Identity Anchor (What the product is): The catalog image is the authoritative anchor for physical product type, packaging structure, container form, labels, branding, colors, and physical markings. It represents the actual product being advertised, not generic inspiration. Do NOT substitute, redesign, merge, or replace the product with a generic alternative.',
            '  - Controlled Presentation Freedom (How the product is presented): The catalog photograph is an identity reference, not a mandatory camera or composition reference. Unless the user explicitly requests the source perspective or changing perspective would materially compromise recognition of the product, do NOT literally copy flat-lay or awkward overhead catalog viewpoints. When appropriate, present the product from a more attractive commercial perspective (such as an eye-level, slightly elevated, or three-quarter product-photography view).',
            '  - Creative Presentation Scope: While keeping product identity strictly faithful, you are encouraged to create an intentional commercial viewpoint, commercial depth, believable staging, authentic reflections, realistic contact shadows, and refined lighting.',
            '• USER CAMERA DIRECTION PRECEDENCE: When the user\'s explicit creative direction in Section 4 specifies a camera angle or viewpoint (e.g., eye-level, low-angle hero, flat-lay), follow that user directive with high authority. When no camera angle is specified by the user, select an attractive commercial product perspective rather than defaulting to the catalog photograph\'s raw camera angle.',
        ];
        $modules[] = implode("\n", $preservationLines);

        // ---------------------------------------------------------------------
        // 4. USER CREATIVE DIRECTION
        // ---------------------------------------------------------------------
        $userCreativeLines = ['USER CREATIVE DIRECTION:'];
        if ($generationMode === 'automatic') {
            $userCreativeLines[] = 'AUTOMATIC AI CREATIVE DIRECTION (Primary Campaign Concept & Visual Strategy):';
            if (! empty($options['creative_concept'])) {
                $userCreativeLines[] = "• Creative Concept: {$options['creative_concept']}";
            }
            if (! empty($options['visual_strategy'])) {
                $userCreativeLines[] = "• Visual Strategy: {$options['visual_strategy']}";
            }
            if (! empty($userScenePrompt) && ! Str::startsWith($userScenePrompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
                $userCreativeLines[] = "• AI Visual Scene: {$userScenePrompt}";
            }
            $userCreativeLines[] = "• PRIMARY CREATIVE SCENE: Realize this campaign-specific creative direction conceived by the AI Creative Director, tailored to the campaign objective, linked event, and industry standards while keeping {$productName} as the undisputed hero.";
        } else {
            $userCreativeLines[] = "USER SCENE DIRECTION:\nUSER SCENE / VISUAL DIRECTION:";
            if (! empty($userScenePrompt) && ! Str::startsWith($userScenePrompt, 'PROMOTIONAL ADVERTISEMENT BRIEF:')) {
                $userCreativeLines[] = "• PRIMARY USER SCENE DIRECTION: {$userScenePrompt}";
                $userCreativeLines[] = "• PRIMARY SCENE INSTRUCTION: Fulfill this specific scene setting, props, environment, and visual atmosphere with high authority while keeping {$productName} as the focal centerpiece. Do not replace with an autonomous AI concept. The user's creative direction is authoritative and must not be overwritten or normalized to a generic studio setup.";
            } else {
                $userCreativeLines[] = "• PRIMARY USER SCENE DIRECTION: Standard commercial product presentation\n• PRIMARY SCENE INSTRUCTION: Present {$productName} in a clean, professional commercial setting reflecting the selected render style, design treatment, and brand tone.";
            }
        }

        // Creative Variation Directive
        if (! empty($options['is_variation'])) {
            $userCreativeLines[] = "CREATIVE VARIATION DIRECTIVE:\n"
                ."• Synthesize a distinct creative variation of this marketing scene.\n"
                ."• Vary the visual world, scene family, environment, composition, camera framing, lighting atmosphere, environmental arrangement, and supporting props to deliver a fresh aesthetic perspective.\n"
                ."• STRICT FIDELITY PRESERVATION: Preserve the exact identity, packaging, labels, colors, and physical attributes of all selected products.\n"
                .'• Maintain all designated marketing copy, brand tones, visual themes, safe margins, and negative space for final application text layers.';
        }

        // Campaign / Event Context
        if (! empty($options['campaign_name']) || ! empty($options['campaign_objective'])) {
            $campLines = [];
            if (! empty($options['campaign_name'])) {
                $campLines[] = "• Campaign: {$options['campaign_name']}";
            }
            if (! empty($options['campaign_objective'])) {
                $campLines[] = "• Goal: {$options['campaign_objective']}";
            }
            $userCreativeLines[] = "CAMPAIGN / EVENT CONTEXT:\nCAMPAIGN:\n".implode("\n", $campLines);
        }

        if (! empty($options['event_name'])) {
            $eventName = (string) $options['event_name'];
            $eventDirection = $this->resolveStructuredEventDirection($eventName, $productName, $aspectRatio);
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN)
                : true;

            $eventLines = [
                "EVENT / HOLIDAY VISUAL INFLUENCE:\nEVENT DIRECTION:",
            ];

            if ($generationMode === 'automatic') {
                $eventLines[] = "EVENT DIRECTION (CREATIVE DRIVER):\n• ROLE: Creative Driver\n{$eventDirection}\n• Creative driver rule: Event and campaign objective actively guide thematic storytelling, festive styling, lighting, and props around {$productName}.";
            } else {
                $eventLines[] = "EVENT DIRECTION (CONTEXTUAL):\n{$eventDirection}\n• Subordination rule: Event elements provide contextual atmosphere and holiday mood; they must complement {$productName} and must not erase the user's explicit scene prompt or product identity.\n• PRIORITY ORDER: Product preservation > Explicit Manual user scene direction > Explicit Manual creative controls > Event visual influence > Campaign context > Generic defaults. Event visual influence must complement and harmonize with the user's scene direction without overriding or replacing it.";
            }

            $eventLines[] = "• Visual Influence Rule: The event/holiday ALWAYS directs scene mood, environment, atmosphere, props, materials, lighting, and visual storytelling around {$productName}. This visual influence remains fully active whether event text is visible or hidden.";

            // Explicit Event Text Visibility Section
            if ($showEventText) {
                $eventLines[] = "EVENT TEXT VISIBILITY: ALLOWED\n"
                    ."• The exact selected event/holiday name \"{$eventName}\" may appear as visible typography when it fits the composition and negative space.\n"
                    ."• It is permitted but NOT mandatory to render the event name as text.\n"
                    ."• Exact wording rule: If rendered as text, use the exact name \"{$eventName}\". Do NOT invent additional event slogans, alternate shortened names, or marketing headlines.";
            } else {
                $eventLines[] = "EVENT TEXT VISIBILITY: FORBIDDEN\n"
                    ."• STRICT TEXT BAN: The event/holiday name (\"{$eventName}\"), shortened event names, or event-derived slogans are STRICTLY FORBIDDEN from appearing as visible text, typography, headlines, or badges anywhere in the image.\n"
                    .'• Retain all event visual styling, props, materials, colors, and celebratory atmosphere, but do NOT render any textual words naming the event or holiday.';
            }

            $userCreativeLines[] = implode("\n", $eventLines);
        }

        $modules[] = implode("\n", $userCreativeLines);

        // ---------------------------------------------------------------------
        // 5. CREATIVE WORLD / SCENE
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['scene_family'])) {
            $sceneLines = [
                'CREATIVE WORLD / SCENE:',
                '• Scene World: DERIVE FROM PRIMARY USER SCENE DIRECTION. Construct the exact physical realm, architectural space, or stylistic world described in the user\'s scene prompt.',
                '• Scene Staging Directive: Fully realize the user\'s authored scene setting without falling back to generic studio or commercial room defaults.',
            ];
        } else {
            $sceneFamily = ! empty($options['scene_family'])
                ? (MarketingDesignSystem::SCENE_FAMILIES[$options['scene_family']] ?? null ? $options['scene_family'] : ($this->designSystem->validateSceneFamily($options['scene_family']) ?? 'studio'))
                : 'studio';
            $sceneDesc = MarketingDesignSystem::SCENE_FAMILIES[$sceneFamily] ?? 'Controlled professional commercial environment.';
            $archetypeKey = $options['visual_world_archetype'] ?? null;
            $archetypeSpec = $archetypeKey ? $this->designSystem->resolveVisualArchetype($archetypeKey) : null;

            $sceneLines = [
                'CREATIVE WORLD / SCENE:',
                "• Scene Family: {$sceneFamily} ({$sceneDesc})",
            ];
            if ($archetypeSpec) {
                $archLabel = $archetypeSpec['label'] ?? ($archetypeSpec['name'] ?? $archetypeKey);
                $sceneLines[] = "• Visual World Archetype: {$archLabel} — {$archetypeSpec['description']}";
            }
            if (! empty($options['visual_world'])) {
                $sceneLines[] = "• Visual World: {$options['visual_world']}";
            }
            if (! empty($options['background_style'])) {
                $bgStyleDesc = MarketingDesignSystem::BACKGROUND_STYLES[$options['background_style']] ?? $options['background_style'];
                $sceneLines[] = "• Background Style Treatment: {$options['background_style']} ({$bgStyleDesc})";
            }
            $sceneLines[] = "• Scene Staging Directive: Construct an evocative visual world adhering to {$sceneFamily}. Prevent repeated generic studio or beige lifestyle defaults; establish a distinctive physical or stylized realm tailored to this product.";
        }
        $modules[] = implode("\n", $sceneLines);

        // ---------------------------------------------------------------------
        // 6. ENVIRONMENT
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['environment_family'])) {
            $modules[] = "ENVIRONMENT:\n"
                ."• Environment Setting: DERIVE FROM PRIMARY USER SCENE DIRECTION. Stage the exact surfaces, materials, textures, and atmospheric environment specified in the user's creative direction rather than a seamless studio backdrop.\n"
                ."• Surface & Materiality: Render the surfaces, reflections, architectural elements, or natural materials requested by the user in authentic detail supporting {$productName}.";
        } else {
            $environmentFamily = ! empty($options['environment_family'])
                ? (MarketingDesignSystem::ENVIRONMENT_FAMILIES[$options['environment_family']] ?? null ? $options['environment_family'] : $this->designSystem->validateEnvironmentFamily($options['environment_family']))
                : 'clean_seamless_studio';
            $envDesc = MarketingDesignSystem::ENVIRONMENT_FAMILIES[$environmentFamily] ?? 'Refined commercial surface with calibrated depth and high-end material finish.';

            $modules[] = "ENVIRONMENT:\n"
                ."• Environment Setting: {$environmentFamily} ({$envDesc})\n"
                ."• Surface & Materiality: Stage realistic architectural or organic surfaces, premium material textures, and natural depth planes supporting {$productName}.";
        }

        // ---------------------------------------------------------------------
        // 7. COMPOSITION
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['composition_type'])) {
            $compLines = [
                "COMPOSITION:\nCAMERA, LIGHTING & SCENE GEOMETRY:",
                "• Composition Geometry: DERIVE FROM PRIMARY USER SCENE DIRECTION. Follow the user's framing, subject placement, and layout directives (e.g., asymmetric, off-center, diagonal, or unusual geometry) with priority over standard centered layouts.",
            ];
            if ($isMultiProduct) {
                $compLines[] = "• Multi-Product Staging Strategy: {$strategyName} ({$strategyDesc}) — deliberate spatial composition avoiding flat side-by-side arrangement, creating believable commercial depth and clear product separation.";
                $compLines[] = '• User Placement Precedence: Honor any specific product placement or grouping requested in the user scene prompt over default staging.';
            }
            $compLines[] = "• Focal Dominance: {$productName} remains the recognizable hero product, positioned in accordance with the user's spatial and compositional instructions. Distribute negative space intentionally to support marketing typography and natural depth.";
        } else {
            $rawComp = ! empty($options['composition_type']) ? trim((string) $options['composition_type']) : null;
            $compositionType = ! empty($options['composition_type'])
                ? (MarketingDesignSystem::COMPOSITION_TYPES[$options['composition_type']] ?? null ? $options['composition_type'] : $this->designSystem->validateCompositionType($options['composition_type']))
                : 'centered hero';
            $compDesc = MarketingDesignSystem::COMPOSITION_TYPES[$compositionType] ?? 'Balanced commercial composition anchoring the product as the hero.';

            $compLines = [
                "COMPOSITION:\nCAMERA, LIGHTING & SCENE GEOMETRY:",
            ];
            if ($rawComp && $rawComp !== $compositionType) {
                $compLines[] = "• Composition Geometry: {$rawComp}";
            }
            $compLines[] = "• Composition Geometry: {$compositionType} ({$compDesc})";
            if (! empty($options['product_arrangement'])) {
                $compLines[] = "• Multi-Product Staging: {$options['product_arrangement']} — deliberate spatial composition avoiding flat side-by-side arrangement.";
            } elseif ($isMultiProduct) {
                $compLines[] = "• Multi-Product Staging: {$strategyName} — deliberate spatial composition avoiding flat side-by-side arrangement, creating believable commercial depth and clear product separation.";
            }
            $compLines[] = "• Focal Dominance: {$productName} commands primary visual authority. Negative space is deliberately distributed to support marketing typography and natural depth.";
        }
        $modules[] = implode("\n", $compLines);

        // ---------------------------------------------------------------------
        // 8. CAMERA
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['camera_viewpoint'])) {
            $camLines = [
                'CAMERA:',
                '• Camera Perspective: DERIVE FROM PRIMARY USER SCENE DIRECTION. Adopt the camera angle, viewpoint, or lens perspective specified by the user\'s scene prompt (e.g., eye-level, low-angle hero, or dynamic perspective). If the user prompt does not specify a camera angle, present the product from an attractive commercial advertising perspective (such as eye-level or three-quarter product view) that showcases its packaging, label, and form, rather than inheriting an awkward or flat-lay catalog camera angle.',
            ];
        } else {
            $rawCam = ! empty($options['camera_viewpoint']) ? trim((string) $options['camera_viewpoint']) : null;
            $cameraViewpoint = ! empty($options['camera_viewpoint'])
                ? (MarketingDesignSystem::CAMERA_VIEWPOINTS[$options['camera_viewpoint']] ?? null ? $options['camera_viewpoint'] : $this->designSystem->validateCameraViewpoint($options['camera_viewpoint']))
                : 'three-quarter';
            $camDesc = MarketingDesignSystem::CAMERA_VIEWPOINTS[$cameraViewpoint] ?? 'Elevated commercial studio angle displaying optimal product geometry and depth.';

            $camLines = ['CAMERA:'];
            if ($rawCam && $rawCam !== $cameraViewpoint) {
                $camLines[] = "• Camera Perspective: {$rawCam}";
            }
            $camLines[] = "• Camera Perspective: {$cameraViewpoint}";
            $camLines[] = "• Canonical Specification: {$camDesc}";
        }
        $modules[] = implode("\n", $camLines);

        // ---------------------------------------------------------------------
        // 9. LIGHTING
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['lighting_profile'])) {
            $lightLines = [
                'LIGHTING:',
                '• Lighting Profile: DERIVE FROM PRIMARY USER SCENE DIRECTION. Execute the exact lighting style requested by the user (e.g., dramatic side lighting, neon rim, golden hour, overhead, high-contrast chiaroscuro, or moody reflections) rather than standard commercial softbox.',
            ];
        } else {
            $rawLight = ! empty($options['lighting_profile']) ? trim((string) $options['lighting_profile']) : null;
            $lightingProfile = ! empty($options['lighting_profile'])
                ? (MarketingDesignSystem::LIGHTING_PROFILES[$options['lighting_profile']] ?? null ? $options['lighting_profile'] : $this->designSystem->validateLightingProfile($options['lighting_profile']))
                : 'soft diffused';
            $lightDesc = MarketingDesignSystem::LIGHTING_PROFILES[$lightingProfile] ?? 'Controlled commercial softbox lighting with soft contact shadows and razor-sharp clarity.';

            $lightLines = ['LIGHTING:'];
            if ($rawLight && $rawLight !== $lightingProfile) {
                $lightLines[] = "• Lighting Profile: {$rawLight}";
            }
            $lightLines[] = "• Lighting Profile: {$lightingProfile}";
            $lightLines[] = "• Canonical Specification: {$lightDesc}";
        }
        $modules[] = implode("\n", $lightLines);

        // ---------------------------------------------------------------------
        // 10. PROPS
        // ---------------------------------------------------------------------
        if ($isManualWithPrompt && empty($options['prop_profile'])) {
            $modules[] = "PROPS & SCENE STAGING:\n"
                ."PROPS:\n"
                ."• Prop Staging Profile: DERIVE FROM PRIMARY USER SCENE DIRECTION. Stage the exact contextual props, environmental elements, and scene details specified in the user's creative brief.\n"
                ."• Contextual Prop Directive: Props must complement and elevate {$productName}, remaining strictly subordinate to the product.";
        } else {
            $propProfile = ! empty($options['prop_profile'])
                ? (MarketingDesignSystem::PROP_PROFILES[$options['prop_profile']] ?? null ? $options['prop_profile'] : $this->designSystem->validatePropProfile($options['prop_profile']))
                : 'minimalist pedestals';
            $propDesc = MarketingDesignSystem::PROP_PROFILES[$propProfile] ?? 'Clean minimalist staging props highlighting the hero product.';

            $modules[] = "PROPS & SCENE STAGING:\n"
                ."PROPS:\n"
                ."• Prop Staging Profile: {$propProfile} ({$propDesc})\n"
                ."• Contextual Prop Directive: Props must complement and elevate {$productName}, remaining strictly subordinate to the product.";
        }

        // ---------------------------------------------------------------------
        // 11. DESIGN TREATMENT
        // ---------------------------------------------------------------------
        $designTreatment = $this->designSystem->validateDesignTreatment($options['design_treatment'] ?? 'Classic');
        $treatmentDesc = $this->designSystem->resolveDesignTreatmentSpec($designTreatment);
        $earlyCopyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? 'Balanced');
        $earlyTypoLayout = $options['typography_layout'] ?? $options['copy_layout'] ?? null;

        $dtLines = [
            "DESIGN TREATMENT:\nMARKETING DESIGN TREATMENT & TYPOGRAPHY LAYOUT:",
            "• Selected Treatment: {$designTreatment}",
            "• Design Treatment: {$designTreatment}",
            "• Canonical Specification: {$treatmentDesc}",
            "• Copy Emphasis: {$earlyCopyEmphasis}",
        ];
        if ($earlyTypoLayout) {
            $dtLines[] = "• Typography Layout: {$earlyTypoLayout}";
        }
        $dtLines[] = '• Design Execution: Establish intentional spatial structure, margins, and visual contrast reflecting this treatment.';

        $modules[] = implode("\n", $dtLines);

        // ---------------------------------------------------------------------
        // 12. RENDER STYLE
        // ---------------------------------------------------------------------
        $renderStyle = $options['render_style'] ?? $options['content_style'] ?? 'Studio Product Still';
        $renderStyleSpec = $this->resolveRenderStyleSpec($renderStyle);
        if ($isManualWithPrompt && $renderStyle === 'Studio Product Still') {
            $renderStyleSpec .= "\n• Subordination Rule: When PRIMARY USER SCENE DIRECTION specifies a distinctive environment, lighting, or setting, maintain high-fidelity product rendering while fully honoring the user's specific world and atmosphere rather than imposing a sterile white/neutral cyclorama studio.";
        }

        $modules[] = "RENDER STYLE:\n{$renderStyleSpec}";

        // ---------------------------------------------------------------------
        // 13. VISUAL THEME
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
            $themeSection = "VISUAL THEME:\n{$themeDesc} (enrich background environment with harmonious props that complement the user scene)\nCanonical Theme Staging:\n".implode("\n", $themeLines);
            if ($isManualWithPrompt) {
                $themeSection .= "\n• Subordination Rule: The visual themes provide complementary aesthetic flavor; the user's scene direction takes precedence for specific lighting and environmental choices.";
            }
            $modules[] = $themeSection;
        } else {
            $modules[] = "VISUAL THEME:\nClean commercial aesthetic enriching the background environment with harmonious materials complementary to the product.";
        }

        // ---------------------------------------------------------------------
        // 14. BRAND TONE
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
            $brandToneLines = ["BRAND TONE & IDENTITY:\nBRAND IDENTITY:\nBRAND TONE:\n{$toneDesc} (calibrate visual personality and lighting mood without overriding product fidelity or replacing requested physical scenes with arbitrary party props)\nCanonical Tone Direction:\n".implode("\n", $toneLines)];
        } else {
            $brandToneLines = ["BRAND TONE & IDENTITY:\nBRAND IDENTITY:\nBRAND TONE:\nProfessional, polished commercial branding with calibrated visual personality and lighting mood."];
        }

        // Industry & Category Art Direction
        $industry = $options['business_industry'] ?? $business->industry ?? 'General';
        $businessCategory = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? 'General';
        $artDirectionData = $this->artDirectionService->resolveArtDirection((string) $industry, (string) $businessCategory, $productName);
        $brandToneLines[] = $this->artDirectionService->formatForPrompt($artDirectionData, $productName);

        // Business Context details
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

            $brandToneLines[] = "BUSINESS CONTEXT:\n".implode("\n", $bizContextLines);
        }

        $modules[] = implode("\n\n", $brandToneLines);

        // ---------------------------------------------------------------------
        // 15. TYPOGRAPHIC ART DIRECTION
        // ---------------------------------------------------------------------
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? 'Balanced');
        $emphasisDesc = $this->designSystem->resolveCopyEmphasisSpec($copyEmphasis);

        $copyLayout = $this->designSystem->validateCopyLayout($options['copy_layout'] ?? $options['typography_layout'] ?? null);
        $productNameStyle = $this->designSystem->validateProductNameStyle($options['product_name_style'] ?? null);
        $priceStyle = $this->designSystem->validatePriceStyle($options['price_style'] ?? null);
        $taglineStyle = $this->designSystem->validateTaglineStyle($options['tagline_style'] ?? null);

        $copyLayoutDesc = MarketingDesignSystem::COPY_LAYOUTS[$copyLayout] ?? 'Harmonious commercial advertising copy arrangement.';
        $productNameStyleDesc = MarketingDesignSystem::PRODUCT_NAME_STYLES[$productNameStyle] ?? 'Clean, high-end commercial product title styling.';
        $priceStyleDesc = MarketingDesignSystem::PRICE_STYLES[$priceStyle] ?? 'Integrated commercial price typography.';
        $taglineStyleDesc = MarketingDesignSystem::TAGLINE_STYLES[$taglineStyle] ?? 'Impactful marketing headline typography.';

        $renderStyleTypoGuidance = match (strtolower(trim($renderStyle))) {
            'studio_product_still', 'studio product still' => '• Render Style Typography Art Direction: Premium, restrained, polished commercial product typography with clean lines, high-end editorial hierarchy, and clear physical product association.',
            'cinematic_marketing', 'cinematic marketing' => '• Render Style Typography Art Direction: Stronger campaign-style hierarchy and dramatic advertising typography integrated organically with scene depth, lighting, and narrative atmosphere while preserving product readability.',
            'lifestyle_capture', 'lifestyle capture' => '• Render Style Typography Art Direction: Editorial lifestyle typography integrated into natural negative space, authentic contextual layout, and complete avoidance of plain unstyled metadata or artificial UI-like labels.',
            'minimalist_graphic', 'minimalist graphic', 'minimalist graphic vec' => '• Render Style Typography Art Direction: Clean, deliberate, highly controlled typographic system with generous whitespace, strong alignment, and restrained graphic advertising treatment without becoming a dashboard, app UI, or wireframe.',
            default => '• Render Style Typography Art Direction: Refined commercial advertising typography with intentional hierarchy and natural visual association with the physical product.',
        };

        $typoArtLines = [
            "TYPOGRAPHIC ART DIRECTION:\nTYPOGRAPHY / COPY PLACEMENT (FINAL ARTWORK DESIGN):",
            '• COMPLETE DESIGN MANDATE: GPT Image 2 is the final visual and typographic designer. Determine the final typography, typographic personality, and layout hierarchy based on:',
            "  - Design Treatment: {$designTreatment} ({$treatmentDesc})",
            "  - Copy Emphasis: {$copyEmphasis} ({$emphasisDesc})",
            "  - Render Style: {$renderStyle}",
            '  - Brand Tone & Visual Theme',
            "  - Canvas Aspect Ratio: {$aspectRatio}",
            '  - Available negative space in the composition',
            "• Copy Layout: {$copyLayout} ({$copyLayoutDesc})",
            "• Product Name Typographic Style: {$productNameStyle} ({$productNameStyleDesc})",
            "• Price Typographic Style: {$priceStyle} ({$priceStyleDesc})",
            "• Tagline Typographic Style: {$taglineStyle} ({$taglineStyleDesc})",
            '• Composition-Aware Placement: Dynamically place typography in available negative-space regions relative to the product silhouette, lighting, and aspect ratio.',
            '• Do NOT place text arbitrarily or cover the primary product, packaging, or labels.',
            '• Typographic Hierarchy & Spacing: Maintain intentional visual rhythm and scale distinction between Headline/Tagline, Business Name, and Price, keeping comfortable breathing room between text and product without stacking into an unreadable block.',
            '• Contrast & Readability: Ensure crisp legibility and high contrast against the scene background using commercial advertising typography tailored to the brand tone and industry, soft contact shadows, or subtle dimensional separation without generic UI boxes.',
            '• DESIGNED ADVERTISING TYPOGRAPHY (NEVER PLAIN METADATA OR DATABASE LABELS): Product names and prices must NEVER look like plain metadata or database labels. Treat all enabled copy as intentional advertising typography designed with typographic scale, weight contrast, and visual rhythm without altering authoritative wording, digits, or currency.',
            '• COHERENT NAME + PRICE TYPOGRAPHIC UNIT: For each product, its name and price must form a visually coherent typographic unit placed together in nearby negative space, establishing the commercial relationship with the physical item.',
            '• POSITIVE TYPOGRAPHY GROUNDING & PRODUCT-COPY ASSOCIATION: Integrate copy naturally into the commercial composition so each item is clearly associated through proximity, alignment, scale, and negative space without arbitrary floating. Communicate the natural commercial relationship: Physical Product ↕ Product Name ↕ Price.',
            '• ZERO CONNECTOR GRAPHICS: Never use leader lines, pointer lines, arrows, anchor dots, callout stems, or connection strokes between products and copy. The relationship is strictly [Product ↔ nearby copy through visual composition], NEVER [Product ↔ graphical connector ↔ copy].',
            '• NO FIXED COORDINATES / NO UI CALLOUTS: Do not use fixed pixel coordinates, rigid percentage locations, permanent left/right assignments, or hardcoded text boxes. Do NOT draw leader lines, pointer arrows, connector lines, anchor dots, callout cards, UI panels, dashboard labels, or floating badges (unless a selected render style explicitly calls for a tasteful graphic treatment, which must remain polished advertising, not an app interface). Ground copy through visual composition, proximity, and typographic hierarchy.',
            $renderStyleTypoGuidance,
            '• Product Name & Price Typographic Hierarchy: Where both product name and price are displayed, establish an intentional typographic hierarchy (e.g., PRODUCT NAME paired comfortably with its corresponding price) through proximity, visual grouping, and alignment without forcing rigid coordinates or fixed stacking order.',
        ];
        $modules[] = implode("\n", $typoArtLines);

        // ---------------------------------------------------------------------
        // 16. COPY CONTENT
        // ---------------------------------------------------------------------
        $includeProductName = array_key_exists('include_product_name', $options)
            ? filter_var($options['include_product_name'], FILTER_VALIDATE_BOOLEAN)
            : true;

        $includePrices = array_key_exists('include_prices', $options)
            ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN)
            : true;

        $includeTagline = array_key_exists('include_tagline', $options)
            ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN)
            : (($options['tagline_mode'] ?? null) !== 'none');

        $normalizedTagline = TaglineNormalizationService::normalize($options['tagline'] ?? null);

        $copyBlockLines = [
            "COPY CONTENT:\nMARKETING COPY:\nMARKETING COPY — FINAL DESIGN TEXT:\nFINAL MARKETING COPY — MUST APPEAR VISIBLY IN THE IMAGE:\n",
        ];

        if ($includeProductName) {
            $copyBlockLines[] = "PRODUCT NAME:\n\"{$productName}\"";
            $copyBlockLines[] = "• Hero Product: \"{$productName}\"";
            $copyBlockLines[] = "• Hero Product: {$productName}";
            $copyBlockLines[] = "• Product Name Grounding: The product name \"{$productName}\" must be visually grounded with the physical hero product through intentional proximity, scale, and alignment, feeling like an authentic commercial title rather than disconnected floating text.";

            if (! empty($secondaryCatalog)) {
                foreach ($secondaryCatalog as $sc) {
                    $copyBlockLines[] = "• Co-Featured Product: \"{$sc['name']}\"";
                    $copyBlockLines[] = "  - Visually ground \"{$sc['name']}\" with its physical companion product in the composition.";
                }
            }
        } else {
            $copyBlockLines[] = "INCLUDE PRODUCT NAME = FALSE:\n• PRODUCT NAME: Disabled.\nDo not render the product name as visible marketing text typography.\nThe physical product itself MUST remain visually present as the hero subject, but its name should not be intentionally rendered as visible copy.";
        }

        // PRICE BLOCK
        if ($includePrices) {
            $allProducts = [];

            if (! empty($options['catalog_products'])) {
                foreach ($options['catalog_products'] as $idx => $prod) {
                    $pId = is_array($prod) ? ($prod['id'] ?? null) : ($prod->id ?? null);
                    $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                    $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;

                    // Fallback to options['prices'] if product price is missing
                    if (($pPrice === null || $pPrice === '') && ! empty($options['prices']) && is_array($options['prices'])) {
                        if ($pId && isset($options['prices'][(string) $pId])) {
                            $pPrice = $options['prices'][(string) $pId];
                        } elseif (isset($options['prices'][$pName])) {
                            $pPrice = $options['prices'][$pName];
                        }
                    }

                    $pImgPath = null;
                    if (isset($options['reference_image_paths'][$idx])) {
                        $pImgPath = $options['reference_image_paths'][$idx];
                    } elseif ($idx === 0 && ! empty($options['reference_image_path'])) {
                        $pImgPath = $options['reference_image_path'];
                    } elseif ($idx === 0 && ! empty($options['product_image_url'])) {
                        $pImgPath = $options['product_image_url'];
                    } elseif (is_array($prod) && ! empty($prod['image_path'])) {
                        $pImgPath = $prod['image_path'];
                    } elseif (is_object($prod) && ! empty($prod->image_path)) {
                        $pImgPath = $prod->image_path;
                    }

                    $physicalDetails = $this->resolveProductPhysicalCharacteristics(
                        $prod,
                        $pImgPath,
                        $idx === 0 ? ($options['vision_blueprint'] ?? null) : null
                    );

                    $allProducts[] = [
                        'id' => $pId,
                        'name' => $pName,
                        'price' => $pPrice,
                        'physical_details' => $physicalDetails,
                    ];
                }
            }

            if (! empty($options['custom_products']) && is_array($options['custom_products'])) {
                foreach ($options['custom_products'] as $cIdx => $cProd) {
                    $cName = is_array($cProd) ? ($cProd['name'] ?? null) : ($cProd->name ?? null);
                    $cPrice = is_array($cProd) ? ($cProd['price'] ?? null) : ($cProd->price ?? null);
                    $cDesc = is_array($cProd) ? ($cProd['description'] ?? null) : ($cProd->description ?? null);
                    if (! empty($cName)) {
                        if (($cPrice === null || $cPrice === '') && ! empty($options['prices']) && is_array($options['prices'])) {
                            if (isset($options['prices']["custom_{$cIdx}"])) {
                                $cPrice = $options['prices']["custom_{$cIdx}"];
                            } elseif (isset($options['prices'][$cName])) {
                                $cPrice = $options['prices'][$cName];
                            }
                        }
                        $allProducts[] = [
                            'id' => "custom_{$cIdx}",
                            'name' => $cName,
                            'price' => $cPrice,
                            'physical_details' => ! empty($cDesc) ? trim((string) $cDesc) : null,
                        ];
                    }
                }
            }

            // If no catalog/custom products array, fallback to primary product
            if (empty($allProducts)) {
                $physicalDetails = $this->resolveProductPhysicalCharacteristics(
                    null,
                    $options['reference_image_path'] ?? ($options['product_image_url'] ?? null),
                    $options['vision_blueprint'] ?? null
                );
                $allProducts[] = [
                    'id' => null,
                    'name' => $productName,
                    'price' => $options['price'] ?? null,
                    'physical_details' => $physicalDetails,
                ];
            }

            $isMultiProduct = count($allProducts) > 1;

            if ($isMultiProduct) {
                // MULTI-PRODUCT PRICING (Exact indexed product-price mapping)
                $multiPriceLines = [];
                $multiPriceSummary = [];
                $associationPairs = [];
                $bindingLines = [];
                foreach ($allProducts as $idx => $item) {
                    $num = $idx + 1;
                    $pName = $item['name'];
                    $rawP = $item['price'];
                    $fmt = 'N/A';
                    if ($rawP !== null && $rawP !== '') {
                        $rawPStr = trim((string) $rawP);
                        $fmt = is_numeric($rawPStr) ? '₱'.number_format((float) $rawPStr, 2) : (str_starts_with($rawPStr, '₱') ? $rawPStr : '₱'.ltrim($rawPStr));
                        $multiPriceLines[] = "• Product {$num} (\"{$pName}\"):\n  Exact price: {$fmt}";
                        $multiPriceSummary[] = "Product {$num} (\"{$pName}\"): {$fmt}";
                        $associationPairs[] = "Product {$num} (\"{$pName}\") ↔ {$fmt}";
                    } else {
                        $associationPairs[] = "Product {$num} (\"{$pName}\")";
                    }

                    $pIdVal = $item['id'] ?? "product_{$num}";
                    $phys = $item['physical_details'] ?? 'Authentic physical appearance as shown in catalog reference image';
                    $bindingLines[] = "• Product {$num} Visual Identity Binding:\n"
                        ."  - Product Name: {$pName}\n"
                        ."  - Exact Price: {$fmt}\n"
                        ."  - Catalog ID: {$pIdVal}\n"
                        ."  - Concrete Physical Characteristics: {$phys}\n"
                        ."  - Exclusive Copy Binding: The product name \"{$pName}\" and price \"{$fmt}\" belong EXCLUSIVELY to this physical appearance.";
                }

                $copyBlockLines[] = '';
                $copyBlockLines[] = "PRICE:\nMULTI-PRODUCT PRICING (MANDATORY EXACT PRODUCT-PRICE ASSOCIATIONS):\n"
                    .implode("\n", $multiPriceLines);
                $copyBlockLines[] = "MULTI-PRODUCT PRICE RULES:\n"
                    .'• Each displayed price belongs exclusively to its corresponding product ('.implode(' | ', $multiPriceSummary).").\n"
                    ."• Display each price as clean, legible typography adjacent to or directly beneath its corresponding product.\n"
                    ."• Do NOT merge, sum, or combine prices.\n"
                    ."• Do NOT omit any selected product's price.\n"
                    ."• Do NOT substitute one product's price for another.\n"
                    .'• NO LEADER LINES / NO CALLOUT POINTERS: Do NOT draw leader lines, pointer arrows, connector lines, anchor dots, or floating callout lines between products and prices. Render prices as clean typographic labels placed directly beside or beneath their respective products through spatial proximity and typography.';

                $copyBlockLines[] = "MULTI-PRODUCT NAME & PRICE ASSOCIATION (1-TO-1 MAPPING):\n"
                    .'• Explicit Product-to-Copy Pairs: '.implode(' | ', $associationPairs)."\n"
                    ."• PRODUCT VISUAL IDENTITY BINDINGS:\n".implode("\n", $bindingLines)."\n"
                    ."• Ground each product's copy directly with its specific physical product in the composition (e.g., Product A ↔ Name A ↔ Price A; Product B ↔ Name B ↔ Price B; Product C ↔ Name C ↔ Price C).\n"
                    ."• Authoritative Identity-to-Copy Binding: The physical item corresponding to Reference Image 1 MUST be bound to Product 1's name and price. The physical item corresponding to Reference Image 2 MUST be bound to Product 2's name and price. Never determine a product's name or price from its generated size, prominence, or canvas position. The catalog reference image is the immutable identity anchor.\n"
                    ."• Natural Composition Prominence: Allow visual composition to balance products naturally by authentic commercial scale without forcing smaller items into artificial dominance. The identity-to-copy mapping remains absolute regardless of which product is larger or more prominent.\n"
                    ."• Spatial & Typographic Association Only (Zero Connector Graphics): Visually associate each product's copy through proximity, typography, and negative space without any connector lines, dots, or divider lines.\n"
                    ."• Do NOT assign Product A's price to Product B, nor place Product B's name beside Product A.\n"
                    ."• Do NOT merge multiple prices into one generic price or create an unattached floating price stack.\n"
                    ."• Do NOT invent a shared price that doesn't belong to a specific product.\n"
                    ."• Do NOT omit any selected product's required copy when its visibility setting is enabled.";
            } else {
                // SINGLE-PRODUCT PRICING (Strict backward compatibility)
                $primaryPriceDisplay = null;
                if (! empty($options['price'])) {
                    $rawP = trim((string) $options['price']);
                    $primaryPriceDisplay = is_numeric($rawP) ? '₱'.number_format((float) $rawP, 2) : (str_starts_with($rawP, '₱') ? $rawP : '₱'.ltrim($rawP));
                } elseif (! empty($allProducts[0]['price'])) {
                    $rawP = trim((string) $allProducts[0]['price']);
                    $primaryPriceDisplay = is_numeric($rawP) ? '₱'.number_format((float) $rawP, 2) : (str_starts_with($rawP, '₱') ? $rawP : '₱'.ltrim($rawP));
                }

                $copyBlockLines[] = '';
                $copyBlockLines[] = "PRICE:\n".($primaryPriceDisplay ? "\"{$primaryPriceDisplay}\"" : '');
                if ($primaryPriceDisplay) {
                    $copyBlockLines[] = "MARKETING PRICE DISPLAY:\n• PRICE: \"{$primaryPriceDisplay}\"";
                    $copyBlockLines[] = "• Price: {$primaryPriceDisplay}";
                    $copyBlockLines[] = '• Product price data is authoritative.';
                    $copyBlockLines[] = "• Price Requirement: MUST appear visibly in the image with crisp, legible typography maintaining the exact currency symbol and digits ({$primaryPriceDisplay})";
                    $copyBlockLines[] = "• Single Product Price Grounding: Visually ground the exact price ({$primaryPriceDisplay}) with {$productName} using intentional proximity, scale, alignment, and whitespace, avoiding generic floating placement.";
                }
            }
        } else {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE PRICES = FALSE:\nMARKETING PRICE DISPLAY: Disabled\nDo not render prices.\nDo not render product/service prices as visible text.\nSelected products MUST remain visually present.";
        }

        // TAGLINE BLOCK
        if ($includeTagline && $normalizedTagline !== null) {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "TAGLINE:\n\"{$normalizedTagline}\"";
            $copyBlockLines[] = "• TAGLINE: \"{$normalizedTagline}\"";
            $copyBlockLines[] = "• Headline/Tagline: \"{$normalizedTagline}\"";
            $copyBlockLines[] = '• Tagline Requirement: MUST appear visibly in the image as commercial headline/supporting copy';
            $copyBlockLines[] = "• Strict Verbatim Rule: Use the exact wording \"{$normalizedTagline}\"";
            $copyBlockLines[] = '• Designed Advertising Typography: Render the tagline as a professionally art-directed advertising typography element';
            $copyBlockLines[] = '• NEVER render as plain unstyled paragraph copy.';
        } elseif (! $includeTagline) {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE TAGLINE = FALSE:\n• TAGLINE: Disabled.\nDo not render any tagline, headline, slogan, or substitute phrase.";
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
            $copyBlockLines[] = "• Business / Shop: {$brandName}";
            $copyBlockLines[] = "• Exact Spelling: \"{$brandName}\"";
            $copyBlockLines[] = '• Business Name Requirement: MUST appear visibly in the generated image as clean, readable commercial typography';
            $copyBlockLines[] = '• Creative Typographic Integration: Visually integrate the name into the creative design using elegant, bold, modern, premium, playful, handwritten, editorial, or stylized typography.';
            $copyBlockLines[] = "BRAND IDENTITY:\n• BUSINESS / SHOP: \"{$brandName}\"{$categorySuffix}";
            $copyBlockLines[] = "• Render the exact business name \"{$brandName}\" as visible text integrated naturally into the overall advertisement composition.";
            $copyBlockLines[] = '• STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name. DO NOT create a coffee cup logo, coffee bean logo, café icon, crown, badge, seal, crest, monogram, mascot, watermark, or brand symbol.';
        } else {
            $copyBlockLines[] = '';
            $copyBlockLines[] = "INCLUDE BUSINESS NAME = FALSE:\n• BUSINESS / SHOP NAME: Disabled. Do not render any business name, logo, or brand mark in the image.\nDo not render the business/shop name.";
            $copyBlockLines[] = "BRAND IDENTITY:\n• Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.";
        }

        if (! empty($options['event_name'])) {
            $eventName = (string) $options['event_name'];
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN)
                : true;

            if ($showEventText) {
                $copyBlockLines[] = '';
                $copyBlockLines[] = "EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED\n"
                    ."• Event/Holiday Name: \"{$eventName}\" (ALLOWED)\n"
                    ."• Visibility: Permitted when fitting composition and negative space, but not mandatory.\n"
                    ."• Exact Text: If displayed, render only \"{$eventName}\". Do not invent event slogans or alternate headlines.";
            } else {
                $copyBlockLines[] = '';
                $copyBlockLines[] = "EVENT TEXT: FORBIDDEN\n"
                    ."• Event/Holiday Name \"{$eventName}\" is NOT approved visible marketing copy.\n"
                    ."• STRICT FORBIDDEN TEXT: Do NOT render \"{$eventName}\", any shortened holiday name, or any event-derived slogans as visible text in the artwork.";
            }
        }

        $copyBlockLines[] = '';
        $copyBlockLines[] = "• COPY RENDERING RULES:\n"
            ."• All enabled copy elements above MUST be visibly rendered in the final image as integrated commercial typography.\n"
            ."• Visual Grounding Rule: Ground each enabled text element with its corresponding physical product through proximity, alignment, and scale without connector lines or anchor dots.\n"
            .(! empty($options['event_name']) && ! (array_key_exists('show_event_text', $options) ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN) : true) ? "• FORBIDDEN EVENT TEXT: Do not render the event/holiday name as visible text.\n" : '')
            ."• Place copy in the designated copy zones inside the safe area.\n"
            ."• Render each enabled text element exactly as provided.\n"
            ."• Preserve spelling exactly.\n"
            ."• Preserve digits exactly.\n"
            ."• Preserve currency exactly.\n"
            ."• Do not paraphrase or abbreviate.\n"
            ."• Do not duplicate any text element.\n"
            .'• Do not generate additional marketing copy, logos, or watermarks.';

        $modules[] = implode("\n", $copyBlockLines);

        // ---------------------------------------------------------------------
        // 17. TEXT HIERARCHY
        // ---------------------------------------------------------------------
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? 'Balanced');
        $emphasisDesc = $this->designSystem->resolveCopyEmphasisSpec($copyEmphasis);

        $normKey = strtolower(str_replace(['-', ' '], '_', $copyEmphasis));
        if ($normKey === 'tagline' && ! $includeTagline) {
            $emphasisDirective = '• Copy Hierarchy Directive (Tagline Disabled): Tagline is disabled by visibility setting. Do NOT render any tagline. Commercial hierarchy defaults to balanced hero product focus.';
        } elseif ($normKey === 'price' && ! $includePrices) {
            $emphasisDirective = '• Copy Hierarchy Directive (Price Disabled): Price is disabled by visibility setting. Do NOT render any price. Commercial hierarchy defaults to balanced hero product focus.';
        } elseif ($normKey === 'product' && ! $includeProductName) {
            $emphasisDirective = '• Copy Hierarchy Directive (Product Name Disabled): Product Name copy is disabled by visibility setting. Do NOT render the product name as text copy. Maintain visual focus on the physical hero product itself.';
        } else {
            $emphasisDirective = match ($normKey) {
                'product', 'product_first', 'product_focused' => '• Copy Hierarchy Directive (Product Dominance): PRIMARY VISUAL ANCHOR: Product identity and name. The physical products receive the strongest visual emphasis. The physical product itself commands primary visual authority through scale, focus, depth, lighting, placement, and contrast. Product typography and price remain clearly grounded, readable, and supportive of the physical product rather than oversized text replacing the product.',
                'price', 'price_first', 'price_focused' => '• Copy Hierarchy Directive (Price Prominence): PRIMARY VISUAL ANCHOR: Pricing callout. The authoritative catalog price commands prominent visual scale, bold weight, and high-contrast hierarchy, serving as a primary conversion hook without altering digits or currency. Prices may become visually prominent, but must remain associated with their corresponding physical products through composition rather than connector graphics. Each price must remain visually grounded and clearly associated with its respective physical product through proximity, grouping, alignment, and whitespace (avoiding detached floating price stacks).',
                'tagline', 'tagline_first', 'headline_first' => '• Copy Hierarchy Directive (Tagline Prominence): PRIMARY VISUAL ANCHOR: Tagline headline. The authoritative marketing tagline commands bold typographic scale and narrative hierarchy, leading the advertising hook without altering wording or breaking product/name/price visual relationships. The tagline may receive stronger expressive typography, but must not visually disconnect from the overall product advertisement.',
                default => '• Copy Hierarchy Directive (Balanced): EQUAL WEIGHT HIERARCHY: Equal visual weight across product name, tagline, and pricing. Balanced hierarchy means: physical products remain the primary visual focus; product names provide clear product recognition; price and tagline support the advertisement; no text element should unnecessarily overpower the physical product (do NOT interpret Balanced as equal visual weight for every text element). Harmonious commercial balance between physical product presentation, marketing tagline, price, and business branding without any single copy element overpowering the layout, maintaining clear visual grounding between products and copy.',
            };
        }

        $hierarchyLines = [
            "TEXT HIERARCHY:\nCOPY EMPHASIS:",
            "• Selected Emphasis: {$copyEmphasis}",
            "• Canonical Specification: {$emphasisDesc}",
            $emphasisDirective,
            '• Relative Text Scale & Hierarchy: Establish intentional scale hierarchy distinguishing Product Name, Tagline/Headline, Price, and Business Name according to '.$copyEmphasis.'.',
            "• Visual Hierarchy Rule: {$productName} acts as the primary visual anchor. Typography reinforces commercial intent without overpowering the product.",
        ];
        $modules[] = implode("\n", $hierarchyLines);

        // ---------------------------------------------------------------------
        // 18. TEXT DEPTH / LAYERING
        // ---------------------------------------------------------------------
        $textDepthMode = $this->designSystem->validateTextDepthMode($options['text_depth_mode'] ?? null);
        $textDepthDesc = MarketingDesignSystem::TEXT_DEPTH_MODES[$textDepthMode] ?? 'Multi-plane spatial layering with comfortable depth.';

        $depthLines = [
            'TEXT DEPTH / LAYERING:',
            "• Text Depth Mode: {$textDepthMode} ({$textDepthDesc})",
            '• Multi-Plane Composition: Stage typography across deliberate spatial depth planes (background, midground, product plane, foreground, or subtle overlap) rather than flattening all text onto a single planar surface.',
            "• Spatial Clearance: Position typography naturally into composition safe zones relative to {$productName}. Do NOT cover or crowd the primary product, packaging, or essential labels.",
        ];
        $modules[] = implode("\n", $depthLines);

        // ---------------------------------------------------------------------
        // 19. RESPONSIVE COMPOSITION
        // ---------------------------------------------------------------------
        $compositionProfile = $this->resolveCompositionProfile($aspectRatio, $productName, $options);
        $compLines = [
            $compositionProfile,
            "• Keep {$productName} visually dominant with realistic contact shadows and natural environmental integration.",
            '• Maintain visual hierarchy: Product as primary focal centerpiece, environmental styling and props subordinate.',
            '• Composition-Aware Typographic Placement: Intelligently anchor typography into negative space regions corresponding to the aspect ratio format. Prevent text from covering the physical product, packaging labels, faces, or essential scene details.',
        ];
        $modules[] = "RESPONSIVE COMPOSITION:\nCOMPOSITION & SAFE MARGINS (INVISIBLE SAFE AREA & OUTPUT CLEANLINESS):\n".implode("\n", $compLines);

        // ---------------------------------------------------------------------
        // 20. NEGATIVE CONSTRAINTS
        // ---------------------------------------------------------------------
        $priorityEnforcement = $hasImageInput
            ? 'The supplied catalog product image is the primary visual source of truth. Product preservation overrides lower-priority styling. Do not replace the supplied product with a newly invented product.'
            : 'Fulfill the full commercial advertising scene with product fidelity and user scene direction prioritized over subordinate styling.';

        $modules[] = "NEGATIVE CONSTRAINTS:\nOUTPUT & SAFETY RULES:\n"
            ."• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.\n"
            ."• INVISIBLE SAFE AREA: The 20% safe margin is an internal, invisible layout constraint only. Keep all important visual subjects, focal elements, and textual regions comfortably inside the designated inner safe area.\n"
            ."• OUTPUT CLEANLINESS & FORBIDDEN ELEMENTS (CRITICAL): The safe margin must NEVER appear in the final artwork. DO NOT render safe-margin boundaries, dotted or dashed borders, frames, guides, grids, rulers, crop marks, alignment marks, measurement indicators, percentage labels, technical annotations, \"20% SAFE MARGIN\", \"SAFE MARGIN\", or any production/layout instructions.\n"
            ."• DO NOT duplicate any text element.\n"
            ."• DO NOT generate additional marketing copy, body text, or slogans beyond the authorized marketing copy.\n"
            ."• FINISHED COMMERCIAL ADVERTISEMENT: The final image must look like a finished professional commercial advertisement, not a design template, production proof, wireframe, or editing canvas.\n\n"
            ."FINAL QUALITY RULES:\n"
            ."• Framing: Format intentionally for {$aspectRatio} canvas.\n"
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
        $generationMode = ($options['generation_mode'] ?? 'manual') === 'automatic' ? 'automatic' : 'manual';
        $hasUserPrompt = ! empty($options['scene_prompt']) || ! empty($options['image_prompt']) || ! empty($options['user_prompt']) || ! empty($options['prompt']);
        $isManualWithPrompt = ($generationMode === 'manual' && $hasUserPrompt);

        return match ($aspectRatio) {
            '1:1' => "RESPONSIVE COMPOSITION PROFILE: 1:1 SQUARE COMMERCIAL ADVERTISEMENT\n"
                ."• Orientation: Symmetrical, balanced square canvas.\n"
                .($isManualWithPrompt
                    ? "• Placement: DERIVE FROM PRIMARY USER SCENE DIRECTION. Follow user placement directives (e.g. centered, off-center, asymmetric, or lateral); if unspecified, center with balanced visual weight.\n"
                    : "• Preferred Product Region: Center or slightly offset focal region with balanced visual weight on left and right.\n")
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
     * Resolve concrete physical characteristics for a product from existing product or vision metadata.
     * Do not invent physical descriptions from product names.
     */
    protected function resolveProductPhysicalCharacteristics(mixed $prod, ?string $imagePath = null, ?array $visionBlueprint = null): ?string
    {
        if (! empty($visionBlueprint['product_physical_details'])) {
            return trim((string) $visionBlueprint['product_physical_details']);
        }
        if (! empty($visionBlueprint['product_identity'])) {
            return trim((string) $visionBlueprint['product_identity']);
        }

        if (! empty($imagePath) && class_exists(ReferenceImageAnalyzer::class)) {
            try {
                $analyzer = app(ReferenceImageAnalyzer::class);
                $analysis = $analyzer->analyze($imagePath);
                if (! empty($analysis['product_physical_details'])) {
                    return trim((string) $analysis['product_physical_details']);
                }
                if (! empty($analysis['product_identity'])) {
                    return trim((string) $analysis['product_identity']);
                }
            } catch (\Throwable $e) {
                // Silently ignore
            }
        }

        $desc = is_array($prod) ? ($prod['description'] ?? null) : ($prod->description ?? null);
        if (! empty($desc)) {
            return trim((string) $desc);
        }

        return null;
    }

    /**
     * Resolve strict specification for the selected render style via MarketingDesignSystem.
     */
    protected function resolveRenderStyleSpec(string $renderStyle): string
    {
        return $this->designSystem->resolveRenderStyleSpec($renderStyle);
    }

    /**
     * Build a concise, compact Manual Campaign Brief (Small Manual Brief) for Manual Studio generation.
     * Generates an authoritative ~4,500–6,000 character brief providing OpenAI with actual product images,
     * factual business/product data, and user creative direction without redundant 20-section expansions.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function orchestrateManualCampaignBrief(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $productName = $options['product_name'] ?? 'Product';
        $rawStyle = $options['render_style'] ?? $options['content_style'] ?? 'Studio Product Still';
        $normalizedStyle = $this->designSystem->validateRenderStyle($rawStyle);
        $renderStyle = (! empty($rawStyle) && ! in_array(strtolower(trim((string) $rawStyle)), ['unknown', 'unknown_style', 'default', ''], true) && $normalizedStyle === 'Studio Product Still' && strtolower(trim((string) $rawStyle)) !== 'studio product still' && strtolower(trim((string) $rawStyle)) !== 'studio_product_still')
            ? (string) $rawStyle
            : $normalizedStyle;
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? 'Balanced');
        $designTreatment = ! empty($options['design_treatment']) ? $this->designSystem->validateDesignTreatment($options['design_treatment']) : null;

        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];

        // Auto-resolve event_name from event model/array or campaign if missing
        if (empty($options['event_name'])) {
            if (! empty($options['event'])) {
                $options['event_name'] = is_array($options['event']) ? ($options['event']['name'] ?? null) : ($options['event']->name ?? null);
            } elseif (! empty($options['campaign']) && is_object($options['campaign']) && ! empty($options['campaign']->event)) {
                $options['event_name'] = $options['campaign']->event->name;
            }
        }

        // Resolve user prompt
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
            } elseif (Str::startsWith($raw, 'FINAL MARKETING DESIGN TASK')) {
                if (preg_match('/• PRIMARY USER SCENE DIRECTION:\s*(.+)$/m', $raw, $matches)) {
                    $userScenePrompt = trim($matches[1]);
                }
            } elseif (Str::startsWith($raw, 'Create a marketing image')) {
                if (preg_match('/Creative direction:\s*\n(.+?)(?=\n\n|\n[A-Z]|$)/s', $raw, $matches)) {
                    $userScenePrompt = trim($matches[1]);
                }
            } else {
                $userScenePrompt = $raw;
            }
        } elseif (! empty($options['notes'])) {
            $userScenePrompt = trim((string) $options['notes']);
        }

        // Visibility Toggles
        $includeProductName = array_key_exists('include_product_name', $options)
            ? filter_var($options['include_product_name'], FILTER_VALIDATE_BOOLEAN) : true;
        $includePrices = array_key_exists('include_prices', $options)
            ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN) : true;
        $includeTagline = array_key_exists('include_tagline', $options)
            ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN) : (($options['tagline_mode'] ?? null) !== 'none');
        $includeBusinessName = array_key_exists('include_business_name', $options)
            ? filter_var($options['include_business_name'], FILTER_VALIDATE_BOOLEAN) : true;

        $normalizedTagline = $includeTagline ? TaglineNormalizationService::normalize($options['tagline'] ?? null) : null;

        $brandName = null;
        if ($includeBusinessName) {
            $brandName = ! empty($options['business_name']) ? trim((string) $options['business_name']) : ($business->name ?? null);
        }

        // Assemble indexed products
        $allProducts = [];
        $attachedImages = (array) ($options['reference_image_paths'] ?? []);
        if (empty($attachedImages) && ! empty($options['reference_image_path'])) {
            $attachedImages = [$options['reference_image_path']];
        }

        if (! empty($catalogProducts)) {
            foreach ($catalogProducts as $idx => $prod) {
                $pId = is_array($prod) ? ($prod['id'] ?? null) : ($prod->id ?? null);
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;
                $imgPath = is_array($prod) ? ($prod['image_path'] ?? null) : ($prod->image_path ?? null);
                $pDesc = $this->resolveProductPhysicalCharacteristics(
                    $prod,
                    $imgPath,
                    $idx === 0 ? ($visionBlueprint ?? ($options['vision_blueprint'] ?? null)) : null
                ) ?: (is_array($prod) ? ($prod['description'] ?? null) : $prod->description);

                $allProducts[] = [
                    'id' => $pId,
                    'name' => $pName,
                    'price' => $pPrice,
                    'description' => $pDesc,
                    'ref_index' => $idx + 1,
                ];
            }
        }
        foreach ($customProducts as $cIdx => $cProd) {
            $cName = is_array($cProd) ? ($cProd['name'] ?? null) : ($cProd->name ?? null);
            $cPrice = is_array($cProd) ? ($cProd['price'] ?? null) : ($cProd->price ?? null);
            $cDesc = is_array($cProd) ? ($cProd['description'] ?? null) : ($cProd->description ?? null);
            if (! empty($cName)) {
                $allProducts[] = [
                    'id' => "custom_{$cIdx}",
                    'name' => $cName,
                    'price' => $cPrice,
                    'description' => $cDesc,
                    'ref_index' => null,
                ];
            }
        }

        if (empty($allProducts)) {
            $allProducts[] = [
                'id' => null,
                'name' => $productName,
                'price' => $options['price'] ?? null,
                'description' => $options['product_description'] ?? null,
                'ref_index' => 1,
            ];
        }

        $industry = $options['business_industry'] ?? $business->industry ?? 'General';
        $category = $options['product_category'] ?? $options['business_category'] ?? $business->category ?? $industry;

        // 1. Business Context
        $bizHeader = 'Create a marketing image';
        if ($includeBusinessName && ! empty($brandName)) {
            $bizHeader .= " for {$brandName}";
        }
        $bizHeader .= ", {$industry} / {$category}.";
        if (! $includeBusinessName) {
            $bizHeader .= ' (Do not include business/shop name or branding text).';
        }

        $lines = [$bizHeader];

        $bizDesc = $options['business_description'] ?? $business?->description ?? null;
        if (! empty($bizDesc)) {
            $lines[] = 'Business context: '.trim((string) $bizDesc);
        }

        // 2. Campaign Context
        $campaignName = ! empty($options['campaign_name'])
            ? (string) $options['campaign_name']
            : ($options['campaign']->name ?? null);
        if (empty($campaignName) && ! empty($options['campaign_id'])) {
            $campaignModel = Campaign::query()->find($options['campaign_id']);
            if ($campaignModel) {
                $campaignName = $campaignModel->name;
                if (empty($options['event_name']) && $campaignModel->event) {
                    $options['event_name'] = $campaignModel->event->name;
                }
            }
        }
        if (! empty($campaignName)) {
            $lines[] = "Campaign: {$campaignName}";
        }

        // 3. Event / Holiday Context
        $eventName = ! empty($options['event_name'])
            ? (string) $options['event_name']
            : ($options['event']->name ?? null);
        if (empty($eventName) && ! empty($options['campaign']) && is_object($options['campaign']) && ! empty($options['campaign']->event)) {
            $eventName = $options['campaign']->event->name;
        }

        if (! empty($eventName)) {
            $eventName = (string) $eventName;
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN) : true;
            $lines[] = "Event: {$eventName}";
            if ($showEventText) {
                $lines[] = "Event visibility: Allowed (Event name \"{$eventName}\" may appear in typography. Do not invent event slogans).";
            } else {
                $lines[] = "Event visibility: Hidden (FORBIDDEN EVENT TEXT: Do not render event name \"{$eventName}\" or event slogans as visible text).";
            }
        } elseif (! empty($campaignName)) {
            $lines[] = 'Event: None';
            $lines[] = 'Event visibility: Hidden';
        }

        // 4. Products & Exact Prices
        $prodLines = ['Products:'];
        foreach ($allProducts as $idx => $item) {
            $num = $idx + 1;
            $pName = $item['name'];
            $pPrice = $item['price'];
            $fmtPrice = null;
            if ($pPrice !== null && $pPrice !== '') {
                $rawPStr = trim((string) $pPrice);
                $fmtPrice = is_numeric($rawPStr) ? '₱'.number_format((float) $rawPStr, 2) : (str_starts_with($rawPStr, '₱') ? $rawPStr : '₱'.ltrim($rawPStr));
            }

            $refNum = ! empty($item['ref_index']) ? $item['ref_index'] : $num;
            $pDesc = "REFERENCE IMAGE {$refNum} = {$pName}";
            if ($fmtPrice) {
                $pDesc .= " — {$fmtPrice}";
            }
            $prodLines[] = "• {$pDesc}";
        }

        if (count($allProducts) > 1) {
            $prodLines[] = '• Rule: All selected products must appear together naturally in the final marketing scene.';
        }
        if (! $includePrices) {
            $prodLines[] = '• Do not render prices.';
        }
        if (! $includeProductName) {
            $prodLines[] = '• Do not render product names as visible text.';
        }
        $lines[] = implode("\n", $prodLines);

        // 5. Creative Direction
        $userScenePrompt = trim((string) ($options['scene_prompt'] ?? $options['user_prompt'] ?? ''));
        if ($userScenePrompt !== '') {
            $lines[] = "Creative direction:\n{$userScenePrompt}";
        }

        // 6. Creative Controls (Concise Inputs Only)
        $ctrlLines = [];
        $ctrlLines[] = "Render style: {$renderStyle}";

        $copyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? null);
        $ctrlLines[] = "Copy emphasis: {$copyEmphasis}";

        if ($includeProductName) {
            if (count($allProducts) > 1) {
                $namesFormatted = array_map(fn ($p) => "\"{$p['name']}\"", $allProducts);
                $ctrlLines[] = 'Product name typography: '.implode(', ', $namesFormatted);
            } else {
                $ctrlLines[] = "Product name typography: \"{$allProducts[0]['name']}\"";
            }
        } else {
            $ctrlLines[] = 'Product name typography: Disabled';
        }

        $includeTagline = array_key_exists('include_tagline', $options)
            ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN) : true;
        $tagline = $options['tagline'] ?? null;
        $normalizedTagline = $tagline ? TaglineNormalizationService::normalize($tagline) : null;
        if ($includeTagline && $normalizedTagline) {
            $ctrlLines[] = "Tagline: \"{$normalizedTagline}\"";
        } elseif (! $includeTagline) {
            $ctrlLines[] = 'Tagline: Disabled';
        }

        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $ctrlLines[] = "Aspect ratio: {$aspectRatio}";
        $lines[] = implode("\n", $ctrlLines);

        // 7. Authoritative Hard Rules
        $rules = [
            'RULES:',
            '• Use the provided product image(s) as the authoritative visual reference. Preserve the actual products and exact product-name/price pairings.',
            '• Follow the user\'s creative direction, keeping the product as the hero while adapting naturally to the campaign, event, render style, and aspect ratio.',
            '• Respect event visibility. If allowed, integrate the event naturally as supporting campaign text; if hidden, do not display the event name.',
            '• Do not create logos, badges, or watermarks.',
        ];

        $includeBusinessName = array_key_exists('include_business_name', $options)
            ? (bool) $options['include_business_name']
            : (! array_key_exists('business_name', $options) || ! empty($options['business_name']));
        if (! $includeBusinessName) {
            $rules[] = '• Business Branding: Disabled. Do not include any business/shop name or branding text in the artwork.';
        }

        $lines[] = implode("\n", $rules);

        return implode("\n\n", $lines);
    }

    /**
     * Build a concise, compact Automatic Campaign Brief for Automatic AI Studio generation.
     * Generates an authoritative compact brief providing OpenAI with actual product images,
     * factual business/product data, and automatic creative direction without legacy art-direction bloat.
     *
     * @param  array<string, mixed>  $options
     * @param  array<string, mixed>|null  $visionBlueprint
     */
    public function orchestrateAutomaticCampaignBrief(array $options, ?Business $business = null, ?array $visionBlueprint = null): string
    {
        $aspectRatio = $options['aspect_ratio'] ?? '1:1';
        $productName = $options['product_name'] ?? 'Product';
        $rawStyle = $options['render_style'] ?? $options['content_style'] ?? 'Studio Product Still';
        $normalizedStyle = $this->designSystem->validateRenderStyle($rawStyle);
        $renderStyle = (! empty($rawStyle) && ! in_array(strtolower(trim((string) $rawStyle)), ['unknown', 'unknown_style', 'default', ''], true) && $normalizedStyle === 'Studio Product Still' && strtolower(trim((string) $rawStyle)) !== 'studio product still' && strtolower(trim((string) $rawStyle)) !== 'studio_product_still')
            ? (string) $rawStyle
            : $normalizedStyle;
        $copyEmphasis = $this->designSystem->validateCopyEmphasis($options['copy_emphasis'] ?? 'Balanced');

        $catalogProducts = $options['catalog_products'] ?? [];
        $customProducts = $options['custom_products'] ?? [];

        // Auto-resolve event_name from event model/array or campaign if missing
        if (empty($options['event_name'])) {
            if (! empty($options['event'])) {
                $options['event_name'] = is_array($options['event']) ? ($options['event']['name'] ?? null) : ($options['event']->name ?? null);
            } elseif (! empty($options['campaign']) && is_object($options['campaign']) && ! empty($options['campaign']->event)) {
                $options['event_name'] = $options['campaign']->event->name;
            }
        }

        // Visibility Toggles
        $includeProductName = array_key_exists('include_product_name', $options)
            ? filter_var($options['include_product_name'], FILTER_VALIDATE_BOOLEAN) : true;
        $includePrices = array_key_exists('include_prices', $options)
            ? filter_var($options['include_prices'], FILTER_VALIDATE_BOOLEAN) : true;
        $includeTagline = array_key_exists('include_tagline', $options)
            ? filter_var($options['include_tagline'], FILTER_VALIDATE_BOOLEAN) : (($options['tagline_mode'] ?? null) !== 'none');
        $includeBusinessName = array_key_exists('include_business_name', $options)
            ? filter_var($options['include_business_name'], FILTER_VALIDATE_BOOLEAN) : true;

        $brandName = null;
        if ($includeBusinessName) {
            $brandName = ! empty($options['business_name']) ? trim((string) $options['business_name']) : ($business->name ?? null);
        }

        // Assemble indexed products
        $allProducts = [];
        if (! empty($catalogProducts)) {
            foreach ($catalogProducts as $idx => $prod) {
                $pId = is_array($prod) ? ($prod['id'] ?? null) : ($prod->id ?? null);
                $pName = is_array($prod) ? ($prod['name'] ?? 'Product') : $prod->name;
                $pPrice = is_array($prod) ? ($prod['price'] ?? null) : $prod->price;

                $allProducts[] = [
                    'id' => $pId,
                    'name' => $pName,
                    'price' => $pPrice,
                    'ref_index' => $idx + 1,
                ];
            }
        }
        foreach ($customProducts as $cIdx => $cProd) {
            $cName = is_array($cProd) ? ($cProd['name'] ?? null) : ($cProd->name ?? null);
            $cPrice = is_array($cProd) ? ($cProd['price'] ?? null) : ($cProd->price ?? null);
            if (! empty($cName)) {
                $allProducts[] = [
                    'id' => "custom_{$cIdx}",
                    'name' => $cName,
                    'price' => $cPrice,
                    'ref_index' => null,
                ];
            }
        }

        if (empty($allProducts)) {
            $allProducts[] = [
                'id' => null,
                'name' => $productName,
                'price' => $options['price'] ?? null,
                'ref_index' => 1,
            ];
        }

        $lines = [];

        // 1. Business Context
        $bizName = ! empty($options['business_name']) ? trim((string) $options['business_name']) : ($business->name ?? null);
        if ($includeBusinessName && ! empty($bizName)) {
            $lines[] = "Business:\n{$bizName}";
        } elseif (! $includeBusinessName) {
            $lines[] = "Business:\n".(! empty($bizName) ? "{$bizName} (Factual context only. Do not render business name as visible copy)" : '(Do not include business/shop name or branding text)');
        }

        $bizDesc = $options['business_description'] ?? $business?->description ?? null;
        if (! empty($bizDesc)) {
            $lines[] = "Business context:\n".trim((string) $bizDesc);
        }

        // 2. Campaign Context
        $campaignName = ! empty($options['campaign_name'])
            ? (string) $options['campaign_name']
            : ($options['campaign']->name ?? null);
        if (empty($campaignName) && ! empty($options['campaign_id'])) {
            $campaignModel = Campaign::query()->find($options['campaign_id']);
            if ($campaignModel) {
                $campaignName = $campaignModel->name;
                if (empty($options['event_name']) && $campaignModel->event) {
                    $options['event_name'] = $campaignModel->event->name;
                }
            }
        }
        if (! empty($campaignName)) {
            $lines[] = "Campaign:\n{$campaignName}";
        }

        // 3. Event / Holiday Context
        $eventName = ! empty($options['event_name'])
            ? (string) $options['event_name']
            : ($options['event']->name ?? null);
        if (empty($eventName) && ! empty($options['campaign']) && is_object($options['campaign']) && ! empty($options['campaign']->event)) {
            $eventName = $options['campaign']->event->name;
        }

        if (! empty($eventName)) {
            $eventName = (string) $eventName;
            $showEventText = array_key_exists('show_event_text', $options)
                ? filter_var($options['show_event_text'], FILTER_VALIDATE_BOOLEAN) : true;
            $lines[] = "Event:\n{$eventName}";
            $lines[] = "Event visibility:\n".($showEventText ? 'Allowed' : 'Hidden');
        } elseif (! empty($campaignName)) {
            $lines[] = "Event:\nNone";
            $lines[] = "Event visibility:\nHidden";
        }

        // 4. Products & Exact Prices
        $prodLines = ['Products:'];
        foreach ($allProducts as $idx => $item) {
            $num = $idx + 1;
            $pName = $item['name'];
            $pPrice = $item['price'];
            $fmtPrice = null;
            if ($pPrice !== null && $pPrice !== '') {
                $rawPStr = trim((string) $pPrice);
                $fmtPrice = is_numeric($rawPStr) ? '₱'.number_format((float) $rawPStr, 2) : (str_starts_with($rawPStr, '₱') ? $rawPStr : '₱'.ltrim($rawPStr));
            }

            $refNum = ! empty($item['ref_index']) ? $item['ref_index'] : $num;
            $pDesc = "• REFERENCE IMAGE {$refNum} = {$pName}";
            if ($fmtPrice) {
                $pDesc .= " — {$fmtPrice}";
            }
            $prodLines[] = $pDesc;
        }

        if (count($allProducts) > 1) {
            $prodLines[] = '• Rule: All selected products must appear together naturally in the final marketing scene.';
        }
        if (! $includePrices) {
            $prodLines[] = '• Do not render prices.';
        }
        if (! $includeProductName) {
            $prodLines[] = '• Do not render product names as visible text.';
        }
        $lines[] = implode("\n", $prodLines);

        // 5. Creative Direction
        $creativeDirection = trim((string) ($options['scene_prompt'] ?? $options['visual_prompt'] ?? $options['user_prompt'] ?? ''));
        if (empty($creativeDirection) && ! empty($options['creative_concept'])) {
            $creativeDirection = trim((string) $options['creative_concept']);
            if (! empty($options['visual_strategy'])) {
                $creativeDirection .= '. '.trim((string) $options['visual_strategy']);
            }
        }
        if ($creativeDirection !== '') {
            $lines[] = "Creative direction:\n{$creativeDirection}";
        }

        // 6. Creative Controls
        $ctrlLines = [];
        $ctrlLines[] = "Render style:\n{$renderStyle}";
        $ctrlLines[] = "Copy emphasis:\n{$copyEmphasis}";

        $tagline = $options['tagline'] ?? null;
        $normalizedTagline = $tagline ? TaglineNormalizationService::normalize($tagline) : null;
        if ($includeTagline && $normalizedTagline) {
            $ctrlLines[] = "Tagline:\n\"{$normalizedTagline}\"";
        } elseif (! $includeTagline) {
            $ctrlLines[] = "Tagline:\nDisabled";
        }

        $ctrlLines[] = "Aspect ratio:\n{$aspectRatio}";
        $lines[] = implode("\n\n", $ctrlLines);

        // 7. Copy Controls
        $copyCtrlLines = [
            'Copy controls:',
            'Product name: '.($includeProductName ? 'Allowed' : 'Hidden'),
            'Product price: '.($includePrices ? 'Allowed' : 'Hidden'),
            'Business name: '.($includeBusinessName ? 'Allowed' : 'Hidden'),
            'Tagline: '.($includeTagline ? 'Allowed' : 'Hidden'),
        ];
        $lines[] = implode("\n", $copyCtrlLines);

        // 8. Concise Hard Constraints
        $rules = [
            'Use the provided product image(s) as the authoritative visual reference.',
            'Preserve the actual products and exact product-name/price pairings.',
            'Follow the creative direction naturally.',
            'Respect event visibility.',
            'Do not create logos, badges, or watermarks.',
        ];

        if (! $includeProductName) {
            $rules[] = 'Do not render product names as visible text.';
        }
        if (! $includePrices) {
            $rules[] = 'Do not render prices as visible copy.';
        }
        if (! $includeBusinessName) {
            $rules[] = 'Do not include business/shop name or branding text.';
        }

        $lines[] = implode("\n", $rules);

        return implode("\n\n", $lines);
    }
}
