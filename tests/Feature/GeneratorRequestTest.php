<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

it('guest cannot access the generator', function () {
    $this->get('/generator')
        ->assertRedirect('/login');
});

it('authenticated user can view the generator with business context', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'North Star Coffee',
    ]);

    Product::factory()->count(2)->create([
        'business_id' => $business->id,
    ]);

    Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Launch',
    ]);

    $expectedProductName = Product::query()->orderBy('name')->first()->name;

    $this->actingAs($user)
        ->get('/generator')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('business.name', 'North Star Coffee')
            ->where('products.0.name', $expectedProductName)
        );
});

it('authenticated user can create a generator request', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'North Star Coffee',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Latte',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Launch',
    ]);

    config()->set('services.openai.api_key', 'test-key');
    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-image-content')],
            ],
        ], 200),
    ]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_id' => $product->id,
            'event_id' => $event->id,
            'product_name' => 'Signature Latte',
            'marketing_goal' => 'Drive early spring sales',
            'content_style' => ['Product-focused', 'Lifestyle'],
            'brand_tone' => ['Professional', 'Warm'],
            'tagline' => 'Fresh flavor, daily joy.',
            'tagline_mode' => 'manual',
            'unique_selling_point' => 'Small-batch roasting and seasonal ingredients',
            'notes' => 'Use warm studio lighting and clean copy.',
        ])
        ->assertRedirect('/generator')
        ->assertSessionHas('success', 'Your marketing asset has been generated.');

    $this->assertDatabaseHas('generation_requests', [
        'user_id' => $user->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'marketing_goal' => 'Drive early spring sales',
        'tagline' => 'Fresh flavor, daily joy',
        'status' => 'completed',
    ]);

    $design = Design::query()->where('user_id', $user->id)->first();
    expect($design)->not->toBeNull()
        ->and($design->generated_image_path)->not->toBeEmpty()
        ->and(Storage::exists($design->generated_image_path))->toBeTrue();
});

it('generates fallback visual when OpenAI API key is missing', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'North Star Coffee',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Latte',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Launch',
    ]);

    config()->set('services.openai.api_key', null);

    $this->actingAs($user)
        ->post('/generator', [
            'product_id' => $product->id,
            'event_id' => $event->id,
            'product_name' => 'Signature Latte',
            'marketing_goal' => 'Drive early spring sales',
            'content_style' => ['Product-focused'],
            'brand_tone' => ['Professional'],
        ])
        ->assertRedirect('/generator')
        ->assertSessionHas('success', 'Your marketing asset has been generated.');

    $this->assertDatabaseHas('generation_requests', [
        'user_id' => $user->id,
        'event_id' => $event->id,
        'status' => 'completed',
    ]);
});

it('validates event_id is required for generator request', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    Business::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_name' => 'Signature Latte',
            'marketing_goal' => 'Drive sales',
        ])
        ->assertSessionHasErrors(['event_id']);
});

it('validates image quality input', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_name' => 'Signature Latte',
            'marketing_goal' => 'Drive sales',
            'event_id' => $event->id,
            'image_quality' => 'ultra-extreme',
        ])
        ->assertSessionHasErrors(['image_quality']);
});

it('normalizes tagline during preview generation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'North Star Coffee',
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Launch',
    ]);

    config()->set('services.openai.api_key', 'test-key');
    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('fake-preview-image')],
            ],
        ], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/preview', [
            'product_name' => 'Signature Latte',
            'event_id' => $event->id,
            'tagline' => '“Fresh Flavor Daily...” &',
            'marketing_goal' => 'Drive sales',
            'aspect_ratio' => '1:1',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'Fresh Flavor Daily',
        ]);
});
