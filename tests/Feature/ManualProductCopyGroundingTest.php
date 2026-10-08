<?php

use App\Models\Business;
use App\Models\Product;
use App\Services\ModularPromptOrchestrator;

it('Test A: Single product name grounding requires intentional visual association between physical product and name', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 10, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
        ],
        'include_product_name' => true,
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('• Product Name Grounding: The product name "Espresso de Peligro" must be visually grounded with the physical hero product')
        ->toContain('POSITIVE TYPOGRAPHY GROUNDING & PRODUCT-COPY ASSOCIATION:')
        ->toContain('Physical Product ↕ Product Name ↕ Price')
        ->toContain('• Hero Product: "Espresso de Peligro"');
});

it('Test B: Single product price grounding requires exact price and visual association with the physical product', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'include_prices' => true,
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('• Single Product Price Grounding: Visually ground the exact price (₱145.00) with Espresso de Peligro')
        ->toContain('Price Requirement: MUST appear visibly in the image with crisp, legible typography maintaining the exact currency symbol and digits (₱145.00)')
        ->toContain('• Product price data is authoritative.');
});

it('Test C: Multi-product name/price mapping preserves 1-to-1 association for 2 products without swapping', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
            ['id' => 2, 'name' => 'Cold Brew Reserve', 'price' => '185.00'],
        ],
        'include_product_name' => true,
        'include_prices' => true,
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT NAME & PRICE ASSOCIATION (1-TO-1 MAPPING):')
        ->toContain('Product 1 ("Espresso de Peligro") ↔ ₱145.00')
        ->toContain('Product 2 ("Cold Brew Reserve") ↔ ₱185.00')
        ->toContain('Product A ↔ Name A ↔ Price A; Product B ↔ Name B ↔ Price B')
        ->toContain("Do NOT assign Product A's price to Product B, nor place Product B's name beside Product A.")
        ->toContain('Do NOT merge multiple prices into one generic price or create an unattached floating price stack.');
});

it('Test D: Three-product mapping maintains distinct name and price relationships for all 3 products', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
            ['id' => 2, 'name' => 'Cold Brew Reserve', 'price' => '185.00'],
            ['id' => 3, 'name' => 'Almond Croissant', 'price' => '120.00'],
        ],
        'include_product_name' => true,
        'include_prices' => true,
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT NAME & PRICE ASSOCIATION (1-TO-1 MAPPING):')
        ->toContain('Product 1 ("Espresso de Peligro") ↔ ₱145.00')
        ->toContain('Product 2 ("Cold Brew Reserve") ↔ ₱185.00')
        ->toContain('Product 3 ("Almond Croissant") ↔ ₱120.00')
        ->toContain('Product A ↔ Name A ↔ Price A; Product B ↔ Name B ↔ Price B; Product C ↔ Name C ↔ Price C')
        ->toContain("Do NOT omit any selected product's required copy when its visibility setting is enabled.");
});

it('Test E: Exact price preservation leaves authoritative digits and currency unaltered', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Handcrafted Pour Over',
        'price' => '210.50',
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('₱210.50')
        ->not->toContain('₱210.00')
        ->not->toContain('₱211.00')
        ->toContain('Preserve digits exactly.')
        ->toContain('Preserve currency exactly.');
});

it('Test F: Product name visibility disables product name text when include_product_name is false', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'include_product_name' => false,
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('INCLUDE PRODUCT NAME = FALSE:')
        ->toContain('PRODUCT NAME: Disabled.')
        ->toContain('Do not render the product name as visible marketing text typography.')
        ->toContain('The physical product itself MUST remain visually present as the hero subject')
        ->not->toContain('• Hero Product: "Espresso de Peligro"');
});

it('Test G: Price visibility disables prices when include_prices is false', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'include_product_name' => true,
        'include_prices' => false,
    ]);

    expect($prompt)->toContain('INCLUDE PRICES = FALSE:')
        ->toContain('MARKETING PRICE DISPLAY: Disabled')
        ->toContain('Do not render prices.')
        ->toContain('Do not render product/service prices as visible text.')
        ->not->toContain('₱145.00');
});

it('Test H: Tagline visibility prohibits tagline when include_tagline is false', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'tagline' => 'Awaken your inner dangerous focus.',
        'include_tagline' => false,
    ]);

    expect($prompt)->toContain('INCLUDE TAGLINE = FALSE:')
        ->toContain('TAGLINE: Disabled.')
        ->toContain('Do not render any tagline, headline, slogan, or substitute phrase.')
        ->not->toContain('Awaken your inner dangerous focus.');
});

it('Test I: Event text visibility prohibits literal event text when show_event_text is false while preserving atmosphere', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'event_name' => 'Christmas Mega Sale',
        'show_event_text' => false,
    ]);

    expect($prompt)->toContain('EVENT TEXT: FORBIDDEN')
        ->toContain('Event/Holiday Name "Christmas Mega Sale" is NOT approved visible marketing copy.')
        ->toContain('STRICT FORBIDDEN TEXT: Do NOT render "Christmas Mega Sale"')
        ->toContain('Event: Christmas Mega Sale')
        ->toContain('Mood: Festive, joyful & generous holiday spirit')
        ->toContain('• FORBIDDEN EVENT TEXT: Do not render the event/holiday name as visible text.');
});

it('Test J: Copy emphasis affects visual hierarchy without altering visibility controls', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // Balanced
    $promptBalanced = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'copy_emphasis' => 'Balanced',
    ]);
    expect($promptBalanced)->toContain('EQUAL WEIGHT HIERARCHY: Equal visual weight across product name, tagline, and pricing');

    // Product Emphasis
    $promptProduct = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'copy_emphasis' => 'Product',
    ]);
    expect($promptProduct)->toContain('Copy Hierarchy Directive (Product Dominance): PRIMARY VISUAL ANCHOR: Product identity and name.')
        ->toContain('The physical product itself commands primary visual authority through scale, focus, depth, lighting, placement, and contrast.')
        ->toContain('Product typography and price remain clearly grounded, readable, and supportive of the physical product');

    // Price Emphasis
    $promptPrice = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'copy_emphasis' => 'Price',
    ]);
    expect($promptPrice)->toContain('Copy Hierarchy Directive (Price Prominence): PRIMARY VISUAL ANCHOR: Pricing callout.')
        ->toContain('The authoritative catalog price commands prominent visual scale, bold weight, and high-contrast hierarchy')
        ->toContain('Each price must remain visually grounded and clearly associated with its respective physical product through proximity, grouping, alignment, and whitespace (avoiding detached floating price stacks).');

    // Tagline Emphasis
    $promptTagline = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'tagline' => 'Pure Energy.',
        'copy_emphasis' => 'Tagline',
        'include_tagline' => true,
    ]);
    expect($promptTagline)->toContain('Copy Hierarchy Directive (Tagline Prominence): PRIMARY VISUAL ANCHOR: Tagline headline.')
        ->toContain('leading the advertising hook without altering wording or breaking product/name/price visual relationships.');

    // Emphasis does NOT override disabled visibility
    $promptPriceDisabledWithPriceEmphasis = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '145.00',
        'include_prices' => false,
        'copy_emphasis' => 'Price',
    ]);
    expect($promptPriceDisabledWithPriceEmphasis)->toContain('Copy Hierarchy Directive (Price Disabled): Price is disabled by visibility setting. Do NOT render any price.')
        ->not->toContain('PRIMARY VISUAL ANCHOR: Pricing callout')
        ->not->toContain('₱145.00');
});

it('Test K: No fixed copy coordinates prevents pixel coordinates and rigid percentage positions', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
            ['id' => 2, 'name' => 'Cold Brew Reserve', 'price' => '185.00'],
        ],
        'include_product_name' => true,
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('NO FIXED COORDINATES / NO UI CALLOUTS: Do not use fixed pixel coordinates, rigid percentage locations, permanent left/right assignments, or hardcoded text boxes.')
        ->not->toMatch('/\b(100px|200px|50%|left: \d+|top: \d+)\b/i');
});

it('Test L: No UI callouts prohibits leader lines, anchor dots, connector lines, arrows, and generic UI badges', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
            ['id' => 2, 'name' => 'Cold Brew Reserve', 'price' => '185.00'],
        ],
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('NO LEADER LINES / NO CALLOUT POINTERS: Do NOT draw leader lines, pointer arrows, connector lines, anchor dots, or floating callout lines between products and prices.')
        ->toContain('Do NOT draw leader lines, pointer arrows, connector lines, anchor dots, callout cards, UI panels, dashboard labels, or floating badges');
});

it('Test M: Phase A preservation retains authoritative product identity while granting camera presentation freedom', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'render_style' => 'Studio Product Still',
    ]);

    expect($prompt)->toContain('PRODUCT IDENTITY VS. CAMERA PRESENTATION ROLE:')
        ->toContain('The supplied catalog product image is the authoritative reference for PRODUCT IDENTITY')
        ->toContain('The catalog image is NOT a mandatory camera angle, framing, or composition reference.');
});

it('Test N: Phase B preservation retains canonical multi-product spatial composition strategies', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => '145.00'],
            ['id' => 2, 'name' => 'Cold Brew Reserve', 'price' => '185.00'],
        ],
        'render_style' => 'Studio Product Still',
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: tiered pedestal')
        ->toContain('STAGING MANDATE: DO NOT align products in a flat side-by-side row, generic horizontal line, or rigid grid.')
        ->toContain('Primary / Hero Product: "Espresso de Peligro"')
        ->toContain('Secondary / Supporting Product: "Cold Brew Reserve"');
});

it('Test O: Industry and category art direction still reaches the final production prompt', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $business = new Business([
        'name' => 'The Peligro Roastery',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
    ]);

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'business_industry' => 'Food & Beverage',
        'product_category' => 'Café / Coffee Shop',
    ], $business);

    expect($prompt)->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('Commercial Environment:')
        ->toContain('Contextual Surfaces & Materials:');
});
