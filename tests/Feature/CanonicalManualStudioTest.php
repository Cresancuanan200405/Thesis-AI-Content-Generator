<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-key-for-canonical-manual']);
    config(['services.openai.budget_limit' => 100.00]);
});

test('MarketingDesignSystem canonical render styles and copy emphases resolve accurately', function () {
    $system = app(MarketingDesignSystem::class);

    // 4 Canonical Render Styles
    expect($system->renderStyles())->toBe([
        'Studio Product Still',
        'Cinematic Marketing',
        'Lifestyle Capture',
        'Minimalist Graphic',
    ]);

    // Validation & normalization of canonical keys and snake_case aliases
    expect($system->validateRenderStyle('studio_product_still'))->toBe('Studio Product Still');
    expect($system->validateRenderStyle('Studio Product Still'))->toBe('Studio Product Still');
    expect($system->validateRenderStyle('cinematic_marketing'))->toBe('Cinematic Marketing');
    expect($system->validateRenderStyle('lifestyle_capture'))->toBe('Lifestyle Capture');
    expect($system->validateRenderStyle('minimalist_graphic'))->toBe('Minimalist Graphic');
    expect($system->validateRenderStyle('minimalist_graphic_vec'))->toBe('Minimalist Graphic');
    expect($system->validateRenderStyle('unknown_style'))->toBe('Studio Product Still');

    // 4 Canonical Copy Emphases normalization
    expect($system->validateCopyEmphasis('product'))->toBe('Product');
    expect($system->validateCopyEmphasis('Product'))->toBe('Product');
    expect($system->validateCopyEmphasis('Product-first'))->toBe('Product-first');
    expect($system->validateCopyEmphasis('price'))->toBe('Price');
    expect($system->validateCopyEmphasis('Price'))->toBe('Price');
    expect($system->validateCopyEmphasis('Price-first'))->toBe('Price-first');
    expect($system->validateCopyEmphasis('tagline'))->toBe('Tagline');
    expect($system->validateCopyEmphasis('Tagline'))->toBe('Tagline');
    expect($system->validateCopyEmphasis('Tagline-first'))->toBe('Tagline-first');
    expect($system->validateCopyEmphasis('balanced'))->toBe('Balanced');
    expect($system->validateCopyEmphasis('Balanced'))->toBe('Balanced');
    expect($system->validateCopyEmphasis('nonexistent'))->toBe('Balanced');
});

test('ModularPromptOrchestrator injects correct Section 17 text hierarchy for canonical copy emphases', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptProduct = $orchestrator->buildSystemPrompt([
        'copy_emphasis' => 'Product',
        'render_style' => 'Studio Product Still',
    ]);
    expect($promptProduct)->toContain('PRIMARY VISUAL ANCHOR: Product identity and name');
    expect($promptProduct)->toContain('Studio Product Still');

    $promptPrice = $orchestrator->buildSystemPrompt([
        'copy_emphasis' => 'Price',
        'render_style' => 'Cinematic Marketing',
    ]);
    expect($promptPrice)->toContain('PRIMARY VISUAL ANCHOR: Pricing callout');
    expect($promptPrice)->toContain('Cinematic Marketing');

    $promptTagline = $orchestrator->buildSystemPrompt([
        'copy_emphasis' => 'Tagline',
        'render_style' => 'Lifestyle Capture',
    ]);
    expect($promptTagline)->toContain('PRIMARY VISUAL ANCHOR: Tagline headline');
    expect($promptTagline)->toContain('Lifestyle Capture');

    $promptBalanced = $orchestrator->buildSystemPrompt([
        'copy_emphasis' => 'Balanced',
        'render_style' => 'Minimalist Graphic',
    ]);
    expect($promptBalanced)->toContain('EQUAL WEIGHT HIERARCHY: Equal visual weight across product name, tagline, and pricing');
    expect($promptBalanced)->toContain('Minimalist Graphic');
});

test('suggest visual prompt copilot endpoint recommends a canonical render style', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    Storage::disk('public')->put('products/watch.png', 'fake-image-bytes');
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Chronograph Watch',
        'price' => 299.00,
        'image_path' => 'products/watch.png',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output_text' => json_encode([
                'creative_concept' => 'Dark moody timepiece visual',
                'visual_strategy' => 'Highlight brushed steel bevels and dramatic rim lighting',
                'suggested_scene' => 'A dramatic high-contrast studio setting with dark slate and directional rim light.',
                'render_style' => 'Cinematic Marketing',
                'visual_theme' => 'Luxury Dark',
                'brand_tone' => 'Sophisticated',
                'camera_viewpoint' => 'front/eye-level',
                'lighting_profile' => 'dramatic side light',
                'composition_type' => 'centered hero',
            ]),
        ], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('generator.prompt'), [
            'mode' => 'manual',
            'business_id' => $business->id,
            'product_ids' => [$product->id],
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('prompt.render_style', 'Cinematic Marketing')
        ->assertJsonPath('prompt.suggested_scene', 'A dramatic high-contrast studio setting with dark slate and directional rim light.');
});

test('manual generation persists canonical render_style and copy_emphasis in metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Storage::disk('public')->put('products/chair.png', 'fake-image-bytes');
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Minimalist Oak Chair',
        'price' => 149.00,
        'image_path' => 'products/chair.png',
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/*' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-generated-image-output')],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('generator.generate.manual'), [
            'business_id' => $business->id,
            'campaign_id' => $campaign->id,
            'product_ids' => [$product->id],
            'prompt' => 'An organic warm modern living room bathed in natural morning sunlight.',
            'render_style' => 'lifestyle_capture',
            'copy_emphasis' => 'product',
            'aspect_ratio' => '4:5',
            'tagline' => 'Designed for Everyday Comfort',
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $design = Design::latest('id')->first();
    expect($design)->not->toBeNull();

    $metadata = $design->generation_metadata;
    expect($metadata['aspect_ratio'])->toBe('4:5');
    expect($metadata['scene_prompt'])->toBe('An organic warm modern living room bathed in natural morning sunlight.');
    expect($metadata['render_style'])->toBe('Lifestyle Capture');
    expect($metadata['copy_emphasis'])->toBe('Product');
    expect($metadata['include_product_name'])->toBeTrue();
    expect($metadata['include_prices'])->toBeTrue();
    expect($metadata['include_tagline'])->toBeTrue();
    expect($metadata['show_event_text'])->toBeTrue();
});

test('ModularPromptOrchestrator enforces semantic content visibility controls and copy emphasis cannot override visibility', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    // 1. Product Name enabled vs disabled
    $promptProductNameEnabled = $orchestrator->buildSystemPrompt([
        'product_name' => 'Ceramic Pour-Over Cone',
        'include_product_name' => true,
    ]);
    expect($promptProductNameEnabled)->toContain('PRODUCT NAME:')
        ->toContain('"Ceramic Pour-Over Cone"');

    $promptProductNameDisabled = $orchestrator->buildSystemPrompt([
        'product_name' => 'Ceramic Pour-Over Cone',
        'include_product_name' => false,
    ]);
    expect($promptProductNameDisabled)->toContain('INCLUDE PRODUCT NAME = FALSE:')
        ->toContain('Do not render the product name as visible marketing text typography.');

    // 2. Price enabled vs disabled (single product)
    $promptPriceEnabled = $orchestrator->buildSystemPrompt([
        'product_name' => 'Specialty Roast',
        'price' => 350.00,
        'include_prices' => true,
    ]);
    expect($promptPriceEnabled)->toContain('MARKETING PRICE DISPLAY:')
        ->toContain('₱350.00');

    $promptPriceDisabled = $orchestrator->buildSystemPrompt([
        'product_name' => 'Specialty Roast',
        'price' => 350.00,
        'include_prices' => false,
    ]);
    expect($promptPriceDisabled)->toContain('INCLUDE PRICES = FALSE:')
        ->toContain('MARKETING PRICE DISPLAY: Disabled')
        ->toContain('Do not render prices.')
        ->not->toContain('₱350.00');

    // 3. Price enabled vs disabled (multi-product)
    $promptMultiPriceEnabled = $orchestrator->buildSystemPrompt([
        'catalog_products' => [
            ['id' => 1, 'name' => 'Roast A', 'price' => 200.00],
            ['id' => 2, 'name' => 'Roast B', 'price' => 300.00],
        ],
        'include_prices' => true,
    ]);
    expect($promptMultiPriceEnabled)->toContain('MULTI-PRODUCT PRICING')
        ->toContain('Exact price: ₱200.00')
        ->toContain('Exact price: ₱300.00');

    $promptMultiPriceDisabled = $orchestrator->buildSystemPrompt([
        'catalog_products' => [
            ['id' => 1, 'name' => 'Roast A', 'price' => 200.00],
            ['id' => 2, 'name' => 'Roast B', 'price' => 300.00],
        ],
        'include_prices' => false,
    ]);
    expect($promptMultiPriceDisabled)->toContain('INCLUDE PRICES = FALSE:')
        ->not->toContain('MULTI-PRODUCT PRICING (MANDATORY EXACT PRODUCT-PRICE ASSOCIATIONS)');

    // 4. Tagline enabled vs disabled
    $promptTaglineEnabled = $orchestrator->buildSystemPrompt([
        'tagline' => 'Crafted with Passion',
        'include_tagline' => true,
    ]);
    expect($promptTaglineEnabled)->toContain('TAGLINE:')
        ->toContain('"Crafted with Passion"');

    $promptTaglineDisabled = $orchestrator->buildSystemPrompt([
        'tagline' => 'Crafted with Passion',
        'include_tagline' => false,
    ]);
    expect($promptTaglineDisabled)->toContain('INCLUDE TAGLINE = FALSE:')
        ->not->toContain('"Crafted with Passion"');

    // 5. Copy Emphasis interaction: emphasis never overrides disabled visibility
    $promptTaglineEmphasisDisabled = $orchestrator->buildSystemPrompt([
        'tagline' => 'Crafted with Passion',
        'include_tagline' => false,
        'copy_emphasis' => 'Tagline',
    ]);
    expect($promptTaglineEmphasisDisabled)->toContain('Copy Hierarchy Directive (Tagline Disabled): Tagline is disabled by visibility setting')
        ->not->toContain('PRIMARY VISUAL ANCHOR: Tagline headline');

    $promptPriceEmphasisDisabled = $orchestrator->buildSystemPrompt([
        'price' => 500.00,
        'include_prices' => false,
        'copy_emphasis' => 'Price',
    ]);
    expect($promptPriceEmphasisDisabled)->toContain('Copy Hierarchy Directive (Price Disabled): Price is disabled by visibility setting')
        ->not->toContain('PRIMARY VISUAL ANCHOR: Pricing callout');

    $promptProductEmphasisDisabled = $orchestrator->buildSystemPrompt([
        'product_name' => 'Test Item',
        'include_product_name' => false,
        'copy_emphasis' => 'Product',
    ]);
    expect($promptProductEmphasisDisabled)->toContain('Copy Hierarchy Directive (Product Name Disabled): Product Name copy is disabled by visibility setting')
        ->not->toContain('PRIMARY VISUAL ANCHOR: Product identity and name');

    // 6. Event Text enabled vs disabled (Event context still affects generation when event text is disabled)
    $promptEventTextEnabled = $orchestrator->buildSystemPrompt([
        'event_name' => 'Independence Day',
        'show_event_text' => true,
    ]);
    expect($promptEventTextEnabled)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED')
        ->toContain('• Event/Holiday Name: "Independence Day" (ALLOWED)');

    $promptEventTextDisabled = $orchestrator->buildSystemPrompt([
        'event_name' => 'Independence Day',
        'show_event_text' => false,
    ]);
    expect($promptEventTextDisabled)->toContain('EVENT TEXT: FORBIDDEN')
        ->toContain('Do NOT render "Independence Day"')
        // Event context itself remains present in the prompt orchestration modules:
        ->toContain('Independence Day');
});

test('manual generation persists customized visibility controls in metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Storage::disk('public')->put('products/lamp.png', 'fake-lamp-bytes');
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Nordic Ceramic Lamp',
        'price' => 89.00,
        'image_path' => 'products/lamp.png',
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/*' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-generated-image-output')],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('generator.generate.manual'), [
            'business_id' => $business->id,
            'campaign_id' => $campaign->id,
            'product_ids' => [$product->id],
            'prompt' => 'Scandinavian reading nook with cozy wool blanket and cedar shelving.',
            'render_style' => 'minimalist_graphic',
            'copy_emphasis' => 'tagline',
            'aspect_ratio' => '16:9',
            'include_product_name' => false,
            'include_prices' => false,
            'include_tagline' => true,
            'tagline' => 'Warmth in Every Corner',
            'show_event_text' => false,
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true);

    $design = Design::latest('id')->first();
    expect($design)->not->toBeNull();

    $metadata = $design->generation_metadata;
    expect($metadata['include_product_name'])->toBeFalse();
    expect($metadata['include_prices'])->toBeFalse();
    expect($metadata['include_tagline'])->toBeTrue();
    expect($metadata['show_event_text'])->toBeFalse();
    expect($metadata['copy_emphasis'])->toBe('Tagline');
    expect($metadata['render_style'])->toBe('Minimalist Graphic');
});
