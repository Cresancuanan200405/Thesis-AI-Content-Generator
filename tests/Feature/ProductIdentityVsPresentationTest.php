<?php

use App\Models\Business;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;

test('Test A — Product identity preservation: production prompt explicitly requires preservation of product identity', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'render_style' => 'Studio Product Still',
    ]);

    expect($prompt)
        ->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('PRODUCT PRESERVATION:')
        ->toContain('Preserve the recognizable identity of the actual supplied product')
        ->toContain('Authoritative Identity Anchor (What the product is)')
        ->toContain('The catalog image is the authoritative anchor for physical product type, packaging structure, container form, labels, branding, colors, and physical markings')
        ->toContain('Do NOT substitute, redesign, merge, or replace the product with a generic alternative');
});

test('Test B — Camera freedom: production prompt explicitly allows presentation/camera changes rather than requiring reproduction of the catalog photograph', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'render_style' => 'Minimalist Graphic',
        'generation_mode' => 'manual',
    ]);

    expect($prompt)
        ->toContain('Espresso de Peligro')
        ->toContain('Minimalist Graphic')
        ->toContain('Use the provided product image(s) as the authoritative visual reference. Preserve the actual products and exact product-name/price pairings.')
        ->toContain('Follow the user\'s creative direction, keeping the product as the hero while adapting naturally to the campaign, event, render style, and aspect ratio.');
});

test('Test C — Explicit user camera direction: user-provided camera or perspective instruction remains present and authoritative', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // Subtest 1: User explicitly requests eye-level front view
    $promptWithCamera = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'scene_prompt' => 'Place cup on polished marble counter at direct eye-level front perspective',
        'camera_viewpoint' => 'eye-level',
        'generation_mode' => 'manual',
    ]);

    expect($promptWithCamera)
        ->toContain('Place cup on polished marble counter at direct eye-level front perspective')
        ->toContain('Creative direction:')
        ->toContain('Follow the user\'s creative direction, keeping the product as the hero while adapting naturally to the campaign, event, render style, and aspect ratio.');

    // Subtest 2: User explicitly requests top-down flat-lay in prompt
    $promptWithFlatlay = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'scene_prompt' => 'Keep the exact overhead flat-lay composition with coffee beans around',
        'generation_mode' => 'manual',
    ]);

    expect($promptWithFlatlay)
        ->toContain('Keep the exact overhead flat-lay composition with coffee beans around')
        ->toContain('Creative direction:');
});

test('Test D — Business truth remains protected: new language does not weaken exact product name, price, tagline, or visibility controls', function () {
    $orchestrator = new ModularPromptOrchestrator;

    // Subtest 1: All visibility controls enabled
    $promptAllEnabled = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '₱499.00',
        'tagline' => 'Dangerously bold roast',
        'reference_image_path' => 'products/espresso.png',
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'copy_emphasis' => 'Product',
    ]);

    expect($promptAllEnabled)
        ->toContain('PRODUCT NAME:')
        ->toContain('"Espresso de Peligro"')
        ->toContain('• PRICE: "₱499.00"')
        ->toContain('• TAGLINE: "Dangerously bold roast"')
        ->toContain('PRIMARY VISUAL ANCHOR: Product identity and name');

    // Subtest 2: Visibility controls suppressed
    $promptSuppressed = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'price' => '₱499.00',
        'tagline' => 'Dangerously bold roast',
        'reference_image_path' => 'products/espresso.png',
        'include_product_name' => false,
        'include_prices' => false,
        'include_tagline' => false,
        'copy_emphasis' => 'Product',
    ]);

    expect($promptSuppressed)
        ->toContain('INCLUDE PRODUCT NAME = FALSE:')
        ->toContain('INCLUDE PRICES = FALSE:')
        ->toContain('INCLUDE TAGLINE = FALSE:')
        ->toContain('Copy Hierarchy Directive (Product Name Disabled): Product Name copy is disabled by visibility setting');
});

test('Test E — Industry/category remains present: existing industry/category context reaches final production prompt', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $user = User::factory()->create();
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'El Peligro Café',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty artisanal roaster serving specialty coffee.',
    ]);

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'reference_image_path' => 'products/espresso.png',
        'business_industry' => 'Food & Beverage',
        'business_category' => 'Café / Coffee Shop',
        'business' => $business,
    ], $business);

    expect($prompt)
        ->toContain('INDUSTRY & CATEGORY ART DIRECTION: Food & Beverage — Café / Coffee Shop')
        ->toContain('Artisanal specialty café counter, sunlit coffeehouse seating, or polished commercial coffee bar setting')
        ->toContain('Warm rustic natural wood, polished terrazzo, white marble countertop')
        ->toContain('ceramic saucer, linen napkin, glass water tumbler')
        ->toContain('BUSINESS CONTEXT:')
        ->toContain('Business Name: El Peligro Café')
        ->toContain('Business Category: Café / Coffee Shop');
});

test('Test F — Multi-product metadata remains intact: existing multi-product price and product contracts remain unchanged', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $catalogProducts = [
        ['id' => 1, 'name' => 'Espresso de Peligro', 'price' => 499, 'image_path' => 'products/espresso.png'],
        ['id' => 2, 'name' => 'LilJohn', 'price' => 340, 'image_path' => 'products/liljohn.png'],
        ['id' => 3, 'name' => 'Cedi', 'price' => 430, 'image_path' => 'products/cedi.png'],
    ];

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso de Peligro',
        'catalog_products' => $catalogProducts,
        'reference_image_paths' => ['products/espresso.png', 'products/liljohn.png', 'products/cedi.png'],
        'include_prices' => true,
        'copy_emphasis' => 'Product',
    ]);

    expect($prompt)
        ->toContain('MULTI-PRODUCT COMPOSITION:')
        ->toContain('Primary Hero Product: Espresso de Peligro')
        ->toContain('- LilJohn')
        ->toContain('- Cedi')
        ->toContain('MULTI-PRODUCT PRICING (MANDATORY EXACT PRODUCT-PRICE ASSOCIATIONS):')
        ->toContain('• Product 1 ("Espresso de Peligro"):')
        ->toContain('Exact price: ₱499.00')
        ->toContain('• Product 2 ("LilJohn"):')
        ->toContain('Exact price: ₱340.00')
        ->toContain('• Product 3 ("Cedi"):')
        ->toContain('Exact price: ₱430.00');
});
