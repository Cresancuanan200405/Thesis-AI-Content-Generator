<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;

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
