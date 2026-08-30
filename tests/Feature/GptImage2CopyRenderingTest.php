<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ImageCompositorService;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Storage;

it('1. includes business name in the prompt when enabled with exact spelling', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
    ]);

    expect($prompt)->toContain('• BUSINESS / SHOP NAME: "CoffeYessir"')
        ->toContain('MUST appear visibly in the generated image as clean, readable commercial typography')
        ->toContain('Exact Spelling: "CoffeYessir"')
        ->not->toContain('CoffeeYessir')
        ->not->toContain('Coffee Yessir');
});

it('2. excludes business name from prompt when disabled', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'include_business_name' => false,
    ]);

    expect($prompt)->toContain('• BUSINESS / SHOP NAME: Disabled. Do not render any business name, logo, or brand mark in the image.')
        ->toContain('BRAND IDENTITY:')
        ->toContain('Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.')
        ->not->toContain('• BUSINESS / SHOP NAME: "CoffeYessir"');
});

it('3. preserves exact price string format in the prompt', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'price' => '₱149',
    ]);

    expect($prompt)->toContain('• PRICE: "₱149"')
        ->toContain('Price Requirement: MUST appear visibly in the image with crisp, legible typography maintaining the exact currency symbol and digits (₱149)')
        ->not->toContain('PHP 149')
        ->not->toContain('149 pesos');
});

it('4. preserves exact normalized tagline in the prompt', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'tagline' => '"Rich caramel sweetness, brewed to perfection."',
    ]);

    expect($prompt)->toContain('• TAGLINE: "Rich caramel sweetness, brewed to perfection"')
        ->toContain('Tagline Requirement: MUST appear visibly in the image as commercial headline/supporting copy')
        ->toContain('Strict Verbatim Rule: Use the exact wording "Rich caramel sweetness, brewed to perfection"')
        ->not->toContain('"Rich caramel sweetness, brewed to perfection."');
});

it('5. explicitly requires visible rendering of enabled copy elements in Priority 3 module', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
        'price' => '₱149',
        'tagline' => 'Rich caramel sweetness, brewed to perfection',
    ]);

    expect($prompt)->toContain('FINAL MARKETING COPY — MUST APPEAR VISIBLY IN THE IMAGE:')
        ->toContain('• Hero Product: "Caramel Machiato"')
        ->toContain('• BUSINESS / SHOP NAME: "CoffeYessir"')
        ->toContain('• PRICE: "₱149"')
        ->toContain('• TAGLINE: "Rich caramel sweetness, brewed to perfection"')
        ->toContain('• COPY RENDERING RULES:')
        ->toContain('All enabled copy elements above MUST be visibly rendered in the final image as integrated commercial typography.')
        ->toContain('Do not omit, duplicate, or hallucinate additional copy.')
        ->toContain('Place copy in the designated copy zones inside the invisible safe area.');
});

it('6. preserves strict anti-logo instructions while treating business name as typography only', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
    ]);

    expect($prompt)->toContain('• STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark')
        ->toContain('Typography Only: Render as readable text typography. DO NOT transform into a logo, emblem, badge, cup/bean icon, watermark, or brand symbol.')
        ->toContain('STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name.');
});

it('7. ensures ImageCompositorService does not create duplicate copy layers', function () {
    $compositor = new ImageCompositorService;

    $manifest = $compositor->generateCompositingManifest([
        'product_name' => 'Caramel Machiato',
        'price' => '₱149',
        'tagline' => 'Rich caramel sweetness, brewed to perfection',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    expect($manifest['exact_content']['brand_name'])->toBe('CoffeYessir')
        ->and($manifest['exact_content']['price'])->toBe('₱149')
        ->and($manifest['exact_content']['tagline'])->toBe('Rich caramel sweetness, brewed to perfection')
        ->and($manifest['exact_content'])->not->toHaveKey('logo')
        ->and($manifest['safe_margins']['margin_percent'])->toBe(20);
});

it('8. preserves all copy fields during design regeneration', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'CoffeYessir',
        'industry' => 'Specialty Cafe',
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Caramel Machiato',
        'price' => 149.00,
        'tagline' => 'Rich caramel sweetness, brewed to perfection',
        'generation_metadata' => [
            'business_name' => 'CoffeYessir',
            'include_business_name' => true,
            'price' => '₱149',
            'render_style' => 'Studio Product Still',
            'aspect_ratio' => '1:1',
            'model' => 'gpt-image-2',
            'scene_prompt' => 'Warm cafe counter setting',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test.png', 'fake-image');

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($design);

    expect($regenerated->product_name)->toBe('Caramel Machiato')
        ->and($regenerated->tagline)->toBe('Rich caramel sweetness, brewed to perfection')
        ->and($regenerated->generation_metadata['business_name'])->toBe('CoffeYessir')
        ->and($regenerated->generation_metadata['include_business_name'])->toBeTrue()
        ->and($regenerated->prompt)->toContain('• Hero Product: Caramel Machiato')
        ->and($regenerated->prompt)->toContain('• Business / Shop: CoffeYessir')
        ->and($regenerated->prompt)->toContain('• Price: ₱149')
        ->and($regenerated->prompt)->toContain('• Headline/Tagline: "Rich caramel sweetness, brewed to perfection"');
});

it('9. adapts copy zones across all 5 responsive aspect ratios without visible guides', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $ratios = ['1:1', '9:16', '16:9', '4:5', '4:3'];

    foreach ($ratios as $ratio) {
        $prompt = $orchestrator->orchestrate([
            'product_name' => 'Caramel Machiato',
            'business_name' => 'CoffeYessir',
            'include_business_name' => true,
            'price' => '₱149',
            'tagline' => 'Rich caramel sweetness, brewed to perfection',
            'aspect_ratio' => $ratio,
        ]);

        expect($prompt)->toContain("RESPONSIVE COMPOSITION PROFILE: {$ratio}")
            ->toContain('Preferred Copy Region:')
            ->toContain('INVISIBLE SAFE AREA:')
            ->toContain('The safe margin must NEVER appear in the final artwork')
            ->toContain('DO NOT render safe-margin boundaries')
            ->not->toContain('SAFE AREA GUIDE');
    }
});

it('10. handles empty tagline cleanly without placeholder text', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $promptNull = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'tagline' => null,
    ]);

    expect($promptNull)->not->toContain('• TAGLINE:')
        ->not->toContain('placeholder')
        ->not->toContain('Your Tagline Here');

    $promptEmpty = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'tagline' => '   ',
    ]);

    expect($promptEmpty)->not->toContain('• TAGLINE:');
});
