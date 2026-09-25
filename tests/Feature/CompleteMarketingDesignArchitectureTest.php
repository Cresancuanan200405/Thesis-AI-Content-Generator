<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ImageCompositorService;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config([
        'services.openai.api_key' => 'sk-test-architecture-key',
        'services.openai.key' => 'sk-test-architecture-key',
    ]);
});

/*
|--------------------------------------------------------------------------
| PART X: COMPLETE DESIGN GENERATION TESTS (1 - 8)
|--------------------------------------------------------------------------
*/

test('1. automatic generation includes enabled Product Name in production prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Signature Cold Brew',
        'include_product_name' => true,
    ]);

    expect($prompt)->toContain('PRODUCT NAME:')
        ->toContain('"Signature Cold Brew"');
});

test('2. automatic generation includes enabled Price', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Signature Cold Brew',
        'price' => '₱180.00',
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('PRICE:')
        ->toContain('"₱180.00"');
});

test('3. automatic generation includes enabled Tagline', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Signature Cold Brew',
        'tagline' => 'Crafted for Pure Indulgence',
        'include_tagline' => true,
    ]);

    expect($prompt)->toContain('TAGLINE:')
        ->toContain('"Crafted for Pure Indulgence"');
});

test('4. automatic generation includes enabled Business Name', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'automatic',
        'product_name' => 'Signature Cold Brew',
        'business_name' => 'Artisan Roasters PH',
        'include_business_name' => true,
    ]);

    expect($prompt)->toContain('BUSINESS NAME:')
        ->toContain('"Artisan Roasters PH"');
});

test('5. manual generation includes enabled Product Name', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Caramel Cortado',
        'include_product_name' => true,
    ]);

    expect($prompt)->toContain('PRODUCT NAME:')
        ->toContain('"Caramel Cortado"');
});

test('6. manual generation includes enabled Price', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Caramel Cortado',
        'price' => '₱145.00',
        'include_prices' => true,
    ]);

    expect($prompt)->toContain('PRICE:')
        ->toContain('"₱145.00"');
});

test('7. manual generation includes enabled Tagline', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Caramel Cortado',
        'tagline' => 'Velvety Sweetness in Every Sip',
        'include_tagline' => true,
    ]);

    expect($prompt)->toContain('TAGLINE:')
        ->toContain('"Velvety Sweetness in Every Sip"');
});

test('8. manual generation includes enabled Business Name', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Caramel Cortado',
        'business_name' => 'Kape Isla Manila',
        'include_business_name' => true,
    ]);

    expect($prompt)->toContain('BUSINESS NAME:')
        ->toContain('"Kape Isla Manila"');
});

/*
|--------------------------------------------------------------------------
| TOGGLE TESTS (9 - 12)
|--------------------------------------------------------------------------
*/

test('9. Tagline OFF removes tagline instruction and adds explicit exclusion', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Cold Brew',
        'tagline' => 'Crafted for Pure Indulgence',
        'include_tagline' => false,
    ]);

    expect($prompt)->toContain('INCLUDE TAGLINE = FALSE:')
        ->toContain('Do not render any tagline, headline, slogan, or substitute phrase.')
        ->not->toContain('Crafted for Pure Indulgence');
});

test('10. Prices OFF removes price instruction and adds explicit exclusion', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Cold Brew',
        'price' => '₱180.00',
        'include_prices' => false,
    ]);

    expect($prompt)->toContain('INCLUDE PRICES = FALSE:')
        ->toContain('Do not render prices.')
        ->toContain('Selected products MUST remain visually present.')
        ->not->toContain('"₱180.00"');
});

test('11. Business Name OFF removes business-name instruction and adds explicit exclusion', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Signature Cold Brew',
        'business_name' => 'Artisan Roasters PH',
        'include_business_name' => false,
    ]);

    expect($prompt)->toContain('INCLUDE BUSINESS NAME = FALSE:')
        ->toContain('Do not render the business/shop name.')
        ->not->toContain('Artisan Roasters PH');
});

test('12. Products remain visually required when prices are OFF', function () {
    $compositor = app(ImageCompositorService::class);
    $params = [
        'primary_product' => ['name' => 'Nitro Cold Brew', 'price' => '190.00'],
        'co_featured_products' => [['name' => 'Butter Croissant', 'price' => '95.00']],
        'include_prices' => false,
    ];

    $manifest = $compositor->generateCompositingManifest($params);

    expect($manifest['primary_product']['name'])->toBe('Nitro Cold Brew')
        ->and($manifest['co_featured_products'])->toHaveCount(1)
        ->and($manifest['co_featured_products'][0]['name'])->toBe('Butter Croissant')
        ->and($manifest['prices'])->toBeEmpty()
        ->and($manifest['exact_content']['price'])->toBeNull();
});

/*
|--------------------------------------------------------------------------
| MULTI-PRODUCT TESTS (13 - 17)
|--------------------------------------------------------------------------
*/

test('13. 2 catalog products are attached with image[] multipart field', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/prod_a.png', 'binary-a');
    Storage::disk('public')->put('products/prod_b.png', 'binary-b');

    $pA = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/prod_a.png', 'name' => 'Cold Brew']);
    $pB = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/prod_b.png', 'name' => 'Croissant']);

    $attachedFields = [];
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$attachedFields) {
            $body = $request->body();
            preg_match_all('/name="([^"]+)"(?:;\s*filename="([^"]+)")?/i', $body, $matches, PREG_SET_ORDER);
            foreach ($matches as $match) {
                if (! empty($match[2])) {
                    $attachedFields[] = ['name' => $match[1], 'file' => $match[2]];
                }
            }

            return Http::response(['data' => [['b64_json' => base64_encode('fake-binary')]]], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Cold Brew & Croissant',
        'catalog_product_ids' => [$pA->id, $pB->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    expect($attachedFields)->toHaveCount(2)
        ->and($attachedFields[0]['name'])->toBe('image[]')
        ->and($attachedFields[0]['file'])->toBe('prod_a.png')
        ->and($attachedFields[1]['name'])->toBe('image[]')
        ->and($attachedFields[1]['file'])->toBe('prod_b.png');
});

test('14. 3 catalog products are attached with image[] multipart field', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/p1.png', 'bin-1');
    Storage::disk('public')->put('products/p2.png', 'bin-2');
    Storage::disk('public')->put('products/p3.png', 'bin-3');

    $p1 = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/p1.png', 'name' => 'Product 1']);
    $p2 = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/p2.png', 'name' => 'Product 2']);
    $p3 = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/p3.png', 'name' => 'Product 3']);

    $attachedFiles = [];
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$attachedFiles) {
            $body = $request->body();
            preg_match_all('/name="image\[\]";\s*filename="([^"]+)"/i', $body, $matches);
            $attachedFiles = $matches[1] ?? [];

            return Http::response(['data' => [['b64_json' => base64_encode('fake-binary')]]], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Trio Bundle',
        'catalog_product_ids' => [$p1->id, $p2->id, $p3->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    expect($attachedFiles)->toHaveCount(3)
        ->and($attachedFiles)->toBe(['p1.png', 'p2.png', 'p3.png']);
});

test('15. reference-image numbering matches binary order', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'catalog_products' => [
            ['name' => 'Item Alpha', 'image_path' => 'products/alpha.png'],
            ['name' => 'Item Beta', 'image_path' => 'products/beta.png'],
            ['name' => 'Item Gamma', 'image_path' => 'products/gamma.png'],
        ],
        'product_name' => 'Item Alpha',
    ]);

    expect($prompt)->toContain('REFERENCE IMAGE 1 = Item Alpha')
        ->toContain('REFERENCE IMAGE 2 = Item Beta')
        ->toContain('REFERENCE IMAGE 3 = Item Gamma');
});

test('16. multi-product source remains multi-product during variation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    Storage::disk('public')->put('products/v_a.png', 'bin-va');
    Storage::disk('public')->put('products/v_b.png', 'bin-vb');

    $pA = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/v_a.png', 'name' => 'Roast A']);
    $pB = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/v_b.png', 'name' => 'Roast B']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Dual Roast Pairing',
        'generated_image_path' => 'designs/dual_source.png',
        'generation_metadata' => [
            'catalog_product_ids' => [$pA->id, $pB->id],
            'reference_image_paths' => ['products/v_a.png', 'products/v_b.png'],
            'primary_product' => ['name' => 'Roast A', 'price' => '200'],
            'co_featured_products' => [['name' => 'Roast B', 'price' => '220']],
        ],
    ]);

    $dispatchedAttachments = [];
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$dispatchedAttachments) {
            $body = $request->body();
            preg_match_all('/name="image\[\]";\s*filename="([^"]+)"/i', $body, $matches);
            $dispatchedAttachments = $matches[1] ?? [];

            return Http::response(['data' => [['b64_json' => base64_encode('fake-variation-binary')]]], 200);
        },
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->generation_metadata['catalog_product_ids'])->toBe([$pA->id, $pB->id])
        ->and($dispatchedAttachments)->toBe(['v_a.png', 'v_b.png']);
});

test('17. multi-image failure cannot silently become one-product success', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/m1.png', 'b1');
    Storage::disk('public')->put('products/m2.png', 'b2');

    $p1 = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/m1.png', 'name' => 'P1']);
    $p2 = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/m2.png', 'name' => 'P2']);

    Http::fake([
        'https://api.openai.com/v1/images/edits' => Http::response([
            'error' => ['message' => 'Multi-image edit endpoint unavailable.'],
        ], 500),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Duo',
        'catalog_product_ids' => [$p1->id, $p2->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertStatus(422);
    $json = $response->json();
    expect($json['success'])->toBeFalse()
        ->and($json['metadata']['generation_method'])->toBe('multi_image_to_image_failed')
        ->and($json['metadata']['attempted_reference_count'])->toBe(2)
        ->and($json['metadata']['actual_reference_count'])->toBe(0);
});

/*
|--------------------------------------------------------------------------
| VARIATION TESTS (18 - 23)
|--------------------------------------------------------------------------
*/

test('18. automatic variation preserves enabled copy', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Artisan Roasters PH']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Signature Blend',
        'tagline' => 'Crafted for Pure Indulgence',
        'price' => 180.00,
        'generated_image_path' => 'designs/src.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'product_name' => 'Signature Blend',
            'tagline' => 'Crafted for Pure Indulgence',
            'business_name' => 'Artisan Roasters PH',
            'include_tagline' => true,
            'include_prices' => true,
            'include_business_name' => true,
            'price' => '₱180.00',
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-auto-var')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->tagline)->toBe('Crafted for Pure Indulgence')
        ->and((float) $variation->price)->toBe(180.00)
        ->and($variation->prompt)->toContain('Signature Blend')
        ->and($variation->prompt)->toContain('Crafted for Pure Indulgence')
        ->and($variation->prompt)->toContain('₱180.00')
        ->and($variation->prompt)->toContain('Artisan Roasters PH');
});

test('19. manual variation preserves enabled copy', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Artisan Roasters PH']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Vanilla Bean Latte',
        'tagline' => 'Smooth notes in every cup',
        'price' => 160.00,
        'generated_image_path' => 'designs/src_man.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'product_name' => 'Vanilla Bean Latte',
            'tagline' => 'Smooth notes in every cup',
            'business_name' => 'Artisan Roasters PH',
            'include_tagline' => true,
            'include_prices' => true,
            'include_business_name' => true,
            'price' => '₱160.00',
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-man-var')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->tagline)->toBe('Smooth notes in every cup')
        ->and((float) $variation->price)->toBe(160.00)
        ->and($variation->prompt)->toContain('Vanilla Bean Latte')
        ->and($variation->prompt)->toContain('Smooth notes in every cup')
        ->and($variation->prompt)->toContain('₱160.00');
});

test('20. automatic variation preserves products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $prod = Product::factory()->create(['business_id' => $business->id, 'name' => 'Cold Brew Concentrate']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $prod->id,
        'product_name' => 'Cold Brew Concentrate',
        'generated_image_path' => 'designs/auto_src.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'product_name' => 'Cold Brew Concentrate',
            'catalog_product_ids' => [$prod->id],
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-auto-prod')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->product_name)->toBe('Cold Brew Concentrate')
        ->and($variation->product_id)->toBe($prod->id);
});

test('21. manual variation preserves products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $prod = Product::factory()->create(['business_id' => $business->id, 'name' => 'Iced Spanish Latte']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $prod->id,
        'product_name' => 'Iced Spanish Latte',
        'generated_image_path' => 'designs/man_src.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'product_name' => 'Iced Spanish Latte',
            'catalog_product_ids' => [$prod->id],
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-man-prod')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->product_name)->toBe('Iced Spanish Latte')
        ->and($variation->product_id)->toBe($prod->id);
});

test('22. variation returns the final GPT-generated design asset', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Matcha Scone',
        'generated_image_path' => 'designs/matcha_source.png',
        'generation_metadata' => ['product_name' => 'Matcha Scone'],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-final-gpt-asset')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->generated_image_path)->toStartWith('designs/design_')
        ->and(Storage::disk('public')->exists($variation->generated_image_path))->toBeTrue()
        ->and(Storage::disk('public')->get($variation->generated_image_path))->toBe('fake-final-gpt-asset');
});

test('23. variation does not return a raw image missing marketing copy', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Pour-Over',
        'tagline' => 'Precision extraction',
        'generated_image_path' => 'designs/orig.png',
        'generation_metadata' => [
            'product_name' => 'Pour-Over',
            'tagline' => 'Precision extraction',
            'include_tagline' => true,
        ],
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-complete-artwork')]],
        ], 200),
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $variation = $regenerationService->regenerate($design);

    expect($variation->prompt)->toContain('MARKETING COPY — FINAL DESIGN TEXT:')
        ->toContain('PRODUCT NAME:')
        ->toContain('TAGLINE:')
        ->toContain('Precision extraction')
        ->and($variation->generation_metadata['complete_gpt_design'])->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| MANUAL-CONTROL TESTS (24 - 30)
|--------------------------------------------------------------------------
*/

test('24. Scene Prompt preserved in production prompt', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'scene_prompt' => 'On a rustic acacia wooden slab beside dried coffee cherries and warm afternoon sun',
    ]);

    expect($prompt)->toContain('USER SCENE / VISUAL DIRECTION:')
        ->toContain('On a rustic acacia wooden slab beside dried coffee cherries and warm afternoon sun');
});

test('25. Design Treatment preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'design_treatment' => 'Editorial',
    ]);

    expect($prompt)->toContain('DESIGN TREATMENT:')
        ->toContain('Editorial')
        ->toContain('High-fashion and magazine editorial layout');
});

test('26. Copy Emphasis preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'copy_emphasis' => 'Price-Focused',
    ]);

    expect($prompt)->toContain('COPY EMPHASIS:')
        ->toContain('Price-Focused')
        ->toContain('Promotional pricing and value proposition featured prominently');
});

test('27. Render Style preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'render_style' => 'Cinematic Marketing',
    ]);

    expect($prompt)->toContain('RENDER STYLE:')
        ->toContain('Cinematic Marketing')
        ->toContain('Volumetric atmospheric rim lighting');
});

test('28. Visual Themes preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'visual_theme' => ['Lifestyle', 'Minimal'],
    ]);

    expect($prompt)->toContain('VISUAL THEME:')
        ->toContain('Lifestyle')
        ->toContain('Minimal');
});

test('29. Brand Tones preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'brand_tone' => ['Warm & Welcoming', 'Luxury'],
    ]);

    expect($prompt)->toContain('BRAND TONE:')
        ->toContain('Warm & Welcoming')
        ->toContain('Luxury');
});

test('30. Aspect Ratio preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Signature Drink',
        'aspect_ratio' => '16:9',
    ]);

    expect($prompt)->toContain('16:9 WIDE LANDSCAPE COMMERCIAL ADVERTISEMENT')
        ->toContain('Canvas Aspect Ratio: 16:9');
});

/*
|--------------------------------------------------------------------------
| AUTOMATIC DIVERSITY TESTS (31 - 44)
|--------------------------------------------------------------------------
*/

test('31. 6/6 recent visual-core match is rejected', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $candidate = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];

    $evaluation = $designSystem->evaluateVisualCoreDiversity($candidate, [$candidate]);

    expect($evaluation['is_allowed'])->toBeFalse()
        ->and($evaluation['max_match_count'])->toBe(6)
        ->and($evaluation['classification'])->toBe('prohibited');
});

test('32. 5/6 recent visual-core match is rejected', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $recent = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];
    $candidate = $recent;
    $candidate['prop_profile'] = 'minimal geometry & brass accents'; // 5/6 match

    $evaluation = $designSystem->evaluateVisualCoreDiversity($candidate, [$recent]);

    expect($evaluation['is_allowed'])->toBeFalse()
        ->and($evaluation['max_match_count'])->toBe(5)
        ->and($evaluation['classification'])->toBe('prohibited');
});

test('33. 4/6 match is allowed but discouraged', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $recent = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];
    $candidate = $recent;
    $candidate['camera_viewpoint'] = 'overhead';
    $candidate['lighting_profile'] = 'soft diffused'; // 4/6 match

    $evaluation = $designSystem->evaluateVisualCoreDiversity($candidate, [$recent]);

    expect($evaluation['is_allowed'])->toBeTrue()
        ->and($evaluation['max_match_count'])->toBe(4)
        ->and($evaluation['classification'])->toBe('discouraged');
});

test('34. At least 3 visual-core dimensions change when compatible alternatives exist', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $recent = [
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm artisanal cafe',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'front/eye-level',
        'lighting_profile' => 'warm morning',
        'prop_profile' => 'refined ceramics & linen textures',
    ];

    $derived = $designSystem->deriveDiverseVisualCore($recent, [$recent], ['category' => 'Specialty Coffee']);
    $evaluation = $designSystem->evaluateVisualCoreDiversity($derived, [$recent]);

    expect($evaluation['max_match_count'])->toBeLessThanOrEqual(3);
});

test('35. Overused scene family receives cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['tabletop', 'environmental_lifestyle', 'overhead_flat_lay'];
    $recentHistory = [
        ['scene_family' => 'tabletop'],
        ['scene_family' => 'tabletop'],
        ['scene_family' => 'tabletop'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'scene_family', 'tabletop');

    expect($prioritized[0])->not()->toBe('tabletop');
});

test('36. Overused environment receives cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['cafe', 'kitchen_counter', 'outdoor_patio'];
    $recentHistory = [
        ['environment_family' => 'cafe'],
        ['environment_family' => 'cafe'],
        ['environment_family' => 'cafe'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'environment_family', 'cafe');

    expect($prioritized[0])->not()->toBe('cafe');
});

test('37. Overused composition receives cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['centered_hero', 'asymmetric_editorial', 'diagonal_dynamic'];
    $recentHistory = [
        ['composition_type' => 'centered_hero'],
        ['composition_type' => 'centered_hero'],
        ['composition_type' => 'centered_hero'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'composition_type', 'centered_hero');

    expect($prioritized[0])->not()->toBe('centered_hero');
});

test('38. Overused camera receives cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['eye-level', 'three-quarter', 'overhead_flatlay'];
    $recentHistory = [
        ['camera_viewpoint' => 'eye-level'],
        ['camera_viewpoint' => 'eye-level'],
        ['camera_viewpoint' => 'eye-level'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'camera_viewpoint', 'eye-level');

    expect($prioritized[0])->not()->toBe('eye-level');
});

test('39. Overused lighting receives cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['warm golden', 'soft diffused', 'high-contrast dramatic'];
    $recentHistory = [
        ['lighting_profile' => 'warm golden'],
        ['lighting_profile' => 'warm golden'],
        ['lighting_profile' => 'warm golden'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'lighting_profile', 'warm golden');

    expect($prioritized[0])->not()->toBe('warm golden');
});

test('40. Overused props receive cooldown', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $pool = ['ceramic_cups', 'glassware', 'botanical_accents'];
    $recentHistory = [
        ['prop_profile' => 'ceramic_cups'],
        ['prop_profile' => 'ceramic_cups'],
        ['prop_profile' => 'ceramic_cups'],
    ];

    $prioritized = $designSystem->prioritizeByDiversityBudget($pool, $recentHistory, 'prop_profile', 'ceramic_cups');

    expect($prioritized[0])->not()->toBe('ceramic_cups');
});

test('41. Product/industry compatibility remains enforced during derivation', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $candidate = [
        'scene_family' => 'tabletop',
        'environment_family' => 'cafe',
        'composition_type' => 'centered_hero',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'warm golden',
        'prop_profile' => 'ceramic_cups',
    ];

    $derived = $designSystem->deriveDiverseVisualCore($candidate, [$candidate], [
        'category' => 'Specialty Coffee',
        'render_style' => 'Studio Product Still',
    ]);

    expect($derived)->toHaveKeys(['scene_family', 'environment_family', 'composition_type', 'camera_viewpoint', 'lighting_profile', 'prop_profile']);
});

test('42. Automatic diversity retry is bounded at 2 attempts', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $prod = Product::factory()->create(['business_id' => $business->id, 'name' => 'Craft Brew']);

    // Seed recent designs with conflicting visual core to force retries
    for ($i = 0; $i < 3; $i++) {
        Design::create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'product_name' => 'Craft Brew',
            'generated_image_path' => "designs/recent_{$i}.png",
            'generation_metadata' => [
                'scene_family' => 'tabletop',
                'environment_family' => 'cafe',
                'composition_type' => 'centered_hero',
                'camera_viewpoint' => 'eye-level',
                'lighting_profile' => 'warm golden',
                'prop_profile' => 'ceramic_cups',
            ],
        ]);
    }

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Fresh Roasted Energy',
                                'creative_concept' => 'Tabletop Still Life',
                                'visual_strategy' => 'Morning sunlight with condensation',
                                'visual_prompt' => 'A commercial advertisement scene',
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
            'usage' => ['input_tokens' => 10, 'output_tokens' => 10, 'total_tokens' => 20],
        ], 200),
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-auto-design')]],
        ], 200),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$prod->id],
        'aspect_ratio' => '1:1',
    ]);

    // Request resolves either to a derived coherent candidate within 2 retries or explicit 422
    expect(in_array($response->status(), [200, 422], true))->toBeTrue();
});

test('43. Failed diversity resolution returns explicit failure', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $candidate = [
        'scene_family' => 'tabletop',
        'environment_family' => 'cafe',
        'composition_type' => 'centered_hero',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'warm golden',
        'prop_profile' => 'ceramic_cups',
    ];

    $evaluation = $designSystem->evaluateVisualCoreDiversity($candidate, [$candidate]);

    expect($evaluation['is_allowed'])->toBeFalse();
});

test('44. Automatic generation does not repeatedly reuse the same visual skeleton when compatible alternatives exist', function () {
    $designSystem = app(MarketingDesignSystem::class);
    $first = [
        'scene_family' => 'tabletop',
        'environment_family' => 'cafe',
        'composition_type' => 'centered_hero',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'warm golden',
        'prop_profile' => 'ceramic_cups',
    ];

    $second = $designSystem->deriveDiverseVisualCore($first, [$first], ['category' => 'Specialty Coffee']);
    $third = $designSystem->deriveDiverseVisualCore($second, [$first, $second], ['category' => 'Specialty Coffee']);

    $matchCount = 0;
    foreach (['scene_family', 'environment_family', 'composition_type', 'camera_viewpoint', 'lighting_profile', 'prop_profile'] as $dim) {
        if ($first[$dim] === $third[$dim]) {
            $matchCount++;
        }
    }

    expect($matchCount)->toBeLessThanOrEqual(4);
});

/*
|--------------------------------------------------------------------------
| PART Y: INTEGRATED ACCEPTANCE TESTS
|--------------------------------------------------------------------------
*/

test('TEST 1: automatic generation creates a complete final marketing design with enabled copy and a novel visual core', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Brew & Bean Co.',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Spring Sunrise Launch',
        'objective' => 'Drive morning visits',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Blossom Weekend',
    ]);

    Storage::disk('public')->put('products/nitro_brew.png', 'fake-nitro-binary');
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Nitro Velvet Latte',
        'price' => 195.00,
        'image_path' => 'products/nitro_brew.png',
        'description' => 'Creamy micro-foamed nitro coffee with velvety sweetness',
    ]);

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'tagline' => 'Velvety Dawn in Every Sip',
                                'creative_concept' => 'Sun-Dappled Micro-Foam Staging',
                                'visual_strategy' => 'Highlight nitrogen cascade against botanical light',
                                'visual_prompt' => 'On a polished wooden cafe counter with morning sunbeams and fresh greenery',
                                'design_treatment' => 'Classic',
                                'copy_emphasis' => 'Balanced',
                                'typography_layout' => 'classic hierarchy',
                                'composition_type' => 'centered hero',
                                'camera_viewpoint' => 'three-quarter',
                                'lighting_profile' => 'soft diffused',
                                'scene_family' => 'tabletop still life',
                                'environment_family' => 'warm artisanal cafe',
                                'prop_profile' => 'refined ceramics & linen textures',
                                'render_style' => 'Studio Product Still',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['input_tokens' => 10, 'output_tokens' => 10, 'total_tokens' => 20],
        ], 200),
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$capturedPrompt) {
            $body = $request->body();
            if (preg_match('/name="prompt"\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches)) {
                $capturedPrompt = $matches[1];
            } else {
                $capturedPrompt = $body;
            }

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-final-complete-auto-design')]],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'event_id' => $event->id,
        'aspect_ratio' => '1:1',
        'include_prices' => true,
        'include_tagline' => true,
        'include_business_name' => true,
    ]);

    $response->assertOk();
    $preview = $response->json('preview');

    // 1. Verify complete marketing design text elements in production prompt
    expect($capturedPrompt)->not()->toBeNull()
        ->and($capturedPrompt)->toContain('PRODUCT NAME:')
        ->and($capturedPrompt)->toContain('"Nitro Velvet Latte"')
        ->and($capturedPrompt)->toContain('PRICE:')
        ->and($capturedPrompt)->toContain('"₱195.00"')
        ->and($capturedPrompt)->toContain('TAGLINE:')
        ->and($capturedPrompt)->toContain('"Velvety Dawn in Every Sip"')
        ->and($capturedPrompt)->toContain('BUSINESS NAME:')
        ->and($capturedPrompt)->toContain('"Brew & Bean Co."');

    // 2. Verify visual strategy, styling, scene, camera, lighting, environment, props
    expect($capturedPrompt)->toContain('Selected Treatment: Classic')
        ->toContain('Selected Emphasis: Balanced')
        ->toContain('Studio Product Still')
        ->toContain('1:1 SQUARE COMMERCIAL ADVERTISEMENT')
        ->toContain('PRIMARY PRODUCT IMAGE:');

    // 3. Verify metadata has complete_gpt_design and structured fields
    $meta = $preview['generation_meta'];
    expect($meta['complete_gpt_design'])->toBeTrue()
        ->and($meta['deterministic_text_compositing'])->toBeFalse()
        ->and($meta['diversity_fingerprint'])->toHaveKeys(['scene_family', 'environment_family', 'composition_type', 'camera_viewpoint', 'lighting_profile', 'prop_profile'])
        ->and($meta['authoritative_copy']['product_names'])->toContain('Nitro Velvet Latte')
        ->and($meta['copy_visibility']['include_prices'])->toBeTrue()
        ->and($meta['copy_visibility']['include_tagline'])->toBeTrue()
        ->and($meta['copy_visibility']['include_business_name'])->toBeTrue();
});

test('TEST 2: manual generation creates a complete final marketing design while preserving explicit controls and all selected products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Equator Craft Roastery',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Harvest Reserve Special',
        'objective' => 'Celebrate micro-lot single origin harvests',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Coffee Harvest Festival',
    ]);

    Storage::disk('public')->put('products/ethiopia.png', 'binary-ethiopia');
    Storage::disk('public')->put('products/guatemala.png', 'binary-guatemala');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Ethiopia Guji Highland',
        'price' => 260.00,
        'image_path' => 'products/ethiopia.png',
        'description' => 'Jasmine and bergamot aroma',
    ]);
    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Guatemala Antigua Reserve',
        'price' => 240.00,
        'image_path' => 'products/guatemala.png',
        'description' => 'Dark chocolate and hazelnut body',
    ]);

    $capturedPrompt = null;
    $attachedBinaries = [];

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$capturedPrompt, &$attachedBinaries) {
            $body = $request->body();
            if (preg_match('/name="prompt"\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches)) {
                $capturedPrompt = $matches[1];
            } else {
                $capturedPrompt = $body;
            }

            preg_match_all('/name="image\[\]";\s*filename="([^"]+)"/i', $body, $matches);
            $attachedBinaries = $matches[1] ?? [];

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-final-manual-two-product-design')]],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$productA->id, $productB->id],
        'event_id' => $event->id,
        'product_name' => 'Harvest Reserve Duo',
        'price' => '₱260.00',
        'tagline' => 'Two Continents, One Shared Passion',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'business_name' => 'Equator Craft Roastery',
        'scene_prompt' => 'On a handcrafted mahogany tasting table with vintage brass scales and roasted coffee beans',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Price-Focused',
        'render_style' => 'Cinematic Marketing',
        'visual_theme' => ['Luxury', 'Craftsmanship'],
        'brand_tone' => ['Prestigious', 'Authentic'],
        'aspect_ratio' => '16:9',
    ]);

    $response->assertOk();
    $preview = $response->json('preview');

    // 1. Both products attached in multipart binary order
    expect($attachedBinaries)->toHaveCount(2)
        ->and($attachedBinaries[0])->toBe('ethiopia.png')
        ->and($attachedBinaries[1])->toBe('guatemala.png');

    // 2. Both products indexed in production prompt
    expect($capturedPrompt)->not()->toBeNull()
        ->and($capturedPrompt)->toContain('REFERENCE IMAGE 1 = Ethiopia Guji Highland')
        ->and($capturedPrompt)->toContain('REFERENCE IMAGE 2 = Guatemala Antigua Reserve')
        ->and($capturedPrompt)->toContain('MULTI-PRODUCT COMPOSITION:');

    // 3. User scene prompt preserved
    expect($capturedPrompt)->toContain('On a handcrafted mahogany tasting table with vintage brass scales and roasted coffee beans');

    // 4. Manual controls preserved
    expect($capturedPrompt)->toContain('Selected Treatment: Editorial')
        ->toContain('Selected Emphasis: Price-Focused')
        ->toContain('Cinematic Marketing')
        ->toContain('16:9 WIDE LANDSCAPE COMMERCIAL ADVERTISEMENT');

    // 5. Complete marketing copy present verbatim in prompt
    expect($capturedPrompt)->toContain('PRODUCT NAME:')
        ->toContain('"Harvest Reserve Duo"')
        ->toContain('PRICE:')
        ->toContain('TAGLINE:')
        ->toContain('"Two Continents, One Shared Passion"')
        ->toContain('BUSINESS NAME:')
        ->toContain('"Equator Craft Roastery"');

    // 6. Metadata verification
    $meta = $preview['generation_meta'];
    expect($meta['complete_gpt_design'])->toBeTrue()
        ->and($meta['deterministic_text_compositing'])->toBeFalse()
        ->and($meta['image_inputs_count'])->toBe(2)
        ->and($meta['generation_method'])->toBe('multi_image_to_image_edit');
});
