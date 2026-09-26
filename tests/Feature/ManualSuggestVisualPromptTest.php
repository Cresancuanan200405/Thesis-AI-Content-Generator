<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
    Config::set('services.openai.api_key', 'sk-test-key-mock-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.budget_limit', 20.00);
});

test('A & J: Manual Suggest Prompt uses product context including multi-product spatial arrangement directive', function () {
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

            // Verify product context was sent
            expect($data['input'])->toContain('Lotion Pump Dispenser')
                ->and($data['input'])->toContain('Glow Serum Bottle')
                ->and($data['input'])->toContain('Total Product Count: 2')
                ->and($data['input'])->toContain('MULTI-PRODUCT DIRECTIVE')
                ->and($data['input'])->toContain('NEVER place them in a flat side-by-side row');

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

test('D, E, F, G, H, I: Creative controls (Design Treatment, Copy Emphasis, Render Style, Themes, Tones, Aspect Ratio) are accurately passed into context', function () {
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

            expect($data['input'])->toContain('- Design Treatment: Bold Promo')
                ->and($data['input'])->toContain('- Copy Emphasis: Price-First')
                ->and($data['input'])->toContain('- Render Style: Cinematic Marketing')
                ->and($data['input'])->toContain('- Visual Theme: Cyberpunk, Neon Glow')
                ->and($data['input'])->toContain('- Brand Tone: Energetic, Edgy')
                ->and($data['input'])->toContain('- Aspect Ratio: 9:16');

            // Copy emphasis negative space guidance
            expect($data['input'])->toContain('Price Display: Enabled (reserve clear negative space for price element)')
                ->and($data['instructions'])->toContain('PRICE-FIRST');

            return Http::response([
                'output' => [
                    [
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'creative_concept' => 'Midnight Luminescence',
                                    'visual_strategy' => 'Dramatic side rim light on dark reflective surface with open foreground for price placement.',
                                    'visual_prompt' => 'An obsidian timepiece angled dynamically on a wet slate pedestal under moody violet and cyan rim lights. Deep atmospheric fog fills the background while the lower third remains uncluttered with dark reflective water.',
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

test('M: User-authored seed prompt in user_instruction is authoritative and treated as seed to refine', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $userSeedPrompt = 'Create a futuristic black glass environment with a dramatic blue gradient, water reflections, and the products far off-center.';

    Http::fake([
        'https://api.openai.com/v1/responses' => function ($request) use ($userSeedPrompt) {
            $data = $request->data();

            expect($data['input'])->toContain('USER EXPLICIT SCENE DIRECTION (AUTHORITATIVE SEED):')
                ->and($data['input'])->toContain($userSeedPrompt)
                ->and($data['input'])->toContain('Refine, enhance, and creatively expand this exact artistic direction');

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
