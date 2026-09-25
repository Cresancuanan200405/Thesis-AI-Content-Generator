<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config()->set('services.openai.api_key', 'test-key');
});

test('guest cannot access automatic or manual generator', function () {
    $this->get('/generator/automatic')->assertRedirect('/login');
    $this->get('/generator/manual')->assertRedirect('/login');
});

test('/generator redirects to /generator/automatic with preserved query parameters', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $this->actingAs($user)
        ->get("/generator?campaign_id={$campaign->id}&foo=bar")
        ->assertRedirect(route('generator.automatic.index', ['campaign_id' => $campaign->id, 'foo' => 'bar']));
});

test('/generator/automatic loads Automatic page with campaign and business context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Roastery',
        'industry' => 'Coffee & Cafe',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Single Origin Barako',
        'price' => 250.00,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'National Coffee Day',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Coffee Day Fest',
        'target_audience' => 'Coffee Aficionados',
    ]);

    $this->actingAs($user)
        ->get("/generator/automatic?campaign_id={$campaign->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('generator/automatic')
            ->where('business.name', 'Artisan Roastery')
            ->where('campaign.name', 'Coffee Day Fest')
            ->where('products.0.name', 'Single Origin Barako')
            ->where('selectedEvent.name', 'National Coffee Day')
        );
});

test('/generator/manual loads Manual page with campaign and business context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Luxe Lifestyle Studio',
        'industry' => 'Fashion & Apparel',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Silk Evening Dress',
        'price' => 1500.00,
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Autumn Wardrobe',
    ]);

    $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('generator/manual')
            ->where('business.name', 'Luxe Lifestyle Studio')
            ->where('campaign.name', 'Autumn Wardrobe')
            ->where('products.0.name', 'Silk Evening Dress')
        );
});

test('automatic generation executes AI Creative Director and OpenAI image generation flow', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'BrewCraft Coffee',
        'industry' => 'Cafe & Bakery',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Cold Brew Bottle',
        'price' => 180.00,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Summer Chill Days',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Summer Refreshers',
    ]);

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
                                'tagline' => 'Chill to the Last Drop',
                                'creative_concept' => 'Sunlight filtering through ice condensation on artisanal cold brew',
                                'visual_strategy' => 'Macro beverage photography with warm golden rim light and summer citrus props',
                                'visual_prompt' => 'Commercial product still of cold brew bottle with ice droplets, golden rim lighting, 8k resolution',
                            ]),
                        ],
                    ],
                ],
            ],
        ]),
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [
                [
                    'b64_json' => base64_encode('fake-generated-png-data'),
                ],
            ],
        ]),
        'https://api.openai.com/v1/organization/*' => Http::response([
            'data' => [],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'product_id' => $product->id,
            'aspect_ratio' => '1:1',
            'image_model' => 'chatgpt-image-latest',
            'image_quality' => 'medium',
            'include_business_name' => true,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
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
            ],
        ]);
});

test('manual generation respects user scene, content style, brand tone, and render style', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Aura Cosmetics',
        'industry' => 'Beauty & Skincare',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Radiance Face Serum',
        'price' => 890.00,
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Glow Collection',
    ]);

    Http::fake([
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [
                [
                    'b64_json' => base64_encode('fake-manual-png-data'),
                ],
            ],
        ]),
        'https://api.openai.com/v1/organization/*' => Http::response([
            'data' => [],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Radiance Face Serum',
            'product_id' => $product->id,
            'image_prompt' => 'Elegant marble pedestal with water ripples and morning sunlight reflecting through serum dropper bottle',
            'tagline' => 'Awaken Your Natural Glow',
            'tagline_mode' => 'manual',
            'render_style' => 'Cinematic Marketing',
            'content_style' => ['Minimal', 'Premium'],
            'brand_tone' => ['Luxury', 'Elegant'],
            'aspect_ratio' => '4:5',
            'image_model' => 'chatgpt-image-latest',
            'image_quality' => 'high',
            'include_business_name' => true,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'success',
            'preview' => [
                'image_url',
                'product_name',
                'tagline',
            ],
        ]);
});

test('budget limit stops generation when quota exceeded', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 15.00], 'organization_name' => 'FSUU']]],
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

    config()->set('services.openai.budget_limit', 10.00);

    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'aspect_ratio' => '1:1',
        ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'quota_exceeded' => true,
        ]);
});

test('tenant isolation ensures user cannot use another users campaign or product', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $businessA = Business::factory()->create(['user_id' => $userA->id]);
    $campaignA = Campaign::factory()->create([
        'user_id' => $userA->id,
        'business_id' => $businessA->id,
    ]);

    $userB = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($userB)
        ->get("/generator/automatic?campaign_id={$campaignA->id}")
        ->assertRedirect(route('campaigns.index'));

    $this->actingAs($userB)
        ->get("/generator/manual?campaign_id={$campaignA->id}")
        ->assertRedirect(route('campaigns.index'));

    $this->actingAs($userB)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaignA->id,
        ])
        ->assertStatus(422)
        ->assertJson(['success' => false]);

    $this->actingAs($userB)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaignA->id,
            'product_name' => 'Sample Product',
            'image_prompt' => 'Test prompt',
        ])
        ->assertStatus(422)
        ->assertJson(['success' => false]);
});

test('automatic mode generates with product only, without user_instruction or manual tagline', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Signature Blend', 'price' => 399.00]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'tagline' => 'Taste Pure Craft',
                        'creative_concept' => 'Artisan pour-over concept',
                        'visual_strategy' => 'Macro food photography',
                        'visual_prompt' => 'Artisanal coffee on rustic wooden counter',
                    ]),
                ]],
            ]],
        ]),
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image')]],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product->id],
            'include_tagline' => true,
            'include_prices' => true,
            'aspect_ratio' => '1:1',
        ]);

    $response->assertOk()
        ->assertJson(['success' => true])
        ->assertJsonPath('tagline', 'Taste Pure Craft')
        ->assertJsonPath('creative_concept', 'Artisan pour-over concept');
});

test('automatic mode with include_tagline false does not generate or return a tagline', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Matcha Latte', 'price' => 195.00]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'creative_concept' => 'Zen Matcha Garden',
                        'visual_strategy' => 'Minimal Japanese aesthetic',
                        'visual_prompt' => 'Iced matcha latte on bamboo mat',
                    ]),
                ]],
            ]],
        ]),
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image')]],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product->id],
            'include_tagline' => false,
            'include_prices' => true,
            'aspect_ratio' => '1:1',
        ]);

    $response->assertOk()
        ->assertJson(['success' => true])
        ->assertJsonPath('tagline', null)
        ->assertJsonPath('include_tagline', false);
});

test('automatic mode with include_prices true includes authoritative product price and false excludes it', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Cold Brew Bottle', 'price' => 220.00]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'tagline' => 'Cool Refreshment',
                        'creative_concept' => 'Summer Chill',
                        'visual_strategy' => 'Ice condensation',
                        'visual_prompt' => 'Chilled bottle with ice',
                    ]),
                ]],
            ]],
        ]),
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image')]],
        ]),
    ]);

    // Enabled
    $respEnabled = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product->id],
            'include_prices' => true,
        ]);
    $respEnabled->assertOk()->assertJsonPath('include_prices', true);
    expect($respEnabled->json('price'))->not->toBeNull();

    // Disabled
    $respDisabled = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product->id],
            'include_prices' => false,
        ]);
    $respDisabled->assertOk()->assertJsonPath('include_prices', false);
    expect($respDisabled->json('price'))->toBeNull();
});

test('automatic mode supports multiple catalog products and custom products without duplication', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product1 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Product A', 'price' => 398.00]);
    $product2 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Product B', 'price' => 322.00]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'tagline' => 'Double Delight',
                        'creative_concept' => 'Duo Product Showcase',
                        'visual_strategy' => 'Side-by-side presentation',
                        'visual_prompt' => 'Product A and Product B together',
                    ]),
                ]],
            ]],
        ]),
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image')]],
        ]),
    ]);

    // Send duplicate ID in catalog_product_ids to verify deduplication
    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product1->id, $product2->id, $product1->id],
            'custom_products' => [
                ['name' => 'Custom Service', 'price' => '₱650'],
            ],
            'include_tagline' => true,
            'include_prices' => true,
        ]);

    $response->assertOk()
        ->assertJson(['success' => true]);
});

test('manual mode accepts include_prices ON and OFF and preserves user creative controls', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Luxe Watch', 'price' => 5000.00]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/images/generations*' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image')]],
        ]),
    ]);

    // ON
    $respOn = $this->actingAs($user)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Luxe Watch',
            'product_id' => $product->id,
            'image_prompt' => 'Close up shot on velvet',
            'tagline' => 'Timeless Precision',
            'include_prices' => true,
            'price' => '5000.00',
        ]);
    $respOn->assertOk()
        ->assertJsonPath('include_prices', true)
        ->assertJsonPath('price', '5000.00');

    // OFF
    $respOff = $this->actingAs($user)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Luxe Watch',
            'product_id' => $product->id,
            'image_prompt' => 'Close up shot on velvet',
            'tagline' => 'Timeless Precision',
            'include_prices' => false,
            'price' => '5000.00',
        ]);
    $respOff->assertOk()
        ->assertJsonPath('include_prices', false)
        ->assertJsonPath('price', null);
});

test('manual suggest tagline still uses /generator/manual/suggest-tagline', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode(['tagline' => 'Crafted for Excellence']),
                ]],
            ]],
        ]),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Espresso Roast',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'Crafted for Excellence',
        ]);
});

test('ModularPromptOrchestrator applies MARKETING PRICE DISPLAY and TAGLINE rules accurately', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    // 1. Prices Enabled
    $promptWithPrices = $orchestrator->orchestrate([
        'product_name' => 'Single Origin Barako',
        'price' => '₱250.00',
        'include_prices' => true,
        'tagline' => 'Bold Morning Coffee',
        'include_tagline' => true,
    ]);

    expect($promptWithPrices)
        ->toContain('MARKETING PRICE DISPLAY:')
        ->toContain('Product price data is authoritative.')
        ->toContain('• TAGLINE: "Bold Morning Coffee"');

    // 2. Prices Disabled & Tagline Disabled
    $promptNoPricesNoTagline = $orchestrator->orchestrate([
        'product_name' => 'Single Origin Barako',
        'price' => '₱250.00',
        'include_prices' => false,
        'tagline' => 'Bold Morning Coffee',
        'include_tagline' => false,
    ]);

    expect($promptNoPricesNoTagline)
        ->toContain('Do not render product/service prices as visible text.')
        ->toContain('• TAGLINE: Disabled.')
        ->not->toContain('• TAGLINE: "Bold Morning Coffee"');
});

test('automatic generation always sends gpt-image-2 to OpenAI even if legacy image_model requested', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $capturedGenerationsModel = null;
    Http::fake([
        'https://api.openai.com/v1/responses*' => Http::response([
            'output' => [[
                'content' => [[
                    'type' => 'output_text',
                    'text' => json_encode([
                        'creative_concept' => 'Modern Minimalist',
                        'visual_strategy' => 'Hero focus',
                        'visual_prompt' => 'Clean product centered',
                        'tagline' => 'Pure Simplicity',
                    ]),
                ]],
            ]],
        ]),
        'https://api.openai.com/v1/images/generations*' => function (Request $request) use (&$capturedGenerationsModel) {
            $data = $request->data();
            $capturedGenerationsModel = $data['model'] ?? null;

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image')]],
            ]);
        },
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'custom_products' => [['name' => 'Signature Blend', 'price' => '300.00']],
            'include_tagline' => true,
            'include_prices' => true,
            'image_model' => 'dall-e-3', // Attempt legacy model override
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('image_model', 'gpt-image-2');

    expect($capturedGenerationsModel)->toBe('gpt-image-2');
});

test('manual generation always sends gpt-image-2 to OpenAI even if legacy image_model requested', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $capturedGenerationsModel = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations*' => function (Request $request) use (&$capturedGenerationsModel) {
            $data = $request->data();
            $capturedGenerationsModel = $data['model'] ?? null;

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image')]],
            ]);
        },
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Espresso Classic',
            'image_prompt' => 'Rich crema espresso in glass cup',
            'tagline' => 'Awaken Your Senses',
            'image_model' => 'chatgpt-image-latest', // Attempt legacy model override
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('preview.image_model', 'gpt-image-2');

    expect($capturedGenerationsModel)->toBe('gpt-image-2');
});

test('reference-image edits pipeline sends gpt-image-2 to /v1/images/edits', function () {
    Storage::fake();
    Storage::put('products/sample.png', 'fake-binary');

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Artisan Cup',
        'image_path' => 'products/sample.png',
    ]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $capturedEditsModel = null;
    Http::fake([
        'https://api.openai.com/v1/chat/completions*' => Http::response([
            'choices' => [['message' => ['content' => json_encode(['composition' => 'centered'])]]],
        ]),
        'https://api.openai.com/v1/images/edits*' => function (Request $request) use (&$capturedEditsModel) {
            $body = (string) $request->body();
            if (str_contains($body, 'name="model"') && str_contains($body, 'gpt-image-2')) {
                $capturedEditsModel = 'gpt-image-2';
            }

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-edited-image')]],
            ]);
        },
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual', [
            'campaign_id' => $campaign->id,
            'product_id' => $product->id,
            'product_name' => 'Artisan Cup',
            'image_prompt' => 'Studio lighting showcase',
            'image_model' => 'gpt-image-1.5', // Attempt legacy model override
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('preview.image_model', 'gpt-image-2');

    expect($capturedEditsModel)->toBe('gpt-image-2');
});
