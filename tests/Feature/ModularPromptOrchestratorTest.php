<?php

use App\Models\Business;
use App\Models\User;
use App\Services\ImageCompositorService;
use App\Services\ModularPromptOrchestrator;
use App\Services\OpenAIImageService;
use App\Services\OpenAIModelRegistry;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

it('orchestrates prompt with strict priority hierarchy and product preservation wording', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $options = [
        'product_name' => 'Caramel Machiato',
        'product_description' => 'Rich espresso layered with creamy steamed milk and decadent caramel drizzle',
        'price' => '₱149',
        'tagline' => 'Rich caramel sweetness, brewed to perfection.',
        'event_name' => 'Mother\'s Day Special',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Food & Beverage',
        'brand_tone' => ['Warm & Welcoming', 'Premium'],
        'render_style' => 'Studio Product Still',
        'visual_theme' => ['Cozy Cafe Vibe'],
        'reference_image_path' => 'products/images/test_product.jpg',
        'aspect_ratio' => '1:1',
    ];

    $visionBlueprint = [
        'product_identity' => 'Tall faceted clear glass with iced layered coffee and caramel topping',
    ];

    $prompt = $orchestrator->orchestrate($options, null, $visionBlueprint);

    // Verify Priority 1: Primary Product Image & Product Preservation
    expect($prompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('Use the supplied catalog product image as the primary visual source of truth for Caramel Machiato.')
        ->toContain('PRODUCT PRESERVATION:')
        ->toContain('Preserve the recognizable identity of the actual supplied product')
        ->toContain('SUPPORTING PRODUCT METADATA (SUPPLEMENTAL):')
        ->toContain('Observed Characteristics: Tall faceted clear glass with iced layered coffee and caramel topping')
        ->toContain('Supporting product metadata is supplemental and must not override, replace, reinterpret, or contradict the supplied product image.');

    // Verify Priority 2: Exact Marketing Content
    expect($prompt)->toContain('• Price: ₱149 (exact price value, maintain exact currency symbol and digits)')
        ->toContain('• Tagline: "Rich caramel sweetness, brewed to perfection" (exact user tagline, do not alter or paraphrase)');

    // Verify Priority 4: Structured Philippine Event Direction
    expect($prompt)->toContain('Event: Mother\'s Day Special')
        ->toContain('Mood: Warm, heartwarming & appreciative');

    // Verify Priority 6: Exactly One Render Style
    expect($prompt)->toContain('Studio Product Still')
        ->toContain('Product-focused commercial studio presentation')
        ->not->toContain('Cinematic visual storytelling')
        ->not->toContain('Minimalist Graphic');

    // Verify Priority 9: Composition & Invisible Safe Area
    expect($prompt)->toContain('COMPOSITION & SAFE MARGINS')
        ->toContain('INVISIBLE SAFE AREA:')
        ->toContain('OUTPUT CLEANLINESS & FORBIDDEN ELEMENTS')
        ->toContain('The safe margin must NEVER appear in the final artwork')
        ->toContain('PRIORITY ENFORCEMENT: The supplied catalog product image is the primary visual source of truth.');
});

it('enforces single active render style specification', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $styles = [
        'Studio Product Still' => 'Controlled three-point studio lighting',
        'Cinematic Marketing' => 'Volumetric atmospheric rim lighting',
        'Lifestyle Capture' => 'Realistic authentic contextual environment',
        'Minimalist Graphic' => 'Clean graphic composition with high negative space',
    ];

    foreach ($styles as $style => $expectedPhrase) {
        $prompt = $orchestrator->orchestrate([
            'product_name' => 'Product',
            'render_style' => $style,
        ]);

        expect($prompt)->toContain($expectedPhrase);

        // Ensure other styles are not mixed in
        foreach ($styles as $otherStyle => $otherPhrase) {
            if ($style !== $otherStyle) {
                expect($prompt)->not->toContain($otherPhrase);
            }
        }
    }
});

it('calculates dynamic safe margins correctly for all aspect ratios', function () {
    $compositor = new ImageCompositorService;

    $ratios = ['1:1', '16:9', '9:16', '4:5', '4:3'];

    foreach ($ratios as $ratio) {
        $manifest = $compositor->generateCompositingManifest([
            'aspect_ratio' => $ratio,
            'price' => '₱149',
            'tagline' => 'Rich caramel sweetness.',
        ]);

        expect($manifest)->toHaveKeys(['canvas', 'safe_margins', 'exact_content']);

        $margins = $manifest['safe_margins'];
        $canvas = $manifest['canvas'];

        expect($margins['left'])->toBe((int) round($canvas['width'] * 0.20))
            ->and($margins['top'])->toBe((int) round($canvas['height'] * 0.20))
            ->and($margins['safe_width'])->toBe($canvas['width'] - (2 * (int) round($canvas['width'] * 0.20)))
            ->and($margins['safe_height'])->toBe($canvas['height'] - (2 * (int) round($canvas['height'] * 0.20)))
            ->and($manifest['exact_content']['price'])->toBe('₱149')
            ->and($manifest['exact_content']['tagline'])->toBe('Rich caramel sweetness');
    }
});

it('maintains OpenAI model registry with GPT-Image-2 as recommended default', function () {
    $registry = new OpenAIModelRegistry;

    $default = $registry->getDefaultModel();
    expect($default['id'])->toBe('gpt-image-2')
        ->and($default['api_model_id'])->toBe('gpt-image-2')
        ->and($default['supports_image_input'])->toBeTrue()
        ->and($default['is_recommended'])->toBeTrue()
        ->and($default['product_preservation_capability'])->toBe('flagship_photorealistic');

    $models = $registry->getAllModels();
    expect(count($models))->toBe(6);
});

it('enforces backend model capability policy distinguishing flagship from other models', function () {
    $registry = new OpenAIModelRegistry;

    $flagshipPolicy = $registry->getModelPolicy('gpt-image-2');
    expect($flagshipPolicy['is_recommended'])->toBeTrue()
        ->and($flagshipPolicy['product_preservation_capability'])->toBe('flagship_photorealistic')
        ->and($flagshipPolicy['supports_image_input'])->toBeTrue()
        ->and($flagshipPolicy['supports_image_editing'])->toBeTrue()
        ->and($flagshipPolicy['recommended_generation_mode'])->toBe('PRODUCT_PRESERVING_FLAGSHIP');

    $gpt1Policy = $registry->getModelPolicy('gpt-image-1');
    expect($gpt1Policy['is_recommended'])->toBeFalse()
        ->and($gpt1Policy['product_preservation_capability'])->toBe('standard_fidelity')
        ->and($gpt1Policy['supports_image_input'])->toBeTrue()
        ->and($gpt1Policy['supports_image_editing'])->toBeTrue()
        ->and($gpt1Policy['recommended_generation_mode'])->toBe('PRODUCT_PRESERVING_ADAPTED');

    $dalle3Policy = $registry->getModelPolicy('dall-e-3');
    expect($dalle3Policy['is_recommended'])->toBeFalse()
        ->and($dalle3Policy['product_preservation_capability'])->toBe('text_to_image_only')
        ->and($dalle3Policy['supports_image_input'])->toBeFalse()
        ->and($dalle3Policy['supports_image_editing'])->toBeFalse();
});

it('strengthens product preservation and suppresses AI typography for non-default models in ModularPromptOrchestrator', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $flagshipPrompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'reference_image_path' => 'products/images/test_product.jpg',
        'image_model' => 'gpt-image-2',
    ]);

    $adaptedPrompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'reference_image_path' => 'products/images/test_product.jpg',
        'image_model' => 'gpt-image-1',
    ]);

    // Both preserve 8-priority product-first architecture
    expect($flagshipPrompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('PRODUCT PRESERVATION:');

    expect($adaptedPrompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('PRODUCT PRESERVATION:')
        ->toContain('STRICT PRESERVATION RULE: The input image is the immutable physical product.')
        ->toContain('NO AI TYPOGRAPHY: Do NOT render or embed text, letters, numbers, currency symbols, prices, or slogans inside the artwork.');
});

it('attaches catalog product binary for image-input models and sends selected model in OpenAIImageService', function () {
    Storage::fake('public');
    Storage::disk('public')->put('products/coffee.png', 'fake-binary-bytes');

    config()->set('services.openai.api_key', 'sk-test-secret-key');

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (Request $request) {
            $hasImage = $request->isMultipart();
            $body = $request->data();

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-image')],
                ],
            ], 200);
        },
    ]);

    $service = app(OpenAIImageService::class);

    // Test with gpt-image-1
    $result = $service->generate('Promotional prompt', [
        'product_name' => 'Caramel Machiato',
        'reference_image_path' => 'products/coffee.png',
        'image_model' => 'gpt-image-1',
    ]);

    expect($result)->not->toBeEmpty();

    $metadata = $service->getLastGenerationMetadata();
    expect($metadata)->not->toBeNull()
        ->and($metadata['model'])->toBe('gpt-image-1')
        ->and($metadata['is_recommended'])->toBeFalse()
        ->and($metadata['product_preservation_capability'])->toBe('standard_fidelity')
        ->and($metadata['generation_method'])->toBe('image_to_image_edit')
        ->and($metadata['product_preserved'])->toBeTrue()
        ->and($metadata['supports_image_editing'])->toBeTrue();

    // Verify secret key is never leaked in metadata
    expect(json_encode($metadata))->not->toContain('sk-test-secret-key');
});

it('handles exact marketing content and safe margin placement in compositing manifest', function () {
    $compositor = new ImageCompositorService;

    $manifest = $compositor->generateCompositingManifest([
        'aspect_ratio' => '1:1',
        'product_name' => 'Caramel Machiato',
        'price' => '₱149',
        'tagline' => 'Rich caramel sweetness.',
        'business_name' => 'CoffeYessir',
    ]);

    expect($manifest)->toHaveKeys(['canvas', 'safe_margins', 'exact_content'])
        ->and($manifest['safe_margins']['margin_percent'])->toBe(20)
        ->and($manifest['exact_content']['product_name'])->toBe('Caramel Machiato')
        ->and($manifest['exact_content']['price'])->toBe('₱149')
        ->and($manifest['exact_content']['tagline'])->toBe('Rich caramel sweetness')
        ->and($manifest['exact_content']['brand_name'])->toBe('CoffeYessir');
});

it('orchestrates business / shop name seamlessly into modular prompt brand identity', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $promptWithBusiness = $orchestrator->orchestrate([
        'product_name' => 'Iced Vanilla Latte',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Specialty Coffee',
        'include_business_name' => true,
    ]);

    expect($promptWithBusiness)->toContain('BUSINESS / SHOP: "CoffeYessir" (Specialty Coffee)')
        ->toContain('Render the exact business name "CoffeYessir" as visible text integrated naturally into the overall advertisement composition.')
        ->not->toContain('CRITICAL LOGO DIRECTIVE');

    // Test when include_business_name is toggled off
    $promptWithoutBusiness = $orchestrator->orchestrate([
        'product_name' => 'Iced Vanilla Latte',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Specialty Coffee',
        'include_business_name' => false,
    ]);

    expect($promptWithoutBusiness)->not->toContain('BUSINESS / SHOP: "CoffeYessir"')
        ->toContain('Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.');
});

it('preserves multi-tenant business identity and brand isolation', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $businessA = Business::factory()->create([
        'user_id' => $userA->id,
        'name' => 'Business A',
    ]);

    $userB = User::factory()->create(['onboarding_completed' => true]);
    $businessB = Business::factory()->create([
        'user_id' => $userB->id,
        'name' => 'Business B',
    ]);

    $compositor = new ImageCompositorService;

    // Scoped to business A
    $manifestA = $compositor->generateCompositingManifest([], $businessA);
    expect($manifestA['exact_content']['brand_name'])->toBe('Business A');

    // Scoped to business B
    $manifestB = $compositor->generateCompositingManifest([], $businessB);
    expect($manifestB['exact_content']['brand_name'])->toBe('Business B');
});

it('generates a complete marketing creative brief in No-Reference Mode without dropping creative inputs', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $options = [
        'product_name' => 'Caramel Machiato',
        'product_description' => 'Rich espresso layered with caramel and milk',
        'product_category' => 'Coffee & Beverages',
        'reference_image_path' => null,
        'product_image_url' => null,
        'scene_prompt' => 'Place the drink on a wooden café table beside a bouquet of pink carnations with warm morning window light.',
        'event_name' => 'Mother\'s Day Special',
        'campaign_name' => 'Spring Appreciation',
        'campaign_objective' => 'Drive seasonal cafe visits',
        'price' => '₱149',
        'tagline' => 'A sweet gesture for mom.',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Café',
        'brand_tone' => ['Warm & Welcoming', 'Playful'],
        'render_style' => 'Photorealistic Commercial Photography',
        'visual_theme' => ['Warm Seasonal', 'Botanical Accent'],
        'aspect_ratio' => '1:1',
    ];

    $prompt = $orchestrator->orchestrate($options);

    // 1. Must use Generative Product & Complete Scene Mode
    expect($prompt)->toContain('PRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):')
        ->toContain('Reference Image Available: NO (Generative Commercial Scene Mode)')
        ->toContain('Target Product: Caramel Machiato')
        ->toContain('Category: Coffee & Beverages')
        ->toContain('GENERATIVE SCENE DIRECTIVE: Synthesize an authentic, photorealistic commercial product representation of Caramel Machiato integrated naturally as the centerpiece of a COMPLETE MARKETING ADVERTISEMENT SCENE.');

    // 2. User Scene Prompt must be included as first-class creative input
    expect($prompt)->toContain('USER SCENE / VISUAL DIRECTION:')
        ->toContain('Place the drink on a wooden café table beside a bouquet of pink carnations with warm morning window light.')
        ->toContain('PRIMARY SCENE INSTRUCTION: Fulfill this specific scene setting, props, environment, and visual atmosphere');

    // 3. Marketing Content
    expect($prompt)->toContain('MARKETING CONTENT:')
        ->toContain('• Product Name: Caramel Machiato')
        ->toContain('• Price: ₱149')
        ->toContain('• Tagline: "A sweet gesture for mom"');

    // 4. Campaign Objective
    expect($prompt)->toContain('CAMPAIGN:')
        ->toContain('• Campaign: Spring Appreciation')
        ->toContain('• Goal: Drive seasonal cafe visits');

    // 5. Event Direction
    expect($prompt)->toContain('EVENT DIRECTION:')
        ->toContain('Event: Mother\'s Day Special')
        ->toContain('Mood: Warm, heartwarming & appreciative');

    // 6. Industry & Category Art Direction
    expect($prompt)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Café — Coffee & Beverages')
        ->toContain('• Commercial Environment: Artisanal specialty café counter');

    // 7. Brand Identity & Tone
    expect($prompt)->toContain('BRAND IDENTITY:')
        ->toContain('BUSINESS / SHOP: "CoffeYessir" (Café)')
        ->toContain('BRAND TONE:')
        ->toContain('Warm & Welcoming, Playful');

    // 7. Render Style
    expect($prompt)->toContain('RENDER STYLE:')
        ->toContain('Photorealistic Commercial Photography');

    // 8. Visual Theme
    expect($prompt)->toContain('VISUAL THEME:')
        ->toContain('Warm Seasonal, Botanical Accent');

    // 9. Invisible Safe Margins & Output Cleanliness
    expect($prompt)->toContain('COMPOSITION & SAFE MARGINS')
        ->toContain('INVISIBLE SAFE AREA:')
        ->toContain('The safe margin must NEVER appear in the final artwork')
        ->toContain('DO NOT render safe-margin boundaries, dotted or dashed borders, frames, guides, grids, rulers');
});

it('enforces invisible safe area constraints and forbids technical overlays in prompt', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Coffee',
        'aspect_ratio' => '16:9',
    ]);

    expect($prompt)->toContain('COMPOSITION & SAFE MARGINS (INVISIBLE SAFE AREA & OUTPUT CLEANLINESS):')
        ->toContain('The 20% safe margin is an internal, invisible layout constraint only.')
        ->toContain('DO NOT render safe-margin boundaries, dotted or dashed borders, frames, guides, grids, rulers, crop marks, alignment marks, measurement indicators, percentage labels, technical annotations, "20% SAFE MARGIN", "SAFE MARGIN"')
        ->toContain('The final image must look like a finished professional commercial advertisement, not a design template, production proof, wireframe, or editing canvas.');
});

it('preserves user scene prompt from notes, image_prompt, or prompt strings', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // Test with image_prompt
    $promptA = $orchestrator->orchestrate([
        'product_name' => 'Matcha Latte',
        'image_prompt' => 'On a minimalist slate coaster with scattered green tea leaves.',
    ]);
    expect($promptA)->toContain('USER SCENE / VISUAL DIRECTION:')
        ->toContain('On a minimalist slate coaster with scattered green tea leaves.');

    // Test with notes
    $promptB = $orchestrator->orchestrate([
        'product_name' => 'Matcha Latte',
        'notes' => 'Rustic wooden background with steam rising gracefully.',
    ]);
    expect($promptB)->toContain('USER SCENE / VISUAL DIRECTION:')
        ->toContain('Rustic wooden background with steam rising gracefully.');
});

it('keeps Brand Tone, Render Style, and Visual Theme distinctly separated without collisions', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso Martini',
        'brand_tone' => ['Sophisticated', 'Bold'],
        'render_style' => 'Cinematic Marketing',
        'visual_theme' => ['Midnight Glamour', 'Moody Bar'],
    ]);

    expect($prompt)->toContain("BRAND TONE:\nSophisticated, Bold")
        ->toContain("RENDER STYLE:\nCinematic Marketing")
        ->toContain("VISUAL THEME:\nMidnight Glamour, Moody Bar")
        ->not->toContain('Studio Product Still');
});

it('orchestrates unique, aspect-ratio-aware composition profiles for all 5 supported aspect ratios', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $ratios = [
        '1:1' => [
            'expectedTitle' => '1:1 SQUARE COMMERCIAL ADVERTISEMENT',
            'expectedFeatures' => [
                'Symmetrical, balanced square canvas',
                'Center or slightly offset focal region with balanced visual weight',
                'Compact horizontal or balanced stacked arrangement',
                'Balanced 360-degree breathing room',
            ],
        ],
        '9:16' => [
            'expectedTitle' => '9:16 MOBILE VERTICAL COMMERCIAL ADVERTISEMENT',
            'expectedFeatures' => [
                'Tall smartphone mobile-first canvas (Story / Reel / TikTok format)',
                'Central or lower-central region with commanding vertical presence',
                'DO NOT squeeze a landscape composition into 9:16',
                'Clear vertical visual hierarchy: Headline → Hero Product → Tagline/Price',
                'Vertical environmental depth',
            ],
        ],
        '16:9' => [
            'expectedTitle' => '16:9 WIDE LANDSCAPE COMMERCIAL ADVERTISEMENT',
            'expectedFeatures' => [
                'Wide horizontal commercial banner canvas',
                'Lateral placement (golden ratio left or right third)',
                'DO NOT place every element in the dead center',
                'DO NOT squeeze a portrait layout into 16:9',
                'Opposite lateral third dedicated to marketing copy',
                'Expansive horizontal environmental storytelling',
            ],
        ],
        '4:5' => [
            'expectedTitle' => '4:5 PORTRAIT SOCIAL MEDIA ADVERTISEMENT',
            'expectedFeatures' => [
                'Social-media-friendly portrait canvas (Instagram/Facebook Feed format)',
                'Central or lower-central area with prominent visual dominance',
                'High-impact centerpiece occupying approximately 45%–60% of the canvas height',
                'Vertical hierarchy with comfortable horizontal breathing room',
                'Generous horizontal margin breathing room',
            ],
        ],
        '4:3' => [
            'expectedTitle' => '4:3 STANDARD LANDSCAPE COMMERCIAL ADVERTISEMENT',
            'expectedFeatures' => [
                'Balanced traditional landscape canvas (Display Ads & Content format)',
                'Dominant focal centerpiece with balanced left/right or slight asymmetric placement',
                'Moderately wide commercial staging',
                'Balanced lateral or upper-corner marketing copy',
                'Traditional advertising negative space',
            ],
        ],
    ];

    foreach ($ratios as $ratio => $specs) {
        $prompt = $orchestrator->orchestrate([
            'product_name' => 'Signature Blend Coffee',
            'aspect_ratio' => $ratio,
        ]);

        expect($prompt)->toContain($specs['expectedTitle']);

        foreach ($specs['expectedFeatures'] as $feature) {
            expect($prompt)->toContain($feature);
        }

        // Verify that different aspect ratios generate distinct composition directives
        foreach ($ratios as $otherRatio => $otherSpecs) {
            if ($ratio !== $otherRatio) {
                expect($prompt)->not->toContain($otherSpecs['expectedTitle']);
            }
        }
    }
});

it('enforces strict anti-logo mandate and creative typography rules for business name', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // 1. With Business Name Included
    $promptWithBusiness = $orchestrator->orchestrate([
        'product_name' => 'Artisan Croissant',
        'business_name' => 'Le Petit Café & Bakery',
        'include_business_name' => true,
    ]);

    expect($promptWithBusiness)
        ->toContain('STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol')
        ->toContain('BUSINESS / SHOP: "Le Petit Café & Bakery"')
        ->toContain('Render the exact business name "Le Petit Café & Bakery" as visible text integrated naturally into the overall advertisement composition.')
        ->toContain('Creative Typographic Integration: Visually integrate the name into the creative design using elegant, bold, modern, premium, playful, handwritten, editorial, or stylized typography')
        ->toContain('STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name.')
        ->toContain('DO NOT create a coffee cup logo, coffee bean logo, café icon, crown, badge, seal, crest, monogram, mascot, watermark, or brand symbol.');

    // 2. With Business Name Disabled
    $promptWithoutBusiness = $orchestrator->orchestrate([
        'product_name' => 'Artisan Croissant',
        'business_name' => 'Le Petit Café & Bakery',
        'include_business_name' => false,
    ]);

    expect($promptWithoutBusiness)
        ->toContain('Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.')
        ->not->toContain('Le Petit Café & Bakery');
});

it('adapts holiday and event spatial staging to the selected aspect ratio', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt916 = $orchestrator->orchestrate([
        'product_name' => 'Iced Mocha',
        'event_name' => 'Christmas Mega Sale',
        'aspect_ratio' => '9:16',
    ]);

    expect($prompt916)->toContain('Vertical seasonal storytelling with celebratory accents distributed along vertical safe zones');

    $prompt169 = $orchestrator->orchestrate([
        'product_name' => 'Iced Mocha',
        'event_name' => 'Christmas Mega Sale',
        'aspect_ratio' => '16:9',
    ]);

    expect($prompt169)->toContain('Wide horizontal environmental storytelling with expansive atmospheric festive depth');

    $prompt11 = $orchestrator->orchestrate([
        'product_name' => 'Iced Mocha',
        'event_name' => 'Christmas Mega Sale',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt11)->toContain('Compact balanced framing with harmonious seasonal accents framing the product');
});

it('normalizes taglines deterministically in prompt orchestration across reference and generative modes', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // Test trailing period stripped
    $promptPeriod = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'tagline' => 'Fresh Taste.',
    ]);
    expect($promptPeriod)->toContain('• Tagline: "Fresh Taste" (exact user tagline, do not alter or paraphrase)')
        ->not->toContain('• Tagline: "Fresh Taste."');

    // Test trailing dangling connector stripped
    $promptDangling = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'tagline' => 'Fresh Taste &',
    ]);
    expect($promptDangling)->toContain('• Tagline: "Fresh Taste" (exact user tagline, do not alter or paraphrase)')
        ->not->toContain('• Tagline: "Fresh Taste &"');

    // Test intentional exclamation preserved
    $promptExclamation = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'tagline' => 'Taste the magic!',
    ]);
    expect($promptExclamation)->toContain('• Tagline: "Taste the magic!" (exact user tagline, do not alter or paraphrase)');

    // Test internal punctuation preserved
    $promptInternal = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'tagline' => 'Sweet, savory & fresh',
    ]);
    expect($promptInternal)->toContain('• Tagline: "Sweet, savory & fresh" (exact user tagline, do not alter or paraphrase)');

    // Test Reference Product Mode with quotes stripped cleanly without double wrapping
    $promptRefMode = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'reference_image_path' => 'products/coffee.png',
        'tagline' => '“The Ultimate Brew...”',
    ]);
    expect($promptRefMode)->toContain('• Tagline: "The Ultimate Brew" (exact user tagline, do not alter or paraphrase)')
        ->not->toContain('""');
});
