<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-dynamic-worlds-key']);
    config(['services.openai.budget_limit' => 100.00]);
});

/*
|--------------------------------------------------------------------------
| AUTOMATIC MODE: DYNAMIC VISUAL WORLDS & TYPOGRAPHY TESTS
|--------------------------------------------------------------------------
*/

test('automatic mode can select and orchestrate different scene families across generations', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $scenes = ['studio', 'luxury', 'bathroom', 'botanical', 'geometric', 'futuristic'];

    foreach ($scenes as $scene) {
        $prompt = $orchestrator->orchestrate([
            'generation_mode' => 'automatic',
            'product_name' => 'Hydrating Face Serum',
            'scene_family' => $scene,
            'include_prices' => true,
            'price' => '₱890.00',
        ]);

        expect($prompt)->toContain("Scene Family: {$scene}")
            ->toContain('CREATIVE WORLD / SCENE:')
            ->toContain('Create the complete final advertising artwork, including the visual scene and all enabled marketing typography.');
    }
});

test('automatic mode can select and orchestrate different environment families', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $environments = ['clean_seamless_studio', 'marble_studio', 'luxury_bathroom', 'tropical_greenery', 'futuristic_lab'];

    foreach ($environments as $env) {
        $prompt = $orchestrator->orchestrate([
            'generation_mode' => 'automatic',
            'product_name' => 'Hydrating Face Serum',
            'environment_family' => $env,
        ]);

        expect($prompt)->toContain("Environment Setting: {$env}")
            ->toContain('ENVIRONMENT:');
    }
});

test('automatic mode can vary typography layout, price style, tagline style, and text depth', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptA = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Botanical Essence',
        'price' => '₱1,250.00',
        'tagline' => 'Awaken Natural Radiance',
        'copy_layout' => 'asymmetric_editorial',
        'product_name_style' => 'editorial_serif',
        'price_style' => 'editorial_price',
        'tagline_style' => 'editorial_headline',
        'text_depth_mode' => 'background',
    ]);

    expect($promptA)->toContain('Copy Layout: asymmetric_editorial')
        ->toContain('Product Name Typographic Style: editorial_serif')
        ->toContain('Price Typographic Style: editorial_price')
        ->toContain('Tagline Typographic Style: editorial_headline')
        ->toContain('Text Depth Mode: background')
        ->toContain('TYPOGRAPHIC ART DIRECTION:')
        ->toContain('TEXT DEPTH / LAYERING:');

    $promptB = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Botanical Essence',
        'price' => '₱1,250.00',
        'tagline' => 'Awaken Natural Radiance',
        'copy_layout' => 'magazine_cover',
        'product_name_style' => 'bold_condensed',
        'price_style' => 'oversized_display',
        'tagline_style' => 'oversized_statement',
        'text_depth_mode' => 'foreground',
    ]);

    expect($promptB)->toContain('Copy Layout: magazine_cover')
        ->toContain('Product Name Typographic Style: bold_condensed')
        ->toContain('Price Typographic Style: oversized_display')
        ->toContain('Tagline Typographic Style: oversized_statement')
        ->toContain('Text Depth Mode: foreground');
});

test('automatic mode preserves business, campaign, and product context correctly', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Aura Skincare Lab',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Dermatological Cosmetics',
        'unique_selling_point' => 'Clinically formulated active botanicals',
    ]);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Cellular Repair Serum',
        'campaign_name' => 'Spring Glow Launch',
        'campaign_objective' => 'Drive initial trial of new formulation',
        'include_business_name' => true,
        'business_name' => $business->name,
    ], $business);

    expect($prompt)->toContain('• Business Name: Aura Skincare Lab')
        ->toContain('• Campaign: Spring Glow Launch')
        ->toContain('• Goal: Drive initial trial of new formulation')
        ->toContain('"Cellular Repair Serum"');
});

test('automatic mode retains all selected products without omission', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Hydrating Toner',
        'catalog_products' => [
            ['id' => 1, 'name' => 'Hydrating Toner', 'description' => 'Balancing facial toner'],
            ['id' => 2, 'name' => 'Moisture Barrier Cream', 'description' => 'Ceramide rich barrier cream'],
        ],
        'custom_products' => [
            ['name' => 'Silk Sleep Mask', 'description' => 'Hypoallergenic mulberry silk'],
        ],
    ]);

    expect($prompt)->toContain('MULTI-PRODUCT COMPOSITION:')
        ->toContain('• Primary Hero Product: Hydrating Toner')
        ->toContain('Moisture Barrier Cream')
        ->toContain('Silk Sleep Mask')
        ->toContain('CO-PRESENCE MANDATE: All selected products and offerings listed above must be actively represented together');
});

test('automatic mode strictly obeys copy toggles for prices, tagline, and business name', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    // Case 1: All copy disabled
    $promptDisabled = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Luminescent Glow Drops',
        'price' => '₱750.00',
        'include_prices' => false,
        'tagline' => 'Radiance from Within',
        'include_tagline' => false,
        'business_name' => 'Aura Glow',
        'include_business_name' => false,
    ]);

    expect($promptDisabled)->toContain('INCLUDE PRICES = FALSE:')
        ->toContain('Selected products MUST remain visually present.')
        ->not->toContain('"₱750.00"')
        ->toContain('INCLUDE TAGLINE = FALSE:')
        ->toContain('Do not render any tagline, headline, slogan, or substitute phrase.')
        ->not->toContain('Radiance from Within')
        ->toContain('INCLUDE BUSINESS NAME = FALSE:')
        ->not->toContain('Aura Glow');

    // Case 2: All copy enabled
    $promptEnabled = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Luminescent Glow Drops',
        'price' => '₱750.00',
        'include_prices' => true,
        'tagline' => 'Radiance from Within',
        'include_tagline' => true,
        'business_name' => 'Aura Glow',
        'include_business_name' => true,
    ]);

    expect($promptEnabled)->toContain('PRICE:')
        ->toContain('"₱750.00"')
        ->toContain('TAGLINE:')
        ->toContain('"Radiance from Within"')
        ->toContain('BUSINESS NAME:')
        ->toContain('"Aura Glow"');
});

test('automatic mode applies anti-repetition cooldown when candidates match recent fingerprints', function () {
    $designSystem = app(MarketingDesignSystem::class);

    $recent = [
        'scene_family' => 'luxury',
        'environment_family' => 'marble_studio',
        'composition_type' => 'centered_hero',
        'camera_viewpoint' => 'three-quarter',
        'lighting_profile' => 'soft diffused',
        'prop_profile' => 'minimalist pedestals',
        'copy_layout' => 'asymmetric_editorial',
        'text_depth_mode' => 'background',
    ];

    $evaluation = $designSystem->evaluateVisualCoreDiversity($recent, [$recent]);
    expect($evaluation['is_allowed'])->toBeFalse()
        ->and($evaluation['classification'])->toBe('prohibited');

    // Derivation avoids repetition
    $derived = $designSystem->deriveDiverseVisualCore($recent, [$recent], ['category' => 'Skincare']);
    $evaluationDerived = $designSystem->evaluateVisualCoreDiversity($derived, [$recent]);
    expect($evaluationDerived['max_match_count'])->toBeLessThanOrEqual(3);
});

/*
|--------------------------------------------------------------------------
| MANUAL MODE: USER CREATIVE DIRECTION TESTS
|--------------------------------------------------------------------------
*/

test('manual mode incorporates authoritative user scene prompt into production prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $userScenePrompt = 'Place the sunscreen products on a clean marble pedestal in a luxury bathroom with golden morning sunlight.';

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Mineral Sunscreen SPF 50',
        'scene_prompt' => $userScenePrompt,
    ]);

    expect($prompt)->toContain('USER CREATIVE DIRECTION:')
        ->toContain('• PRIMARY USER SCENE DIRECTION: '.$userScenePrompt)
        ->toContain('The user\'s creative direction is authoritative and must not be overwritten or normalized to a generic studio setup.');
});

test('manual mode preserves unusual and conceptual user scene directions without normalization', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $conceptualPrompt = 'Futuristic Japanese skincare floating above ripples of mineral water on sculpted black obsidian stone.';

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Obsidian Clarifying Balm',
        'scene_prompt' => $conceptualPrompt,
    ]);

    expect($prompt)->toContain($conceptualPrompt)
        ->not->toContain('AUTOMATIC AI CREATIVE DIRECTION');
});

test('manual mode incorporates optional typography and visual world directives into production prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Velvet Matte Lipstick',
        'scene_family' => 'editorial',
        'environment_family' => 'fashion_editorial_set',
        'copy_layout' => 'magazine_cover',
        'product_name_style' => 'luxury_thin',
        'price_style' => 'floating_price',
        'tagline_style' => 'hero_headline',
        'text_depth_mode' => 'overlap',
        'tagline' => 'Bold Color That Never Fades',
        'include_tagline' => true,
        'price' => '₱499.00',
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('Scene Family: editorial')
        ->toContain('Environment Setting: fashion_editorial_set')
        ->toContain('Copy Layout: magazine_cover')
        ->toContain('Product Name Typographic Style: luxury_thin')
        ->toContain('Price Typographic Style: floating_price')
        ->toContain('Tagline Typographic Style: hero_headline')
        ->toContain('Text Depth Mode: overlap');
});

test('manual mode multi-product generation maintains all selected product attachments and references', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/prod_a.png', 'binary-a');
    Storage::disk('public')->put('products/prod_b.png', 'binary-b');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Cleansing Gel',
        'price' => 350.00,
        'image_path' => 'products/prod_a.png',
    ]);
    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Hydrating Toner',
        'price' => 450.00,
        'image_path' => 'products/prod_b.png',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => $productA->name,
        'catalog_products' => [$productA, $productB],
        'include_prices' => true,
    ], $business);

    expect($prompt)->toContain('PRIMARY & REFERENCE PRODUCT IMAGES:')
        ->toContain('REFERENCE IMAGE 1 = Cleansing Gel')
        ->toContain('REFERENCE IMAGE 2 = Hydrating Toner')
        ->toContain('• MULTI-IMAGE COMPOSITION DIRECTIVE:')
        ->toContain('MULTI-PRODUCT COMPOSITION:');
});

/*
|--------------------------------------------------------------------------
| VARIATION GENERATION TESTS
|--------------------------------------------------------------------------
*/

test('variation preserves selected products and enabled copy while varying visual world and composition', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Isla Coffee Co.',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee & Beverages',
    ]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/cold_brew.png', 'binary-cold-brew');
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Nitro Cold Brew',
        'price' => 195.00,
        'image_path' => 'products/cold_brew.png',
    ]);

    $sourceDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'prompt' => 'Initial Cold Brew ad prompt',
        'price' => 195.00,
        'tagline' => 'Steeped for 24 Hours to Perfection',
        'tagline_mode' => 'custom',
        'reference_image_path' => $product->image_path,
        'generated_image_path' => 'designs/cold_brew_v1.png',
        'generation_metadata' => [
            'scene_family' => 'studio',
            'environment_family' => 'clean_seamless_studio',
            'composition_type' => 'centered_hero',
            'camera_viewpoint' => 'three-quarter',
            'lighting_profile' => 'soft diffused',
            'prop_profile' => 'minimalist pedestals',
            'copy_layout' => 'balanced',
            'product_name_style' => 'modern_sans',
            'price_style' => 'editorial_price',
            'tagline_style' => 'editorial_headline',
            'text_depth_mode' => 'foreground',
            'include_prices' => true,
            'include_tagline' => true,
            'include_business_name' => true,
            'business_name' => 'Isla Coffee Co.',
            'aspect_ratio' => '1:1',
            'catalog_product_ids' => [$product->id],
            'reference_image_paths' => [$product->image_path],
        ],
    ]);

    // Mock OpenAI image generation
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['product_identity' => 'Nitro Cold Brew glass'])]],
            ],
        ], 200),
        'https://api.openai.com/v1/images/edits' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-generated-variation-image')],
            ],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-generated-variation-image')],
            ],
        ], 200),
    ]);

    $service = app(DesignRegenerationService::class);
    $variation = $service->regenerate($sourceDesign, $user, $business);

    expect($variation)->toBeInstanceOf(Design::class)
        ->and($variation->product_name)->toBe('Nitro Cold Brew')
        ->and($variation->tagline)->toBe('Steeped for 24 Hours to Perfection')
        ->and((float) $variation->price)->toBe(195.00)
        ->and($variation->prompt)->toContain('CREATIVE VARIATION DIRECTIVE:')
        ->and($variation->prompt)->toContain('Nitro Cold Brew')
        ->and($variation->prompt)->toContain('"₱195.00"')
        ->and($variation->prompt)->toContain('Steeped for 24 Hours to Perfection')
        ->and($variation->prompt)->toContain('Isla Coffee Co.');

    // The variation prompt must vary visual dimensions
    $meta = $variation->generation_metadata;
    expect($meta)->toHaveKeys(['scene_family', 'environment_family', 'composition_type', 'camera_viewpoint', 'lighting_profile', 'prop_profile']);
});

test('variation does not silently downgrade multi-product reference to single product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/var_a.png', 'binary-a');
    Storage::disk('public')->put('products/var_b.png', 'binary-b');

    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Matcha Latte',
        'price' => 180.00,
        'image_path' => 'products/var_a.png',
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Croissant',
        'price' => 120.00,
        'image_path' => 'products/var_b.png',
    ]);

    $sourceDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $prodA->id,
        'product_name' => $prodA->name,
        'prompt' => 'Initial multi-product ad',
        'price' => 180.00,
        'reference_image_path' => $prodA->image_path,
        'generated_image_path' => 'designs/matcha_croissant.png',
        'generation_metadata' => [
            'catalog_product_ids' => [$prodA->id, $prodB->id],
            'reference_image_paths' => [$prodA->image_path, $prodB->image_path],
            'include_prices' => true,
        ],
    ]);

    // If OpenAI rejects multi-image edits, system must throw rather than silently downgrading to 1 image
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['product_identity' => 'Matcha & Croissant'])]],
            ],
        ], 200),
        'https://api.openai.com/v1/images/edits' => Http::response([
            'error' => ['message' => 'Multi-image edits failed'],
        ], 400),
    ]);

    $service = app(DesignRegenerationService::class);

    expect(fn () => $service->regenerate($sourceDesign, $user, $business))
        ->toThrow(RuntimeException::class);
});
