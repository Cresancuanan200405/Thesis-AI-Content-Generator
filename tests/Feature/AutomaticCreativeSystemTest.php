<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Config::set('services.openai.api_key', 'sk-test-mock-key-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.image_model', 'gpt-image-2');
    Config::set('services.openai.budget_limit', 10.00);
});

// Helper to create basic setup
function createAutomaticTestSetup(array $businessOverrides = [], array $campaignOverrides = [], array $productOverrides = [], ?array $eventOverrides = null): array
{
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(array_merge([
        'user_id' => $user->id,
        'name' => 'Artisan Craft Studio',
        'industry' => 'Cafe & Bakery',
        'category' => 'Specialty Coffee',
    ], $businessOverrides));

    $event = null;
    if ($eventOverrides !== null) {
        $event = Event::factory()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'Spring Blossom Festival',
            'description' => 'Celebrating the blooming season with fresh floral aesthetics.',
        ], $eventOverrides));
    }

    $campaign = Campaign::factory()->create(array_merge([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event?->id,
        'name' => 'Signature Blend Launch',
        'objective' => 'Drive Product Awareness',
    ], $campaignOverrides));

    $product = Product::factory()->create(array_merge([
        'business_id' => $business->id,
        'name' => 'Golden Roast Coffee Beans',
        'price' => 350.00,
        'image_path' => 'products/beans.png',
    ], $productOverrides));

    return [$user, $business, $campaign, $product, $event];
}

// Helper to mock OpenAI responses for automatic generation
function fakeAutomaticAiResponse(array $creativeAttributes = []): array
{
    $recordedPayloads = [];

    $creativeResult = array_merge([
        'tagline' => 'Awaken Your Senses Daily',
        'creative_concept' => 'Minimalist sunlit morning ritual with golden roasted beans',
        'visual_strategy' => 'Macro studio lighting with tactile linen surfaces',
        'visual_prompt' => 'A bag of golden roast coffee beans resting on raw textured linen in a sunlit architectural studio',
        'scene_family' => 'architectural',
        'environment_family' => 'warm_wood_terracotta',
        'composition_type' => 'dynamic diagonal',
        'camera_viewpoint' => 'three-quarters-dynamic',
        'lighting_profile' => 'golden hour',
        'prop_profile' => 'raw ingredients',
        'copy_layout' => 'editorial-left',
        'product_name_style' => 'editorial-serif',
        'price_style' => 'badge',
        'tagline_style' => 'hero-headline',
        'text_depth_mode' => 'integrated-3d',
        'visual_world_archetype' => 'architectural_interior',
        'background_style' => 'stone',
        'product_arrangement' => 'hero + supporting products',
        'visual_theme' => 'Warm Organic',
        'brand_tone' => 'Artisanal',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Balanced',
    ], $creativeAttributes);

    Http::fake([
        'https://api.openai.com/v1/responses*' => function ($request) use (&$recordedPayloads, $creativeResult) {
            $data = $request->data();
            $recordedPayloads[] = $data;

            return Http::response([
                'id' => 'resp-test-'.uniqid(),
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-test-123',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode($creativeResult),
                            ],
                        ],
                    ],
                ],
            ]);
        },
        'https://api.openai.com/v1/images/generations*' => function ($request) use (&$recordedPayloads) {
            $recordedPayloads[] = $request->data();

            return Http::response([
                'data' => [
                    [
                        'b64_json' => base64_encode('fake-generated-image-content'),
                    ],
                ],
            ]);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []]),
    ]);

    return [
        'getPayloads' => function () use (&$recordedPayloads) {
            return $recordedPayloads;
        },
    ];
}

// A. Industry changes visual vocabulary
test('A. industry changes visual vocabulary', function () {
    [$user1, $business1, $campaign1, $product1] = createAutomaticTestSetup([
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare',
    ]);
    [$user2, $business2, $campaign2, $product2] = createAutomaticTestSetup([
        'industry' => 'Automotive & Motorcycle',
        'category' => 'Motorcycle Accessories',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptBeauty = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Hydrating Glow Serum',
        'product_category' => 'Skincare',
        'business_industry' => 'Beauty & Personal Care',
        'aspect_ratio' => '1:1',
    ], $business1);

    $promptAuto = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Carbon Fiber Helmet',
        'product_category' => 'Motorcycle Accessories',
        'business_industry' => 'Automotive & Motorcycle',
        'aspect_ratio' => '1:1',
    ], $business2);

    expect($promptBeauty)->toContain('Beauty & Personal Care');
    expect($promptAuto)->toContain('Automotive & Motorcycle');
    expect($promptBeauty)->not->toEqual($promptAuto);
});

// B. Category changes visual vocabulary
test('B. category changes visual vocabulary within the same industry', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup([
        'industry' => 'Food & Beverage',
        'category' => 'Artisan Bakery',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptBakery = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Sourdough Loaf',
        'product_category' => 'Artisan Bakery',
        'business_industry' => 'Food & Beverage',
        'aspect_ratio' => '1:1',
    ], $business);

    $promptBeverage = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Craft IPA Beer',
        'product_category' => 'Craft Brewery & Spirits',
        'business_industry' => 'Food & Beverage',
        'aspect_ratio' => '1:1',
    ], $business);

    expect($promptBakery)->toContain('Artisan Bakery');
    expect($promptBeverage)->toContain('Craft Brewery & Spirits');
    expect($promptBakery)->not->toEqual($promptBeverage);
});

// C. Event influences visual storytelling
test('C. event influences visual storytelling in automatic mode', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => "Philippine Teachers' Day",
        'description' => 'Honoring educators with thoughtful gift packages and floral tributes.',
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'show_event_text' => false,
    ]);

    $response->assertOk();
    $data = $response->json();
    $visualPrompt = $data['visual_prompt'];

    // Visual storytelling from event must be active even with show_event_text false
    expect($visualPrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($visualPrompt)->toContain("Philippine Teachers' Day");
    expect($visualPrompt)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "Philippine Teachers\' Day"');
});

// D. Custom events influence visual storytelling
test('D. custom events influence visual storytelling', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => 'Midsummer Midnight Bazaar',
        'description' => 'Eclectic night market celebration under bohemian fairy lights.',
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'show_event_text' => true,
    ]);

    $response->assertOk();
    $visualPrompt = $response->json('visual_prompt');

    expect($visualPrompt)->toContain('Midsummer Midnight Bazaar');
    expect($visualPrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
});

// E. Multiple products receive deliberate spatial composition
test('E. multiple products receive deliberate spatial composition', function () {
    [$user, $business, $campaign, $product1] = createAutomaticTestSetup();
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Artisan Ceramic Pour-Over Dripper',
        'price' => 450.00,
    ]);

    $recorder = fakeAutomaticAiResponse([
        'product_arrangement' => 'tiered pedestal',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product2->id],
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('MULTI-PRODUCT SPATIAL COMPOSITION STRATEGY: tiered pedestal');
    expect($prompt)->toContain('Multi-Product Staging: tiered pedestal');
});

// F. Automatic does not default to flat product rows
test('F. automatic explicitly forbids flat side-by-side rows', function () {
    [$user, $business, $campaign, $product1] = createAutomaticTestSetup();
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Espresso Cup Set',
        'price' => 290.00,
    ]);

    $recorder = fakeAutomaticAiResponse([
        'product_arrangement' => 'diagonal progression',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product2->id],
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('STAGING MANDATE: DO NOT align products in a flat side-by-side row or generic horizontal line.');
});

// G. Background styles vary
test('G. background styles vary across canonical system treatments', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $promptGlass = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'background_style' => 'glass',
        'product_name' => 'Luxury Perfume',
    ], $business);

    $promptMarble = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'background_style' => 'marble',
        'product_name' => 'Luxury Perfume',
    ], $business);

    $promptFullBlack = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'background_style' => 'full black',
        'product_name' => 'Luxury Perfume',
    ], $business);

    expect($promptGlass)->toContain('Background Style Treatment: glass');
    expect($promptMarble)->toContain('Background Style Treatment: marble');
    expect($promptFullBlack)->toContain('Background Style Treatment: full black');
    expect($promptGlass)->not->toEqual($promptMarble);
});

// H. Scene families vary
test('H. scene families vary across generations', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $promptStudio = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'scene_family' => 'studio',
        'product_name' => 'Watch',
    ], $business);

    $promptNature = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'scene_family' => 'nature',
        'product_name' => 'Watch',
    ], $business);

    expect($promptStudio)->toContain('Scene Family: studio');
    expect($promptNature)->toContain('Scene Family: nature');
    expect($promptStudio)->not->toEqual($promptNature);
});

// I. Composition varies
test('I. composition types vary', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'composition_type' => 'centered hero',
        'product_name' => 'Camera',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'composition_type' => 'diagonal editorial',
        'product_name' => 'Camera',
    ], $business);

    expect($prompt1)->toContain('• Composition Geometry: centered hero');
    expect($prompt2)->toContain('• Composition Geometry: diagonal editorial');
});

// J. Lighting varies
test('J. lighting profiles vary', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'lighting_profile' => 'golden hour',
        'product_name' => 'Camera',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'lighting_profile' => 'dramatic side light',
        'product_name' => 'Camera',
    ], $business);

    expect($prompt1)->toContain('• Lighting Profile: golden hour');
    expect($prompt2)->toContain('• Lighting Profile: dramatic side light');
});

// K. Camera varies
test('K. camera viewpoints vary', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'camera_viewpoint' => 'overhead',
        'product_name' => 'Notebook',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'camera_viewpoint' => 'eye-level',
        'product_name' => 'Notebook',
    ], $business);

    expect($prompt1)->toContain('• Camera Perspective: overhead');
    expect($prompt2)->toContain('• Camera Perspective: eye-level');
});

// L. Props vary
test('L. prop profiles vary', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'prop_profile' => 'raw organic ingredients & botanicals',
        'product_name' => 'Lotion',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'prop_profile' => 'minimal geometry & brass accents',
        'product_name' => 'Lotion',
    ], $business);

    expect($prompt1)->toContain('Prop Staging Profile: raw organic ingredients & botanicals');
    expect($prompt2)->toContain('Prop Staging Profile: minimal geometry & brass accents');
});

// M. Typography layout varies
test('M. typography layout varies across distinct configurations', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'copy_layout' => 'asymmetric_editorial',
        'product_name' => 'Tea',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'copy_layout' => 'bottom_editorial',
        'product_name' => 'Tea',
    ], $business);

    expect($prompt1)->toContain('• Copy Layout: asymmetric_editorial');
    expect($prompt2)->toContain('• Copy Layout: bottom_editorial');
});

// N. Product-name treatment varies
test('N. product-name treatment varies', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name_style' => 'editorial_serif',
        'product_name' => 'Velvet Cream',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name_style' => 'bold_condensed',
        'product_name' => 'Velvet Cream',
    ], $business);

    expect($prompt1)->toContain('• Product Name Typographic Style: editorial_serif');
    expect($prompt2)->toContain('• Product Name Typographic Style: bold_condensed');
});

// O. Price treatment varies
test('O. price treatment varies', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'price_style' => 'price_badge',
        'include_prices' => true,
        'price' => '₱500',
        'product_name' => 'Purse',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'price_style' => 'floating_price',
        'include_prices' => true,
        'price' => '₱500',
        'product_name' => 'Purse',
    ], $business);

    expect($prompt1)->toContain('• Price Typographic Style: price_badge');
    expect($prompt2)->toContain('• Price Typographic Style: floating_price');
});

// P. Tagline treatment varies
test('P. tagline treatment varies', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'tagline_style' => 'hero_headline',
        'include_tagline' => true,
        'tagline' => 'Elegance Redefined',
        'product_name' => 'Jewelry',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'tagline_style' => 'background_type',
        'include_tagline' => true,
        'tagline' => 'Elegance Redefined',
        'product_name' => 'Jewelry',
    ], $business);

    expect($prompt1)->toContain('• Tagline Typographic Style: hero_headline');
    expect($prompt2)->toContain('• Tagline Typographic Style: background_type');
});

// Q. Text depth varies
test('Q. text depth varies across layers', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prompt1 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'text_depth_mode' => 'background',
        'product_name' => 'Sneakers',
    ], $business);

    $prompt2 = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'text_depth_mode' => 'overlap',
        'product_name' => 'Sneakers',
    ], $business);

    expect($prompt1)->toContain('• Text Depth Mode: background');
    expect($prompt2)->toContain('• Text Depth Mode: overlap');
});

// R. Exact marketing copy remains unchanged
test('R. exact marketing copy remains unchanged without hallucination', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $recorder = fakeAutomaticAiResponse([
        'tagline' => 'Pure Altitude Roasted to Perfection',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_prices' => true,
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    // Authoritative copy values must appear verbatim
    expect($prompt)->toContain('Golden Roast Coffee Beans');
    expect($prompt)->toContain('350');
    expect($prompt)->toContain('Pure Altitude Roasted to Perfection');
    expect($prompt)->toContain('Artisan Craft Studio');
});

// S. Disabled copy remains forbidden
test('S. disabled copy remains forbidden from prompt', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_prices' => false,
        'include_tagline' => false,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('INCLUDE PRICES = FALSE:');
    expect($prompt)->toContain('Do not render prices.');
    expect($prompt)->toContain('INCLUDE TAGLINE = FALSE:');
    expect($prompt)->toContain('Do not render any tagline, headline, slogan, or substitute phrase.');
});

// T. Recent-history diversity remains active
test('T. recent-history diversity remains active and prevents excessive overlap', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $designSystem = app(MarketingDesignSystem::class);

    // Create 3 identical historical candidates
    $historicalCandidate = [
        'scene_family' => 'studio',
        'environment_family' => 'clean_seamless_studio',
        'composition_type' => 'centered',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'soft diffused',
        'prop_profile' => 'minimalist pedestals',
        'copy_layout' => 'centered',
        'product_name_style' => 'bold-stacked',
        'price_style' => 'badge',
        'tagline_style' => 'hero-headline',
        'text_depth_mode' => 'flat-overlay',
        'visual_world_archetype' => 'clean_centered_studio',
        'background_style' => 'clean white',
        'product_arrangement' => 'hero + supporting products',
    ];

    $recentFingerprints = [$historicalCandidate, $historicalCandidate, $historicalCandidate];

    // Evaluate proposed identical candidate
    $eval = $designSystem->evaluateVisualCoreDiversity($historicalCandidate, $recentFingerprints);
    expect($eval['is_allowed'])->toBeFalse();
    expect($eval['max_match_count'])->toBe(6);

    // Deriving candidate must shift away
    $context = [
        'industry' => $business->industry,
        'category' => $business->category,
        'aspect_ratio' => '1:1',
        'product' => $product->name,
    ];
    $derived = $designSystem->deriveDiverseVisualCore($historicalCandidate, $recentFingerprints, $context);

    expect($derived)->not->toEqual($historicalCandidate);
    $evalDerived = $designSystem->evaluateVisualCoreDiversity($derived, $recentFingerprints);
    expect($evalDerived['is_allowed'])->toBeTrue();
});

// U. Automatic uses shared MarketingDesignSystem
test('U. automatic uses shared MarketingDesignSystem canonical vocabularies', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $recorder = fakeAutomaticAiResponse([
        'visual_world_archetype' => 'marble_travertine_set',
        'background_style' => 'marble',
        'product_arrangement' => 'tiered pedestal',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect(array_keys(MarketingDesignSystem::VISUAL_WORLD_ARCHETYPES))->toContain($data['visual_world_archetype']);
    expect(array_keys(MarketingDesignSystem::BACKGROUND_STYLES))->toContain($data['background_style']);
    expect(array_keys(MarketingDesignSystem::PRODUCT_ARRANGEMENTS))->toContain($data['product_arrangement']);
    expect(array_keys(MarketingDesignSystem::SCENE_FAMILIES))->toContain($data['scene_family']);
    expect(array_keys(MarketingDesignSystem::ENVIRONMENT_FAMILIES))->toContain($data['environment_family']);
    expect(array_keys(MarketingDesignSystem::COPY_LAYOUTS))->toContain($data['copy_layout']);
});

// V. Automatic does not regress Manual Mode
test('V. automatic does not regress manual mode', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $orchestrator = app(ModularPromptOrchestrator::class);

    // Manual mode with explicit user prompt and scene direction
    $manualPrompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => $product->name,
        'scene_prompt' => 'A dramatic midnight neon aesthetic with wet asphalt reflections and magenta rim lighting',
        'user_prompt' => 'A dramatic midnight neon aesthetic with wet asphalt reflections and magenta rim lighting',
        'aspect_ratio' => '1:1',
        'include_prices' => false,
        'include_tagline' => false,
    ], $business);

    expect($manualPrompt)->toContain('USER SCENE DIRECTION:');
    expect($manualPrompt)->toContain('PRIMARY USER SCENE DIRECTION:');
    expect($manualPrompt)->toContain('A dramatic midnight neon aesthetic with wet asphalt reflections');
    expect($manualPrompt)->toContain('DERIVE FROM PRIMARY USER SCENE DIRECTION');
});

// W. Automatic remains one-click
test('W. automatic remains one-click without multi-step wizard requirements', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $recorder = fakeAutomaticAiResponse();

    // Direct one-click post with ONLY campaign_id and product_id
    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data)->toHaveKeys([
        'tagline',
        'creative_concept',
        'visual_strategy',
        'visual_prompt',
        'prompt',
        'visual_world_archetype',
        'background_style',
        'product_arrangement',
        'preview',
    ]);
});
