<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
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

// Helper for test fixtures
function createAutomaticEventTestSetup(array $businessOverrides = [], array $campaignOverrides = [], array $productOverrides = [], ?array $eventOverrides = null): array
{
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(array_merge([
        'user_id' => $user->id,
        'name' => 'Artisan Roasters',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ], $businessOverrides));

    $event = null;
    if ($eventOverrides !== null) {
        $event = Event::factory()->create(array_merge([
            'user_id' => $user->id,
            'name' => "National Teachers' Day",
            'description' => 'Honoring educators with gratitude, gifting, and refined appreciation.',
        ], $eventOverrides));
    }

    $campaign = Campaign::factory()->create(array_merge([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event?->id,
        'name' => 'Teachers Appreciation Campaign',
        'objective' => 'Gift Sales',
    ], $campaignOverrides));

    $product = Product::factory()->create(array_merge([
        'business_id' => $business->id,
        'name' => 'Velvet Espresso Blend',
        'price' => 450.00,
        'image_path' => 'products/coffee.png',
    ], $productOverrides));

    return [$user, $business, $campaign, $product, $event];
}

function fakeAutomaticApiCall(array $creativeAttributes = []): stdClass
{
    $container = new stdClass;
    $container->payloads = [];

    $creativeResult = array_merge([
        'tagline' => 'To Those Who Inspire Every Day',
        'creative_concept' => 'Refined stationery and appreciation gift setting with velvet coffee pouch',
        'visual_strategy' => 'Warm festive studio lighting with diploma-inspired paper and ribbon accents',
        'visual_prompt' => 'An artisanal coffee gift box staged on polished cherry wood with delicate celebratory stationery',
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
        'visual_theme' => 'Warm Festive',
        'brand_tone' => 'Artisanal',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Balanced',
    ], $creativeAttributes);

    Http::fake([
        'https://api.openai.com/v1/responses*' => function ($request) use ($container, $creativeResult) {
            $data = $request->data();
            $container->payloads[] = $data;

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
        'https://api.openai.com/v1/images/generations*' => function ($request) use ($container) {
            $container->payloads[] = $request->data();

            return Http::response([
                'data' => [
                    [
                        'b64_json' => base64_encode('fake-image-bytes-content'),
                    ],
                ],
            ]);
        },
    ]);

    return $container;
}

// A. Automatic event selected → event reaches Creative Director
test('A. automatic event selected reaches Creative Director with active visual influence', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticEventTestSetup(
        [], [], [], ['name' => "National Teachers' Day"]
    );

    $apiMock = fakeAutomaticApiCall([
        'tagline' => 'Gratitude in Every Brew',
        'creative_concept' => 'Appreciation gifting atmosphere with stationery and diploma-style ribbons',
        'visual_strategy' => 'Warm golden illumination highlighting coffee beans and celebratory gifts',
        'visual_prompt' => 'Premium coffee package resting among appreciation gift stationery and ribbons',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'show_event_text' => false,
    ]);

    $response->assertOk();
    $responsesPayload = collect($apiMock->payloads)->first(fn ($p) => isset($p['input']));
    $recordedUserPrompt = $responsesPayload['input'] ?? '';
    expect($recordedUserPrompt)->not->toBeEmpty();
    expect($recordedUserPrompt)->toContain("National Teachers' Day");
    expect($recordedUserPrompt)->toContain('Visual Influence: ALWAYS ACTIVE');
    expect($recordedUserPrompt)->toContain('Show Event Text: FALSE (Event name text is FORBIDDEN)');
});

// B. Automatic event selected → event reaches final production prompt
test('B. automatic event selected reaches final production prompt', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticEventTestSetup(
        [], [], [], ['name' => "National Teachers' Day"]
    );

    $apiMock = fakeAutomaticApiCall([
        'tagline' => 'Honoring Mentors',
        'creative_concept' => 'Celebratory gift setup',
        'visual_strategy' => 'Appreciation scene with ribbons',
        'visual_prompt' => 'Artisanal coffee canister surrounded by thank-you cards and ribbons',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'show_event_text' => true,
    ]);

    $response->assertOk();
    $lastImagePrompt = $response->json('preview.prompt') ?? ($apiMock->payloads[1]['prompt'] ?? '');
    expect($lastImagePrompt)->not->toBeEmpty();
    expect($lastImagePrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($lastImagePrompt)->toContain("National Teachers' Day");
    expect($lastImagePrompt)->toContain('ROLE: Creative Driver');
});

// C. show_event_text=true → exact event name permitted
test('C. show_event_text=true permits exact event name in production prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "National Teachers' Day",
        'show_event_text' => true,
        'product_name' => 'Velvet Espresso Blend',
    ]);

    expect($prompt)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');
    expect($prompt)->toContain('"National Teachers\' Day" (ALLOWED)');
    expect($prompt)->toContain('render only "National Teachers\' Day"');
    expect($prompt)->not->toContain('EVENT TEXT: FORBIDDEN');
});

// D. show_event_text=false → event name forbidden
test('D. show_event_text=false strictly forbids literal event name from visible copy', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "National Teachers' Day",
        'show_event_text' => false,
        'product_name' => 'Velvet Espresso Blend',
    ]);

    expect($prompt)->toContain('EVENT TEXT: FORBIDDEN');
    expect($prompt)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "National Teachers\' Day"');
    expect($prompt)->toContain('FORBIDDEN EVENT TEXT: Do not render the event/holiday name as visible text');
    expect($prompt)->not->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');
});

// E. show_event_text=false → event visual influence remains
test('E. show_event_text=false retains full event visual influence', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "National Teachers' Day",
        'show_event_text' => false,
        'product_name' => 'Velvet Espresso Blend',
    ]);

    expect($prompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($prompt)->toContain("National Teachers' Day");
    expect($prompt)->toContain('ROLE: Creative Driver');
    expect($prompt)->toContain('Visual Influence Rule: The event/holiday ALWAYS directs scene mood, environment, atmosphere, props, materials, lighting, and visual storytelling');
    expect($prompt)->toContain('Retain all event visual styling, props, materials, colors, and celebratory atmosphere');
});

// F. Event does not become an invented slogan
test('F. event does not become an invented slogan when show_event_text=false', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "National Teachers' Day",
        'show_event_text' => false,
        'tagline' => 'Crafted for Excellence',
        'include_tagline' => true,
        'product_name' => 'Velvet Espresso Blend',
    ]);

    expect($prompt)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "National Teachers\' Day", any shortened holiday name, or any event-derived slogans as visible text in the artwork');
    expect($prompt)->toContain('TAGLINE:');
    expect($prompt)->toContain('"Crafted for Excellence"');
});

// G. Event influences automatic multi-product staging
test('G. event influences automatic multi-product staging', function () {
    [$user, $business, $campaign, $product1, $event] = createAutomaticEventTestSetup(
        [], [], ['name' => 'Lavender Latte'], ['name' => "National Teachers' Day"]
    );
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Caramel Macchiato',
        'price' => 220.00,
    ]);

    fakeAutomaticApiCall([
        'tagline' => 'Double the Appreciation',
        'creative_concept' => 'Curated appreciation gift pairing for teachers',
        'visual_strategy' => 'Staggered dual drink composition with celebratory ribbon accents',
        'visual_prompt' => 'Two artisan coffee drinks staged together in a warm celebratory gifting display',
        'product_arrangement' => 'hero + supporting products',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product2->id],
        'show_event_text' => false,
    ]);

    $response->assertOk();
    $preview = $response->json('preview');
    expect($preview['show_event_text'])->toBeFalse();
    expect($preview['prompt'])->toContain('MULTI-PRODUCT SPATIAL COMPOSITION');
    expect($preview['prompt'])->toContain('Lavender Latte');
    expect($preview['prompt'])->toContain('Caramel Macchiato');
    expect($preview['prompt'])->toContain("National Teachers' Day");
    expect($preview['prompt'])->toContain('EVENT TEXT: FORBIDDEN');
});

// H. Event influence works across industries
test('H. event influence works across industries (Cafe, Beauty, Fashion)', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $industries = [
        ['industry' => 'Beauty & Personal Care', 'product' => 'Rose Hydrating Mist'],
        ['industry' => 'Fashion & Apparel', 'product' => 'Silk Embroidered Scarf'],
        ['industry' => 'Food & Beverage', 'product' => 'Artisanal Macaron Box'],
    ];

    foreach ($industries as $item) {
        $prompt = $orchestrator->orchestrate([
            'generation_mode' => 'automatic',
            'business' => (object) ['industry' => $item['industry'], 'category' => 'Retail'],
            'product_name' => $item['product'],
            'event_name' => "Mother's Day",
            'show_event_text' => false,
        ]);

        expect($prompt)->toContain("Mother's Day");
        expect($prompt)->toContain('EVENT TEXT: FORBIDDEN');
        expect($prompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
        expect($prompt)->toContain($item['product']);
    }
});

// I. Custom events work
test('I. custom events work with automatic creative direction and prompt orchestration', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticEventTestSetup(
        [], [], [], [
            'name' => "Founder's 10th Anniversary Jubilee",
            'description' => 'A decade of artisanal craftsmanship celebrated with gold accents and heritage props.',
        ]
    );

    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptWithText = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "Founder's 10th Anniversary Jubilee",
        'show_event_text' => true,
        'product_name' => 'Heritage Reserve Roast',
    ]);

    expect($promptWithText)->toContain("Founder's 10th Anniversary Jubilee");
    expect($promptWithText)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');

    $promptWithoutText = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'event_name' => "Founder's 10th Anniversary Jubilee",
        'show_event_text' => false,
        'product_name' => 'Heritage Reserve Roast',
    ]);

    expect($promptWithoutText)->toContain("Founder's 10th Anniversary Jubilee");
    expect($promptWithoutText)->toContain('EVENT TEXT: FORBIDDEN');
    expect($promptWithoutText)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "Founder\'s 10th Anniversary Jubilee"');
});

// J. Automatic remains one-click
test('J. automatic generation executes completely in a single one-click request', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticEventTestSetup(
        [], [], [], ['name' => "National Teachers' Day"]
    );

    fakeAutomaticApiCall();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'show_event_text' => false,
    ]);

    $response->assertOk();
    $response->assertJsonStructure([
        'success',
        'message',
        'preview' => [
            'image_url',
            'prompt',
            'tagline',
            'creative_concept',
            'visual_strategy',
            'show_event_text',
            'generation_meta',
        ],
    ]);

    expect($response->json('preview.show_event_text'))->toBeFalse();
});

// K. Existing Automatic diversity remains functional
test('K. existing automatic diversity logic remains functional with event toggle', function () {
    [$user, $business, $campaign, $product, $event] = createAutomaticEventTestSetup(
        [], [], [], ['name' => "National Teachers' Day"]
    );

    fakeAutomaticApiCall([
        'scene_family' => 'botanical',
        'environment_family' => 'raw_concrete_stone',
        'composition_type' => 'staggered',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'show_event_text' => true,
        'previous_concepts' => ['Previous classic studio setup'],
    ]);

    $response->assertOk();
    $genMeta = $response->json('preview.generation_meta');
    expect($genMeta)->toHaveKey('visual_core_diversity');
    expect($genMeta['visual_core_diversity'])->toHaveKey('final_accepted_candidate');
});

// L. Manual event semantics remain unchanged
test('L. manual event semantics remain completely unchanged', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Luxe Cosmetics',
        'industry' => 'Beauty & Personal Care',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Rose Radiance Serum',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    // Manual with show_event_text = true
    $manualPromptTrue = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'event_name' => "National Teachers' Day",
        'show_event_text' => true,
        'product_name' => 'Rose Radiance Serum',
    ]);
    expect($manualPromptTrue)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');
    expect($manualPromptTrue)->toContain("National Teachers' Day");

    // Manual with show_event_text = false
    $manualPromptFalse = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'event_name' => "National Teachers' Day",
        'show_event_text' => false,
        'product_name' => 'Rose Radiance Serum',
    ]);
    expect($manualPromptFalse)->toContain('EVENT TEXT: FORBIDDEN');
    expect($manualPromptFalse)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($manualPromptFalse)->toContain("National Teachers' Day");
});
