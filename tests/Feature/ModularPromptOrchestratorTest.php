<?php

use App\Services\ImageCompositorService;
use App\Services\ModularPromptOrchestrator;
use App\Services\OpenAIModelRegistry;

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
        'include_logo' => true,
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
        ->toContain('• Tagline: "Rich caramel sweetness, brewed to perfection." (exact user tagline, do not alter or paraphrase)');

    // Verify Priority 4: Structured Philippine Event Direction
    expect($prompt)->toContain('Event: Mother\'s Day Special')
        ->toContain('Mood: Warm, heartwarming & appreciative');

    // Verify Priority 6: Exactly One Render Style
    expect($prompt)->toContain('Studio Product Still')
        ->toContain('Product-focused commercial studio presentation')
        ->not->toContain('Cinematic visual storytelling')
        ->not->toContain('Minimalist Graphic');

    // Verify Priority 8: Composition & 20% Safe Margins
    expect($prompt)->toContain('COMPOSITION & SAFE MARGINS:')
        ->toContain('Adhere strictly to 20% safe-margin breathing room along canvas borders.')
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

    $ratios = ['1:1', '16:9', '9:16'];

    foreach ($ratios as $ratio) {
        $manifest = $compositor->generateCompositingManifest([
            'aspect_ratio' => $ratio,
            'price' => '₱149',
            'tagline' => 'Rich caramel sweetness.',
            'include_logo' => true,
        ]);

        expect($manifest)->toHaveKeys(['canvas', 'safe_margins', 'exact_content']);

        $margins = $manifest['safe_margins'];
        $canvas = $manifest['canvas'];

        expect($margins['left'])->toBe((int) round($canvas['width'] * 0.20))
            ->and($margins['top'])->toBe((int) round($canvas['height'] * 0.20))
            ->and($margins['safe_width'])->toBe($canvas['width'] - (2 * (int) round($canvas['width'] * 0.20)))
            ->and($margins['safe_height'])->toBe($canvas['height'] - (2 * (int) round($canvas['height'] * 0.20)))
            ->and($manifest['exact_content']['price'])->toBe('₱149')
            ->and($manifest['exact_content']['tagline'])->toBe('Rich caramel sweetness.');
    }
});

it('maintains OpenAI model registry with GPT-Image-2 as recommended default', function () {
    $registry = new OpenAIModelRegistry;

    $default = $registry->getDefaultModel();
    expect($default['id'])->toBe('gpt-image-2')
        ->and($default['api_model_id'])->toBe('gpt-image-2')
        ->and($default['supports_image_input'])->toBeTrue()
        ->and($default['is_recommended'])->toBeTrue();

    $models = $registry->getAllModels();
    expect(count($models))->toBe(6);
});
