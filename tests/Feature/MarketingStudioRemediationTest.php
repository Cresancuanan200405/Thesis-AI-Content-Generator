<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ModularPromptOrchestrator;
use App\Services\OpenAIImageService;
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

/*
|--------------------------------------------------------------------------
| Section 30: Controlled Case — Automatic Mode (Prices OFF vs Prices ON)
|--------------------------------------------------------------------------
*/
test('controlled case: automatic generation preserves all catalog and custom products when prices are off', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Coffee business',
        'industry' => 'Food & Beverage',
        'category' => 'Café',
        'description' => 'Neighborhood specialty coffee shop',
        'unique_selling_point' => 'Fresh specialty coffee prepared daily',
        'target_audience' => 'Students and nearby professionals',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Store Anniversary',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Store Anniversary Special',
        'objective' => 'Celebrate store anniversary',
    ]);

    Storage::disk('public')->put('products/latte.png', 'fake-latte-binary');
    Storage::disk('public')->put('products/muffin.png', 'fake-muffin-binary');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Latte',
        'price' => 149.00,
        'image_path' => 'products/latte.png',
        'description' => 'Chilled espresso with fresh milk',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Blueberry Muffin',
        'price' => 120.00,
        'image_path' => 'products/muffin.png',
        'description' => 'Freshly baked muffin with real blueberries',
    ]);

    $customItem = [
        'name' => 'Barista Special Pour',
        'description' => 'Artisanal hand-dripped coffee',
        'price' => '220',
    ];

    $recordedPrompt = null;

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
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
                                'tagline' => 'A Year of Perfect Brews',
                                'creative_concept' => 'Anniversary coffee gathering',
                                'visual_strategy' => 'Warm café counter with co-featured treats',
                                'visual_prompt' => 'A celebratory café counter displaying an Iced Latte and Blueberry Muffin alongside Barista Special Pour coffee.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 250],
        ], 200),

        'https://api.openai.com/v1/images/*' => function ($request) use (&$recordedPrompt) {
            $recordedPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-image-binary')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$productA->id, $productB->id],
        'custom_products' => [$customItem],
        'include_prices' => false,
        'include_tagline' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    $data = $response->json();
    $prompt = $data['prompt'] ?? $data['visual_prompt'];

    // Verify product identities are all preserved
    expect($prompt)->toContain('Iced Latte')
        ->and($prompt)->toContain('Blueberry Muffin')
        ->and($prompt)->toContain('Barista Special Pour')
        ->and($prompt)->toContain('CO-FEATURED PRODUCTS & SERVICES')
        ->and($prompt)->toContain('CO-PRESENCE MANDATE');

    // Verify prices are suppressed when include_prices is false
    expect($prompt)->not()->toContain('₱149')
        ->and($prompt)->not()->toContain('149.00')
        ->and($prompt)->not()->toContain('₱120')
        ->and($prompt)->not()->toContain('120.00')
        ->and($prompt)->not()->toContain('₱220')
        ->and($prompt)->toContain('MARKETING PRICE DISPLAY: Disabled');

    // Verify business context and creative outputs
    expect($prompt)->toContain('Coffee business')
        ->and($prompt)->toContain('Fresh specialty coffee prepared daily')
        ->and($prompt)->toContain('Students and nearby professionals')
        ->and($prompt)->toContain('Store Anniversary');
});

test('controlled case: automatic generation includes authoritative prices when include_prices is on', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Coffee business',
        'industry' => 'Food & Beverage',
        'category' => 'Café',
        'description' => 'Neighborhood specialty coffee shop',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Latte',
        'price' => 149.00,
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Blueberry Muffin',
        'price' => 120.00,
    ]);

    $customItem = [
        'name' => 'Barista Special Pour',
        'description' => 'Artisanal hand-dripped coffee',
        'price' => '220',
    ];

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
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
                                'tagline' => 'A Year of Perfect Brews',
                                'creative_concept' => 'Anniversary coffee gathering',
                                'visual_strategy' => 'Warm café counter with co-featured treats',
                                'visual_prompt' => 'An arrangement of Iced Latte, Blueberry Muffin, and Barista Special Pour.',
                            ]),
                        ],
                    ],
                    'role' => 'assistant',
                ],
            ],
            'usage' => ['total_tokens' => 200],
        ], 200),

        'https://api.openai.com/v1/images/*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-binary')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$productA->id, $productB->id],
        'custom_products' => [$customItem],
        'include_prices' => true,
        'include_tagline' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    $prompt = $response->json('prompt');

    // All authoritative prices are present
    expect($prompt)->toContain('149')
        ->and($prompt)->toContain('120')
        ->and($prompt)->toContain('220')
        ->and($prompt)->toContain('Iced Latte')
        ->and($prompt)->toContain('Blueberry Muffin')
        ->and($prompt)->toContain('Barista Special Pour');
});

/*
|--------------------------------------------------------------------------
| Section 31: Controlled Case — Manual Mode
|--------------------------------------------------------------------------
*/
test('controlled case: manual mode propagates all visible creative controls and mixed products to final prompt', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Coffee business',
        'industry' => 'Food & Beverage',
        'category' => 'Café',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Latte',
        'price' => 149.00,
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Blueberry Muffin',
        'price' => 120.00,
    ]);

    $customItem = [
        'name' => 'Barista Special Pour',
        'description' => 'Artisanal hand-dripped coffee',
        'price' => '220',
    ];

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/*' => function ($request) use (&$capturedPrompt) {
            $capturedPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-manual-image')]],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson('/generator/manual', [
        'campaign_id' => $campaign->id,
        'product_name' => 'Iced Latte',
        'product_id' => $productA->id,
        'catalog_product_ids' => [$productA->id, $productB->id],
        'custom_products' => [$customItem],
        'scene_prompt' => 'Premium coffee service scene in a warm modern café counter',
        'render_style' => 'Studio Product Still',
        'brand_tone' => ['Warm'],
        'visual_theme' => ['Cozy Cafe'],
        'tagline' => 'Made for your everyday pause',
        'tagline_mode' => 'custom',
        'aspect_ratio' => '4:5',
        'include_prices' => true,
        'include_business_name' => true,
        'business_name' => 'Coffee business',
    ]);

    $response->assertOk();

    // Verify all manual controls survive into the orchestrated prompt
    expect($capturedPrompt)->toContain('Premium coffee service scene in a warm modern café counter')
        ->and($capturedPrompt)->toContain('Studio Product Still')
        ->and($capturedPrompt)->toContain('Warm')
        ->and($capturedPrompt)->toContain('Cozy Cafe')
        ->and($capturedPrompt)->toContain('Made for your everyday pause')
        ->and($capturedPrompt)->toContain('Coffee business')
        ->and($capturedPrompt)->toContain('4:5')
        ->and($capturedPrompt)->toContain('Iced Latte')
        ->and($capturedPrompt)->toContain('Blueberry Muffin')
        ->and($capturedPrompt)->toContain('Barista Special Pour')
        ->and($capturedPrompt)->toContain('149')
        ->and($capturedPrompt)->toContain('120')
        ->and($capturedPrompt)->toContain('220');
});

/*
|--------------------------------------------------------------------------
| Section 34 & 36: Multi-Image Reference Attachments to OpenAI
|--------------------------------------------------------------------------
*/
test('multi-image reference handling attaches all valid reference images to openai image edits', function () {
    Storage::disk('public')->put('products/latte.png', 'binary-latte-data');
    Storage::disk('public')->put('products/muffin.png', 'binary-muffin-data');

    $capturedAttachments = [];

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function ($request) use (&$capturedAttachments) {
            // Count attachments or verify request structure
            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-edited-image')],
                ],
            ], 200);
        },
    ]);

    $service = app(OpenAIImageService::class);
    $path = $service->generate('Composite visual of Iced Latte and Blueberry Muffin', [
        'reference_image_paths' => [
            'products/latte.png',
            'products/muffin.png',
        ],
        'aspect_ratio' => '1:1',
    ]);

    expect($path)->not()->toBeEmpty();
    $meta = $service->getLastGenerationMetadata();
    expect($meta['generation_method'])->toBe('multi_image_to_image_edit')
        ->and($meta['product_preserved'])->toBeTrue()
        ->and($meta['reference_image_used'])->toBeTrue()
        ->and($meta['image_inputs_count'])->toBe(2)
        ->and($meta['reference_image_paths'])->toBe(['products/latte.png', 'products/muffin.png']);
});

test('multi-image reference falls back to primary image edit if multi-image edit is rejected', function () {
    Storage::disk('public')->put('products/latte.png', 'binary-latte-data');
    Storage::disk('public')->put('products/muffin.png', 'binary-muffin-data');

    $attemptCount = 0;

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function ($request) use (&$attemptCount) {
            $attemptCount++;
            if ($attemptCount === 1) {
                // First attempt (multi-image) fails with 400
                return Http::response(['error' => ['message' => 'Multiple images not supported']], 400);
            }

            // Second attempt (single primary image) succeeds
            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-single-edited-image')],
                ],
            ], 200);
        },
    ]);

    $service = app(OpenAIImageService::class);
    $path = $service->generate('Composite visual of Iced Latte and Blueberry Muffin', [
        'reference_image_paths' => [
            'products/latte.png',
            'products/muffin.png',
        ],
        'aspect_ratio' => '1:1',
    ]);

    expect($path)->not()->toBeEmpty();
    expect($attemptCount)->toBe(2);
    $meta = $service->getLastGenerationMetadata();
    expect($meta['generation_method'])->toBe('image_to_image_edit')
        ->and($meta['product_preserved'])->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Section 26 & 27: Regeneration Restoration
|--------------------------------------------------------------------------
*/
test('regeneration restores all catalog products, custom items, and reference image paths from metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Bean & Leaf Roastery',
    ]);

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Cold Brew Bottle',
        'price' => 160.00,
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Croissant',
        'price' => 95.00,
    ]);

    $customItems = [
        ['name' => 'Single Origin Drip', 'price' => '180', 'description' => 'Light roast'],
    ];

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $productA->id,
        'product_name' => 'Cold Brew Bottle',
        'price' => 160.00,
        'tagline' => 'Crisp Morning Awakening',
        'generation_metadata' => [
            'source' => 'openai',
            'model' => 'gpt-image-2',
            'aspect_ratio' => '1:1',
            'render_style' => 'Studio Product Still',
            'include_prices' => false,
            'catalog_product_ids' => [$productA->id, $productB->id],
            'custom_products' => $customItems,
            'scene_prompt' => 'A clean café counter presentation with warm morning backlight.',
        ],
    ]);

    $regeneratedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/*' => function ($request) use (&$regeneratedPrompt) {
            $regeneratedPrompt = $request->data()['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('regenerated-image-binary')]],
            ], 200);
        },
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $regeneratedDesign = $regenerationService->regenerate($design);

    expect($regeneratedDesign)->toBeInstanceOf(Design::class);
    $genMeta = $regeneratedDesign->generation_metadata;

    // Both catalog products and custom items are preserved in regenerated design
    expect($genMeta['catalog_product_ids'])->toBe([$productA->id, $productB->id])
        ->and($genMeta['custom_products'])->toBe($customItems)
        ->and($genMeta['include_prices'])->toBeFalse();

    // Verify prompt contains both products and custom items
    expect($regeneratedPrompt)->toContain('Cold Brew Bottle')
        ->and($regeneratedPrompt)->toContain('Croissant')
        ->and($regeneratedPrompt)->toContain('Single Origin Drip');

    // And price is suppressed because include_prices is false
    expect($regeneratedPrompt)->not()->toContain('160.00')
        ->and($regeneratedPrompt)->not()->toContain('95.00');
});

/*
|--------------------------------------------------------------------------
| Section 29: Negative & Boundary Tests
|--------------------------------------------------------------------------
*/
test('cross-tenant product selection is strictly rejected with 422', function () {
    $user1 = User::factory()->create(['onboarding_completed' => true]);
    $business1 = Business::factory()->create(['user_id' => $user1->id]);
    $campaign1 = Campaign::factory()->create(['user_id' => $user1->id, 'business_id' => $business1->id]);

    $user2 = User::factory()->create(['onboarding_completed' => true]);
    $business2 = Business::factory()->create(['user_id' => $user2->id]);
    $foreignProduct = Product::factory()->create(['business_id' => $business2->id]);

    $response = $this->actingAs($user1)->postJson('/generator/automatic', [
        'campaign_id' => $campaign1->id,
        'product_id' => $foreignProduct->id,
    ]);

    $response->assertStatus(422);
});

test('duplicate product ids are normalized and deduplicated', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Blend',
        'price' => 150.00,
    ]);

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Blend',
        'catalog_products' => collect([$product, $product, $product]),
        'include_prices' => true,
    ], $business);

    // Verify Signature Blend is present and not duplicated into co-featured secondary products
    expect($prompt)->toContain('Signature Blend')
        ->and($prompt)->not()->toContain('• Co-Featured Catalog Products:');
});

test('deselected product does not reach the generation prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $productA = Product::factory()->create(['business_id' => $business->id, 'name' => 'Iced Americano']);
    $productB = Product::factory()->create(['business_id' => $business->id, 'name' => 'Matcha Latte']);

    // User only selects Product A (Product B was deselected in UI)
    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Iced Americano',
        'catalog_products' => collect([$productA]),
        'include_prices' => true,
    ], $business);

    expect($prompt)->toContain('Iced Americano')
        ->and($prompt)->not()->toContain('Matcha Latte');
});
