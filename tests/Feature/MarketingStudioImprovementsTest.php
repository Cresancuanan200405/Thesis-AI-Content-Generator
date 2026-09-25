<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ImageCompositorService;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use App\Services\OpenAIImageService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    config()->set('services.openai.api_key', 'test-key');
    Storage::fake('public');
});

test('MarketingDesignSystem taxonomies, validators, and deterministic shuffle work as expected', function () {
    $system = app(MarketingDesignSystem::class);

    // Taxonomies
    expect($system->designTreatments())->toContain('Classic', 'Editorial', 'Bold Promo', 'Minimal', 'Premium')
        ->and($system->copyEmphases())->toContain('Product-first', 'Tagline-first', 'Price-first', 'Balanced')
        ->and($system->compositionTypes())->toContain('centered hero', 'asymmetric negative-space layout')
        ->and($system->cameraViewpoints())->toContain('front/eye-level', 'three-quarter')
        ->and($system->lightingProfiles())->toContain('soft diffused', 'premium studio');

    // Validators
    expect($system->validateDesignTreatment('editorial'))->toBe('Editorial')
        ->and($system->validateDesignTreatment('invalid'))->toBe('Auto')
        ->and($system->validateCopyEmphasis('tagline-first'))->toBe('Tagline-first')
        ->and($system->validateCopyEmphasis('unknown'))->toBe('Balanced')
        ->and($system->validateAspectRatio('16:9'))->toBe('16:9')
        ->and($system->validateAspectRatio('invalid'))->toBe('1:1');

    // Deterministic shuffle
    $shuffled = $system->shufflePresets();
    expect($shuffled)->toHaveKeys([
        'render_style',
        'design_treatment',
        'copy_emphasis',
        'composition_type',
        'camera_viewpoint',
        'lighting_profile',
        'aspect_ratio',
        'brand_tone',
        'visual_theme',
    ]);
    expect($shuffled['brand_tone'])->toBeArray()->and(count($shuffled['brand_tone']))->toBeLessThanOrEqual(3);
    expect($shuffled['visual_theme'])->toBeArray()->and(count($shuffled['visual_theme']))->toBeLessThanOrEqual(3);

    // Fingerprint
    $fp = $system->buildFingerprint([
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Balanced',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'premium studio',
    ]);
    expect($fp)->toBeArray()
        ->and($fp['design_treatment'])->toBe('Editorial')
        ->and($fp['copy_emphasis'])->toBe('Balanced')
        ->and($fp['composition_type'])->toBe('centered hero')
        ->and($fp['camera_viewpoint'])->toBe('front/eye-level')
        ->and($fp['lighting_profile'])->toBe('premium studio');
});

test('ModularPromptOrchestrator injects Priority 9b and Priority 9c design system directives', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Artisan Handcrafted Ceramic Mug',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Product-first',
        'typography_layout' => 'Sophisticated Upper Third Overlay',
        'composition_type' => 'Rule of Thirds Offset',
        'camera_viewpoint' => 'Hero Low-Angle Dramatic Staging',
        'lighting_profile' => 'High-End Studio Softbox With Diffused Shadows',
        'generation_mode' => 'automatic',
    ]);

    expect($prompt)
        ->toContain('MARKETING DESIGN TREATMENT & TYPOGRAPHY LAYOUT')
        ->toContain('Design Treatment: Editorial')
        ->toContain('Copy Emphasis: Product-first')
        ->toContain('Typography Layout: Sophisticated Upper Third Overlay')
        ->toContain('CAMERA, LIGHTING & SCENE GEOMETRY')
        ->toContain('Composition Geometry: Rule of Thirds Offset')
        ->toContain('Camera Perspective: Hero Low-Angle Dramatic Staging')
        ->toContain('Lighting Profile: High-End Studio Softbox With Diffused Shadows');
});

test('AutomaticGeneratorController executes AI Creative Director, captures structured design decisions and stores creative fingerprint', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kape Isla Roastery',
        'industry' => 'Coffee & Beverages',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Single Origin Robusta',
        'price' => 320.00,
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Harvest Season 2026',
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Awaken Your Senses With Pure Philippine Brew.',
                                'visual_prompt' => 'A steaming ceramic cup of Single Origin Robusta sits on reclaimed wood.',
                                'creative_concept' => 'Highland Harvest Warmth',
                                'visual_strategy' => 'Rich earthy textures paired with dramatic natural morning light.',
                                'design_treatment' => 'Editorial',
                                'copy_emphasis' => 'Tagline-first',
                                'typography_layout' => 'editorial',
                                'composition_type' => 'centered hero',
                                'camera_viewpoint' => 'eye-level commercial',
                                'lighting_profile' => 'high-end studio softbox',
                                'render_style' => 'Cinematic Marketing',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => [
                'input_tokens' => 200,
                'output_tokens' => 100,
                'total_tokens' => 300,
            ],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [
                [
                    'b64_json' => base64_encode('fake-image-bytes-auto'),
                ],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'include_tagline' => true,
        'include_prices' => true,
        'aspect_ratio' => '1:1',
        'image_model' => 'gpt-image-2',
        'image_quality' => 'medium',
        'include_business_name' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'design_treatment' => 'Editorial',
            'copy_emphasis' => 'Tagline-first',
            'tagline' => 'Awaken Your Senses With Pure Philippine Brew.',
        ]);

    $preview = $response->json('preview');
    expect($preview['generation_meta'])
        ->toHaveKey('design_treatment', 'Editorial')
        ->toHaveKey('copy_emphasis', 'Tagline-first')
        ->toHaveKey('creative_fingerprint');
});

test('ManualGeneratorController obeys Tagline Rule A (OFF -> tagline excluded)', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Canvas Backpack', 'price' => 850]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-bytes')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => 'Canvas Backpack',
        'prompt' => 'Backpack resting on mountain trail rocks with golden sunset lighting.',
        'include_tagline' => '0',
        'tagline' => 'Some ignored tagline',
        'include_prices' => '1',
        'aspect_ratio' => '1:1',
        'image_model' => 'gpt-image-2',
        'image_quality' => 'medium',
        'design_treatment' => 'Minimal',
        'copy_emphasis' => 'Product-first',
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $preview = $response->json('preview');
    expect($preview['tagline'])->toBeNull()
        ->and($preview['generation_meta']['design_treatment'])->toBe('Minimal')
        ->and($preview['generation_meta']['copy_emphasis'])->toBe('Product-first');
});

test('ManualGeneratorController obeys Tagline Rule B (ON + user input -> preserved verbatim)', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Handmade Leather Belt', 'price' => 599]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-bytes')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => 'Handmade Leather Belt',
        'prompt' => 'Leather belt neatly rolled next to raw saddle leather textures.',
        'include_tagline' => '1',
        'tagline' => 'Crafted For Generations',
        'include_prices' => '1',
        'aspect_ratio' => '1:1',
        'image_model' => 'gpt-image-2',
        'image_quality' => 'medium',
        'design_treatment' => 'Premium',
        'copy_emphasis' => 'Tagline-first',
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $preview = $response->json('preview');
    expect($preview['tagline'])->toBe('Crafted For Generations')
        ->and($preview['generation_meta']['design_treatment'])->toBe('Premium');
});

test('ManualGeneratorController obeys Tagline Rule C (ON + empty -> calls generateTagline via gpt-5.6-luna)', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Ube Chiffon Cake', 'price' => 450]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Pure Purple Decadence In Every Bite',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => [
                'input_tokens' => 150,
                'output_tokens' => 20,
                'total_tokens' => 170,
            ],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-bytes')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->post('/generator/manual', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => 'Ube Chiffon Cake',
        'prompt' => 'A slice of vibrant purple ube cake on a minimalist pastel plate.',
        'include_tagline' => '1',
        'tagline' => '', // Empty!
        'include_prices' => '1',
        'aspect_ratio' => '1:1',
        'image_model' => 'gpt-image-2',
        'image_quality' => 'medium',
        'design_treatment' => 'Bold Promo',
        'copy_emphasis' => 'Balanced',
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $preview = $response->json('preview');
    expect($preview['tagline'])->toBe('Pure Purple Decadence In Every Bite');

    Http::assertSent(function (Request $request) {
        return str_contains($request->url(), 'responses')
            && $request['model'] === 'gpt-5.6-luna';
    });
});

test('DesignRegenerationService preserves design_treatment, copy_emphasis, and creative_fingerprint', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Premium Olive Oil', 'price' => 990]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'product_name' => 'Premium Olive Oil',
        'tagline' => 'From Mediterranean Groves to Your Table.',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'design_treatment' => 'Classic',
            'copy_emphasis' => 'Price-first',
            'include_tagline' => true,
            'creative_fingerprint' => 'Classic|Price-first|Centered Hero|Eye-level Commercial|High-End Studio Softbox',
            'catalog_product_ids' => [$product->id],
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('regenerated-image-bytes')]],
        ], 200),
    ]);

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($design);

    expect($regenerated)->toBeInstanceOf(Design::class)
        ->and($regenerated->generation_metadata['design_treatment'])->toBe('Classic')
        ->and($regenerated->generation_metadata['copy_emphasis'])->toBe('Price-first')
        ->and($regenerated->generation_metadata['creative_fingerprint'])->toBe('Classic|Price-first|Centered Hero|Eye-level Commercial|High-End Studio Softbox');
});

test('ImageCompositorService deterministically composites authoritative marketing copy onto images', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Artisan Craft Roasters']);

    $compositor = app(ImageCompositorService::class);

    // 1. Test manifest and layer toggles
    $manifestFull = $compositor->generateCompositingManifest([
        'product_name' => 'Signature Cold Brew',
        'price' => 180,
        'tagline' => 'Steeped for 24 Hours.',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Product-first',
    ], $business);

    expect($manifestFull['exact_content']['product_name'])->toBe('Signature Cold Brew')
        ->and($manifestFull['exact_content']['brand_name'])->toBe('Artisan Craft Roasters')
        ->and($manifestFull['exact_content']['tagline'])->toBe('Steeped for 24 Hours') // Normalized trailing period stripped
        ->and($manifestFull['exact_content']['price'])->toBe('₱180.00')
        ->and($manifestFull['safe_margins']['margin_percent'])->toBe(20)
        ->and($manifestFull['safe_margins']['top'])->toBe(205)
        ->and($manifestFull['safe_margins']['left'])->toBe(205);

    // 2. Test toggles off: disabled layers omitted
    $manifestOmitted = $compositor->generateCompositingManifest([
        'product_name' => 'Signature Cold Brew',
        'price' => 180,
        'tagline' => 'Steeped for 24 Hours.',
        'include_tagline' => false,
        'include_prices' => false,
        'include_business_name' => false,
        'aspect_ratio' => '16:9',
    ], $business);

    expect($manifestOmitted['exact_content']['tagline'])->toBeNull()
        ->and($manifestOmitted['exact_content']['price'])->toBeNull()
        ->and($manifestOmitted['exact_content']['brand_name'])->toBeNull()
        ->and($manifestOmitted['canvas']['aspect_ratio'])->toBe('16:9')
        ->and($manifestOmitted['canvas']['width'])->toBe(1792)
        ->and($manifestOmitted['canvas']['height'])->toBe(1024);

    // 3. Test compositing execution on an SVG image (testing environment standard)
    $svgPath = 'designs/test_mockup_'.Str::uuid().'.svg';
    Storage::disk('public')->put($svgPath, '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#000"/></svg>');

    $compositedPath = $compositor->composite($svgPath, [
        'product_name' => 'Signature Cold Brew',
        'price' => 180,
        'tagline' => 'Steeped for 24 Hours.',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
    ], $business);

    expect($compositedPath)->toBe($svgPath);
    $svgContent = Storage::disk('public')->get($svgPath);
    expect($svgContent)->toContain('Signature Cold Brew')
        ->toContain('Steeped for 24 Hours')
        ->toContain('₱180.00')
        ->toContain('Artisan Craft Roasters');

    $lastResult = $compositor->getLastCompositingResult();
    expect($lastResult)->not->toBeNull()
        ->and($lastResult['raster_modified'])->toBeTrue()
        ->and($lastResult['visible_layers'])->toContain('product_name', 'business_name', 'tagline', 'price');
});

test('MarketingDesignSystem supports expanded scene, environment, and prop diversity dimensions', function () {
    $system = app(MarketingDesignSystem::class);

    expect($system->sceneFamilies())->toContain('tabletop still life', 'in-use lifestyle action', 'environmental workspace')
        ->and($system->environmentFamilies())->toContain('warm artisanal cafe', 'sleek modern studio', 'sunlit contemporary kitchen')
        ->and($system->propProfiles())->toContain('raw organic ingredients & botanicals', 'refined ceramics & linen textures');

    $fp = $system->buildFingerprint([
        'creative_concept' => 'Artisanal Roastery Morning Pour',
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
        'design_treatment' => 'Classic',
        'copy_emphasis' => 'Balanced',
    ]);

    expect($fp['scene_family'])->toBe('tabletop still life')
        ->and($fp['environment_family'])->toBe('warm artisanal cafe')
        ->and($fp['prop_profile'])->toBe('refined ceramics & linen textures')
        ->and($fp['composition_type'])->toBe('centered hero')
        ->and($fp['lighting_profile'])->toBe('warm morning');

    // Anti-repetition guidance formatting
    $guidance = $system->formatAntiRepetitionGuidance([$fp]);
    expect($guidance)->toContain('DIVERSITY MANDATE')
        ->toContain('tabletop still life')
        ->toContain('warm artisanal cafe')
        ->toContain('refined ceramics & linen textures');
});

test('Manual deterministic shuffle obeys single-select and multi-select bounds without network calls', function () {
    $system = app(MarketingDesignSystem::class);

    $shuffled = $system->shufflePresets();

    // Single-select: exactly 1
    expect($shuffled['render_style'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['design_treatment'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['copy_emphasis'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['aspect_ratio'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['composition_type'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['camera_viewpoint'])->toBeString()->not->toBeEmpty()
        ->and($shuffled['lighting_profile'])->toBeString()->not->toBeEmpty();

    // Multi-select: max 3 distinct compatible items
    expect($shuffled['brand_tone'])->toBeArray()
        ->and(count($shuffled['brand_tone']))->toBeLessThanOrEqual(3)
        ->and(count($shuffled['brand_tone']))->toBe(count(array_unique($shuffled['brand_tone'])));

    expect($shuffled['visual_theme'])->toBeArray()
        ->and(count($shuffled['visual_theme']))->toBeLessThanOrEqual(3)
        ->and(count($shuffled['visual_theme']))->toBe(count(array_unique($shuffled['visual_theme'])));

    // Excludes recent combinations when alternatives exist
    $recent = [
        [
            'design_treatment' => 'Classic',
            'render_style' => 'Studio Product Still',
            'composition_type' => 'centered hero',
        ],
    ];

    $shuffledWithRecent = $system->shufflePresets([], $recent);
    expect($shuffledWithRecent['design_treatment'])->not->toBe('Classic');
});

test('MarketingDesignSystem evaluates six-part primary visual core similarity across tiers', function () {
    $system = app(MarketingDesignSystem::class);

    $base = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];

    // 1. Exact match (6/6) -> prohibited
    $exactDuplicate = $base;
    $eval6 = $system->evaluateVisualCoreDiversity($exactDuplicate, [$base]);
    expect($eval6['max_match_count'])->toBe(6)
        ->and($eval6['classification'])->toBe('prohibited')
        ->and($eval6['is_allowed'])->toBeFalse()
        ->and(count($eval6['matching_keys']))->toBe(6);

    // 2. Near duplicate (5/6) -> prohibited (regenerate)
    $nearDuplicate = array_merge($base, ['lighting_profile' => 'golden hour']);
    $eval5 = $system->evaluateVisualCoreDiversity($nearDuplicate, [$base]);
    expect($eval5['max_match_count'])->toBe(5)
        ->and($eval5['classification'])->toBe('prohibited')
        ->and($eval5['is_allowed'])->toBeFalse()
        ->and(count($eval5['matching_keys']))->toBe(5);

    // 3. Substantial overlap (4/6) -> discouraged
    $substantialOverlap = array_merge($base, [
        'lighting_profile' => 'golden hour',
        'prop_profile' => 'minimal geometry & brass accents',
    ]);
    $eval4 = $system->evaluateVisualCoreDiversity($substantialOverlap, [$base]);
    expect($eval4['max_match_count'])->toBe(4)
        ->and($eval4['classification'])->toBe('discouraged')
        ->and($eval4['is_allowed'])->toBeTrue()
        ->and(count($eval4['matching_keys']))->toBe(4);

    // 4. Distinct combination (0–3/6) -> acceptable
    $distinctCombination = array_merge($base, [
        'scene_family' => 'outdoor natural setting',
        'environment_family' => 'botanical garden / natural patio',
        'composition_type' => 'diagonal editorial',
        'lighting_profile' => 'golden hour',
    ]);
    $eval2 = $system->evaluateVisualCoreDiversity($distinctCombination, [$base]);
    expect($eval2['max_match_count'])->toBe(2)
        ->and($eval2['classification'])->toBe('acceptable')
        ->and($eval2['is_allowed'])->toBeTrue();

    // 5. Automatic diverse candidate derivation
    $derived = $system->deriveDiverseVisualCore($nearDuplicate, [$base]);
    $evalDerived = $system->evaluateVisualCoreDiversity($derived, [$base]);
    expect($evalDerived['is_allowed'])->toBeTrue()
        ->and($evalDerived['max_match_count'])->toBeLessThanOrEqual(4);
});

test('ModularPromptOrchestrator injects negative authoritative copy directive when deterministic compositing is active', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptWithCompositor = $orchestrator->orchestrate([
        'product_name' => 'Cold Brew Nitro',
        'business_name' => 'CoffeYessir',
        'tagline' => 'Velvety smooth finish',
        'price' => '₱160',
        'deterministic_compositing' => true,
    ]);

    expect($promptWithCompositor)
        ->toContain('• AUTHORITATIVE COPY RENDERING:')
        ->toContain('The application will add all final marketing text after image generation.')
        ->toContain('Do NOT render, invent, paraphrase, duplicate, or approximate:')
        ->toContain('- Product Name')
        ->toContain('- Business Name')
        ->toContain('- Tagline')
        ->toContain('- Price')
        ->toContain('- Campaign Name')
        ->toContain('Leave intentional clean negative space for the application-owned text overlay.');

    // When deterministic compositing is not passed, directive is absent
    $promptWithoutCompositor = $orchestrator->orchestrate([
        'product_name' => 'Cold Brew Nitro',
        'business_name' => 'CoffeYessir',
        'tagline' => 'Velvety smooth finish',
        'price' => '₱160',
        'deterministic_compositing' => false,
    ]);

    expect($promptWithoutCompositor)->not->toContain('• AUTHORITATIVE COPY RENDERING:');
});

test('OpenAIImageService records enriched compositor and visual generation metadata', function () {
    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'created' => time(),
            'data' => [
                ['b64_json' => base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#000"/></svg>')],
            ],
        ], 200),
    ]);

    $service = app(OpenAIImageService::class);

    $service->generate('A professional commercial image', [
        'product_name' => 'Espresso Roast',
        'business_name' => 'Coffee Lab',
        'tagline' => 'Pure Energy',
        'price' => '₱120',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    $meta = $service->getLastGenerationMetadata();

    expect($meta)->toHaveKeys([
        'ai_visual_generation',
        'deterministic_text_compositing',
        'compositor_engine',
        'authoritative_text_layers',
        'text_layers_rendered',
        'fallback_state',
    ]);

    expect($meta['ai_visual_generation']['success'])->toBeTrue()
        ->and($meta['deterministic_text_compositing'])->toBeTrue()
        ->and($meta['authoritative_text_layers']['product_name'])->toBe('Espresso Roast')
        ->and($meta['authoritative_text_layers']['brand_name'])->toBe('Coffee Lab')
        ->and($meta['authoritative_text_layers']['tagline'])->toBe('Pure Energy')
        ->and($meta['authoritative_text_layers']['price'])->toBe('₱120')
        ->and($meta['text_layers_rendered'])->toContain('product_name', 'business_name', 'tagline', 'price')
        ->and($meta['fallback_state'])->toBe('none');
});

test('AutomaticGeneratorController enforces diversity by regenerating prohibited candidates with bounded retries', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'RoastHouse']);
    $campaign = Campaign::factory()->create(['business_id' => $business->id, 'user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Signature Mocha', 'price' => 150]);

    // Create prior design with known visual core
    Design::factory()->create([
        'business_id' => $business->id,
        'user_id' => $user->id,
        'campaign_id' => $campaign->id,
        'generation_metadata' => [
            'scene_family' => 'tabletop still life',
            'environment_family' => 'warm artisanal cafe',
            'composition_type' => 'centered hero',
            'camera_viewpoint' => 'front/eye-level',
            'lighting_profile' => 'warm morning',
            'prop_profile' => 'refined ceramics & linen textures',
        ],
    ]);

    // Mock Creative Director proposing a prohibited 6/6 duplicate candidate
    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Warm coffee comfort',
                                'creative_concept' => 'Artisanal tabletop morning',
                                'visual_strategy' => 'Morning warm cafe table',
                                'visual_prompt' => 'A cup of mocha on an artisanal cafe table',
                                'design_treatment' => 'Classic',
                                'copy_emphasis' => 'Balanced',
                                'typography_layout' => 'classic hierarchy',
                                'composition_type' => 'centered hero',
                                'camera_viewpoint' => 'front/eye-level',
                                'lighting_profile' => 'warm morning',
                                'scene_family' => 'tabletop still life',
                                'environment_family' => 'warm artisanal cafe',
                                'prop_profile' => 'refined ceramics & linen textures',
                                'render_style' => 'Studio Product Still',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['input_tokens' => 100, 'output_tokens' => 50, 'total_tokens' => 150],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'created' => time(),
            'data' => [
                ['b64_json' => base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#000"/></svg>')],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    $data = $response->json();

    $diversityMeta = $data['generation_meta']['visual_core_diversity'] ?? [];
    expect($diversityMeta)->toHaveKeys([
        'attempted_candidates',
        'rejected_candidates',
        'final_accepted_candidate',
        'similarity_metrics',
        'diversity_result',
        'retry_count',
        'retry_limit',
        'final_coherence_state',
    ]);

    // Bounded retries executed to resolve prohibited proposal
    expect($diversityMeta['retry_count'])->toBeGreaterThan(0)
        ->and(count($diversityMeta['attempted_candidates']))->toBeGreaterThan(1)
        ->and(count($diversityMeta['rejected_candidates']))->toBeGreaterThan(0)
        ->and($diversityMeta['final_coherence_state'])->toBe('derived_coherent')
        ->and($diversityMeta['diversity_result']['is_allowed'])->toBeTrue();

    // Verify derived visual core rebuilt coherent creative concept and visual strategy
    $acceptedCore = $diversityMeta['final_accepted_candidate'];
    expect($data['preview']['creative_concept'])->toContain($acceptedCore['scene_family'])
        ->and($data['preview']['visual_strategy'])->toContain($acceptedCore['environment_family'])
        ->and($data['preview']['prompt'])->toContain($acceptedCore['scene_family']);
});

test('MarketingDesignSystem deriveDiverseVisualCore strictly enforces context compatibility and coherence flow', function () {
    $system = app(MarketingDesignSystem::class);

    $baseCandidate = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];

    // Context for Food & Beverage with 9:16 aspect ratio
    $context = [
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'product' => 'Iced Vanilla Latte',
        'aspect_ratio' => '9:16',
    ];

    $derived = $system->deriveDiverseVisualCore($baseCandidate, [$baseCandidate], $context);

    // Canonical -> compatibility -> history -> diversity -> coherence
    expect($derived['scene_family'])->not->toBe('tabletop still life')
        ->and($derived['environment_family'])->not->toBe('warm artisanal cafe')
        ->and(['centered hero', 'diagonal editorial', 'layered foreground/background', 'asymmetric negative-space layout'])->toContain($derived['composition_type']);

    // Coherence: overhead composition must enforce overhead camera viewpoint and flat-lay scene
    $flatLayContext = ['aspect_ratio' => '1:1', 'industry' => 'Food & Beverage'];
    $derivedOverhead = $system->deriveDiverseVisualCore($baseCandidate, [['composition_type' => 'centered hero']], $flatLayContext);
    expect($derivedOverhead['composition_type'])->toBe('overhead')
        ->and($derivedOverhead['camera_viewpoint'])->toBe('overhead');

    // Rebuild coherent textual direction
    $coherent = $system->buildCoherentCreativeDirection($derived, 'Iced Vanilla Latte', 'Food & Beverage', 'Coffee');
    expect($coherent['creative_concept'])->toContain($derived['scene_family'])
        ->and($coherent['creative_concept'])->toContain($derived['environment_family'])
        ->and($coherent['visual_strategy'])->toContain($derived['composition_type'])
        ->and($coherent['visual_strategy'])->toContain($derived['camera_viewpoint'])
        ->and($coherent['visual_strategy'])->toContain($derived['lighting_profile'])
        ->and($coherent['scene_prompt'])->toContain($derived['prop_profile']);
});

test('AutomaticGeneratorController returns explicit controlled 422 failure when retries are exhausted without accepted candidate', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'RoastHouse']);
    $campaign = Campaign::factory()->create(['business_id' => $business->id, 'user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Signature Mocha', 'price' => 150]);

    // Mock DesignSystem in container to simulate failure to find non-colliding candidate within 2 retries
    $mockDesignSystem = Mockery::mock(MarketingDesignSystem::class)->makePartial();
    $mockDesignSystem->shouldReceive('evaluateVisualCoreDiversity')
        ->andReturn([
            'max_match_count' => 6,
            'matching_keys' => ['scene_family', 'environment_family', 'composition_type', 'camera_viewpoint', 'lighting_profile', 'prop_profile'],
            'classification' => 'prohibited',
            'is_allowed' => false,
            'most_similar_fingerprint' => [],
        ]);

    app()->instance(MarketingDesignSystem::class, $mockDesignSystem);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Warm coffee comfort',
                                'creative_concept' => 'Artisanal tabletop morning',
                                'visual_strategy' => 'Morning warm cafe table',
                                'visual_prompt' => 'A cup of mocha on an artisanal cafe table',
                                'design_treatment' => 'Classic',
                                'copy_emphasis' => 'Balanced',
                                'typography_layout' => 'classic hierarchy',
                                'composition_type' => 'centered hero',
                                'camera_viewpoint' => 'front/eye-level',
                                'lighting_profile' => 'warm morning',
                                'scene_family' => 'tabletop still life',
                                'environment_family' => 'warm artisanal cafe',
                                'prop_profile' => 'refined ceramics & linen textures',
                                'render_style' => 'Studio Product Still',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['input_tokens' => 100, 'output_tokens' => 50, 'total_tokens' => 150],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'aspect_ratio' => '1:1',
    ]);

    // Explicit controlled failure with HTTP 422
    $response->assertStatus(422);
    $data = $response->json();

    expect($data['success'])->toBeFalse()
        ->and($data['message'])->toContain('Unable to generate a sufficiently diverse creative concept within retry limits')
        ->and($data['generation_metadata']['visual_core_diversity'])->toHaveKeys([
            'attempted_candidates',
            'rejected_candidates',
            'final_accepted_candidate',
            'similarity_metrics',
            'retry_count',
            'retry_limit',
            'final_coherence_state',
        ])
        ->and($data['generation_metadata']['visual_core_diversity']['retry_count'])->toBe(2)
        ->and($data['generation_metadata']['visual_core_diversity']['retry_limit'])->toBe(2)
        ->and($data['generation_metadata']['visual_core_diversity']['final_accepted_candidate'])->toBeNull()
        ->and($data['generation_metadata']['visual_core_diversity']['final_coherence_state'])->toBe('prohibited_exhaustion')
        ->and(count($data['generation_metadata']['visual_core_diversity']['rejected_candidates']))->toBe(3);
});
