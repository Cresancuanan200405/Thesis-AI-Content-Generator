<?php

use App\Models\Product;
use App\Services\ModularPromptOrchestrator;

it('Test A: Single product does not receive multi-product composition instructions', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Single Espresso Shot',
        'reference_image_path' => 'products/espresso.png',
        'catalog_products' => [
            ['id' => 10, 'name' => 'Single Espresso Shot', 'price' => '120.00', 'image_path' => 'products/espresso.png'],
        ],
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->not->toContain('MULTI-PRODUCT COMPOSITION:')
        ->not->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY:')
        ->not->toContain('CO-FEATURED PRODUCTS & SERVICES:')
        ->not->toContain('• Co-Featured Catalog Products:')
        ->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('PRODUCT PRESERVATION:');
});

it('Test B: Two products receive coherent primary and supporting composition strategy', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Macchiato',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Caramel Macchiato', 'price' => '150.00', 'image_path' => 'products/caramel.png'],
            ['id' => 2, 'name' => 'Cold Brew Bottle', 'price' => '180.00', 'image_path' => 'products/coldbrew.png'],
        ],
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT COMPOSITION:')
        ->toContain('Primary / Hero Product: "Caramel Macchiato"')
        ->toContain('Secondary / Supporting Product: "Cold Brew Bottle"')
        ->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: tiered pedestal')
        ->toContain('STAGING MANDATE: DO NOT align products in a flat side-by-side row')
        ->toContain('COMPOSITION GUIDANCE: Maintain disciplined studio product hierarchy');
});

it('Test C: Three products receive three-tier hierarchy and coherent arrangement strategy', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Espresso Blend',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Signature Espresso Blend', 'price' => '190.00', 'image_path' => 'products/espresso.png'],
            ['id' => 2, 'name' => 'Matcha Green Tea Latte', 'price' => '170.00', 'image_path' => 'products/matcha.png'],
            ['id' => 3, 'name' => 'Almond Butter Croissant', 'price' => '130.00', 'image_path' => 'products/croissant.png'],
        ],
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT COMPOSITION:')
        ->toContain('Primary / Hero Product: "Signature Espresso Blend"')
        ->toContain('Secondary / Supporting Product: "Matcha Green Tea Latte"')
        ->toContain('Tertiary / Supporting Product: "Almond Butter Croissant"')
        ->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: hero + supporting products')
        ->toContain('STAGING MANDATE: DO NOT align products in a flat side-by-side row, generic horizontal line, or rigid grid.');
});

it('Test D: Prompt does not prescribe rigid coordinates or hardcoded positions', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso', 'price' => '120.00'],
            ['id' => 2, 'name' => 'Latte', 'price' => '150.00'],
            ['id' => 3, 'name' => 'Mocha', 'price' => '160.00'],
        ],
        'render_style' => 'Cinematic Marketing',
        'aspect_ratio' => '16:9',
    ]);

    expect($prompt)->toContain('CANVAS & ASPECT RATIO RESPONSIVENESS (NO HARDCODED POSITIONS):')
        ->not->toContain('must always be on the left')
        ->not->toContain('must always be on the right')
        ->not->toContain('must always be in the center')
        ->not->toContain('x=')
        ->not->toContain('y=');
});

it('Test E: Prompt enforces distinct product integrity against merging, swapping, or generic substitution', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso Blend',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso Blend', 'price' => '140.00'],
            ['id' => 2, 'name' => 'Iced Americano', 'price' => '130.00'],
        ],
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('DISTINCT PHYSICAL PRODUCT INTEGRITY:')
        ->toContain('Do NOT merge two or more products into a single combined item.')
        ->toContain('Do NOT swap packaging, containers, labels, or branding between products.')
        ->toContain('Do NOT omit any selected product from the composition.')
        ->toContain('Do NOT duplicate one product to replace another.')
        ->toContain('Avoid floating callout boxes, leader lines, dots, or UI cards pointing to products.');
});

it('Test F: Deterministic product ordering remains stable across orchestration', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $catalog = [
        ['id' => 101, 'name' => 'Product Alpha', 'price' => '100.00'],
        ['id' => 102, 'name' => 'Product Beta', 'price' => '200.00'],
        ['id' => 103, 'name' => 'Product Gamma', 'price' => '300.00'],
    ];

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Product Alpha',
        'catalog_products' => $catalog,
        'aspect_ratio' => '1:1',
    ]);

    $posHero = strpos($prompt, 'Primary / Hero Product: "Product Alpha"');
    $posBeta = strpos($prompt, 'Secondary / Supporting Product: "Product Beta"');
    $posGamma = strpos($prompt, 'Tertiary / Supporting Product: "Product Gamma"');

    expect($posHero)->not->toBeFalse()
        ->and($posBeta)->not->toBeFalse()
        ->and($posGamma)->not->toBeFalse()
        ->and($posHero)->toBeLessThan($posBeta)
        ->and($posBeta)->toBeLessThan($posGamma);
});

it('Test G: Multi-product per-product price associations remain exact and intact', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $catalog = [
        ['id' => 50, 'name' => 'Drink A', 'price' => '115.00'],
        ['id' => 51, 'name' => 'Drink B', 'price' => '225.00'],
    ];

    $prices = [
        '50' => '115.00',
        'Drink A' => '115.00',
        '51' => '225.00',
        'Drink B' => '225.00',
    ];

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Drink A',
        'catalog_products' => $catalog,
        'prices' => $prices,
        'include_prices' => true,
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('• Product 1 ("Drink A"):')
        ->toContain('Exact price: ₱115.00')
        ->toContain('• Product 2 ("Drink B"):')
        ->toContain('Exact price: ₱225.00')
        ->toContain('MULTI-PRODUCT PRICE RULES:');
});

it('Test H: Explicit user composition instructions remain authoritative over default arrangement', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '499.00'],
            ['id' => 2, 'name' => 'Spanish Latte', 'price' => '180.00'],
            ['id' => 3, 'name' => 'Iced Matcha', 'price' => '190.00'],
        ],
        'render_style' => 'Studio Product Still',
        'scene_prompt' => 'Show the three drinks together on a rustic wood table with the espresso closest to camera in front of the others.',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('• PRIMARY USER SCENE DIRECTION: Show the three drinks together on a rustic wood table with the espresso closest to camera in front of the others.')
        ->toContain('USER COMPOSITION DIRECTION PRECEDENCE: When the user\'s explicit creative direction in Section 4 specifies a spatial arrangement')
        ->toContain('User Placement Precedence: Honor any specific product placement or grouping requested in the user scene prompt over default staging.');
});

it('Test I: Multi-product arrangement guidance adapts compatibly to all four canonical render styles', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $catalog = [
        ['id' => 1, 'name' => 'Drink One', 'price' => '100.00'],
        ['id' => 2, 'name' => 'Drink Two', 'price' => '120.00'],
        ['id' => 3, 'name' => 'Drink Three', 'price' => '140.00'],
    ];

    // 1. Studio Product Still (3 products) -> hero + supporting products
    $promptStudio = $orchestrator->orchestrate([
        'product_name' => 'Drink One',
        'catalog_products' => $catalog,
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);
    expect($promptStudio)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: hero + supporting products')
        ->toContain('Maintain disciplined studio product hierarchy');

    // 2. Cinematic Marketing (3 products) -> staggered depth
    $promptCinematic = $orchestrator->orchestrate([
        'product_name' => 'Drink One',
        'catalog_products' => $catalog,
        'render_style' => 'Cinematic Marketing',
        'aspect_ratio' => '1:1',
    ]);
    expect($promptCinematic)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: staggered depth')
        ->toContain('Emphasize dimensional foreground/background relationships with volumetric atmospheric lighting');

    // 3. Lifestyle Capture (3 products) -> sculptural cluster
    $promptLifestyle = $orchestrator->orchestrate([
        'product_name' => 'Drink One',
        'catalog_products' => $catalog,
        'render_style' => 'Lifestyle Capture',
        'aspect_ratio' => '1:1',
    ]);
    expect($promptLifestyle)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: sculptural cluster')
        ->toContain('Stage products with organic, unforced contextual spacing');

    // 4. Minimalist Graphic (3 products) -> editorial cascade
    $promptMinimalist = $orchestrator->orchestrate([
        'product_name' => 'Drink One',
        'catalog_products' => $catalog,
        'render_style' => 'Minimalist Graphic',
        'aspect_ratio' => '1:1',
    ]);
    expect($promptMinimalist)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: editorial cascade')
        ->toContain('Emphasize restrained geometric grouping, generous negative space');
});

it('Test J: Multi-product composition adapts naturally to aspect ratio without hardcoded coordinates', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $catalog = [
        ['id' => 1, 'name' => 'Product 1', 'price' => '100.00'],
        ['id' => 2, 'name' => 'Product 2', 'price' => '120.00'],
    ];

    // Vertical canvas 9:16
    $promptVertical = $orchestrator->orchestrate([
        'product_name' => 'Product 1',
        'catalog_products' => $catalog,
        'aspect_ratio' => '9:16',
    ]);
    expect($promptVertical)->toContain('CANVAS & ASPECT RATIO RESPONSIVENESS (NO HARDCODED POSITIONS):')
        ->toContain('For vertical canvas, utilize vertical depth planes, tiered surface heights')
        ->toContain('rather than cramping them into a narrow horizontal line.');

    // Horizontal canvas 16:9
    $promptHorizontal = $orchestrator->orchestrate([
        'product_name' => 'Product 1',
        'catalog_products' => $catalog,
        'aspect_ratio' => '16:9',
    ]);
    expect($promptHorizontal)->toContain('CANVAS & ASPECT RATIO RESPONSIVENESS (NO HARDCODED POSITIONS):')
        ->toContain('For horizontal canvas, utilize lateral negative space, diagonal depth')
        ->toContain('avoiding vertical stacking.');
});

it('Test K: Industry and category art direction remains active alongside multi-product composition', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Cold Brew Bottle',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Cold Brew Bottle', 'price' => '160.00'],
            ['id' => 2, 'name' => 'Espresso Blend', 'price' => '140.00'],
        ],
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Café / Coffee Shop',
        'business_name' => 'Brew Haven',
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('Artisanal specialty café counter')
        ->toContain('MULTI-PRODUCT COMPOSITION:')
        ->toContain('Primary / Hero Product: "Cold Brew Bottle"')
        ->toContain('Secondary / Supporting Product: "Espresso Blend"');
});

it('Test L: Phase A product identity vs camera presentation rules are preserved and not weakened', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '499.00', 'image_path' => 'products/overhead.jpg'],
            ['id' => 2, 'name' => 'Spanish Latte', 'price' => '180.00', 'image_path' => 'products/latte.jpg'],
        ],
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('• PRODUCT IDENTITY VS. CAMERA PRESENTATION ROLE:')
        ->toContain('The supplied catalog product image is the authoritative reference for PRODUCT IDENTITY')
        ->toContain('The catalog image is NOT a mandatory camera angle, framing, or composition reference.')
        ->toContain('• PRODUCT IDENTITY VS. PRESENTATION IN MULTI-PRODUCT STAGING:')
        ->toContain('Each referenced product\'s catalog image is the authoritative identity reference for WHAT that product is')
        ->toContain('Controlled Presentation Freedom (How the product is presented):')
        ->toContain('present the product from a more attractive commercial perspective (such as an eye-level, slightly elevated, or three-quarter product-photography view).');
});
