<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ImageCompositorService;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

it('confirms the businesses database table has no logo_path column', function () {
    expect(Schema::hasColumn('businesses', 'logo_path'))->toBeFalse()
        ->and(Schema::hasColumn('businesses', 'logo'))->toBeFalse()
        ->and(Schema::hasColumn('businesses', 'logo_url'))->toBeFalse()
        ->and(Schema::hasColumn('businesses', 'brand_logo'))->toBeFalse();
});

it('validates generation requests without requiring any logo parameters', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'CoffeYessir',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Caramel Machiato',
        'price' => 149.00,
    ]);
    $event = Event::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->post('/generator', [
        'product_id' => $product->id,
        'event_id' => $event->id,
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
        'marketing_goal' => 'Promote new summer drink',
        'price' => '149.00',
        'tagline' => 'Rich caramel sweetness, brewed to perfection',
        'brand_tone' => ['Warm & Welcoming'],
        'render_style' => 'Studio Product Still',
        'visual_theme' => ['Cozy Cafe Vibe'],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertSessionHasNoErrors();
});

it('compiles prompt with exact business name typography when include_business_name is enabled', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Specialty Cafe',
        'include_business_name' => true,
    ]);

    // Exact name & typography instructions
    expect($prompt)->toContain('BUSINESS / SHOP: "CoffeYessir" (Specialty Cafe)')
        ->toContain('Render the exact business name "CoffeYessir" as visible text integrated naturally into the overall advertisement composition.')
        ->toContain('Creative Typographic Integration: Visually integrate the name into the creative design using elegant, bold, modern, premium, playful, handwritten, editorial, or stylized typography')
        ->toContain('STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL): The business name must remain TYPOGRAPHY ONLY. DO NOT create a logo or emblem for the business name.')
        ->not->toContain('CoffeeYessir')
        ->not->toContain('Coffee Yessir');
});

it('excludes business name from prompt when include_business_name is disabled', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'business_name' => 'CoffeYessir',
        'business_industry' => 'Specialty Cafe',
        'include_business_name' => false,
    ]);

    expect($prompt)->not->toContain('BUSINESS / SHOP: "CoffeYessir"')
        ->not->toContain('Render the exact business name "CoffeYessir"')
        ->toContain('BRAND IDENTITY:')
        ->toContain('Business Branding: Disabled. Do not include the business/shop name, logo, emblem, or any business branding in the artwork.');
});

it('enforces top-level anti-logo prohibition in every prompt compilation', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Espresso Caramel Blend',
        'business_name' => 'CoffeYessir',
        'include_business_name' => true,
    ]);

    expect($prompt)->toContain('STRICT LOGO RESTRICTION: Do not generate, invent, draw, or add any logo, emblem, icon, brand mark, watermark, cup logo, bean logo, café emblem, crown, badge, or decorative brand symbol anywhere in the artwork.')
        ->toContain('No Logos/Emblems: No logos, emblems, badges, or invented branding symbols.');
});

it('ensures ImageCompositorService has no logo layer and renders exact text typography', function () {
    $compositor = new ImageCompositorService;

    $manifest = $compositor->generateCompositingManifest([
        'product_name' => 'Caramel Machiato',
        'price' => '₱149.00',
        'tagline' => 'Rich caramel sweetness, brewed to perfection',
        'business_name' => 'CoffeYessir',
        'aspect_ratio' => '1:1',
    ]);

    expect($manifest['exact_content'])->toHaveKey('brand_name')
        ->and($manifest['exact_content'])->toHaveKey('price')
        ->and($manifest['exact_content'])->toHaveKey('tagline')
        ->and($manifest['exact_content'])->not->toHaveKey('logo')
        ->and($manifest['exact_content'])->not->toHaveKey('brand_logo')
        ->and($manifest['exact_content']['brand_name'])->toBe('CoffeYessir')
        ->and($manifest['exact_content']['price'])->toBe('₱149.00');
});

it('preserves business name and include_business_name setting across design regeneration', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'CoffeYessir',
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Caramel Machiato',
        'price' => 149.00,
        'tagline' => 'Rich caramel sweetness',
        'generation_metadata' => [
            'business_name' => 'CoffeYessir',
            'include_business_name' => true,
            'aspect_ratio' => '1:1',
            'render_style' => 'Studio Product Still',
            'model' => 'gpt-image-2',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test.png', 'fake');

    $regenerationService = app(DesignRegenerationService::class);
    $regenerated = $regenerationService->regenerate($design);

    expect($regenerated->business_id)->toBe($business->id)
        ->and($regenerated->generation_metadata['business_name'])->toBe('CoffeYessir')
        ->and($regenerated->generation_metadata['include_business_name'])->toBeTrue()
        ->and($regenerated->generation_metadata)->not->toHaveKey('logo_path')
        ->and($regenerated->generation_metadata)->not->toHaveKey('include_logo');
});
