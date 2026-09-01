<?php

use App\Models\Business;
use App\Services\ModularPromptOrchestrator;

it('compiles prompt with designed advertising typography for both business name and tagline', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $options = [
        'product_name' => 'Kalamansi Glow Botanical Serum',
        'business_name' => 'Aura Botanicals PH',
        'include_business_name' => true,
        'tagline' => 'Fresh Vitamin C Brightening for Radiant Skin',
        'price' => '₱690',
        'aspect_ratio' => '1:1',
        'render_style' => 'Studio Product Still',
        'brand_tone' => ['Refined', 'Clean & Elegant'],
    ];

    $prompt = $orchestrator->orchestrate($options);

    // 1. Business name as designed typography & exact preservation
    expect($prompt)->toContain('• BUSINESS / SHOP NAME: "Aura Botanicals PH"')
        ->toContain('Exact Spelling: "Aura Botanicals PH"')
        ->toContain('Designed Brand Typography: Render as professionally designed commercial brand typography')
        ->toContain('NEVER render as unstyled plain body text, default browser text, or tiny metadata.');

    // 2. Tagline as designed advertising typography & exact preservation
    expect($prompt)->toContain('• TAGLINE: "Fresh Vitamin C Brightening for Radiant Skin"')
        ->toContain('Strict Verbatim Rule: Use the exact wording "Fresh Vitamin C Brightening for Radiant Skin"')
        ->toContain('Designed Advertising Typography: Render the tagline as a professionally art-directed advertising typography element')
        ->toContain('NEVER render as plain unstyled paragraph copy.');

    // 3. Composition-aware placement & negative space utilization
    expect($prompt)->toContain('Composition-Aware Placement: Dynamically place typography in available negative-space regions relative to the product silhouette, lighting, and aspect ratio.')
        ->toContain('Do NOT place text arbitrarily or cover the primary product, packaging, or labels.')
        ->toContain('Composition-Aware Brand Placement: Position the business name in an intentional negative-space zone')
        ->toContain('Composition-Aware Typographic Placement: Intelligently anchor typography into negative space regions corresponding to the aspect ratio format.');

    // 4. Typographic hierarchy & contrast
    expect($prompt)->toContain('Typographic Hierarchy & Spacing: Maintain intentional visual rhythm and scale distinction between Headline/Tagline, Business Name, and Price.')
        ->toContain('Prevent typography elements from colliding or stacking into an unreadable block.')
        ->toContain('Contrast & Readability: Ensure crisp legibility against the scene environment using natural tonal contrast, soft contact shadows, or subtle dimensional separation without generic UI boxes.');

    // 5. Anti-logo and anti-emblem enforcement
    expect($prompt)->toContain('STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.')
        ->toContain('STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name.');

    // 6. Exact Philippine Peso price preservation
    expect($prompt)->toContain('• PRICE: "₱690"')
        ->toContain('Price Requirement: MUST appear visibly in the image with crisp, legible typography maintaining the exact currency symbol and digits (₱690)');

    // 7. Invisible safe area
    expect($prompt)->toContain('INVISIBLE SAFE AREA: The 20% safe margin is an internal, invisible layout constraint only.')
        ->toContain('The safe margin must NEVER appear in the final artwork.');
});

it('adapts composition-aware typography across all supported aspect ratios', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $ratios = ['1:1', '9:16', '16:9', '4:5', '4:3'];

    foreach ($ratios as $ratio) {
        $prompt = $orchestrator->orchestrate([
            'product_name' => 'Linen Resort Shirt',
            'business_name' => 'Laguna Weavers Co.',
            'include_business_name' => true,
            'tagline' => 'Handcrafted Breathable Linen Essentials',
            'price' => '₱1,450',
            'aspect_ratio' => $ratio,
        ]);

        expect($prompt)->toContain("RESPONSIVE COMPOSITION PROFILE: {$ratio}")
            ->toContain("Framing: Format intentionally for {$ratio} canvas.")
            ->toContain('Composition-Aware Typography: Professionally design Business Name and Tagline typography with deliberate negative-space placement, high contrast, and clear visual hierarchy without covering the product or using unstyled plain body text.')
            ->toContain('• PRICE: "₱1,450"')
            ->toContain('• TAGLINE: "Handcrafted Breathable Linen Essentials"')
            ->toContain('• BUSINESS / SHOP NAME: "Laguna Weavers Co."');
    }
});

it('verifies product reference mode preserves physical product while applying designed typography', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Ube Halaya Cake',
        'business_name' => 'Pampanga Sweet Treats',
        'include_business_name' => true,
        'tagline' => 'Authentic Kapampangan Heritage Recipe',
        'price' => '₱850',
        'reference_image_path' => 'products/images/sample_ube.jpg',
        'aspect_ratio' => '1:1',
    ]);

    expect($prompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->toContain('Use the supplied catalog product image as the primary visual source of truth for Ube Halaya Cake. (REFERENCE PRODUCT PRESERVATION MODE)')
        ->toContain('PRODUCT PRESERVATION:')
        ->toContain('Preserve the recognizable identity of the actual supplied product')
        ->toContain('• BUSINESS / SHOP NAME: "Pampanga Sweet Treats"')
        ->toContain('• TAGLINE: "Authentic Kapampangan Heritage Recipe"')
        ->toContain('• PRICE: "₱850"')
        ->toContain('PRIORITY ENFORCEMENT: The supplied catalog product image is the primary visual source of truth.');
});

it('verifies product-less creative generation synthesizes complete scene while applying designed typography', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Cold Brew Heritage Blend',
        'business_name' => 'Kape Barako Heritage',
        'include_business_name' => true,
        'tagline' => 'Bold Batangas Liberica Brewed for 18 Hours',
        'price' => '₱165',
        'aspect_ratio' => '4:5',
    ]);

    expect($prompt)->toContain('PRODUCT SOURCE & HANDLING (GENERATIVE PRODUCT & COMPLETE SCENE MODE):')
        ->toContain('• Target Product: Cold Brew Heritage Blend')
        ->toContain('• BUSINESS / SHOP NAME: "Kape Barako Heritage"')
        ->toContain('• TAGLINE: "Bold Batangas Liberica Brewed for 18 Hours"')
        ->toContain('• PRICE: "₱165"')
        ->toContain('PRIORITY ENFORCEMENT: Fulfill the full commercial advertising scene with product fidelity and user scene direction prioritized over subordinate styling.');
});
