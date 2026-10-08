<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Http\Client\Request as ClientRequest;
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
        'render_style' => 'Studio Product Still',
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
        'https://api.openai.com/v1/images/edits*' => function (ClientRequest $request) use (&$recordedPayloads) {
            $recordedPayloads[] = [
                'type' => 'edits',
                'body' => $request->body(),
                'data' => $request->data(),
            ];

            return Http::response([
                'data' => [
                    [
                        'b64_json' => base64_encode('fake-generated-image-content'),
                    ],
                ],
            ]);
        },
        'https://api.openai.com/v1/images/generations*' => function ($request) use (&$recordedPayloads) {
            $recordedPayloads[] = [
                'type' => 'generations',
                'data' => $request->data(),
            ];

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

// A. Campaign context reaches final Automatic prompt
test('A. campaign context reaches final Automatic prompt', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Campaign:\n{$campaign->name}");
});

// B. Event context reaches final Automatic prompt
test('B. event context reaches final Automatic prompt', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => 'Harvest Moon Gala',
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Event:\nHarvest Moon Gala");
});

// C. Event visibility Allowed and Hidden reach final prompt
test('C. event visibility Allowed and Hidden reach final prompt', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => 'Spring Blossom Festival',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptAllowed = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'event_name' => $event->name,
        'show_event_text' => true,
        'product_name' => $product->name,
    ], $business);

    $promptHidden = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'event_name' => $event->name,
        'show_event_text' => false,
        'product_name' => $product->name,
    ], $business);

    expect($promptAllowed)->toContain("Event visibility:\nAllowed");
    expect($promptHidden)->toContain("Event visibility:\nHidden");
});

// D. Product identity exact product names preserved
test('D. product identity exact product names preserved', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup([], [], [
        'name' => 'Single-Origin Ethiopian Yirgacheffe',
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('Single-Origin Ethiopian Yirgacheffe');
});

// E. Product price exact product-price pairing preserved
test('E. product price exact product-price pairing preserved', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup([], [], [
        'name' => 'Artisan Pour-Over Set',
        'price' => 780.00,
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_prices' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('• REFERENCE IMAGE 1 = Artisan Pour-Over Set — ₱780.00');
});

// F. Product image actual catalog image binary is attached to /v1/images/edits
test('F. product image actual catalog image binary is attached to /v1/images/edits', function () {
    Storage::disk('public')->put('products/authoritative_beans.png', 'FAKECATALOGBINARYIMAGEBYTES12345');

    [$user, $business, $campaign, $product] = createAutomaticTestSetup([], [], [
        'name' => 'Authoritative Coffee Bag',
        'image_path' => 'products/authoritative_beans.png',
    ]);

    $recorder = fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();

    $payloads = $recorder['getPayloads']();
    $editCalls = array_filter($payloads, fn ($p) => ($p['type'] ?? '') === 'edits');
    expect($editCalls)->not->toBeEmpty();

    $lastEditCall = end($editCalls);
    expect($lastEditCall['body'])->toContain('authoritative_beans.png');
    expect($lastEditCall['body'])->toContain('FAKECATALOGBINARYIMAGEBYTES12345');
});

// G. Creative direction Automatic visual prompt reaches final prompt
test('G. creative direction Automatic visual prompt reaches final prompt', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $uniqueDirection = 'A serene minimalist wooden table bathed in morning sunlight with organic linen textiles';
    fakeAutomaticAiResponse([
        'visual_prompt' => $uniqueDirection,
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Creative direction:\n{$uniqueDirection}");
});

// H. Render style preserved
test('H. render style preserved', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse([
        'render_style' => 'Cinematic Marketing',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Render style:\nCinematic Marketing");
});

// I. Copy emphasis preserved
test('I. copy emphasis preserved', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse([
        'copy_emphasis' => 'Tagline',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Copy emphasis:\nTagline");
});

// J. Tagline preserved
test('J. tagline preserved in final prompt', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse([
        'tagline' => 'Awaken Your Daily Inspiration',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('Tagline:');
    expect($prompt)->toContain('"Awaken Your Daily Inspiration"');
});

// K. Aspect ratio preserved
test('K. aspect ratio preserved in final prompt', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '16:9',
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain("Aspect ratio:\n16:9");
});

// L. Multi-product: all selected products appear in final brief
test('L. multi-product all selected products appear in final brief', function () {
    [$user, $business, $campaign, $product1] = createAutomaticTestSetup();
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Handcrafted Pour-Over Dripper',
        'price' => 450.00,
    ]);
    $product3 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Gooseneck Kettle',
        'price' => 1250.00,
    ]);

    fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product2->id, $product3->id],
        'include_prices' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('• REFERENCE IMAGE 1 = Golden Roast Coffee Beans — ₱350.00');
    expect($prompt)->toContain('• REFERENCE IMAGE 2 = Handcrafted Pour-Over Dripper — ₱450.00');
    expect($prompt)->toContain('• REFERENCE IMAGE 3 = Gooseneck Kettle — ₱1,250.00');
    expect($prompt)->toContain('All selected products must appear together naturally in the final marketing scene.');
});

// M. Custom product remains supported
test('M. custom product remains supported in Automatic brief', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'custom_products' => [
            ['name' => 'Limited Edition Holiday Tumbler', 'price' => '650.00'],
        ],
        'include_prices' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    expect($prompt)->toContain('Golden Roast Coffee Beans — ₱350.00');
    expect($prompt)->toContain('Limited Edition Holiday Tumbler — ₱650.00');
});

// N. Prompt size is compact with no prompt truncation
test('N. prompt size is compact with no prompt truncation', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    $wordCount = str_word_count($prompt);
    $charCount = strlen($prompt);

    // Assert compact brief size: ~80 to 250 words, < 2,500 chars (not legacy 15,000+ chars)
    expect($wordCount)->toBeGreaterThan(30);
    expect($wordCount)->toBeLessThan(350);
    expect($charCount)->toBeLessThan(2500);
});

// O. Legacy prompt removal: does NOT contain forbidden legacy strings
test('O. legacy prompt removal asserts final prompt does NOT contain forbidden concepts', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    fakeAutomaticAiResponse();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    $forbiddenLegacyTokens = [
        'VISUAL THEME',
        'BRAND TONE',
        'DESIGN TREATMENT',
        'CAMERA VIEWPOINT',
        'CAMERA PERSPECTIVE',
        'LIGHTING PROFILE',
        'LENS',
        'APERTURE',
        'DEPTH OF FIELD',
        'SAFE MARGIN',
        'INDUSTRY ART DIRECTION',
        'HOLIDAY ART DIRECTION',
        'CREATIVE WORLD',
        'COMPOSITION ALGORITHM',
        'TYPOGRAPHY SYSTEM',
        'MULTI-PRODUCT COMPOSITION',
        'CO-FEATURED PRODUCTS & SERVICES',
        'Selected Emphasis',
    ];

    foreach ($forbiddenLegacyTokens as $token) {
        expect($prompt)->not->toContain($token);
    }
});

// P. Automatic diversity candidate evaluation remains functional
test('P. automatic diversity candidate evaluation remains functional', function () {
    [$user, $business, $campaign, $product] = createAutomaticTestSetup();

    $designSystem = app(MarketingDesignSystem::class);

    $candidate = [
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
    ];

    $recentFingerprints = [$candidate, $candidate, $candidate];

    $eval = $designSystem->evaluateVisualCoreDiversity($candidate, $recentFingerprints);
    expect($eval['is_allowed'])->toBeFalse();

    $context = [
        'industry' => $business->industry,
        'category' => $business->category,
        'aspect_ratio' => '1:1',
        'product' => $product->name,
    ];
    $derived = $designSystem->deriveDiverseVisualCore($candidate, $recentFingerprints, $context);
    expect($derived)->not->toEqual($candidate);

    $evalDerived = $designSystem->evaluateVisualCoreDiversity($derived, $recentFingerprints);
    expect($evalDerived['is_allowed'])->toBeTrue();
});

// Q. Automatic regeneration uses new compact path
test('Q. automatic regeneration uses new compact path with prompt_is_final', function () {
    Storage::disk('public')->put('products/beans.png', 'DUMMY_BEANS_DATA');

    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => 'Spring Blossom Festival',
    ]);

    $recorder = fakeAutomaticAiResponse([
        'visual_prompt' => 'A beautifully staged coffee bag surrounded by Spring florals',
    ]);

    $firstResponse = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'show_event_text' => true,
    ]);

    $firstResponse->assertOk();
    $preview = $firstResponse->json('preview');

    // Create Design model mimicking automatic generation save
    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => $product->price,
        'image_path' => 'designs/first_auto.png',
        'reference_image_path' => $product->image_path,
        'aspect_ratio' => '1:1',
        'prompt' => $preview['prompt'],
        'tagline' => $preview['tagline'],
        'generation_source' => 'automatic',
        'generation_metadata' => $preview['generation_meta'],
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $regeneratedDesign = $regenerationService->regenerate($design);

    expect($regeneratedDesign)->not->toBeNull();

    // Check payload sent during regeneration
    $payloads = $recorder['getPayloads']();
    $editCalls = array_filter($payloads, fn ($p) => ($p['type'] ?? '') === 'edits');
    expect($editCalls)->not->toBeEmpty();

    $lastEditCall = end($editCalls);
    $promptSent = $lastEditCall['body'] ?? '';

    expect($promptSent)->toContain('Campaign:');
    expect($promptSent)->toContain('Spring Blossom Festival');
    expect($promptSent)->toContain('Golden Roast Coffee Beans');
    expect($promptSent)->not->toContain('VISUAL THEME');
    expect($promptSent)->not->toContain('CAMERA VIEWPOINT');
});

// R. Manual regression guard: verify Manual tests and structure remain unaffected
test('R. manual regression guard: verify manual mode retains compact brief and protected semantics', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticTestSetup([], [], [], [
        'name' => 'Spring Blossom Festival',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    $manualPrompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'campaign_name' => $campaign->name,
        'event_name' => $event->name,
        'show_event_text' => true,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_prices' => true,
        'scene_prompt' => 'A custom manual cinematic shot of the product on dark slate',
        'render_style' => 'Cinematic Marketing',
        'copy_emphasis' => 'Balanced',
        'tagline' => 'Handcrafted Excellence',
        'aspect_ratio' => '1:1',
    ], $business);

    expect($manualPrompt)->toContain('Campaign:');
    expect($manualPrompt)->toContain('Event: Spring Blossom Festival');
    expect($manualPrompt)->toContain('Event visibility: Allowed');
    expect($manualPrompt)->toContain('Golden Roast Coffee Beans — ₱350.00');
    expect($manualPrompt)->toContain("Creative direction:\nA custom manual cinematic shot of the product on dark slate");
    expect($manualPrompt)->toContain('Render style: Cinematic Marketing');
    expect($manualPrompt)->toContain('Copy emphasis: Balanced');
    expect($manualPrompt)->toContain('Tagline: "Handcrafted Excellence"');
    expect($manualPrompt)->toContain('Aspect ratio: 1:1');
    expect($manualPrompt)->toContain('RULES:');
    expect($manualPrompt)->toContain('• Use the provided product image(s) as the authoritative visual reference.');
});
