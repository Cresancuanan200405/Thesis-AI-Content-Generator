<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use App\Services\OpenAIImageService;
use App\Services\ReferenceImageAnalyzer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Cache::flush();
    Config::set('services.openai.api_key', 'sk-test-key-mock-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.budget_limit', 20.00);
});

test('A: Manual Suggest Prompt includes featured products context cleanly without rigid spatial arrangement directives', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Luxe Apothecary',
        'industry' => 'Beauty & Personal Care',
        'category' => 'Skincare',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Spring Glow Launch',
    ]);
    $product1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Lotion Pump Dispenser',
        'price' => 450.00,
        'description' => 'Hydrating body moisturizer in matte pump bottle.',
    ]);
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Glow Serum Bottle',
        'price' => 680.00,
        'description' => 'Brightening vitamin C elixir in amber glass droplet.',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Verify product context was sent cleanly without rigid spatial directives
            expect($data['input'])->toContain('Lotion Pump Dispenser')
                ->and($data['input'])->toContain('Glow Serum Bottle')
                ->and($data['input'])->toContain('PRODUCTS:')
                ->and($data['input'])->not->toContain('MULTI-PRODUCT DIRECTIVE')
                ->and($data['input'])->not->toContain('NEVER place them in a flat side-by-side row');

            return Http::response([
                'id' => 'resp-manual-test-a',
                'model' => 'gpt-5.6-luna',
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Tiered Travertine Botanicals',
                                    'visual_strategy' => 'Hero serum elevated on stepped stone block with lotion bottle staggered behind in soft window daylight.',
                                    'visual_prompt' => 'A luxury skincare pairing featuring a matte lotion pump and amber serum bottle arranged on stepped travertine pedestals. Diffused morning window light casts soft shadows across textured stone, complemented by delicate olive branches and negative space.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 250],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product1->id, $product2->id],
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Product-First',
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Tiered Travertine Botanicals',
            'visual_strategy' => 'Hero serum elevated on stepped stone block with lotion bottle staggered behind in soft window daylight.',
        ]);

    expect($response->json('visual_prompt'))->toContain('stepped travertine pedestals');
});

test('B & C: Manual Suggest Prompt uses business, industry, campaign, and event context for thematic storytelling without headline leakage', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Bloom',
        'industry' => 'Floristry & Gifts',
        'category' => 'Boutique Florist',
        'description' => 'Curated bespoke botanical gifts.',
        'unique_selling_point' => 'Locally sourced sustainable flowers.',
        'target_audience' => 'Thoughtful gift-givers and educators.',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
        'type' => 'Appreciation Day',
        'description' => 'Honoring educators with gratitude and thoughtful appreciation tokens.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Teachers Gratitude Collection',
        'objective' => 'Celebrate educators with thoughtful gift sets',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Gratitude Botanical Box',
        'price' => 950.00,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            expect($data['input'])->toContain('Artisan Bloom')
                ->and($data['input'])->toContain('Floristry & Gifts')
                ->and($data['input'])->toContain("National Teachers' Day")
                ->and($data['input'])->toContain('Do NOT use the event name as headline copy')
                ->and($data['input'])->toContain('Celebrate educators with thoughtful gift sets');

            // Instructions ensure event is thematic, not headline copy
            expect($data['instructions'])->toContain('NEVER turn the event name into visible headline copy');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Educator Appreciation Sanctuary',
                                    'visual_strategy' => 'Stationery props and ribbon accents framing the botanical box in warm golden library light.',
                                    'visual_prompt' => 'An artisanal wooden gratitude box resting on an antique mahogany study desk. Beside it rests a vintage calligraphy pen, rolled diploma tied with satin ribbon, and warm afternoon sunlight streaming across leather-bound books.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 200],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Educator Appreciation Sanctuary',
        ]);
});

test('D: Render Style is passed as visual treatment constraint while avoiding legacy prompt-expansion systems', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Obsidian Watch']);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            expect($data['input'])->toContain('RENDER STYLE:')
                ->and($data['input'])->toContain('Cinematic Marketing')
                ->and($data['input'])->not->toContain('- Design Treatment:')
                ->and($data['input'])->not->toContain('- Copy Emphasis:')
                ->and($data['input'])->not->toContain('- Visual Theme:')
                ->and($data['input'])->not->toContain('- Brand Tone:');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Midnight Luminescence',
                                    'visual_strategy' => 'Dramatic side rim light on dark reflective surface with cinematic mood.',
                                    'visual_prompt' => 'An obsidian timepiece angled dynamically on a wet slate pedestal under moody violet and cyan rim lights. Deep atmospheric fog fills the background while maintaining a sleek, modern visual aesthetic.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 260],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'design_treatment' => 'Bold Promo',
        'copy_emphasis' => 'Price-First',
        'render_style' => 'Cinematic Marketing',
        'visual_theme' => ['Cyberpunk', 'Neon Glow'],
        'brand_tone' => ['Energetic', 'Edgy'],
        'aspect_ratio' => '9:16',
        'include_prices' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Midnight Luminescence',
        ]);
});

test('K & L: Produces a concise natural-language visual scene prompt without technical prompt syntax or raw price tokens', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'price' => 1250.00]);

    $scenePromptText = 'A premium ceramic vase centered upon a raw travertine plinth, bathed in warm afternoon sun with subtle palm frond shadows dancing across a terracotta wall. Minimalist styling with negative space and earthy organic tranquility.';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'creative_concept' => 'Sun-Drenched Travertine Harmony',
                                'visual_strategy' => 'Natural light casting soft botanical shadows onto warm terracotta backdrop.',
                                'visual_prompt' => $scenePromptText,
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['total_tokens' => 200],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');

    // Verify concise length (approx 60-130 words or reasonable commercial brief length)
    $wordCount = str_word_count($prompt);
    expect($wordCount)->toBeGreaterThanOrEqual(15)
        ->and($wordCount)->toBeLessThanOrEqual(150);

    // Verify no technical parameters or raw prices in the visual scene description
    expect($prompt)->not->toContain('₱1250')
        ->and($prompt)->not->toContain('1250.00')
        ->and($prompt)->not->toContain('--ar')
        ->and($prompt)->not->toContain('safe margins')
        ->and($prompt)->not->toContain('taxonomy');
});

test('M: User-authored seed prompt in user_instruction is authoritative and treated as seed concept', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $userSeedPrompt = 'Create a futuristic black glass environment with a dramatic blue gradient, water reflections, and the products far off-center.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($userSeedPrompt) {
            $data = $request->data();

            expect($data['input'])->toContain('USER CREATIVE DIRECTION (AUTHORITATIVE CONCEPT):')
                ->and($data['input'])->toContain($userSeedPrompt)
                ->and($data['input'])->toContain('Preserve this core visual idea and translate it into a concise visual concept (40–90 words)');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Futuristic Cobalt Reflection',
                                    'visual_strategy' => 'Refining user request for dark mirror glass and off-center product placement with cool caustics.',
                                    'visual_prompt' => 'An asymmetric staging upon polished black obsidian glass with tranquil water ripples reflecting a deep cobalt-to-indigo gradient. The product rests gracefully off-center with razor-sharp cyan edge lighting.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 230],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'user_instruction' => $userSeedPrompt,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Futuristic Cobalt Reflection',
        ]);
});

test('N & O: Anti-repetition utilizes previous_concepts to instruct model to explore a distinctly different visual world', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $priorConcept1 = 'White studio setting with centered product on round marble pedestal under soft daylight.';
    $priorConcept2 = 'Full black luxury backdrop with amber gradient and dramatic rim lighting.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($priorConcept1, $priorConcept2) {
            $data = $request->data();

            expect($data['input'])->toContain('PREVIOUS VISUAL SUGGESTIONS (DO NOT REPEAT):')
                ->and($data['input'])->toContain($priorConcept1)
                ->and($data['input'])->toContain($priorConcept2)
                ->and($data['input'])->toContain('Formulate a distinctly DIFFERENT visual world');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Translucent Glass Sanctuary',
                                    'visual_strategy' => 'Moving away from previous white studio and black backgrounds to a frosted glass architectural pavilion.',
                                    'visual_prompt' => 'An airy translucent glass pavilion overlooking misty morning greenery. The product rests on floating frosted acrylic blocks bathed in cool directional sunrise light with delicate caustics.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 280],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'previous_concepts' => [$priorConcept1, $priorConcept2],
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Translucent Glass Sanctuary',
        ]);
});

test('P, Q, R, S, T: Downstream handoff receives user-edited scene prompt while orchestrating exact prices, multi-products, and copy', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Serenity Spa',
        'industry' => 'Wellness',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Holiday Calm',
    ]);
    $product1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Lavender Mist',
        'price' => 350.00,
    ]);
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Calm Candle',
        'price' => 550.00,
    ]);

    // Simulated user editing the suggested prompt
    $userEditedScenePrompt = 'A serene bamboo garden setting with dual-tier slate platforms, soft lantern glow, and lush green moss.';

    $orchestrator = app(ModularPromptOrchestrator::class);

    $finalPrompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'scene_prompt' => $userEditedScenePrompt,
        'user_prompt' => $userEditedScenePrompt,
        'catalog_products' => [$product1, $product2],
        'design_treatment' => 'Premium',
        'copy_emphasis' => 'Price-First',
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
        'tagline' => 'Find Your Peace Today',
        'price' => 350.00,
        'include_prices' => true,
        'include_business_name' => true,
        'business_name' => 'Serenity Spa',
        'product_name' => 'Lavender Mist',
    ], $business);

    // Verify user-edited scene prompt is preserved in the final production prompt
    expect($finalPrompt)->toContain('A serene bamboo garden setting with dual-tier slate platforms')
        ->and($finalPrompt)->toContain('Lavender Mist')
        ->and($finalPrompt)->toContain('Calm Candle')
        ->and($finalPrompt)->toContain('350')
        ->and($finalPrompt)->toContain('Find Your Peace Today')
        ->and($finalPrompt)->toContain('Serenity Spa');
});

test('U: Existing Automatic behavior is not regressed', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) {
            $data = $request->data();

            // Automatic mode still generates full design dimensions and taxonomy properties
            expect($data['instructions'])->toContain('MarketPilot\'s AI Creative Director')
                ->and($data['instructions'])->toContain('AUTOMATIC CREATIVE DECISION HIERARCHY')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('design_treatment')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('composition_type')
                ->and($data['text']['format']['schema']['properties'])->toHaveKey('lighting_profile');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Automatic Commercial Staging',
                                    'visual_strategy' => 'Symmetrical hero presentation with dynamic contrast.',
                                    'visual_prompt' => 'An automatic high-conversion marketing visual.',
                                    'tagline' => 'Pure Quality Guaranteed',
                                    'design_treatment' => 'Classic',
                                    'copy_emphasis' => 'Balanced',
                                    'typography_layout' => 'centered_stacked',
                                    'copy_layout' => 'centered_stacked',
                                    'product_name_style' => 'clean_sans',
                                    'price_style' => 'pill_badge',
                                    'tagline_style' => 'italic_accent',
                                    'text_depth_mode' => 'flat_overlay',
                                    'composition_type' => 'centered_hero',
                                    'camera_viewpoint' => 'eye_level',
                                    'lighting_profile' => 'soft_diffused',
                                    'scene_family' => 'studio',
                                    'environment_family' => 'clean_seamless_studio',
                                    'prop_profile' => 'minimalist_pedestals',
                                    'render_style' => 'Studio Product Still',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 350],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'automatic',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Automatic Commercial Staging',
            'tagline' => 'Pure Quality Guaranteed',
        ]);
});

test('Section 20: Sequential suggestions with identical inputs explore distinct creative concepts via previous_concepts accumulation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Lumière Skincare',
        'industry' => 'Beauty & Cosmetics',
        'category' => 'Luxury Skincare',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Equinox',
        'description' => 'Celebration of seasonal renewal and natural freshness.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Equinox Radiance',
    ]);
    $product1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Hydrating Essence',
        'price' => 520.00,
    ]);
    $product2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Restorative Night Cream',
        'price' => 780.00,
    ]);

    // 5 distinct creative directions for the exact same products & campaign
    $concepts = [
        [
            'concept' => 'Pastel Dual-Tone Color-Block',
            'prompt' => 'Clean dual-tone pastel lavender and terracotta background split diagonally, products arranged in a centered premium gift presentation on a warm limestone plinth with soft morning window light.',
        ],
        [
            'concept' => 'Full Black Luxury Gradient',
            'prompt' => 'Full black luxury background with a subtle amber-to-violet gradient, products staggered across sculptural stone blocks with dramatic rim lighting and fine mist atmosphere.',
        ],
        [
            'concept' => 'Translucent Glass Architectural Pavilion',
            'prompt' => 'Translucent glass architectural set with water reflections, asymmetric product placement on floating acrylic tiers, and cool directional daylight casting ripples.',
        ],
        [
            'concept' => 'Sunlit Botanical Vanity',
            'prompt' => 'Sunlit botanical vanity scene with raw travertine stone, soft greenery, delicate white petals, and layered product arrangement under dappled sunbeams.',
        ],
        [
            'concept' => 'Minimal Monochrome Cream',
            'prompt' => 'Minimal monochrome cream set with oversized geometric pedestals, strong negative space, and disciplined commercial studio lighting.',
        ],
    ];

    $accumulatedHistory = [];
    $currentIndex = 0;

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($concepts, &$currentIndex, &$accumulatedHistory) {
            $data = $request->data();
            $cData = $concepts[$currentIndex];

            // If previous concepts were passed, verify they appear in the model payload
            if (! empty($accumulatedHistory)) {
                expect($data['input'])->toContain('PREVIOUS VISUAL SUGGESTIONS (DO NOT REPEAT):');
                foreach ($accumulatedHistory as $prev) {
                    expect($data['input'])->toContain($prev);
                }
            }

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => $cData['concept'],
                                    'visual_strategy' => 'Distinct visual direction contrasting with previous suggestions.',
                                    'visual_prompt' => $cData['prompt'],
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 240],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    foreach ($concepts as $step => $cData) {
        $currentIndex = $step;

        $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
            'generation_mode' => 'manual',
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product1->id, $product2->id],
            'previous_concepts' => $accumulatedHistory,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'creative_concept' => $cData['concept'],
            ]);

        expect($response->json('visual_prompt'))->toBe($cData['prompt']);

        // Accumulate prompt for next iteration
        $accumulatedHistory[] = $cData['prompt'];
    }

    expect(count($accumulatedHistory))->toBe(5);
});

test('Suggest Visual Prompt generates concise creative visual concept for Kapekol 10.10 coffee campaign without over-designed poster elements', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kapekol',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee & Café',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
        'description' => 'Annual mega shopping festival with special coffee treats and seasonal brews.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 180.00,
        'description' => 'Traditional frothed chicory-blended filter coffee in brass tumbler and dabarah.',
    ]);

    $userCreativeDirection = 'Create a bold, premium 10.10 coffee campaign with a warm, modern café atmosphere and subtle festive energy.';

    $conciseVisualPrompt = 'A steaming brass tumbler of South Indian Kaapi rests upon a warm, matte walnut café surface bathed in rich amber morning light. Subtle warm festive bokeh and deep espresso tones introduce a celebratory spirit, styled with clean graphic minimalism, elegant negative space, and refined modern café tranquility.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($userCreativeDirection, $conciseVisualPrompt) {
            $data = $request->data();

            // Verify concise assistant instructions
            expect($data['instructions'])->toContain('You are a visual concept assistant for a marketing image generator.')
                ->and($data['instructions'])->toContain('Do not write headlines, slogans, product claims, feature copy, prices, product names, event text, typography instructions')
                ->and($data['instructions'])->toContain('Do not invent marketing claims or promotional elements')
                ->and($data['instructions'])->toContain('approximately 40');

            // Verify clean contextual payload
            expect($data['input'])->toContain('Kapekol')
                ->and($data['input'])->toContain('South Indian Kaapi')
                ->and($data['input'])->toContain('10.10 Perfect 10 Shopping Festival')
                ->and($data['input'])->toContain('Minimalist Graphic')
                ->and($data['input'])->toContain($userCreativeDirection)
                ->and($data['input'])->not->toContain('- Design Treatment:')
                ->and($data['input'])->not->toContain('- Copy Emphasis:')
                ->and($data['input'])->not->toContain('MULTI-PRODUCT DIRECTIVE')
                ->and($data['input'])->not->toContain('gift boxes')
                ->and($data['input'])->not->toContain('shopping bags');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Warm Festive Café Atmosphere',
                                    'visual_strategy' => 'Steaming brass coffee tumbler on matte walnut counter with subtle celebratory warm bokeh.',
                                    'visual_prompt' => $conciseVisualPrompt,
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 210],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'user_instruction' => $userCreativeDirection,
        'render_style' => 'Minimalist Graphic',
        'copy_emphasis' => 'Balanced',
        'aspect_ratio' => '1:1',
        'tagline' => 'Make Your 10.10 Perfectly Brewed',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'creative_concept' => 'Warm Festive Café Atmosphere',
        ]);

    $suggestedPrompt = $response->json('visual_prompt');

    // 1. Output size target: approximately 40-90 words
    $wordCount = str_word_count($suggestedPrompt);
    expect($wordCount)->toBeGreaterThanOrEqual(35)
        ->and($wordCount)->toBeLessThanOrEqual(95);

    // 2. Contains no invented poster elements, badges, claims, or shopping bags
    expect($suggestedPrompt)->not->toContain('shopping bag')
        ->and($suggestedPrompt)->not->toContain('gift box')
        ->and($suggestedPrompt)->not->toContain('badge')
        ->and($suggestedPrompt)->not->toContain('10.10 PERFECT 10 SHOPPING FESTIVAL')
        ->and($suggestedPrompt)->not->toContain('split background')
        ->and($suggestedPrompt)->not->toContain('metallic discs');

    // 3. Verify downstream orchestration leaves it concise and does not re-expand it
    $orchestrator = app(ModularPromptOrchestrator::class);
    $finalPrompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'scene_prompt' => $suggestedPrompt,
        'user_prompt' => $suggestedPrompt,
        'catalog_products' => [$product],
        'render_style' => 'Minimalist Graphic',
        'copy_emphasis' => 'Balanced',
        'aspect_ratio' => '1:1',
        'tagline' => 'Make Your 10.10 Perfectly Brewed',
        'show_event_text' => false,
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'include_prices' => true,
        'include_business_name' => true,
        'business_name' => 'Kapekol',
    ], $business);

    expect($finalPrompt)->toContain($suggestedPrompt)
        ->and($finalPrompt)->toContain('Kapekol')
        ->and($finalPrompt)->toContain('South Indian Kaapi')
        ->and($finalPrompt)->toContain('₱180')
        ->and($finalPrompt)->not->toContain('safe margins')
        ->and($finalPrompt)->not->toContain('MULTI-PRODUCT COMPOSITION');
});

test('1-8: Suggest Visual Prompt connects Campaign, Event, Product Name, and actual Product Image without inventing unsupported details', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kapekol',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee & Café',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
        'description' => 'Festive coffee promotion celebrating 10.10.',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 180.00,
        'description' => 'Chicory-infused filter coffee.',
        'image_path' => 'products/south_indian_kaapi.jpg',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('products/south_indian_kaapi.jpg', 'fake-product-image-binary-bytes');

    $analyzer = Mockery::mock(ReferenceImageAnalyzer::class);
    $analyzer->shouldReceive('analyze')
        ->with('products/south_indian_kaapi.jpg')
        ->once()
        ->andReturn([
            'product_identity' => 'Traditional brass tumbler and dabarah saucer with rich foaming coffee',
            'product_physical_details' => 'Handcrafted cylindrical brass cup inside wide dabarah bowl with thick frothy crema',
            'is_product_photo' => true,
        ]);
    $this->app->instance(ReferenceImageAnalyzer::class, $analyzer);

    $userCreativeDirection = 'Create a bold, premium 10.10 coffee campaign with a warm, modern café atmosphere and subtle festive energy.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($userCreativeDirection) {
            $data = $request->data();

            // 1. Campaign influences visual suggestion
            expect($data['input'])->toContain('CAMPAIGN:')
                ->and($data['input'])->toContain('10.10 Perfect 10 Shopping Festival');

            // 2. Event influences visual suggestion
            expect($data['input'])->toContain('EVENT / OCCASION:')
                ->and($data['input'])->toContain('10.10 Perfect 10 Shopping Festival');

            // 3. Product name influences visual suggestion
            expect($data['input'])->toContain('South Indian Kaapi');

            // 4. Actual product image is supplied to suggestion-analysis step
            expect($data['input'])->toContain('products/south_indian_kaapi.jpg')
                ->and($data['input'])->toContain('Traditional brass tumbler and dabarah saucer with rich foaming coffee');

            // 5. Suggestion does not invent unsupported physical product details
            expect($data['input'])->toContain('Do NOT invent containers, cups, bottles, packaging, steam, ingredients, materials, shapes, props, or accessories');

            // 6. User creative direction remains represented
            expect($data['input'])->toContain('USER CREATIVE DIRECTION (AUTHORITATIVE CONCEPT):')
                ->and($data['input'])->toContain($userCreativeDirection);

            // 8. No composition/typography/camera instructions are generated
            expect($data['instructions'])->toContain('Do NOT generate exact layout instructions, text zones, pricing zones, headline areas, negative-space instructions, left/right/top/bottom coordinates, exact product positioning, split backgrounds, camera angles, lenses, apertures, photography recipes, or typography systems');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Festive Brass Kaapi Sanctuary',
                                    'visual_strategy' => 'Traditional brass tumbler staged on rich walnut surface bathed in amber morning sunlight.',
                                    'visual_prompt' => 'The traditional brass tumbler of South Indian Kaapi rests upon a warm walnut counter bathed in amber morning sunlight. Soft festive bokeh and deep espresso tones introduce celebratory warmth, styled with clean graphic minimalism and refined modern café tranquility.',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['total_tokens' => 200],
            ], 200);
        },
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'user_instruction' => $userCreativeDirection,
        'render_style' => 'Minimalist Graphic',
        'copy_emphasis' => 'Balanced',
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    $suggestedPrompt = $response->json('visual_prompt');

    // 7. Suggestion remains approximately 40–90 words
    $wordCount = str_word_count($suggestedPrompt);
    expect($wordCount)->toBeGreaterThanOrEqual(35)
        ->and($wordCount)->toBeLessThanOrEqual(95);

    // Verify it doesn't contain composition/typography recipes or badges
    expect($suggestedPrompt)->not->toContain('safe margin')
        ->and($suggestedPrompt)->not->toContain('camera angle')
        ->and($suggestedPrompt)->not->toContain('split background')
        ->and($suggestedPrompt)->not->toContain('badge');
});

test('9-14: Final Manual prompt contains Campaign, Event, Event visibility, exact products, and sends product binary to /v1/images/edits', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kapekol',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee & Café',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 180.00,
        'image_path' => 'products/south_indian_kaapi.jpg',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('products/south_indian_kaapi.jpg', 'authoritative-product-image-binary-12345');

    $orchestrator = app(ModularPromptOrchestrator::class);

    $finalPrompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'show_event_text' => false,
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'scene_prompt' => 'A steaming brass tumbler of South Indian Kaapi on walnut surface.',
        'render_style' => 'Minimalist Graphic',
        'copy_emphasis' => 'Balanced',
        'tagline' => 'Make Your 10.10 Perfectly Brewed',
        'aspect_ratio' => '1:1',
    ], $business, [$product]);

    // 9. Final Manual prompt contains Campaign
    expect($finalPrompt)->toContain('Campaign: 10.10 Perfect 10 Shopping Festival');

    // 10. Final Manual prompt contains Event
    expect($finalPrompt)->toContain('Event: 10.10 Perfect 10 Shopping Festival');

    // 11. Final Manual prompt contains Event visibility
    expect($finalPrompt)->toContain('Event visibility: Hidden');

    // 12. Exact product name/price remains unchanged
    expect($finalPrompt)->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi — ₱180.00');

    // 14. No legacy prompt sections return
    expect($finalPrompt)->not->toContain('VISUAL THEME:')
        ->and($finalPrompt)->not->toContain('BRAND TONE:')
        ->and($finalPrompt)->not->toContain('CAMERA VIEWPOINT:')
        ->and($finalPrompt)->not->toContain('LIGHTING PROFILE:')
        ->and($finalPrompt)->not->toContain('Safe Margin')
        ->and($finalPrompt)->not->toContain('MULTI-PRODUCT COMPOSITION');

    // 13. Actual product binary is still sent to /v1/images/edits
    $capturedRequest = null;
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function ($request) use (&$capturedRequest) {
            $capturedRequest = $request;

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('generated-image-result')],
                ],
            ], 200);
        },
    ]);

    $imageService = app(OpenAIImageService::class);
    $result = $imageService->generate($finalPrompt, [
        'generation_mode' => 'manual',
        'reference_image_paths' => ['products/south_indian_kaapi.jpg'],
        'aspect_ratio' => '1:1',
    ]);

    expect($capturedRequest)->not->toBeNull();
    expect($capturedRequest->isMultipart())->toBeTrue();
    // Verify the actual product image binary was attached
    $body = (string) $capturedRequest->body();
    expect($body)->toContain('authoritative-product-image-binary-12345');
});
