<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

it('user can save a design from ai marketing studio in mockup mode', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Christmas Sale']);

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Winter Glow Cream',
            'image_prompt' => 'A luxury winter skincare product on snow background',
            'prompt' => 'A luxury winter skincare product on snow background',
            'price' => 49.99,
            'event_id' => $event->id,
            'brand_tone' => ['Warm', 'Elegant'],
            'visual_theme' => ['Seasonal', 'Premium'],
            'tagline' => 'Glow through the cold.',
            'tagline_mode' => 'ai',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'design' => [
                'product_name' => 'Winter Glow Cream',
                'tagline' => 'Glow through the cold',
                'status' => 'completed',
            ],
        ]);

    $this->assertDatabaseHas('designs', [
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Winter Glow Cream',
        'event_id' => $event->id,
        'tagline' => 'Glow through the cold',
        'status' => 'completed',
    ]);

    $design = Design::where('product_name', 'Winter Glow Cream')->first();
    expect($design)->not->toBeNull();
    expect($design->generated_image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($design->generated_image_path);
});

it('saved design reflects in my designs list and show page', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Artisan Coffee Blend',
            'prompt' => 'Fresh roasted organic coffee beans visual',
            'tagline' => 'Start every morning right.',
        ])
        ->assertOk();

    $design = Design::where('product_name', 'Artisan Coffee Blend')->first();

    $this->actingAs($user)->get('/designs')->assertOk();
    $this->actingAs($user)->get('/designs/'.$design->id)->assertOk();
    $this->actingAs($user)->get('/designs/'.$design->id.'/download')->assertOk();
});

it('user can create a campaign and link a generated design to it', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Black Friday 2026']);

    // First save the design
    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Wireless Noise Canceling Headphones',
            'prompt' => 'Studio headphones in deep neon lighting',
            'tagline' => 'Hear the silence.',
            'event_id' => $event->id,
        ])
        ->assertOk();

    $design = Design::where('product_name', 'Wireless Noise Canceling Headphones')->first();
    expect($design->campaign_id)->toBeNull();

    // Now create campaign and link design
    $campaignResponse = $this->actingAs($user)
        ->postJson('/campaigns', [
            'name' => 'Black Friday Audio Campaign',
            'event_id' => $event->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'objective' => 'Drive holiday audio gear sales',
            'design_id' => $design->id,
        ]);

    $campaignResponse->assertOk()
        ->assertJson([
            'success' => true,
            'campaign' => [
                'name' => 'Black Friday Audio Campaign',
            ],
        ]);

    $campaign = Campaign::where('name', 'Black Friday Audio Campaign')->first();
    expect($campaign)->not->toBeNull();

    // Verify the design was linked to the campaign
    $design->refresh();
    expect($design->campaign_id)->toBe($campaign->id);

    // Verify campaign show page displays the linked design
    $showResponse = $this->actingAs($user)->get('/campaigns/'.$campaign->id);
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page
        ->component('campaigns/show')
        ->has('campaign.designs', 1)
        ->where('campaign.designs.0.product_name', 'Wireless Noise Canceling Headphones')
    );
});

it('user can save a design with custom business_name enabled', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Aura Cosmetics',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Rose Hydrating Mist',
            'prompt' => 'Dewy skincare bottle on marble',
            'business_name' => 'Aura Luxury Boutique',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'design' => [
                'product_name' => 'Rose Hydrating Mist',
            ],
        ]);

    $design = Design::where('product_name', 'Rose Hydrating Mist')->first();
    expect($design)->not->toBeNull();
    expect($design->generated_image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($design->generated_image_path);
    expect($design->generation_metadata['business_name'] ?? null)->toBe('Aura Luxury Boutique');
});

it('user can attach an existing design to an existing campaign for matching event', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Autumn Refresh 2026',
    ]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'campaign_id' => null,
        'product_name' => 'Autumn Candle Set',
    ]);

    $response = $this->actingAs($user)
        ->postJson("/designs/{$design->id}/attach-campaign", [
            'campaign_id' => $campaign->id,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'campaign' => [
                'id' => $campaign->id,
                'name' => 'Autumn Refresh 2026',
            ],
        ]);

    $design->refresh();
    expect($design->campaign_id)->toBe($campaign->id);
});

it('rejects attaching a design if event does not match campaign event', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event1 = Event::factory()->create(['user_id' => $user->id]);
    $event2 = Event::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event1->id,
        'name' => 'Halloween Campaign',
    ]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event2->id,
        'campaign_id' => null,
        'product_name' => 'Christmas Candle',
    ]);

    $response = $this->actingAs($user)
        ->postJson("/designs/{$design->id}/attach-campaign", [
            'campaign_id' => $campaign->id,
        ]);

    $response->assertStatus(422);
    $design->refresh();
    expect($design->campaign_id)->toBeNull();
});

it('user can edit campaign name, dates, status, and details', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Old Campaign Name',
        'status' => 'draft',
    ]);

    $response = $this->actingAs($user)
        ->putJson("/campaigns/{$campaign->id}", [
            'name' => 'Updated Campaign Name 2026',
            'status' => 'active',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'campaign' => [
                'name' => 'Updated Campaign Name 2026',
                'status' => 'active',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-30',
            ],
        ]);

    $campaign->refresh();
    expect($campaign->name)->toBe('Updated Campaign Name 2026');
    expect($campaign->status)->toBe('active');
});

it('user can toggle favorite status on a design and filter favorites', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $design1 = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Favorite Visual 1',
        'is_favorite' => false,
    ]);

    $design2 = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Standard Visual 2',
        'is_favorite' => false,
    ]);

    // Toggle favorite on design1
    $response = $this->actingAs($user)
        ->postJson("/designs/{$design1->id}/favorite");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'is_favorite' => true,
        ]);

    $design1->refresh();
    expect($design1->is_favorite)->toBeTrue();

    // Verify filter works
    $filterResponse = $this->actingAs($user)->get('/designs?favorites=1');
    $filterResponse->assertOk();
    $filterResponse->assertInertia(fn ($page) => $page
        ->component('designs/index')
        ->has('designs.data', 1)
        ->where('designs.data.0.id', $design1->id)
    );

    // Toggle favorite off
    $response2 = $this->actingAs($user)
        ->postJson("/designs/{$design1->id}/favorite");

    $response2->assertOk()
        ->assertJson([
            'success' => true,
            'is_favorite' => false,
        ]);

    $design1->refresh();
    expect($design1->is_favorite)->toBeFalse();
});

it('user can delete a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Temporary Campaign',
    ]);

    $response = $this->actingAs($user)
        ->delete("/campaigns/{$campaign->id}");

    $response->assertRedirect('/campaigns');
    $this->assertDatabaseMissing('campaigns', [
        'id' => $campaign->id,
    ]);
});

it('generator store passes catalog product image to reference image path and OpenAI pipeline', function () {
    config(['services.openai.api_key' => 'test-key']);

    $capturedPrompt = null;
    $capturedMultipart = false;
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function ($request) use (&$capturedPrompt, &$capturedMultipart) {
            $capturedMultipart = true;

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-generated-image')]],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => function ($request) {
            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-generated-image')]],
            ], 200);
        },
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Barako Cold Brew',
        'image_path' => 'products/barako-cold-brew.png',
    ]);
    $event = Event::factory()->create(['user_id' => $user->id]);
    Storage::disk('public')->put('products/barako-cold-brew.png', 'cold-brew-bytes');

    $response = $this->actingAs($user)
        ->post('/generator', [
            'product_id' => $product->id,
            'event_id' => $event->id,
            'product_name' => 'Barako Cold Brew',
            'marketing_goal' => 'Promote cold brew for summer',
            'content_style' => ['Lifestyle'],
            'brand_tone' => ['Energetic'],
        ]);

    $response->assertRedirect();
    $design = Design::query()->where('user_id', $user->id)->latest('id')->first();

    expect($design)->not->toBeNull()
        ->and($design->reference_image_path)->toBe('products/barako-cold-brew.png')
        ->and($design->generation_metadata['product_preserved'])->toBeTrue()
        ->and($capturedMultipart)->toBeTrue();
});

it('deleting product preserves historical design reference image when referenced', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Ube Cake',
        'image_path' => 'products/ube-cake.png',
    ]);
    Storage::disk('public')->put('products/ube-cake.png', 'ube-bytes');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'product_name' => 'Ube Cake',
        'reference_image_path' => 'products/ube-cake.png',
    ]);

    $this->actingAs($user)
        ->delete("/products/{$product->id}")
        ->assertRedirect('/products');

    $this->assertSoftDeleted('products', ['id' => $product->id]);
    Storage::disk('public')->assertExists('products/ube-cake.png');
});
