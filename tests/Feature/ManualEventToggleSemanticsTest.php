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

// A. Selected event always reaches Suggest Visual Prompt
test('A. selected event always reaches Suggest Visual Prompt in manual mode', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Luxe Cosmetics',
        'industry' => 'Beauty & Personal Care',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
        'description' => 'Honoring teachers with heartfelt appreciation and gifting.',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Teachers Appreciation Campaign',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Rose Radiance Serum',
        'price' => 899.00,
    ]);

    $recordedSystemInstruction = null;
    $recordedUserPrompt = null;

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use (&$recordedSystemInstruction, &$recordedUserPrompt) {
            $data = $request->data();
            $recordedSystemInstruction = $data['instructions'] ?? '';
            $recordedUserPrompt = $data['input'] ?? '';

            return Http::response([
                'id' => 'resp_test_123',
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'visual_prompt' => 'An elegant beauty gift presentation with warm celebratory styling, refined stationery, a satin ribbon, and diploma-inspired paper details.',
                                    'tagline' => 'To Those Who Inspire Every Day',
                                    'composition_notes' => 'Warm festive atmosphere without literal event text',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => [
                    'input_tokens' => 100,
                    'output_tokens' => 50,
                    'total_tokens' => 150,
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson('/generator/prompt', [
        'campaign_id' => $campaign->id,
        'generation_mode' => 'manual',
        'target' => 'prompt',
        'catalog_product_ids' => [$product->id],
        'event_id' => $event->id,
        'show_event_text' => false,
        'user_instruction' => 'Create an elegant beauty gift presentation',
    ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
    ]);

    expect($recordedUserPrompt)->toContain("National Teachers' Day");
    expect($recordedUserPrompt)->toContain('Visual Influence: ALWAYS ACTIVE');
    expect($recordedUserPrompt)->toContain('Show Event Text: FALSE');
    expect($recordedSystemInstruction)->toContain('Show Event/Holiday Text');
});

// B. Selected event always reaches final production prompt
test('B. selected event always reaches final production prompt in manual generation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Luxe Cosmetics',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Teachers Day Campaign',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Hydrating Glow Serum',
        'price' => 599.00,
    ]);

    $finalImagePrompt = null;

    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalImagePrompt) {
            $finalImagePrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-image-bytes')],
                ],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'scene_prompt' => 'An elegant gift display with soft satin ribbons.',
        'show_event_text' => '1',
    ]);

    $response->assertOk();
    expect($finalImagePrompt)->not->toBeNull();
    expect($finalImagePrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($finalImagePrompt)->toContain("National Teachers' Day");
    expect($finalImagePrompt)->toContain('EVENT DIRECTION (CONTEXTUAL)');
});

// C. show_event_text=false still retains event visual influence
test('C. show_event_text=false still retains event visual influence in final prompt', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Bakery',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Mother’s Day Celebration',
        'description' => 'Heartfelt floral and gifting moments celebrating mothers.',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Mothers Day Special',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Strawberry Shortcake',
        'price' => 450.00,
    ]);

    $finalPrompt = null;

    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalPrompt) {
            $finalPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-image-bytes')],
                ],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'scene_prompt' => 'Pastel floral table setting with delicate porcelain dessert plates.',
        'show_event_text' => '0',
    ]);

    $response->assertOk();
    expect($finalPrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($finalPrompt)->toContain('Mother’s Day Celebration');
    expect($finalPrompt)->toContain('EVENT DIRECTION (CONTEXTUAL):');
    expect($finalPrompt)->toContain('• Visual Influence Rule: The event/holiday ALWAYS directs scene mood, environment, atmosphere, props, materials, lighting, and visual storytelling');
    expect($finalPrompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
});

// D. show_event_text=false forbids literal event text
test('D. show_event_text=false strictly forbids literal event text from appearing', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Planner Notebook']);

    $finalPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalPrompt) {
            $finalPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('img')]],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'scene_prompt' => 'Desk with stationery and warm sunlight.',
        'show_event_text' => '0',
    ]);

    $response->assertOk();
    expect($finalPrompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
    expect($finalPrompt)->toContain('EVENT TEXT: FORBIDDEN');
    expect($finalPrompt)->toContain('STRICT TEXT BAN: The event/holiday name ("National Teachers\' Day")');
    expect($finalPrompt)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "National Teachers\' Day"');
});

// E. show_event_text=true allows exact event name
test('E. show_event_text=true allows exact event name as visible typography', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Fountain Pen']);

    $finalPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalPrompt) {
            $finalPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('img')]],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'scene_prompt' => 'Solid wooden writing desk with brass inkwell.',
        'show_event_text' => '1',
    ]);

    $response->assertOk();
    expect($finalPrompt)->toContain('EVENT TEXT VISIBILITY: ALLOWED');
    expect($finalPrompt)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');
    expect($finalPrompt)->toContain('• The exact selected event/holiday name "National Teachers\' Day" may appear as visible typography');
    expect($finalPrompt)->toContain('• Visibility: Permitted when fitting composition and negative space, but not mandatory.');
});

// F. No invented event slogans are generated
test('F. instructions forbid invented event slogans regardless of toggle state', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Independence Day',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    // When show_event_text is false
    $promptOff = $orchestrator->orchestrate(
        options: [
            'generation_mode' => 'manual',
            'event' => $event,
            'campaign' => $campaign,
            'product_name' => 'Patriotic Mug',
            'show_event_text' => false,
        ],
        business: $business
    );
    expect($promptOff)->toContain('event-derived slogans are STRICTLY FORBIDDEN');
    expect($promptOff)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "Independence Day"');

    // When show_event_text is true
    $promptOn = $orchestrator->orchestrate(
        options: [
            'generation_mode' => 'manual',
            'event' => $event,
            'campaign' => $campaign,
            'product_name' => 'Patriotic Mug',
            'show_event_text' => true,
        ],
        business: $business
    );
    expect($promptOn)->toContain('Do NOT invent additional event slogans, alternate shortened names, or marketing headlines.');
    expect($promptOn)->toContain('Do not invent event slogans or alternate headlines.');
});

// G. Event does not override user scene direction
test('G. user scene direction has strict priority over event visual influence', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $userScene = 'Create a futuristic black-glass environment with neon violet backlighting and floating geometric prisms.';

    $prompt = $orchestrator->orchestrate(
        options: [
            'generation_mode' => 'manual',
            'event' => $event,
            'campaign' => $campaign,
            'product_name' => 'Night Glow Serum',
            'scene_prompt' => $userScene,
            'show_event_text' => false,
        ],
        business: $business
    );

    // Section 1 Core Direction MUST reflect user scene verbatim
    expect($prompt)->toContain($userScene);

    // Prompt instructions must enforce priority hierarchy
    expect($prompt)->toContain('Product preservation > Explicit Manual user scene direction > Explicit Manual creative controls > Event visual influence');
    expect($prompt)->toContain('Event visual influence must complement and harmonize with the user\'s scene direction without overriding');
});

// H. Custom events behave identically
test('H. custom user-created events behave identically with toggle semantics', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $customEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Teacher Appreciation Week',
        'type' => 'custom',
        'is_global' => false,
        'description' => 'A week-long celebration honoring school educators.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $customEvent->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Gift Hamper']);

    $finalPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalPrompt) {
            $finalPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('img')]],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $customEvent->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'scene_prompt' => 'Rustic wooden tabletop with ribbon tied bundles.',
        'show_event_text' => '0',
    ]);

    $response->assertOk();
    expect($finalPrompt)->toContain('EVENT / HOLIDAY VISUAL INFLUENCE:');
    expect($finalPrompt)->toContain('Teacher Appreciation Week');
    expect($finalPrompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
    expect($finalPrompt)->toContain('EVENT TEXT: FORBIDDEN');
    expect($finalPrompt)->toContain('STRICT TEXT BAN: The event/holiday name ("Teacher Appreciation Week")');
    expect($finalPrompt)->toContain('STRICT FORBIDDEN TEXT: Do NOT render "Teacher Appreciation Week"');
});

// I. Event influence works with multiple products
test('I. event visual influence works cleanly with multiple products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Christmas Gala Sale',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $productA = Product::factory()->create(['business_id' => $business->id, 'name' => 'Holiday Candle', 'price' => 350]);
    $productB = Product::factory()->create(['business_id' => $business->id, 'name' => 'Pine Reed Diffuser', 'price' => 450]);

    $finalPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$finalPrompt) {
            $finalPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('img')]],
                'usage' => ['total_tokens' => 100],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'catalog_product_ids' => [$productA->id, $productB->id],
        'product_name' => 'Holiday Candle, Pine Reed Diffuser',
        'scene_prompt' => 'Festive winter fireplace mantle with pine garland and golden fairy lights.',
        'show_event_text' => '0',
    ]);

    $response->assertOk();
    expect($finalPrompt)->toContain('Holiday Candle');
    expect($finalPrompt)->toContain('Pine Reed Diffuser');
    expect($finalPrompt)->toContain('Christmas Gala Sale');
    expect($finalPrompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
});

// J. Event influence works with different industries
test('J. event visual influence adapts across different industries', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create();

    $industries = [
        'Beauty & Personal Care' => ['Luxe Skincare', 'Anti-Aging Elixir'],
        'Food & Beverage' => ['Artisan Roasters', 'Cold Brew Concentrate'],
        'Fashion & Apparel' => ['Urban Threadworks', 'Tailored Linen Blazer'],
        'Consumer Electronics' => ['AeroTech Audio', 'Wireless Noise-Canceling Earbuds'],
    ];

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Summer Solstice Festival',
    ]);

    foreach ($industries as $industry => [$bizName, $prodName]) {
        $user = User::factory()->create();
        $business = Business::factory()->create([
            'user_id' => $user->id,
            'name' => $bizName,
            'industry' => $industry,
        ]);
        $campaign = Campaign::factory()->create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'event_id' => $event->id,
        ]);

        $prompt = $orchestrator->orchestrate(
            options: [
                'generation_mode' => 'manual',
                'event' => $event,
                'campaign' => $campaign,
                'product_name' => $prodName,
                'show_event_text' => false,
            ],
            business: $business
        );

        expect($prompt)->toContain('Summer Solstice Festival');
        expect($prompt)->toContain($industry);
        expect($prompt)->toContain($prodName);
        expect($prompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
    }
});

// K. User tagline remains separate from event text
test('K. user tagline remains strictly separate from event text', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Valentine’s Day Special',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $userTagline = 'Cherish Every Pure Moment';

    $prompt = $orchestrator->orchestrate(
        options: [
            'generation_mode' => 'manual',
            'event' => $event,
            'campaign' => $campaign,
            'product_name' => 'Velvet Rose Cologne',
            'include_tagline' => true,
            'tagline' => $userTagline,
            'show_event_text' => false,
        ],
        business: $business
    );

    // Tagline must appear in its dedicated section
    expect($prompt)->toContain('TAGLINE:');
    expect($prompt)->toContain("\"{$userTagline}\"");
    // Event text must remain forbidden
    expect($prompt)->toContain('EVENT TEXT VISIBILITY: FORBIDDEN');
    expect($prompt)->toContain('EVENT TEXT: FORBIDDEN');
    expect($prompt)->toContain('STRICT TEXT BAN: The event/holiday name ("Valentine’s Day Special")');
});

// L. Product names/prices remain separate from event text
test('L. product names and prices remain strictly separate from event text', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Autumn Harvest Week',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $prompt = $orchestrator->orchestrate(
        options: [
            'generation_mode' => 'manual',
            'event' => $event,
            'campaign' => $campaign,
            'product_name' => 'Spiced Pumpkin Jam',
            'include_prices' => true,
            'price' => '280.00',
            'show_event_text' => true,
        ],
        business: $business
    );

    // Product and Price in Section 16
    expect($prompt)->toContain('PRODUCT NAME:');
    expect($prompt)->toContain('"Spiced Pumpkin Jam"');
    expect($prompt)->toContain('PRICE:');
    expect($prompt)->toContain('280.00');

    // Event text is in its own distinct section
    expect($prompt)->toContain('EVENT TEXT (OPTIONAL COMMERCIAL TYPOGRAPHY): ALLOWED');
    expect($prompt)->toContain('Autumn Harvest Week');
});
