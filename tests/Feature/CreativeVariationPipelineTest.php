<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-key-for-variation-pipeline']);
    config(['services.openai.budget_limit' => 100.00]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'id' => 'resp-test-123',
            'model' => 'gpt-5.6-luna',
            'output' => [
                [
                    'id' => 'msg-test-123',
                    'type' => 'message',
                    'status' => 'completed',
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Mastery in Every Single Pour',
                                'creative_concept' => 'Artisanal Mastery in High Contrast',
                                'visual_strategy' => 'Highlight single origin bean notes and amber clarity',
                                'visual_prompt' => 'Commercial product still of cold brew bottle with ice droplets, golden rim lighting, 8k resolution',
                                'design_treatment' => 'Classic',
                                'copy_emphasis' => 'Balanced',
                            ]),
                        ],
                    ],
                ],
            ],
        ]),
    ]);
});

/**
 * SECTION 15: AUTOMATIC VARIATION REGRESSION TEST
 */
test('automatic variation restores complete marketing-copy configuration and executes finalization', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Roasters PH',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Summer Cold Brew Fest',
        'objective' => 'Promote signature bottled cold brew',
    ]);

    Storage::disk('public')->put('products/signature_cold_brew.png', 'fake-binary-cold-brew');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Cold Brew',
        'price' => 280.00,
        'image_path' => 'products/signature_cold_brew.png',
        'description' => 'Steeped for 24 hours in cold filtered water',
    ]);

    // Create controlled source design
    $originalDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $productA->id,
        'product_name' => 'Signature Cold Brew',
        'prompt' => 'PROMOTIONAL ADVERTISEMENT BRIEF: Signature Cold Brew with morning light',
        'price' => 280.00,
        'brand_tone' => 'Bold, Modern',
        'visual_theme' => 'Commercial, Studio Lighting',
        'tagline' => 'Mastery in Every Single Pour',
        'tagline_mode' => 'ai',
        'reference_image_path' => 'products/signature_cold_brew.png',
        'generated_image_path' => 'designs/initial_auto_source.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'product_name' => 'Signature Cold Brew',
            'business_name' => 'Artisan Roasters PH',
            'include_business_name' => true,
            'include_tagline' => true,
            'tagline' => 'Mastery in Every Single Pour',
            'tagline_mode' => 'ai',
            'include_prices' => true,
            'price' => '₱280.00',
            'prices' => ['Signature Cold Brew' => '₱280.00'],
            'primary_product' => ['name' => 'Signature Cold Brew', 'price' => '₱280.00'],
            'aspect_ratio' => '1:1',
            'design_treatment' => 'Classic',
            'copy_emphasis' => 'Balanced',
            'render_style' => 'Automatic Commercial Art Direction',
            'creative_concept' => 'Artisanal Mastery in High Contrast',
            'visual_strategy' => 'Highlight single origin bean notes and amber clarity',
            'catalog_product_ids' => [$productA->id],
            'reference_image_paths' => ['products/signature_cold_brew.png'],
            'scene_prompt' => 'A clean marble countertop with golden hour backlight and condensate glass',
        ],
    ]);

    Storage::disk('public')->put('designs/initial_auto_source.png', 'fake-initial-source-image');

    Http::fake([
        'https://api.openai.com/v1/images/*' => function (ClientRequest $request) {
            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-variation-binary')],
                ],
            ], 200);
        },
    ]);

    // Test Path A: Via DesignRegenerationService
    $regenerationService = app(DesignRegenerationService::class);
    $variationDesign = $regenerationService->regenerate($originalDesign);

    // 1. Variation succeeds
    expect($variationDesign)->toBeInstanceOf(Design::class)
        ->and($variationDesign->id)->not()->toBe($originalDesign->id);

    // 2. Final image path is the finalized image
    expect($variationDesign->generated_image_path)->not()->toBeEmpty()
        ->and($variationDesign->generated_image_path)->toStartWith('designs/');

    // 3 & 4. Authoritative copy layers survive
    $meta = $variationDesign->generation_metadata;
    expect($meta['include_business_name'])->toBeTrue()
        ->and($meta['business_name'])->toBe('Artisan Roasters PH')
        ->and($meta['include_tagline'])->toBeTrue()
        ->and($variationDesign->tagline)->toBe('Mastery in Every Single Pour')
        ->and($meta['tagline'])->toBe('Mastery in Every Single Pour')
        ->and($meta['include_prices'])->toBeTrue()
        ->and((float) $variationDesign->price)->toBe(280.00);

    // 5. Compositor received authoritative contract
    expect($meta['authoritative_text_layers'])->toHaveKey('product_name')
        ->and($meta['authoritative_text_layers']['product_name'])->toBe('Signature Cold Brew')
        ->and($meta['authoritative_text_layers'])->toHaveKey('tagline')
        ->and($meta['authoritative_text_layers']['tagline'])->toBe('Mastery in Every Single Pour')
        ->and($meta['authoritative_text_layers'])->toHaveKey('business_name')
        ->and($meta['authoritative_text_layers']['business_name'])->toBe('Artisan Roasters PH');

    // 6. Text layers rendered
    expect($meta['text_layers_rendered'])->toContain('product_name')
        ->and($meta['text_layers_rendered'])->toContain('tagline')
        ->and($meta['text_layers_rendered'])->toContain('business_name');

    // 7. Restored aspect ratio
    expect($meta['aspect_ratio'])->toBe('1:1');

    // Test Path B: Via Controller API (POST /generator/automatic with is_variation)
    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$productA->id],
        'is_variation' => true,
        'source_design_id' => $originalDesign->id,
        'tagline' => 'Mastery in Every Single Pour',
        'design_treatment' => 'Classic',
        'copy_emphasis' => 'Balanced',
        'render_style' => 'Automatic Commercial Art Direction',
        'creative_concept' => 'Artisanal Mastery in High Contrast',
        'visual_strategy' => 'Highlight single origin bean notes and amber clarity',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'is_variation' => true,
            'tagline' => 'Mastery in Every Single Pour',
        ]);

    $preview = $response->json('preview');
    expect($preview['tagline'])->toBe('Mastery in Every Single Pour')
        ->and($preview['generated_image_path'])->not()->toBeEmpty()
        ->and($preview['generation_meta']['authoritative_text_layers'])->toHaveKey('tagline');
});

/**
 * SECTION 16: MANUAL MULTI-PRODUCT VARIATION REGRESSION TEST
 */
test('manual variation restores both products, creative direction, and passes multi-product contract to compositor', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Roasters PH',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Artisan Pairing Campaign',
    ]);

    Storage::disk('public')->put('products/iced_latte.png', 'fake-binary-iced-latte');
    Storage::disk('public')->put('products/croissant.png', 'fake-binary-croissant');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Latte',
        'price' => 150.00,
        'image_path' => 'products/iced_latte.png',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Butter Croissant',
        'price' => 95.00,
        'image_path' => 'products/croissant.png',
    ]);

    $originalDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $productA->id,
        'product_name' => 'Iced Latte & Butter Croissant Pairing',
        'prompt' => 'A refined editorial scene on a sunlit marble cafe counter with iced latte and flaky croissant',
        'price' => 150.00,
        'brand_tone' => 'Sophisticated, Elegant',
        'visual_theme' => 'Editorial, High Contrast',
        'tagline' => 'Crafted for Pure Indulgence',
        'tagline_mode' => 'manual',
        'reference_image_path' => 'products/iced_latte.png',
        'generated_image_path' => 'designs/initial_manual_source.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'product_name' => 'Iced Latte & Butter Croissant Pairing',
            'business_name' => 'Artisan Roasters PH',
            'include_business_name' => true,
            'include_tagline' => true,
            'tagline' => 'Crafted for Pure Indulgence',
            'tagline_mode' => 'manual',
            'include_prices' => true,
            'price' => '₱150.00',
            'prices' => [
                'Iced Latte' => '₱150.00',
                'Butter Croissant' => '₱95.00',
            ],
            'primary_product' => ['name' => 'Iced Latte', 'price' => '₱150.00'],
            'co_featured_products' => [
                ['name' => 'Butter Croissant', 'price' => '₱95.00'],
            ],
            'aspect_ratio' => '16:9',
            'design_treatment' => 'Editorial',
            'copy_emphasis' => 'Price-Focused',
            'render_style' => 'Cinematic Marketing',
            'catalog_product_ids' => [$productA->id, $productB->id],
            'reference_image_paths' => ['products/iced_latte.png', 'products/croissant.png'],
            'scene_prompt' => 'A refined editorial scene on a sunlit marble cafe counter with iced latte and flaky croissant',
        ],
    ]);

    $attachedFilenames = [];
    $interceptedPrompt = '';

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$attachedFilenames, &$interceptedPrompt) {
            $body = $request->body();
            if (str_contains($body, 'iced_latte.png')) {
                $attachedFilenames[] = 'iced_latte.png';
            }
            if (str_contains($body, 'croissant.png')) {
                $attachedFilenames[] = 'croissant.png';
            }

            // Extract prompt
            $promptSent = preg_match('/name="prompt"\s*\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches) ? $matches[1] : $body;
            $interceptedPrompt = $promptSent;

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-multi-product-variation-binary')],
                ],
            ], 200);
        },
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($originalDesign);

    // 1. Both reference images are restored and attached
    expect($attachedFilenames)->toHaveCount(2)
        ->and($attachedFilenames[0])->toBe('iced_latte.png')
        ->and($attachedFilenames[1])->toBe('croissant.png');

    // 2. Prompt contains both reference-image anchors
    expect($interceptedPrompt)->toContain('REFERENCE IMAGE 1 = Iced Latte')
        ->and($interceptedPrompt)->toContain('REFERENCE IMAGE 2 = Butter Croissant');

    // 3. Creative controls remain present
    $meta = $variation->generation_metadata;
    expect($meta['design_treatment'])->toBe('Editorial')
        ->and($meta['copy_emphasis'])->toBe('Price-Focused')
        ->and($meta['render_style'])->toBe('Cinematic Marketing')
        ->and($meta['aspect_ratio'])->toBe('16:9');

    // 4. Exact tagline preserved
    expect($variation->tagline)->toBe('Crafted for Pure Indulgence')
        ->and($meta['tagline'])->toBe('Crafted for Pure Indulgence');

    // 5. Business name preserved
    expect($meta['business_name'])->toBe('Artisan Roasters PH')
        ->and($meta['include_business_name'])->toBeTrue();

    // 6. Prices preserved
    expect($meta['include_prices'])->toBeTrue()
        ->and($meta['prices'])->toHaveKey('Iced Latte')
        ->and($meta['prices'])->toHaveKey('Butter Croissant');

    // 7. Multi-product contract to compositor
    expect($meta['primary_product']['name'])->toBe('Iced Latte')
        ->and($meta['co_featured_products'][0]['name'])->toBe('Butter Croissant');

    // 8. Text layers present in compositor result
    expect($meta['authoritative_text_layers'])->toHaveKey('product_name')
        ->and($meta['authoritative_text_layers'])->toHaveKey('tagline')
        ->and($meta['authoritative_text_layers'])->toHaveKey('price')
        ->and($meta['authoritative_text_layers'])->toHaveKey('business_name');
});

/**
 * SECTION 17: TEST VARIATION COPY TOGGLE BEHAVIOR
 */
test('variation respects all copy toggles disabled (tagline OFF, prices OFF, business name OFF)', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Minimal Brand']);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Minimal Bag',
        'price' => 500.00,
    ]);

    // Source design with ALL copy toggles disabled
    $originalDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'product_name' => 'Minimal Bag',
        'prompt' => 'Minimal aesthetic bag against clean stone wall',
        'price' => null,
        'brand_tone' => 'Understated',
        'visual_theme' => 'Minimalist',
        'tagline' => null,
        'tagline_mode' => 'none',
        'reference_image_path' => null,
        'generated_image_path' => 'designs/clean_bag.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'product_name' => 'Minimal Bag',
            'include_business_name' => false,
            'business_name' => null,
            'include_tagline' => false,
            'tagline' => null,
            'tagline_mode' => 'none',
            'include_prices' => false,
            'price' => null,
            'prices' => [],
            'aspect_ratio' => '1:1',
            'design_treatment' => 'Minimal',
            'copy_emphasis' => 'Minimal Copy',
            'render_style' => 'Studio Product Still',
            'catalog_product_ids' => [$product->id],
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/*' => function () {
            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-clean-image')]],
            ], 200);
        },
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($originalDesign);

    $meta = $variation->generation_metadata;

    // Assert: No tagline layer
    expect($variation->tagline)->toBeNull()
        ->and($meta['include_tagline'])->toBeFalse()
        ->and($meta['authoritative_text_layers'])->not()->toHaveKey('tagline');

    // Assert: No price layer
    expect($variation->price)->toBeNull()
        ->and($meta['include_prices'])->toBeFalse()
        ->and($meta['authoritative_text_layers'])->not()->toHaveKey('price');

    // Assert: No business name layer
    expect($meta['include_business_name'])->toBeFalse()
        ->and($meta['business_name'])->toBeNull()
        ->and($meta['authoritative_text_layers'])->not()->toHaveKey('business_name');

    // Products remain present
    expect($variation->product_name)->toBe('Minimal Bag')
        ->and($meta['authoritative_text_layers'])->toHaveKey('product_name');
});

/**
 * SECTION 18: TEST MULTI-PRODUCT VARIATION FAILURE POLICY
 */
test('manual multi-product variation failure does not silently fallback to single-product and returns explicit 422', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Roasters Co']);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/prod_1.png', 'binary-1');
    Storage::disk('public')->put('products/prod_2.png', 'binary-2');

    $prod1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Product 1',
        'image_path' => 'products/prod_1.png',
    ]);
    $prod2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Product 2',
        'image_path' => 'products/prod_2.png',
    ]);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $prod1->id,
        'product_name' => 'Bundle 1 and 2',
        'prompt' => 'Bundle shot',
        'generated_image_path' => 'designs/orig_bundle.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'product_name' => 'Bundle 1 and 2',
            'catalog_product_ids' => [$prod1->id, $prod2->id],
            'reference_image_paths' => ['products/prod_1.png', 'products/prod_2.png'],
            'include_prices' => true,
            'include_tagline' => true,
            'tagline' => 'Best Duo',
            'include_business_name' => true,
        ],
    ]);

    // Simulate OpenAI API failure for edits
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function () {
            return Http::response([
                'error' => ['message' => 'Rate limit exceeded on multi-image edit endpoint'],
            ], 429);
        },
    ]);

    // Test API route POST /designs/{design}/regenerate with JSON header
    $response = $this->actingAs($user)->postJson(route('designs.regenerate', $design));

    // Assert: Explicit HTTP 422
    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
            'generation_method' => 'multi_image_to_image_failed',
            'attempted_reference_count' => 2,
            'actual_reference_count' => 0,
        ]);

    expect($response->json('fallback_reason'))->toContain('Rate limit exceeded on multi-image edit endpoint');
});
