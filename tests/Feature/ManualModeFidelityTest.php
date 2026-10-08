<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ImageCompositorService;
use App\Services\MarketingDesignSystem;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-key-for-manual-fidelity']);
    config(['services.openai.budget_limit' => 100.00]);
});

test('manual mode attaches both catalog product images in exact order A then B without omitting product B', function () {
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
        'name' => 'Coffee Pairing Fest',
        'objective' => 'Promote afternoon pairing bundle',
    ]);

    Storage::disk('public')->put('products/iced_latte.png', 'fake-binary-iced-latte');
    Storage::disk('public')->put('products/blueberry_muffin.png', 'fake-binary-blueberry-muffin');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Latte',
        'price' => 150.00,
        'image_path' => 'products/iced_latte.png',
        'description' => 'Cold brewed espresso with steamed oat milk',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Blueberry Muffin',
        'price' => 120.00,
        'image_path' => 'products/blueberry_muffin.png',
        'description' => 'Freshly baked organic blueberry muffin',
    ]);

    $interceptedRequest = null;
    $attachedFilenames = [];

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedRequest, &$attachedFilenames) {
            $interceptedRequest = $request;

            // In multipart requests, examine the body or parts
            $body = $request->body();
            if (str_contains($body, 'iced_latte.png')) {
                $attachedFilenames[] = 'iced_latte.png';
            }
            if (str_contains($body, 'blueberry_muffin.png')) {
                $attachedFilenames[] = 'blueberry_muffin.png';
            }

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-multi-product-composite-image')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Iced Latte & Blueberry Muffin Combo',
        'catalog_product_ids' => [$productA->id, $productB->id],
        'aspect_ratio' => '1:1',
        'render_style' => 'Studio Product Still',
        'design_treatment' => 'Classic',
        'copy_emphasis' => 'Balanced',
        'camera_viewpoint' => 'three-quarter',
        'lighting_profile' => 'soft diffused',
        'scene_prompt' => 'On a rustic wooden cafe table beside morning sunlight',
        'include_prices' => true,
        'include_tagline' => true,
        'tagline' => 'Better together every afternoon',
    ]);

    $response->assertOk();

    // 1. Two image references were actually attached/provided
    expect($attachedFilenames)->toHaveCount(2)
        // 2. Request order is A then B
        ->and($attachedFilenames[0])->toBe('iced_latte.png')
        ->and($attachedFilenames[1])->toBe('blueberry_muffin.png');

    // 3. Inspect the intercepted prompt
    expect($interceptedRequest)->not()->toBeNull();
    $promptSent = '';
    // Extract prompt field from multipart
    $body = $interceptedRequest->body();
    if (preg_match('/name="prompt"\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches)) {
        $promptSent = $matches[1];
    } else {
        $promptSent = $body;
    }

    // 4. Prompt contains REFERENCE IMAGE 1 = Product A and REFERENCE IMAGE 2 = Product B
    expect($promptSent)->toContain('REFERENCE IMAGE 1 = Iced Latte')
        ->toContain('REFERENCE IMAGE 2 = Blueberry Muffin');

    // 5. No second product image is omitted before dispatch
    expect($promptSent)->toContain('Blueberry Muffin')
        ->toContain('Iced Latte')
        ->toContain('Products:');
});

test('manual mode returns HTTP 422 with metadata and refuses silent downgrade if multi-image edit fails', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Metro Cafe',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Combo Launch',
    ]);

    Storage::disk('public')->put('products/tea.png', 'binary-tea');
    Storage::disk('public')->put('products/croissant.png', 'binary-croissant');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Matcha Tea',
        'image_path' => 'products/tea.png',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Butter Croissant',
        'image_path' => 'products/croissant.png',
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/edits' => Http::response([
            'error' => ['message' => 'Multiple image attachments rejected by model endpoint.'],
        ], 400),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Matcha & Croissant',
        'catalog_product_ids' => [$productA->id, $productB->id],
        'aspect_ratio' => '1:1',
    ]);

    // Must return 422 (not 200 with silent one-product result)
    $response->assertStatus(422)
        ->assertJsonPath('success', false);

    $responseData = $response->json();
    expect($responseData['message'])->toContain('Multiple product reference generation could not be completed')
        ->and($responseData['metadata']['attempted_reference_count'])->toBe(2)
        ->and($responseData['metadata']['actual_reference_count'])->toBe(0)
        ->and($responseData['metadata']['generation_method'])->toBe('multi_image_to_image_failed');
});

test('modular prompt orchestrator builds complete canonical commercial architecture with all required blocks', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $designSystem = new MarketingDesignSystem;

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kape Isla',
        'industry' => 'Beverage & Hospitality',
        'category' => 'Coffee & Tea',
    ]);

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Barako Cold Brew',
        'price' => '₱130',
        'tagline' => 'Bold heritage in every drop',
        'campaign_name' => 'Heritage Coffee Month',
        'campaign_objective' => 'Drive awareness for local beans',
        'event_name' => 'Philippine Independence Day',
        'user_prompt' => 'On a handcrafted bamboo tray beside fresh green coffee leaves and warm sun rays',
        'render_style' => 'Editorial Lifestyle Campaign',
        'design_treatment' => 'Bold Commercial',
        'copy_emphasis' => 'Headline-First',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'golden hour',
        'visual_theme' => ['Product-focused', 'Minimal'],
        'brand_tone' => ['Bold', 'Authentic'],
        'include_prices' => true,
        'include_tagline' => true,
        'include_business_name' => false,
        'aspect_ratio' => '1:1',
    ], $business);

    // Verify all required blocks exist in compact manual architecture
    expect($prompt)->toContain('Create a marketing image')
        ->toContain('Business context:')
        ->toContain('Campaign: Heritage Coffee Month')
        ->toContain('Event: Philippine Independence Day')
        ->toContain('Product')
        ->toContain('Creative direction')
        ->toContain('RULES:');

    // Verify creative controls are present in compact manual architecture
    expect($prompt)->toContain('Copy emphasis: Headline-First')
        ->toContain('Editorial Lifestyle Campaign');

    // Verify business branding rule: disabled when include_business_name is false
    expect($prompt)->toContain('Business Branding: Disabled. Do not include any business/shop name or branding text in the artwork.');

    // Verify cleanliness rule
    expect($prompt)->toContain('Do not create logos, badges, or watermarks.');
});

test('manual generation preserves all explicit creative controls and all selected catalog references', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Roasters PH',
        'industry' => 'Food & Beverage',
        'category' => 'Specialty Coffee',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Philippine Coffee Day',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Artisan Reserve 2026',
        'objective' => 'Celebrate specialty craft harvest',
    ]);

    Storage::disk('public')->put('products/ethiopia_single_origin.png', 'binary-ethiopia-roast');
    Storage::disk('public')->put('products/colombia_supremo.png', 'binary-colombia-roast');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Ethiopia Yirgacheffe',
        'price' => 280.00,
        'image_path' => 'products/ethiopia_single_origin.png',
        'description' => 'Floral notes with citrus acidity',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Colombia Supremo',
        'price' => 250.00,
        'image_path' => 'products/colombia_supremo.png',
        'description' => 'Caramel sweetness with nutty finish',
    ]);

    $interceptedRequest = null;
    $attachedFilenames = [];

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedRequest, &$attachedFilenames) {
            $interceptedRequest = $request;
            $body = $request->body();
            if (str_contains($body, 'ethiopia_single_origin.png')) {
                $attachedFilenames[] = 'ethiopia_single_origin.png';
            }
            if (str_contains($body, 'colombia_supremo.png')) {
                $attachedFilenames[] = 'colombia_supremo.png';
            }

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-binary-two-product-image')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_name' => 'Artisan Dual Reserve',
        'catalog_product_ids' => [$productA->id, $productB->id],
        'scene_prompt' => 'Sunlit mahogany tasting bar with hand-turned ceramic dripper and spilled green coffee beans',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Price-Focused',
        'render_style' => 'Cinematic Marketing',
        'visual_theme' => ['Lifestyle', 'Storytelling'],
        'brand_tone' => ['Luxury', 'Inspiring'],
        'include_tagline' => true,
        'tagline' => 'Mastery in Every Single Pour',
        'include_prices' => true,
        'price' => '280.00',
        'include_business_name' => true,
        'business_name' => 'Artisan Roasters PH',
        'aspect_ratio' => '16:9',
    ]);

    $response->assertOk();

    // 1. Verify two images sent in order A then B
    expect($attachedFilenames)->toHaveCount(2)
        ->and($attachedFilenames[0])->toBe('ethiopia_single_origin.png')
        ->and($attachedFilenames[1])->toBe('colombia_supremo.png');

    // 2. Verify all explicit controls represented in the production prompt sent to OpenAI
    expect($interceptedRequest)->not()->toBeNull();
    $body = $interceptedRequest->body();
    $promptSent = preg_match('/name="prompt"\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches) ? $matches[1] : $body;

    // Both products indexed and co-present
    expect($promptSent)->toContain('REFERENCE IMAGE 1 = Ethiopia Yirgacheffe')
        ->toContain('REFERENCE IMAGE 2 = Colombia Supremo')
        ->toContain('Products:')
        ->toContain('All selected products must appear together naturally in the final marketing scene');

    // Distinctive scene prompt
    expect($promptSent)->toContain('Sunlit mahogany tasting bar with hand-turned ceramic dripper and spilled green coffee beans');

    // Canonical copy emphasis and render style
    expect($promptSent)->toContain('Copy emphasis: Price-Focused')
        ->toContain('Cinematic Marketing');

    // Tagline, Prices, Business Name, Campaign, Event, Aspect Ratio
    expect($promptSent)->toContain('Tagline: "Mastery in Every Single Pour"')
        ->toContain('Artisan Roasters PH')
        ->toContain('Ethiopia Yirgacheffe — ₱280.00')
        ->toContain('Colombia Supremo — ₱250.00')
        ->toContain('Artisan Reserve 2026')
        ->toContain('Philippine Coffee Day')
        ->toContain('16:9');

    // 3. Inspect final response payload and generation metadata
    $data = $response->json();
    expect($data['success'])->toBeTrue();

    $preview = $data['preview'];
    expect($preview['tagline'])->toBe('Mastery in Every Single Pour')
        ->and($preview['aspect_ratio'])->toBe('16:9')
        ->and($preview['product_name'])->toBe('Artisan Dual Reserve');

    $meta = $preview['generation_meta'];
    expect($meta['design_treatment'])->toBe('Editorial')
        ->and($meta['copy_emphasis'])->toBe('Price-Focused')
        ->and($meta['aspect_ratio'])->toBe('16:9')
        ->and($meta['image_inputs_count'])->toBe(2)
        ->and($meta['actual_reference_count'])->toBe(2)
        ->and($meta['generation_method'])->toBe('multi_image_to_image_edit')
        ->and($meta['authoritative_text_layers']['tagline'])->toBe('Mastery in Every Single Pour')
        ->and($meta['authoritative_text_layers']['brand_name'])->toBe('Artisan Roasters PH')
        ->and($meta['authoritative_text_layers']['price'])->toContain('₱280.00');
});

test('a manual prompt does not inject bloated design treatment essays', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $business = Business::factory()->create();

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Single Origin',
        'design_treatment' => 'Editorial',
    ], $business);

    expect($prompt)->not()->toContain('Selected Treatment:')
        ->toContain('Single Origin');
});

test('a manual render style cannot be replaced by an automatic default', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $business = Business::factory()->create();

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Single Origin',
        'render_style' => 'Cinematic Marketing',
    ], $business);

    expect($prompt)->toContain('Cinematic Marketing')
        ->not()->toContain('Studio Product Still');
});

test('a manual prompt does not inject bloated brand tone essays', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $business = Business::factory()->create();

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Single Origin',
        'brand_tone' => ['Luxury', 'Playful'],
    ], $business);

    expect($prompt)->not()->toContain('BRAND TONE:')
        ->not()->toContain('Luxury: Exclusive, prestigious')
        ->not()->toContain('Playful: Vibrant, whimsical')
        ->toContain('Single Origin');
});

test('a manual prompt does not inject bloated visual theme essays', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $business = Business::factory()->create();

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Single Origin',
        'visual_theme' => ['Seasonal', 'Storytelling'],
    ], $business);

    expect($prompt)->not()->toContain('VISUAL THEME:')
        ->not()->toContain('Seasonal: Thematic seasonal props')
        ->not()->toContain('Storytelling: Rich narrative visual depth')
        ->toContain('Single Origin');
});

test('a manual scene prompt cannot disappear', function () {
    $orchestrator = new ModularPromptOrchestrator;
    $business = Business::factory()->create();

    $distinctiveInstruction = 'Staged on hand-carved mahogany wood beside smoking palo santo and rain drops';

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Specialty Roast',
        'scene_prompt' => $distinctiveInstruction,
    ], $business);

    expect($prompt)->toContain('Creative direction:')
        ->toContain($distinctiveInstruction);
});

test('a custom manual tagline reaches the compositor', function () {
    $compositor = app(ImageCompositorService::class);
    $business = Business::factory()->create(['name' => 'Kape Roasters']);

    $layout = $compositor->buildDeterministicLayoutProperties(1024, 1024, [
        'product_name' => 'Specialty Espresso',
        'include_tagline' => true,
        'tagline' => 'Crafted with Passion Every Sunrise',
        'include_business_name' => true,
        'business_name' => 'Kape Roasters',
        'include_prices' => true,
        'price' => '175.00',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Balanced',
    ], $business);

    expect($layout['exact_content']['tagline'])->toBe('Crafted with Passion Every Sunrise')
        ->and($layout['exact_content']['brand_name'])->toBe('Kape Roasters')
        ->and($layout['exact_content']['price'])->toBe('₱175.00')
        ->and($layout['exact_content']['product_name'])->toBe('Specialty Espresso')
        ->and($layout['treatment'])->toBe('Editorial')
        ->and($layout['emphasis'])->toBe('Balanced');
});

test('a second selected catalog product cannot disappear before OpenAI dispatch', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/prod_1.png', 'fake-img-1');
    Storage::disk('public')->put('products/prod_2.png', 'fake-img-2');

    $prod1 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Cold Brew Bottle',
        'image_path' => 'products/prod_1.png',
    ]);
    $prod2 = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Almond Croissant',
        'image_path' => 'products/prod_2.png',
    ]);

    $dispatchedFilenames = [];
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$dispatchedFilenames) {
            $body = $request->body();
            if (str_contains($body, 'prod_1.png')) {
                $dispatchedFilenames[] = 'prod_1.png';
            }
            if (str_contains($body, 'prod_2.png')) {
                $dispatchedFilenames[] = 'prod_2.png';
            }

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-composite-result')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Breakfast Duo',
        'catalog_product_ids' => [$prod1->id, $prod2->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();
    expect($dispatchedFilenames)->toBe(['prod_1.png', 'prod_2.png']);
});

test('multi-image API failure cannot silently become a one-product success', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('products/a.png', 'img-a');
    Storage::disk('public')->put('products/b.png', 'img-b');

    $pA = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/a.png']);
    $pB = Product::factory()->create(['business_id' => $business->id, 'image_path' => 'products/b.png']);

    Http::fake([
        'https://api.openai.com/v1/images/edits' => Http::response([
            'error' => ['message' => 'Multiple image input format rejected.'],
        ], 400),
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Combo Pack',
        'catalog_product_ids' => [$pA->id, $pB->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertStatus(422);
    $json = $response->json();
    expect($json['success'])->toBeFalse()
        ->and($json['metadata']['generation_method'])->toBe('multi_image_to_image_failed')
        ->and($json['metadata']['actual_reference_count'])->toBe(0)
        ->and($json['metadata']['attempted_reference_count'])->toBe(2);
});

test('compositor input contract explicitly receives all manual creative controls', function () {
    $compositor = app(ImageCompositorService::class);
    $business = Business::factory()->create(['name' => 'Soleil Cafe']);

    $manualParams = [
        'product_name' => 'Iced Spanish Latte',
        'business_name' => 'Soleil Cafe',
        'tagline' => 'Sunlight in Every Sip',
        'price' => '180.00',
        'include_tagline' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'design_treatment' => 'Bold Commercial',
        'copy_emphasis' => 'Price-Focused',
        'aspect_ratio' => '4:5',
    ];

    $layout = $compositor->buildDeterministicLayoutProperties(1024, 1280, $manualParams, $business);

    expect($layout['exact_content']['product_name'])->toBe('Iced Spanish Latte')
        ->and($layout['exact_content']['brand_name'])->toBe('Soleil Cafe')
        ->and($layout['exact_content']['tagline'])->toBe('Sunlight in Every Sip')
        ->and($layout['exact_content']['price'])->toBe('₱180.00')
        ->and($layout['treatment'])->toBe('Bold Commercial')
        ->and($layout['emphasis'])->toBe('Price-Focused')
        ->and($layout['canvas']['aspect_ratio'])->toBe('4:5')
        ->and($layout['safe_margins']['margin_percent'])->toBe(20)
        ->and($layout['layout_properties']['safe_margins_respected'])->toBeTrue();
});

test('multi-product request boundary enforces image array field, order, and full reference metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Roast Co',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Storage::disk('public')->put('products/prod_alpha.png', 'binary-alpha');
    Storage::disk('public')->put('products/prod_beta.png', 'binary-beta');

    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Product Alpha',
        'image_path' => 'products/prod_alpha.png',
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Product Beta',
        'image_path' => 'products/prod_beta.png',
    ]);

    $interceptedRequest = null;
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedRequest) {
            $interceptedRequest = $request;

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-multi-image-result')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Alpha & Beta Bundle',
        'catalog_product_ids' => [$prodA->id, $prodB->id],
        'aspect_ratio' => '1:1',
    ]);

    $response->assertOk();

    expect($interceptedRequest)->not()->toBeNull();
    $body = $interceptedRequest->body();

    // 1. Exact catalog_product_ids count = 2
    $json = $response->json();
    expect($json['preview']['catalog_product_ids'])->toHaveCount(2)
        ->and($json['preview']['catalog_product_ids'])->toBe([$prodA->id, $prodB->id]);

    // 2. Exact reference image path count = 2
    expect($json['preview']['reference_image_paths'])->toHaveCount(2)
        ->and($json['preview']['reference_image_paths'])->toBe(['products/prod_alpha.png', 'products/prod_beta.png']);

    // 3. Exact binary attachment count = 2, actual multipart field = image[], order = Product A, Product B
    preg_match_all('/name="([^"]+)"(?:;\s*filename="([^"]+)")?/i', $body, $matches, PREG_SET_ORDER);
    $attachments = [];
    foreach ($matches as $match) {
        if (! empty($match[2])) {
            $attachments[] = [
                'field' => $match[1],
                'filename' => $match[2],
            ];
        }
    }

    expect($attachments)->toHaveCount(2)
        ->and($attachments[0]['field'])->toBe('image[]')
        ->and($attachments[0]['filename'])->toBe('prod_alpha.png')
        ->and($attachments[1]['field'])->toBe('image[]')
        ->and($attachments[1]['filename'])->toBe('prod_beta.png');

    // 4. Prompt contains both indexed references
    expect($body)->toContain('REFERENCE IMAGE 1 = Product Alpha')
        ->toContain('REFERENCE IMAGE 2 = Product Beta');

    // 5. Generation metadata says image_inputs_count = 2 and generation_method = multi_image_to_image_edit
    $meta = $json['preview']['generation_meta'];
    expect($meta['image_inputs_count'])->toBe(2)
        ->and($meta['actual_reference_count'])->toBe(2)
        ->and($meta['attempted_reference_count'])->toBe(2)
        ->and($meta['generation_method'])->toBe('multi_image_to_image_edit')
        ->and($meta['fallback_used'])->toBeFalse();
});

test('multi-product compositor contract supports primary product, co-featured products, and pricing state without collapsing', function () {
    $compositor = app(ImageCompositorService::class);
    $business = Business::factory()->create(['name' => 'Artisan Craft Cafe']);

    // Multi-product input with prices enabled
    $multiParams = [
        'primary_product' => [
            'name' => 'Pour-Over Reserve',
            'price' => '160.00',
        ],
        'co_featured_products' => [
            [
                'name' => 'Matcha Scone',
                'price' => '110.00',
            ],
        ],
        'custom_products' => [
            [
                'name' => 'Handcrafted Ceramic Mug',
                'price' => '350.00',
            ],
        ],
        'business_name' => 'Artisan Craft Cafe',
        'tagline' => 'Handcrafted Excellence in Every Detail',
        'include_business_name' => true,
        'include_tagline' => true,
        'include_prices' => true,
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Price-Focused',
        'aspect_ratio' => '1:1',
    ];

    $manifest = $compositor->generateCompositingManifest($multiParams, $business);

    // Verify multi-product structure preserved without collapsing
    expect($manifest['primary_product']['name'])->toBe('Pour-Over Reserve')
        ->and($manifest['co_featured_products'])->toHaveCount(1)
        ->and($manifest['co_featured_products'][0]['name'])->toBe('Matcha Scone')
        ->and($manifest['custom_products'])->toHaveCount(1)
        ->and($manifest['custom_products'][0]['name'])->toBe('Handcrafted Ceramic Mug')
        ->and($manifest['selected_products'])->toHaveCount(3)
        ->and($manifest['prices'])->toHaveKey('Pour-Over Reserve', '₱160.00')
        ->and($manifest['prices'])->toHaveKey('Matcha Scone', '₱110.00')
        ->and($manifest['prices'])->toHaveKey('Handcrafted Ceramic Mug', '₱350.00')
        // Backward compatibility
        ->and($manifest['exact_content']['product_name'])->toBe('Pour-Over Reserve')
        ->and($manifest['exact_content']['price'])->toBe('₱160.00')
        ->and($manifest['exact_content']['tagline'])->toBe('Handcrafted Excellence in Every Detail')
        ->and($manifest['exact_content']['brand_name'])->toBe('Artisan Craft Cafe');

    // Multi-product input with prices DISABLED: products MUST remain selected, only price layers disabled
    $noPriceParams = $multiParams;
    $noPriceParams['include_prices'] = false;

    $noPriceManifest = $compositor->generateCompositingManifest($noPriceParams, $business);

    expect($noPriceManifest['primary_product']['name'])->toBe('Pour-Over Reserve')
        ->and($noPriceManifest['co_featured_products'])->toHaveCount(1)
        ->and($noPriceManifest['co_featured_products'][0]['name'])->toBe('Matcha Scone')
        ->and($noPriceManifest['selected_products'])->toHaveCount(3)
        ->and($noPriceManifest['prices'])->toBeEmpty()
        ->and($noPriceManifest['exact_content']['price'])->toBeNull();

    // Single-product backward compatibility verification
    $singleParams = [
        'product_name' => 'Single Espresso',
        'price' => '100.00',
        'include_prices' => true,
        'aspect_ratio' => '1:1',
    ];
    $singleManifest = $compositor->generateCompositingManifest($singleParams, $business);

    expect($singleManifest['primary_product']['name'])->toBe('Single Espresso')
        ->and($singleManifest['co_featured_products'])->toBeEmpty()
        ->and($singleManifest['exact_content']['product_name'])->toBe('Single Espresso')
        ->and($singleManifest['exact_content']['price'])->toBe('₱100.00');
});

test('campaign linked event is authoritative and unrelated request event_id cannot override it', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'The Learning Corner PH',
        'industry' => 'Education & Books',
        'category' => 'Educational Supplies',
    ]);

    $teachersDay = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "National Teachers' Day",
    ]);

    $newYearsDay = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "New Year's Day",
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $teachersDay->id,
        'name' => "National Teachers' Day Campaign",
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Gratitude Journal Gift Set',
        'price' => 450.00,
        'image_path' => 'products/journal.png',
    ]);
    Storage::disk('public')->put('products/journal.png', 'binary-journal');

    $interceptedRequest = null;
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedRequest) {
            $interceptedRequest = $request;

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-image')],
                ],
            ], 200);
        },
    ]);

    // Send request with mismatched event_id pointing to New Year's Day
    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'event_id' => $newYearsDay->id,
        'product_name' => 'Gratitude Journal Gift Set',
        'catalog_product_ids' => [$product->id],
        'aspect_ratio' => '1:1',
        'render_style' => 'Studio Product Still',
        'scene_prompt' => 'Show the journal beside a handcrafted wooden pen on a desk',
    ]);

    $response->assertOk();

    expect($interceptedRequest)->not()->toBeNull();
    $body = $interceptedRequest->body();
    $promptSent = preg_match('/name="prompt"\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches) ? $matches[1] : $body;

    // Must contain the campaign's linked event "National Teachers' Day"
    expect($promptSent)->toContain("Event: National Teachers' Day")
        // MUST NOT contain the unrelated requested event "New Year's Day"
        ->not()->toContain("New Year's Day");
});

test('user creative prompt remains direct and is not expanded into camera or lighting essays', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Roasters PH',
    ]);

    $userDirection = 'Show the coffee beside a warm pastry on a rustic cafe table.';

    $prompt = $orchestrator->orchestrate([
        'generation_mode' => 'manual',
        'product_name' => 'Pour-Over Reserve',
        'scene_prompt' => $userDirection,
        'render_style' => 'Studio Product Still',
        'copy_emphasis' => 'Balanced',
        'aspect_ratio' => '1:1',
    ], $business);

    // Creative direction contains user's exact input
    expect($prompt)->toContain('Creative direction')
        ->toContain($userDirection)
        // Must NOT contain technical camera, lighting, or composition bloat
        ->not()->toContain('f/2.8')
        ->not()->toContain('50mm lens')
        ->not()->toContain('three-point lighting')
        ->not()->toContain('golden ratio grid')
        ->not()->toContain('depth of field calculation')
        ->not()->toContain('VISUAL THEME:')
        ->not()->toContain('BRAND TONE:');
});
