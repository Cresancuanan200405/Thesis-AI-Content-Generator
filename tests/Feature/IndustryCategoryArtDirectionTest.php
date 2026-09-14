<?php

use App\Models\Product;
use App\Services\IndustryCategoryArtDirectionService;
use App\Services\ModularPromptOrchestrator;

it('authoritative taxonomy exposes exactly 12 MSME industries', function () {
    $industries = IndustryCategoryArtDirectionService::getIndustries();

    expect($industries)->toHaveCount(12)
        ->toBe([
            'Food & Beverage',
            'Retail & E-Commerce',
            'Fashion & Apparel',
            'Beauty & Personal Care',
            'Home & Lifestyle',
            'Agriculture & Agribusiness',
            'Arts, Crafts & Creative Services',
            'Tourism & Hospitality',
            'Automotive & Transport Services',
            'Technology & Digital Services',
            'Education & Training',
            'Health, Fitness & Wellness',
        ]);
});

it('validates industry and category combinations correctly', function () {
    expect(IndustryCategoryArtDirectionService::isValidCombination('Food & Beverage', 'Café / Coffee Shop'))->toBeTrue()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Food & Beverage', 'Restaurant'))->toBeTrue()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Automotive & Transport Services', 'Auto Repair'))->toBeTrue()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Technology & Digital Services', 'Software / Digital Services'))->toBeTrue()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Food & Beverage', 'Auto Repair'))->toBeFalse()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Automotive & Transport Services', 'Skincare'))->toBeFalse()
        ->and(IndustryCategoryArtDirectionService::isValidCombination('Invalid Industry', 'Restaurant'))->toBeFalse()
        ->and(IndustryCategoryArtDirectionService::isValidCombination(null, null))->toBeFalse();
});

it('resolves dedicated structured visual art direction for all 12 MSME industries', function () {
    $service = new IndustryCategoryArtDirectionService;
    $industries = IndustryCategoryArtDirectionService::getIndustries();

    foreach ($industries as $industry) {
        $categories = IndustryCategoryArtDirectionService::getCategoriesForIndustry($industry);
        expect($categories)->not->toBeEmpty();

        $firstCategory = $categories[0];
        $direction = $service->resolveArtDirection($industry, $firstCategory, 'Test MSME Hero Product');

        expect($direction)->toHaveKeys([
            'industry',
            'category',
            'environment',
            'surfaces',
            'lighting',
            'props',
            'commercial_conventions',
            'things_to_avoid',
        ])
            ->and($direction['environment'])->not->toBeEmpty()
            ->and($direction['surfaces'])->not->toBeEmpty()
            ->and($direction['lighting'])->not->toBeEmpty()
            ->and($direction['props'])->not->toBeEmpty()
            ->and($direction['commercial_conventions'])->not->toBeEmpty()
            ->and($direction['things_to_avoid'])->not->toBeEmpty();

        $promptModule = $service->formatForPrompt($direction, 'Test MSME Hero Product');
        expect($promptModule)->toContain("INDUSTRY & CATEGORY ART DIRECTION: {$industry} — {$firstCategory}")
            ->toContain('• Commercial Environment:')
            ->toContain('• Contextual Surfaces & Materials:')
            ->toContain('• Commercial Lighting Direction:')
            ->toContain('• Restrained Supporting Props:')
            ->toContain('• Commercial Photography Standards:')
            ->toContain('• Things to Avoid:')
            ->toContain('• Hierarchy & Subordination: Industry and category staging must elevate Test MSME Hero Product as the undisputed hero');
    }
});

it('resolves dedicated structured visual art direction for Food & Beverage and Cafe', function () {
    $service = new IndustryCategoryArtDirectionService;

    $direction = $service->resolveArtDirection('Food & Beverage', 'Café / Coffee Shop', 'Iced Caramel Macchiato');

    expect($direction['industry'])->toBe('Food & Beverage')
        ->and($direction['category'])->toBe('Café / Coffee Shop')
        ->and($direction['environment'])->toContain('café')
        ->and($direction['surfaces'])->toContain('wood')
        ->and($direction['lighting'])->toContain('Warm golden sunlight')
        ->and($direction['props'])->toContain('saucer')
        ->and($direction['commercial_conventions'])->toContain('beverage')
        ->and($direction['things_to_avoid'])->toContain('Do not clutter');

    $promptModule = $service->formatForPrompt($direction, 'Iced Caramel Macchiato');
    expect($promptModule)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('• Commercial Environment:')
        ->toContain('• Contextual Surfaces & Materials:')
        ->toContain('• Commercial Lighting Direction:')
        ->toContain('• Restrained Supporting Props:')
        ->toContain('• Hierarchy & Subordination: Industry and category staging must elevate Iced Caramel Macchiato as the undisputed hero');
});

it('resolves distinct art direction for different industries (Automotive vs Beauty vs Technology)', function () {
    $service = new IndustryCategoryArtDirectionService;

    $beauty = $service->resolveArtDirection('Beauty & Personal Care', 'Skincare', 'Hydrating Facial Serum');
    $auto = $service->resolveArtDirection('Automotive & Transport Services', 'Car Wash / Detailing', 'Ceramic Shield Polish');
    $tech = $service->resolveArtDirection('Technology & Digital Services', 'Software / Digital Services', 'Cloud Management Suite');

    // Beauty
    expect($beauty['environment'])->toContain('skincare vanity')
        ->and($beauty['surfaces'])->toContain('travertine')
        ->and($beauty['lighting'])->toContain('luminous beauty lighting')
        ->and($beauty['things_to_avoid'])->toContain('makeup kits');

    // Automotive
    expect($auto['environment'])->toContain('detailing bay')
        ->and($auto['surfaces'])->toContain('showroom floor')
        ->and($auto['lighting'])->toContain('LED strip lighting')
        ->and($auto['things_to_avoid'])->toContain('grease stains');

    // Tech
    expect($tech['environment'])->toContain('tech studio')
        ->and($tech['surfaces'])->toContain('aluminum')
        ->and($tech['lighting'])->toContain('cool-white')
        ->and($tech['things_to_avoid'])->toContain('tangled cable');
});

it('integrates industry and category art direction into ModularPromptOrchestrator in Reference Product Mode', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Blend Coffee',
        'reference_image_path' => 'products/coffee.png',
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Café / Coffee Shop',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
        'aspect_ratio' => '9:16',
    ]);

    // Verify Reference Product Mode is active
    expect($prompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('REFERENCE PRODUCT PRESERVATION MODE')
        ->toContain('PRODUCT PRESERVATION:');

    // Verify Active Industry & Category Art Direction is present
    expect($prompt)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('• Commercial Environment: Artisanal specialty café counter')
        ->toContain('• Contextual Surfaces & Materials:')
        ->toContain('• Commercial Lighting Direction: Warm golden sunlight')
        ->toContain('• Restrained Supporting Props:')
        ->toContain('• Hierarchy & Subordination: Industry and category staging must elevate Signature Blend Coffee as the undisputed hero');

    // Verify Anti-Logo and Brand Identity
    expect($prompt)->toContain('STRICT LOGO RESTRICTION:')
        ->toContain('BUSINESS / SHOP: "CoffeYessir" (Food & Beverage)')
        ->toContain('• STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL):');
});

it('integrates industry and category art direction into ModularPromptOrchestrator in Generative Mode', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Hydro Glow Serum',
        'business_industry' => 'Beauty & Personal Care',
        'business_category' => 'Skincare',
        'business_name' => 'Luxe Skin Lab',
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('PRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):')
        ->toContain('INDUSTRY & CATEGORY ART DIRECTION: Beauty & Personal Care — Skincare')
        ->toContain('• Commercial Environment: Pristine luxury skincare vanity')
        ->toContain('• Commercial Photography Standards: Premium cosmetic and skincare advertising photography')
        ->toContain('STRICT LOGO RESTRICTION:');
});

it('incorporates supplemental business context without overriding product fidelity', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Cold Brew Bottle',
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Café / Coffee Shop',
        'business_description' => 'A boutique micro-roastery serving specialty single-origin beans.',
    ]);

    expect($prompt)->toContain('BUSINESS CONTEXT:')
        ->toContain('• Business Description: A boutique micro-roastery serving specialty single-origin beans.')
        ->toContain('• Business Category: Café / Coffee Shop')
        ->toContain('• Instruction: Use the business description only as contextual information for visual generation.');
});

it('seamlessly combines Event + Industry + Category + Product + Tone + Style', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso Caramel Blend',
        'event_name' => 'Mother\'s Day Special',
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Café / Coffee Shop',
        'business_name' => 'CoffeYessir',
        'brand_tone' => ['Warm & Welcoming', 'Playful'],
        'render_style' => 'Studio Product Still',
        'visual_theme' => ['Cozy Cafe Vibe'],
        'aspect_ratio' => '16:9',
    ]);

    // Event
    expect($prompt)->toContain('EVENT DIRECTION:')
        ->toContain('Mother\'s Day Special')
        ->toContain('Mood: Warm, heartwarming & appreciative');

    // Industry Art Direction
    expect($prompt)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('Artisanal specialty café counter');

    // Brand Identity & Tone
    expect($prompt)->toContain('BUSINESS / SHOP: "CoffeYessir" (Food & Beverage)')
        ->toContain('BRAND TONE:')
        ->toContain('Warm & Welcoming, Playful');

    // Render Style & Theme
    expect($prompt)->toContain('RENDER STYLE:')
        ->toContain('Studio Product Still')
        ->toContain('VISUAL THEME:')
        ->toContain('Cozy Cafe Vibe');

    // Composition & Safe Area
    expect($prompt)->toContain('RESPONSIVE COMPOSITION PROFILE: 16:9 WIDE LANDSCAPE COMMERCIAL ADVERTISEMENT')
        ->toContain('The 20% safe margin is an internal, invisible layout constraint only.');
});
