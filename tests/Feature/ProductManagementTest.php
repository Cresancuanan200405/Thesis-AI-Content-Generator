<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingPromptBuilder;

it('authenticated user can list own products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    Product::factory()->count(2)->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->get('/products')
        ->assertOk();
});

it('unauthenticated user cannot access products', function () {
    $this->get('/products')
        ->assertRedirect('/login');
});

it('user can view own product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->get('/products/'.$product->id)
        ->assertOk();
});

it('user cannot view another users product', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $otherBusiness = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $otherBusiness->id]);

    expect($viewer->can('view', $product))->toBeFalse();
});

it('user can create a product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/products', [
            'name' => 'Canvas Tote',
            'description' => 'A premium everyday carry tote.',
            'price' => '49.99',
        ])
        ->assertRedirect('/products');

    $this->assertDatabaseHas('products', [
        'name' => 'Canvas Tote',
        'description' => 'A premium everyday carry tote.',
        'price' => '49.99',
    ]);
});

it('product is automatically assigned to the authenticated users business', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/products', [
            'name' => 'Starter Kit',
            'description' => 'Example product.',
            'price' => '120.00',
        ]);

    $this->assertDatabaseHas('products', [
        'business_id' => $business->id,
        'name' => 'Starter Kit',
    ]);
});

it('user cannot create a product for another business', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);
    $otherBusiness = Business::factory()->create();

    $this->actingAs($user)
        ->post('/products', [
            'business_id' => $otherBusiness->id,
            'name' => 'Not Allowed',
            'description' => 'Ignored by the server.',
            'price' => '19.99',
        ])
        ->assertRedirect('/products');

    $this->assertDatabaseMissing('products', [
        'business_id' => $otherBusiness->id,
        'name' => 'Not Allowed',
    ]);
});

it('user can update own product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Old Name']);

    $this->actingAs($user)
        ->put('/products/'.$product->id, [
            'name' => 'Updated Name',
            'description' => 'New copy.',
            'price' => '89.99',
        ])
        ->assertRedirect('/products');

    $product->refresh();

    expect($product->name)->toBe('Updated Name')
        ->and($product->description)->toBe('New copy.')
        ->and((string) $product->price)->toBe('89.99');
});

it('user cannot update another users product', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $otherBusiness = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $otherBusiness->id]);

    expect($viewer->can('update', $product))->toBeFalse();
});

it('user can delete own product when allowed', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->delete('/products/'.$product->id)
        ->assertRedirect('/products');

    $this->assertDatabaseMissing('products', ['id' => $product->id]);
});

it('user cannot delete another users product', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $otherBusiness = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $otherBusiness->id]);

    expect($viewer->can('delete', $product))->toBeFalse();
});

it('product validation works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/products', [
            'description' => str_repeat('x', 5000),
            'price' => 'abc',
        ])
        ->assertSessionHasErrors(['description', 'price']);
});

it('product can be created without name or price', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/products', [
            'name' => '',
            'price' => '',
        ])
        ->assertRedirect('/products');

    $this->assertDatabaseHas('products', [
        'business_id' => $business->id,
        'name' => 'Untitled Product',
        'price' => null,
    ]);
});

it('product belongs to business', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    expect($product->business->id)->toBe($business->id)
        ->and($product->business->user_id)->toBe($user->id);
});

it('generator rejects another users product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $ownerBusiness = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $ownerBusiness->id]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_id' => $product->id,
            'product_name' => 'Test Product',
            'marketing_goal' => 'Increase awareness',
            'content_style' => ['Lifestyle'],
            'brand_tone' => ['Professional'],
        ])
        ->assertSessionHasErrors('product_id');
});

it('generator accepts the authenticated users product', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_id' => $product->id,
            'product_name' => $product->name,
            'marketing_goal' => 'Increase awareness',
            'content_style' => ['Lifestyle'],
            'brand_tone' => ['Professional'],
        ])
        ->assertSessionDoesntHaveErrors('product_id');
});

it('marketing prompt builder includes product information', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Northstar Studio',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Candle',
        'description' => 'Premium soy candle with cedar notes.',
        'price' => 49.99,
    ]);

    $prompt = app(MarketingPromptBuilder::class)->build([
        'product_id' => $product->id,
        'product_name' => $product->name,
        'marketing_goal' => 'Increase awareness',
        'content_style' => ['Lifestyle'],
        'brand_tone' => ['Warm'],
    ], $business);

    expect($prompt)->toContain('Hero Product: Signature Candle')
        ->and($prompt)->toContain('Description: Premium soy candle with cedar notes.')
        ->and($prompt)->toContain('Price: $49.99');
});

it('campaign product ownership remains protected', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $otherBusiness = Business::factory()->create();
    $otherProduct = Product::factory()->create(['business_id' => $otherBusiness->id]);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Q4 Launch',
            'description' => 'Campaign description',
            'product_id' => $otherProduct->id,
            'event_id' => null,
            'objective' => 'Increase revenue',
            'target_audience' => 'Home buyers',
            'start_date' => now()->addDays(10)->format('Y-m-d'),
            'end_date' => now()->addDays(20)->format('Y-m-d'),
            'status' => 'draft',
        ])
        ->assertSessionHasErrors('product_id');
});

it('campaign product relationship stays scoped to the users business', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
    ]);

    expect($campaign->product->id)->toBe($product->id)
        ->and($campaign->product->business_id)->toBe($business->id);
});

it('user can bulk delete multiple products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $products = Product::factory()->count(3)->create(['business_id' => $business->id]);

    $idsToDelete = $products->take(2)->pluck('id')->all();

    $this->actingAs($user)
        ->post('/products/bulk-delete', ['ids' => $idsToDelete])
        ->assertRedirect('/products');

    expect(Product::whereIn('id', $idsToDelete)->count())->toBe(0)
        ->and(Product::where('id', $products->last()->id)->exists())->toBeTrue();
});
