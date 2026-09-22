<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use App\Services\TaglineNormalizationService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
    Config::set('services.openai.api_key', 'sk-test-key-mock-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.budget_limit', 10.00);
});

test('user can generate a visual prompt using gpt-5.6-luna and OpenAI Responses API', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Café',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'Specialty coffee roastery in Manila.',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Christmas Day',
        'date' => '2026-12-25',
        'type' => 'Regular Holiday',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Holiday Warmth Campaign',
        'objective' => 'Drive holiday beverage sales',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Caramel Latte',
        'price' => 149.00,
        'description' => 'Velvety espresso with rich caramel swirl.',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Verify requested model is gpt-5.6-luna
            expect($data['model'])->toBe('gpt-5.6-luna');

            // Verify structured outputs schema was supplied
            expect($data['text']['format']['type'])->toBe('json_schema')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('visual_prompt');

            // Verify instructions include MarketPilot constraints
            expect($data['instructions'])->toContain('MarketPilot')
                ->and($data['instructions'])->toContain('STRICT LOGO RESTRICTION')
                ->and($data['instructions'])->toContain('PRESERVE PRODUCT IDENTITY');

            // Verify authoritative context is sent
            expect($data['input'])->toContain('Artisan Café')
                ->and($data['input'])->toContain('Christmas Day')
                ->and($data['input'])->toContain('Caramel Latte')
                ->and($data['input'])->toContain('149.00')
                ->and($data['input'])->toContain('1:1')
                ->and($data['input'])->toContain('Cozy Christmas');

            return Http::response([
                'id' => 'resp-12345',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-12345',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'visual_prompt' => 'A steaming ceramic cup of Caramel Latte positioned gracefully on a rustic mahogany café table, dusted with cinnamon, framed by soft warm Christmas twinkle lights and subtle pine garland, festive morning ambience.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => [
                    'input_tokens' => 320,
                    'output_tokens' => 64,
                    'total_tokens' => 384,
                ],
            ], 200);
        },
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 1.50], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 1000, 'num_model_requests' => 5]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'user_instruction' => 'Make it feel warm and premium, but not overly Christmas-themed.',
        'render_style' => 'Studio Product Still',
        'visual_theme' => ['Cozy Christmas'],
        'brand_tone' => ['Warm'],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'model' => 'gpt-5.6-luna',
            'visual_prompt' => 'A steaming ceramic cup of Caramel Latte positioned gracefully on a rustic mahogany café table, dusted with cinnamon, framed by soft warm Christmas twinkle lights and subtle pine garland, festive morning ambience.',
            'usage' => [
                'input_tokens' => 320,
                'output_tokens' => 64,
                'total_tokens' => 384,
            ],
        ]);
});

test('catalog price and name are authoritative and preserved in context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Matcha Latte',
        'price' => 175.50,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();
            // Verify authoritative catalog price ₱175.50 is included in context
            expect($data['input'])->toContain('Iced Matcha Latte')
                ->and($data['input'])->toContain('175.50');

            return Http::response([
                'id' => 'resp-test-2',
                'output' => [
                    [
                        'id' => 'msg-test-2',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'visual_prompt' => 'Artisanal glass of vibrant layered Iced Matcha Latte on a clean bamboo coaster.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 200],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);
});

test('campaign linked event is preserved and client cannot override event through prompt endpoint', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $realEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Valentine Special',
    ]);
    $otherEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Halloween Spooktacular',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $realEvent->id,
    ]);

    // Submitting a different event_id must fail validation
    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'event_id' => $otherEvent->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['event_id']);
});

test('tenant isolation: user cannot generate prompt using another users campaign', function () {
    $user1 = User::factory()->create(['onboarding_completed' => true]);
    $business1 = Business::factory()->create(['user_id' => $user1->id]);

    $user2 = User::factory()->create(['onboarding_completed' => true]);
    $business2 = Business::factory()->create(['user_id' => $user2->id]);
    $campaign2 = Campaign::factory()->create([
        'user_id' => $user2->id,
        'business_id' => $business2->id,
    ]);

    $response = $this->actingAs($user1)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign2->id,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['campaign_id']);
});

test('tenant isolation: user cannot supply another businesses catalog products', function () {
    $user1 = User::factory()->create(['onboarding_completed' => true]);
    $business1 = Business::factory()->create(['user_id' => $user1->id]);
    $campaign1 = Campaign::factory()->create([
        'user_id' => $user1->id,
        'business_id' => $business1->id,
    ]);

    $user2 = User::factory()->create(['onboarding_completed' => true]);
    $business2 = Business::factory()->create(['user_id' => $user2->id]);
    $product2 = Product::factory()->create([
        'business_id' => $business2->id,
    ]);

    $response = $this->actingAs($user1)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign1->id,
        'catalog_product_ids' => [$product2->id],
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['catalog_product_ids']);
});

test('handles OpenAI failure gracefully with safe error message without leaking secrets', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'error' => ['message' => 'Rate limit exceeded on OpenAI server'],
        ], 429),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
    ]);

    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
            'message' => "We couldn't generate the visual prompt right now. Please try again.",
        ]);
});

test('empty user instruction generates prompt successfully from structured context alone', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-empty-instruction',
            'output' => [
                [
                    'id' => 'msg-empty-instruction',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'visual_prompt' => 'A clean editorial still life presentation of the product with natural daylight and subtle shadows.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'user_instruction' => '',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'visual_prompt' => 'A clean editorial still life presentation of the product with natural daylight and subtle shadows.',
        ]);
});

test('empty or unreadable output fails safely with controlled error', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-unreadable',
            'output' => [
                [
                    'id' => 'msg-unreadable',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [],
                    'role' => 'assistant',
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
    ]);

    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
            'message' => "We couldn't generate the visual prompt right now. Please try again.",
        ]);
});

test('generator prompt endpoint blocks request when AI budget limit is reached', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 10.50], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 300000, 'num_model_requests' => 150]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'quota_exceeded' => true,
        ]);
});

test('automatic mode succeeds without manual creative fields and injects full business, campaign, event, and art-direction context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Lumina Skin Clinic',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare & Cosmetics',
        'description' => 'Boutique aesthetic dermatology and organic botanical skincare clinic.',
        'target_audience' => 'Discerning professionals aged 25-45 seeking radiant skin.',
        'unique_selling_point' => 'Hypoallergenic botanical formulation backed by dermatological clinical trials.',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "Mother's Day",
        'date' => '2026-05-10',
        'type' => 'Special Holiday',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => "Mother's Day Glow Radiance Campaign",
        'objective' => 'Drive gifting and bundle reservations for pampering mothers',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Radiance Botanical Facial Serum',
        'price' => 1250.00,
        'description' => 'Infused with cold-pressed rosehip seed oil and plant squalane in an amber glass dropper bottle.',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // 1. Structured output schema includes concept, strategy, and prompt
            expect($data['text']['format']['schema']['properties'])->toHaveKey('creative_concept')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('visual_strategy')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('visual_prompt');

            // 2. Automatic mode instructions are active
            expect($data['instructions'])->toContain('AI Creative Director')
                ->and($data['instructions'])->toContain('ANTI-REPETITION MANDATE')
                ->and($data['instructions'])->toContain('STRICT LOGO RESTRICTION');

            // 3. Campaign & Event context present
            expect($data['input'])->toContain("Mother's Day Glow Radiance Campaign")
                ->and($data['input'])->toContain("Mother's Day")
                ->and($data['input'])->toContain('Drive gifting and bundle reservations');

            // 4. Business context present
            expect($data['input'])->toContain('Lumina Skin Clinic')
                ->and($data['input'])->toContain('Beauty & Personal Care')
                ->and($data['input'])->toContain('Skincare & Cosmetics')
                ->and($data['input'])->toContain('Hypoallergenic botanical formulation')
                ->and($data['input'])->toContain('Discerning professionals');

            // 5. Product context present
            expect($data['input'])->toContain('Radiance Botanical Facial Serum')
                ->and($data['input'])->toContain('1,250.00')
                ->and($data['input'])->toContain('amber glass dropper bottle');

            // 6. User tagline and aspect ratio preserved
            expect($data['input'])->toContain('Give Mom the Radiance She Deserves')
                ->and($data['input'])->toContain('4:5');

            // 7. Domain art direction rules injected from IndustryCategoryArtDirectionService
            expect($data['input'])->toContain('INDUSTRY & SUBCATEGORY ART DIRECTION STANDARDS');

            return Http::response([
                'id' => 'resp-auto-mode-1',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-auto-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'Give Mom the Radiance She Deserves',
                                    'creative_concept' => 'Serene morning vanity ritual celebrating maternal care and glowing self-appreciation',
                                    'visual_strategy' => 'Focus on warm diffused morning sunlight, natural marble textures, subtle soft pink peonies, and pristine amber glass serum bottle',
                                    'visual_prompt' => 'An amber glass dropper bottle of Radiance Botanical Facial Serum standing elegantly on a polished white Carrara marble bathroom counter, illuminated by soft golden morning window light with subtle pink peony petals resting nearby, calm luxurious self-care atmosphere.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => [
                    'input_tokens' => 450,
                    'output_tokens' => 110,
                    'total_tokens' => 560,
                ],
            ], 200);
        },
    ]);

    // Send request in Automatic mode WITHOUT manual fields (render_style, visual_theme, brand_tone)
    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'automatic',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'tagline' => 'Give Mom the Radiance She Deserves',
        'aspect_ratio' => '4:5',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'model' => 'gpt-5.6-luna',
            'creative_concept' => 'Serene morning vanity ritual celebrating maternal care and glowing self-appreciation',
            'visual_strategy' => 'Focus on warm diffused morning sunlight, natural marble textures, subtle soft pink peonies, and pristine amber glass serum bottle',
            'visual_prompt' => 'An amber glass dropper bottle of Radiance Botanical Facial Serum standing elegantly on a polished white Carrara marble bathroom counter, illuminated by soft golden morning window light with subtle pink peony petals resting nearby, calm luxurious self-care atmosphere.',
        ]);
});

test('automatic regeneration passes previous concepts to prevent repetition', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Metro Auto Hub',
        'industry' => 'Automotive',
        'category' => 'Dealership / Showroom',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Year-End Drive Event',
    ]);

    // Create a previous completed design for this campaign to simulate existing history
    Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'completed',
        'prompt' => 'Sleek luxury crossover vehicle parked under modern showroom spotlights.',
        'generation_metadata' => [
            'creative_concept' => 'Modern showroom reveal of the new luxury crossover vehicle',
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Verify previous concepts are passed in context under anti-repetition guidance
            expect($data['input'])->toContain('PREVIOUS CREATIVE CONCEPTS (DO NOT REPEAT OR DUPLICATE)')
                ->and($data['input'])->toContain('Modern showroom reveal of the new luxury crossover vehicle')
                ->and($data['input'])->toContain('Open highway dusk cruise through mountain pass');

            return Http::response([
                'id' => 'resp-regen-1',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-regen-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'Drive the extraordinary',
                                    'creative_concept' => 'Urban rain reflections and neon night drive cityscape',
                                    'visual_strategy' => 'Contrast wet asphalt reflections with crisp LED headlights and dramatic architectural depth',
                                    'visual_prompt' => 'A glistening aerodynamic automobile cutting through a cinematic wet metropolitan boulevard at dusk, headlights illuminating mist, vibrant neon reflections dancing across the sleek metallic bodywork.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 400],
            ], 200);
        },
    ]);

    // Send regeneration request with both in-session previous concepts and campaign database history
    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'automatic',
        'campaign_id' => $campaign->id,
        'previous_concepts' => [
            'Open highway dusk cruise through mountain pass',
        ],
        'aspect_ratio' => '16:9',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Urban rain reflections and neon night drive cityscape',
        ]);
});

test('previous concepts do not leak across different campaigns or tenants', function () {
    $user1 = User::factory()->create(['onboarding_completed' => true]);
    $business1 = Business::factory()->create(['user_id' => $user1->id]);
    $campaign1 = Campaign::factory()->create([
        'user_id' => $user1->id,
        'business_id' => $business1->id,
        'name' => 'Spring Bakery Campaign',
    ]);

    $campaign2 = Campaign::factory()->create([
        'user_id' => $user1->id,
        'business_id' => $business1->id,
        'name' => 'Summer Smoothie Campaign',
    ]);

    // Concept for campaign 2
    Design::factory()->create([
        'user_id' => $user1->id,
        'business_id' => $business1->id,
        'campaign_id' => $campaign2->id,
        'status' => 'completed',
        'prompt' => 'Tropical beach smoothie splash with fresh dragonfruit.',
        'generation_metadata' => [
            'creative_concept' => 'Tropical beach smoothie splash with fresh dragonfruit',
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Verify concept from campaign 2 is NOT present in campaign 1's request
            expect($data['input'])->not->toContain('Tropical beach smoothie splash with fresh dragonfruit');

            return Http::response([
                'id' => 'resp-iso-1',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-iso-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'Warm rustic artisanal bread',
                                    'creative_concept' => 'Artisanal sourdough crust crackling in morning bakery sun',
                                    'visual_strategy' => 'Golden morning sunlight catching flour dust and rustic cutting board',
                                    'visual_prompt' => 'A rustic loaf of sourdough bread with golden blistered crust resting on a wooden board.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 300],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user1)->postJson(route('generator.prompt'), [
        'generation_mode' => 'automatic',
        'campaign_id' => $campaign1->id,
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);
});

test('manual mode preserves explicit user-supplied render style, visual theme, and brand tone', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Manual mode preserves explicit user choices
            expect($data['input'])->toContain('Render Style: Studio Product Still')
                ->and($data['input'])->toContain('Visual Theme: Minimalist Japanese')
                ->and($data['input'])->toContain('Brand Tone: Sophisticated, Serene');

            return Http::response([
                'id' => 'resp-manual-1',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-manual-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Minimalist Japanese tea ceremony aesthetic',
                                    'visual_strategy' => 'Strict monochrome balance with single ceramic focal element',
                                    'visual_prompt' => 'A ceramic vessel in Studio Product Still style with Minimalist Japanese atmosphere.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 300],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'render_style' => 'Studio Product Still',
        'visual_theme' => ['Minimalist Japanese'],
        'brand_tone' => ['Sophisticated', 'Serene'],
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Minimalist Japanese tea ceremony aesthetic',
            'visual_strategy' => 'Strict monochrome balance with single ceramic focal element',
        ]);
});

test('automatic mode one-action endpoint /generator/automatic generates tagline, concept, prompt, and image seamlessly', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Komorebi Matcha',
        'industry' => 'Food & Beverage',
        'category' => 'Artisan Café',
        'description' => 'Authentic ceremonial grade matcha café.',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'National Teachers Day',
        'date' => '2026-10-05',
        'type' => 'Special Working',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Ceremonial Matcha Latte',
        'price' => 185.00,
        'description' => 'Stone-ground Uji matcha whisked with oat milk.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'name' => 'Teachers Gratitude Celebration',
        'objective' => 'Celebrate educators with a calming artisan matcha break',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Automatic mode derives from Campaign, Business, and Product without manual style inputs
            expect($data['instructions'])->toContain('CAMPAIGN TAGLINE')
                ->and($data['instructions'])->toContain('GROUNDED TAGLINE MANDATE')
                ->and($data['input'])->toContain('Komorebi Matcha')
                ->and($data['input'])->toContain('National Teachers Day')
                ->and($data['input'])->toContain('Ceremonial Matcha Latte')
                ->and($data['input'])->toContain('185.00')
                ->and($data['input'])->toContain('1:1');

            return Http::response([
                'id' => 'resp-auto-full',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-auto-full',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'A Mindful Pause for Those Who Teach with Heart',
                                    'creative_concept' => 'Mindful tea sanctuary celebrating calm and gratitude',
                                    'visual_strategy' => 'Soft morning window light illuminating delicate jade matcha foam and handcrafted ceramic bowl',
                                    'visual_prompt' => 'A serene handcrafted ceramic cup filled with frothy Ceremonial Matcha Latte on a light hinoki wood table, bathed in calm morning sun with delicate steam.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 450],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => Http::response([
            'created' => 1718000000,
            'data' => [
                [
                    'b64_json' => base64_encode('fake-png-binary-content-marketpilot'),
                ],
            ],
        ], 200),
    ]);

    // Single generation action from client: only campaign, product, aspect_ratio
    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'A Mindful Pause for Those Who Teach with Heart',
            'creative_concept' => 'Mindful tea sanctuary celebrating calm and gratitude',
            'visual_strategy' => 'Soft morning window light illuminating delicate jade matcha foam and handcrafted ceramic bowl',
        ])
        ->assertJsonStructure([
            'success',
            'tagline',
            'creative_concept',
            'visual_strategy',
            'visual_prompt',
            'preview' => [
                'image_url',
                'product_name',
                'tagline',
                'aspect_ratio',
            ],
        ]);
});

test('automatic mode resolves campaign event and passes context without manual event input', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Sweet Blooms Bakery',
        'industry' => 'Food & Beverage',
        'category' => 'Bakery',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Mothers Day',
        'date' => '2026-05-10',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Mothers Day Sweet Treats',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Strawberry Shortcake',
        'price' => 320.00,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();
            // Verify linked event reached the prompt context automatically
            expect($data['input'])->toContain('Mothers Day')
                ->and($data['input'])->toContain('Sweet Blooms Bakery')
                ->and($data['input'])->toContain('Strawberry Shortcake');

            return Http::response([
                'id' => 'resp-auto-event',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-auto-event',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'Every Layer Baked with Sweetest Love for Mom',
                                    'creative_concept' => 'Pastel floral teatime celebrating maternal warmth',
                                    'visual_strategy' => 'Delicate lace and edible flowers framing the strawberry layers',
                                    'visual_prompt' => 'An artisanal Strawberry Shortcake on a vintage porcelain stand with fresh sliced strawberries and powdered sugar.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 400],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-cake-image')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '4:5',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'Every Layer Baked with Sweetest Love for Mom',
        ]);
});

test('automatic mode rejects request when ai budget is exceeded', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 10.50], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 300000, 'num_model_requests' => 150]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Blend',
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'quota_exceeded' => true,
        ]);
});

test('automatic mode enforces tenant and campaign ownership', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $businessA = Business::factory()->create(['user_id' => $userA->id]);
    $campaignA = Campaign::factory()->create([
        'user_id' => $userA->id,
        'business_id' => $businessA->id,
    ]);

    $userB = User::factory()->create(['onboarding_completed' => true]);
    $businessB = Business::factory()->create(['user_id' => $userB->id]);
    $productB = Product::factory()->create([
        'business_id' => $businessB->id,
        'name' => 'Foreign Product',
    ]);

    // User A attempts to use User B's product
    $response = $this->actingAs($userA)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaignA->id,
        'product_id' => $productB->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertStatus(422);

    // User B attempts to use User A's campaign
    $response2 = $this->actingAs($userB)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaignA->id,
        'product_id' => $productB->id,
        'aspect_ratio' => '1:1',
    ]);

    $response2->assertStatus(422);
});

test('subsequent automatic generation includes previous concept context for anti-repetition', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Artisan Loaf',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Verify previous concepts are passed in prompt context to ensure variety
            expect($data['input'])->toContain('Golden morning rustic bread board')
                ->and($data['instructions'])->toContain('ANTI-REPETITION');

            return Http::response([
                'id' => 'resp-regen',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-regen',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'A Fresh Hearth Tradition Reimagined',
                                    'creative_concept' => 'Evening dusk boulangerie with warm terracotta ovens',
                                    'visual_strategy' => 'Deep amber oven glow creating dramatic silhouette highlights',
                                    'visual_prompt' => 'An artisanal bread loaf freshly pulled from a wood-fired brick oven at dusk, dusting of flour glowing warm.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 420],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-regen-image')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '16:9',
        'previous_concepts' => ['Golden morning rustic bread board'],
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'A Fresh Hearth Tradition Reimagined',
            'creative_concept' => 'Evening dusk boulangerie with warm terracotta ovens',
        ]);
});

test('automatic mode preserves intermediate tagline and concept if image generation fails downstream', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Espresso Roast',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-step1-ok',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-1',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Bold Notes for Every High-Powered Morning',
                                'creative_concept' => 'Dynamic dark roast crema explosion',
                                'visual_strategy' => 'Macro splash of velvety espresso droplets',
                                'visual_prompt' => 'A crystal demitasse cup of espresso with golden crema surrounded by whole roasted beans.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 380],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'error' => [
                'message' => 'The image generation service is temporarily overloaded.',
            ],
        ], 503),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    // Should return 500 or error status, but intermediate outputs must be preserved in the response
    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
            'tagline' => 'Bold Notes for Every High-Powered Morning',
            'creative_concept' => 'Dynamic dark roast crema explosion',
            'visual_strategy' => 'Macro splash of velvety espresso droplets',
        ]);

    expect($response->json('visual_prompt'))
        ->toContain('A crystal demitasse cup of espresso with golden crema')
        ->and($response->json('visual_prompt'))
        ->toContain('Bold Notes for Every High-Powered Morning');
});

test('automatic mode normalizes duplicate catalog product IDs before processing', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Revuele Aloe Daily Sun Barrier',
        'price' => 398.00,
    ]);
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'CRS Daily Sun Protection',
        'price' => 322.00,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $input = $request->data()['input'];
            // Verify product1 appears in input
            expect($input)->toContain('Revuele Aloe Daily Sun Barrier')
                ->and($input)->toContain('CRS Daily Sun Protection');

            // Count occurrences of product1 catalog item in input to ensure it was not duplicated
            $count = substr_count($input, '  - Revuele Aloe Daily Sun Barrier');
            expect($count)->toBe(1);

            return Http::response([
                'id' => 'resp-dedup-1',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => 'Shield your glow every single day.',
                                    'creative_concept' => 'Minimalist sunlit skincare flatlay',
                                    'visual_strategy' => 'Crisp botanical shadows with gentle morning illumination',
                                    'visual_prompt' => 'A clean aesthetic skincare presentation with aloe vera gel textures.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 350],
            ], 200);
        },
        'https://api.openai.com/v1/images/edits' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-edits-image')]],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-dedup-image')]],
        ], 200),
    ]);

    // Send product1 twice in catalog_product_ids alongside product2
    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product1->id, $product2->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'Shield your glow every single day.',
        ]);
});

test('automatic mode extracts genuine AI tagline and propagates it into production visual prompt', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Lumina Botanicals']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Summer Radiance',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Hydra Mist',
        'price' => 450.00,
    ]);

    $distinctiveTagline = 'A brighter pause for every busy morning';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-tagline-prop',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-1',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => $distinctiveTagline,
                                'creative_concept' => 'Dewy morning botanical misting',
                                'visual_strategy' => 'Macro droplets with prismatic dawn rays',
                                'visual_prompt' => 'A frosted glass bottle of Hydra Mist suspended in crystalline water droplets.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 380],
        ], 200),
        'https://api.openai.com/v1/images/generations' => function ($request) use ($distinctiveTagline) {
            $prompt = $request->data()['prompt'];
            // Verify the production visual prompt passed to image service contains the exact AI tagline
            expect($prompt)->toContain($distinctiveTagline)
                ->and($prompt)->toContain('Lumina Botanicals')
                ->and($prompt)->toContain('Hydra Mist')
                ->and($prompt)->toContain('STRICT TYPOGRAPHY ONLY (NO LOGO/EMBLEM/SYMBOL)');

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-result')]],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
        'include_business_name' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => $distinctiveTagline,
        ]);

    expect($response->json('visual_prompt'))->toContain($distinctiveTagline);
});

test('automatic mode fails safely when AI returns empty or missing tagline without using static fallbacks', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Daily Cleanse',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-empty-tagline',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-1',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => '   ', // Empty/whitespace tagline
                                'creative_concept' => 'Minimalist clean aesthetic',
                                'visual_strategy' => 'Natural light',
                                'visual_prompt' => 'A clean bottle on marble.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 300],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    // Must fail safely without substituting a deterministic or hardcoded tagline
    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
        ]);

    expect($response->json('message'))
        ->toContain('AI Creative Director failed to generate a valid commercial tagline');
});

test('Test 1 to 4 & 7: Automatic mode propagates exact OpenAI tagline to response, orchestrator, and image service with valid strict schema', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Artisan Lab']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Botanical Essence',
    ]);

    $distinctTagline = 'Everyday protection, beautifully simple.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($distinctTagline) {
            $data = $request->data();

            // Test 7: Verify schema has tagline in BOTH properties and required
            expect($data['text']['format']['schema']['properties'])->toHaveKey('tagline')
                ->and($data['text']['format']['schema']['required'])->toContain('tagline')
                ->and($data['text']['format']['schema']['required'])->toContain('creative_concept')
                ->and($data['text']['format']['schema']['required'])->toContain('visual_strategy')
                ->and($data['text']['format']['schema']['required'])->toContain('visual_prompt');

            return Http::response([
                'id' => 'resp-test-tagline',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => $distinctTagline,
                                    'creative_concept' => 'Serene botanical laboratory',
                                    'visual_strategy' => 'Soft diffused lighting and clean marble textures',
                                    'visual_prompt' => 'An amber glass bottle of Botanical Essence on polished marble.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 350],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => function ($request) use ($distinctTagline) {
            $data = $request->data();
            $normalizedTagline = TaglineNormalizationService::normalize($distinctTagline);

            // Test 3 & 4: Exact tagline reaches ModularPromptOrchestrator and image generation payload
            expect($data['prompt'])->toContain($normalizedTagline)
                ->and($data['prompt'])->toContain('• TAGLINE: "'.$normalizedTagline.'"');

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-image-bytes')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    // Test 1 & 2: Succeeds and exact tagline reaches response
    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => $distinctTagline,
        ]);

    $normalizedTagline = TaglineNormalizationService::normalize($distinctTagline);
    expect($response->json('visual_prompt'))->toContain($normalizedTagline)
        ->and($response->json('preview.tagline'))->toBe($distinctTagline);
});

test('Test 5: Different mocked OpenAI tagline produces different application tagline dynamically', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $secondTagline = 'Confidence begins with daily care.';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-test-tagline-2',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-2',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => $secondTagline,
                                'creative_concept' => 'Daily radiance ritual',
                                'visual_strategy' => 'Morning golden hour rays',
                                'visual_prompt' => 'A skincare dropper bottle in golden morning light.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 310],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-bytes')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    expect($response->json('tagline'))->toBe($secondTagline)
        ->and($response->json('visual_prompt'))->toContain(TaglineNormalizationService::normalize($secondTagline));
});

test('Test 8: Automatic mode does not use a deterministic tagline template', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Signature Blend']);

    $aiTagline = 'Pure artisan focus in every cup.';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-test-ai',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-3',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => $aiTagline,
                                'creative_concept' => 'Specialty roast elegance',
                                'visual_strategy' => 'Moody rim light',
                                'visual_prompt' => 'A steaming cup on dark slate.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 300],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-bytes')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    expect($response->json('tagline'))->toBe($aiTagline);
});

test('Test 9 to 11: Manual Suggest Tagline triggers backend AI request and populates response', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Nordic Roast',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Autumn Warmth',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Nordic Espresso',
        'price' => 175.00,
    ]);

    $manualAiTagline = 'Warming hearts with Nordic craftsmanship.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($manualAiTagline) {
            $data = $request->data();

            // Verify manual tagline request includes require_tagline in schema
            expect($data['text']['format']['schema']['properties'])->toHaveKey('tagline')
                ->and($data['text']['format']['schema']['required'])->toContain('tagline');

            // Verify context was passed
            expect($data['input'])->toContain('Nordic Roast')
                ->and($data['input'])->toContain('Nordic Espresso')
                ->and($data['input'])->toContain('Autumn Warmth');

            return Http::response([
                'id' => 'resp-manual-tagline',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-man-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => $manualAiTagline,
                                    'creative_concept' => 'Minimalist Scandinavian hygge',
                                    'visual_strategy' => 'Morning sunlight through frost glass',
                                    'visual_prompt' => 'A clean ceramic mug on pine wood.',
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 290],
            ], 200);
        },
    ]);

    // Manual Suggest Tagline sends require_tagline = true and target = tagline
    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'generation_mode' => 'manual',
        'require_tagline' => true,
        'target' => 'tagline',
        'catalog_product_ids' => [$product->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => $manualAiTagline,
        ]);

    expect($response->json('tagline'))->toBe($manualAiTagline);
});

test('Test 12 & 13: Generated Manual tagline enters production prompt and changes with different mock', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Lumina Skin']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Glow Elixir',
    ]);

    $secondManualTagline = 'Radiance refined for every dawn.';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'id' => 'resp-man-diff',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-man-2',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => $secondManualTagline,
                                'creative_concept' => 'Pure dawn luminescence',
                                'visual_strategy' => 'Crystal reflections and soft morning mist',
                                'visual_prompt' => 'An elegant frosted dropper bottle glowing in soft morning light.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 310],
        ], 200),
    ]);

    $promptRes = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'generation_mode' => 'manual',
        'require_tagline' => true,
        'catalog_product_ids' => [$product->id],
    ]);

    $promptRes->assertOk();
    $obtainedTagline = $promptRes->json('tagline');
    expect($obtainedTagline)->toBe($secondManualTagline);

    // Verify this tagline enters the production prompt
    $orchestrator = app(ModularPromptOrchestrator::class);
    $productionPrompt = $orchestrator->orchestrate([
        'product_name' => $product->name,
        'tagline' => $obtainedTagline,
        'aspect_ratio' => '1:1',
    ], $business);

    expect($productionPrompt)->toContain('• TAGLINE: "'.TaglineNormalizationService::normalize($secondManualTagline).'"');
});

test('Test 14: Frontend generator page does not contain hardcoded 32-element template array', function () {
    $frontendFile = file_get_contents(resource_path('js/pages/generator/index.tsx'));

    expect($frontendFile)->not->toContain('const templates =')
        ->and($frontendFile)->not->toContain('generateTagline =')
        ->and($frontendFile)->not->toContain('lastTaglineIndex')
        ->and($frontendFile)->toContain('handleSuggestTagline');
});

test('Test 15: Manual direct user-entered tagline is preserved verbatim without AI overwrite', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Heritage Bread']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Sourdough Loaf',
    ]);

    $customUserTagline = 'Handcrafted sourdough baked fresh at 4 AM';

    // In preview/manual store with a custom tagline, user tagline is authoritative
    $orchestrator = app(ModularPromptOrchestrator::class);
    $productionPrompt = $orchestrator->orchestrate([
        'product_name' => $product->name,
        'tagline' => $customUserTagline,
        'aspect_ratio' => '1:1',
    ], $business);

    expect($productionPrompt)->toContain('• TAGLINE: "'.$customUserTagline.'"');
});

/*
|--------------------------------------------------------------------------
| Section 29, 30, 31, 32: Mode-Distinct Creative Priority & Production Prompt Tests
|--------------------------------------------------------------------------
*/

test('Section 29: Automatic mode receives full event, objective, industry, business context and generates 4 AI outputs into orchestrator', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Botanica Skincare',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare & Cosmetics',
        'description' => 'Organic botanical anti-aging formulas',
        'unique_selling_point' => 'Cold-pressed bioactive plant extracts',
        'target_audience' => 'Health-conscious adults 25-50',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "Mother's Day",
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => "Mother's Day Pampering",
        'objective' => 'Seasonal Gifting & Maternal Appreciation',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Rosehip Glow Serum',
        'price' => 899.00,
        'description' => 'Pure cold-pressed rosehip seed oil',
    ]);

    $aiTagline = 'Celebrate Mom with the Gift of Radiance.';
    $aiConcept = 'Morning vanity tribute highlighting maternal self-care';
    $aiStrategy = 'Soft golden window light, white marble vanity, subtle pink peonies, pristine serum dropper bottle';
    $aiVisualPrompt = 'A delicate amber glass dropper bottle of Rosehip Glow Serum on a white marble vanity, bathed in soft morning light with fresh pink peonies.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($aiTagline, $aiConcept, $aiStrategy, $aiVisualPrompt) {
            $data = $request->data();

            // 1. Linked Event / Holiday
            expect($data['input'])->toContain("Mother's Day");
            // 2. Campaign Objective
            expect($data['input'])->toContain('Seasonal Gifting & Maternal Appreciation');
            // 3. Industry
            expect($data['input'])->toContain('Beauty & Personal Care');
            // 4. Subcategory
            expect($data['input'])->toContain('Skincare & Cosmetics');
            // 5. Business context
            expect($data['input'])->toContain('Botanica Skincare')
                ->and($data['input'])->toContain('Organic botanical anti-aging formulas')
                ->and($data['input'])->toContain('Cold-pressed bioactive plant extracts')
                ->and($data['input'])->toContain('Health-conscious adults 25-50');
            // 6. Product / Service context
            expect($data['input'])->toContain('Rosehip Glow Serum')
                ->and($data['input'])->toContain('899.00');

            // Automatic Instructions must state the 10-tier creative hierarchy
            expect($data['instructions'])->toContain('AUTOMATIC CREATIVE DECISION HIERARCHY')
                ->and($data['instructions'])->toContain('1. CAMPAIGN OBJECTIVE')
                ->and($data['instructions'])->toContain('2. LINKED EVENT / HOLIDAY')
                ->and($data['instructions'])->toContain('3. INDUSTRY & SUBCATEGORY DOMAIN STANDARDS');

            return Http::response([
                'id' => 'resp-sec29-auto',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'id' => 'msg-sec29-1',
                        'type' => 'message',
                        'status' => 'completed',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'tagline' => $aiTagline,
                                    'creative_concept' => $aiConcept,
                                    'visual_strategy' => $aiStrategy,
                                    'visual_prompt' => $aiVisualPrompt,
                                ]),
                            ],
                        ],
                        'role' => 'assistant',
                    ],
                ],
                'usage' => ['total_tokens' => 380],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => function ($request) use ($aiTagline) {
            $data = $request->data();
            $normalizedTagline = TaglineNormalizationService::normalize($aiTagline);

            // 11. Passed through ModularPromptOrchestrator
            expect($data['prompt'])->toContain($normalizedTagline)
                ->and($data['prompt'])->toContain('• TAGLINE: "'.$normalizedTagline.'"')
                ->and($data['prompt'])->toContain('AUTOMATIC AI CREATIVE DIRECTION');

            // 12. Aspect ratio remains authoritative (9:16)
            expect($data['prompt'])->toContain('9:16');

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image')]],
            ], 200);
        },
    ]);

    // 13. Manual style/tone values are not required in Automatic
    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '9:16',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => $aiTagline,
            'creative_concept' => $aiConcept,
            'visual_strategy' => $aiStrategy,
        ]);
});

test('Section 30: Manual mode preserves user scene, content style, brand tone, visual theme, and tagline with event as contextual only', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Noir Luxe',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare & Cosmetics',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "Valentine's Day",
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Valentine Special',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Midnight Velvet Serum',
    ]);

    $userScene = 'A single matte black dropper bottle on a dark slate slab with dramatic rim lighting and water droplets';
    $userTagline = 'Velvet touch for unforgettable nights.';
    $userContentStyle = 'Studio Product Still';
    $userBrandTone = 'Sophisticated';
    $userVisualTheme = 'Dark Luxury';

    $orchestrator = app(ModularPromptOrchestrator::class);
    $productionPrompt = $orchestrator->orchestrate([
        'product_name' => $product->name,
        'prompt' => $userScene,
        'tagline' => $userTagline,
        'content_style' => $userContentStyle,
        'brand_tone' => $userBrandTone,
        'visual_theme' => $userVisualTheme,
        'event_name' => $event->name,
        'generation_mode' => 'manual',
        'aspect_ratio' => '1:1',
    ], $business);

    // 16. Manual visual prompt is preserved
    expect($productionPrompt)->toContain($userScene);
    // 17. Manual Content Style is preserved
    expect($productionPrompt)->toContain("RENDER STYLE:\nStudio Product Still");
    // 18. Manual Brand Tone is preserved
    expect($productionPrompt)->toContain("BRAND TONE:\nSophisticated");
    // 19. Manual Visual Theme is preserved
    expect($productionPrompt)->toContain("VISUAL THEME:\nDark Luxury");
    // 20. Manual tagline is preserved
    expect($productionPrompt)->toContain('• TAGLINE: "'.TaglineNormalizationService::normalize($userTagline).'"');
    // 22 & 23. Campaign Event is contextual (Subtle Seasonal Context) but does not override user scene
    expect($productionPrompt)->toContain('EVENT DIRECTION (CONTEXTUAL)')
        ->and($productionPrompt)->toContain("Valentine's Day")
        ->and($productionPrompt)->toContain('PRIMARY USER SCENE DIRECTION:');
    // 24. Aspect ratio is authoritative
    expect($productionPrompt)->toContain('1:1');
});

test('Section 31: Mode switching preserves shared campaign and product context without state leakage', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    // Generator index loads shared dataset once
    $response = $this->actingAs($user)->get(route('generator.automatic.index', ['campaign_id' => $campaign->id]));
    $response->assertOk();

    // Verify props contain shared campaign, business, products, events
    $page = $response->original->getData()['page'];
    expect($page['props'])->toHaveKey('campaign')
        ->and($page['props'])->toHaveKey('business')
        ->and($page['props'])->toHaveKey('products')
        ->and($page['props'])->toHaveKey('events');
});

test('Section 32: Production prompt demonstrates clear semantic distinction between Automatic and Manual modes', function () {
    $business = Business::factory()->make([
        'name' => 'Lumina Skin',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare & Cosmetics',
    ]);

    $orchestrator = app(ModularPromptOrchestrator::class);

    // Automatic mode prompt
    $autoPrompt = $orchestrator->orchestrate([
        'product_name' => 'Radiance Facial Serum',
        'event_name' => "Mother's Day",
        'generation_mode' => 'automatic',
        'creative_concept' => 'Serene morning maternal care tribute',
        'visual_strategy' => 'Golden sunlight through sheer linen, marble vanity, soft peonies',
        'prompt' => 'An amber glass bottle on a sunlit marble vanity with gentle pink peony petals.',
        'tagline' => 'Give Mom the Glow She Cherishes.',
        'aspect_ratio' => '9:16',
    ], $business);

    expect($autoPrompt)->toContain('AUTOMATIC AI CREATIVE DIRECTION (Primary Campaign Concept & Visual Strategy)')
        ->and($autoPrompt)->toContain('EVENT DIRECTION (CREATIVE DRIVER)')
        ->and($autoPrompt)->toContain('Mother\'s Day')
        ->and($autoPrompt)->toContain('Serene morning maternal care tribute')
        ->and($autoPrompt)->toContain('Golden sunlight through sheer linen');

    // Manual mode prompt
    $manualPrompt = $orchestrator->orchestrate([
        'product_name' => 'Radiance Facial Serum',
        'event_name' => "Mother's Day",
        'generation_mode' => 'manual',
        'prompt' => 'Serum bottle resting flat on textured raw concrete with harsh direct noon sunlight and geometric shadow lines.',
        'content_style' => 'Minimalist Graphic',
        'brand_tone' => 'Bold & Edgy',
        'visual_theme' => 'Monochrome Minimal',
        'tagline' => 'Pure active formula.',
        'aspect_ratio' => '1:1',
    ], $business);

    expect($manualPrompt)->toContain('PRIMARY USER SCENE DIRECTION: Serum bottle resting flat on textured raw concrete')
        ->and($manualPrompt)->toContain("RENDER STYLE:\nMinimalist Graphic")
        ->and($manualPrompt)->toContain("BRAND TONE:\nBold & Edgy")
        ->and($manualPrompt)->toContain("VISUAL THEME:\nMonochrome Minimal")
        ->and($manualPrompt)->toContain('EVENT DIRECTION (CONTEXTUAL)')
        ->and($manualPrompt)->toContain('Mother\'s Day');
});
