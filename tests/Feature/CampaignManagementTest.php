<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;

it('guest cannot view campaigns', function () {
    $this->get('/campaigns')->assertRedirect('/login');
});

it('authenticated user can view campaigns', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Q4 Promotion',
        'status' => 'active',
    ]);

    $this->actingAs($user)->get('/campaigns')->assertOk();
});

it('user can create a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Holiday Launch',
            'description' => 'Seasonal product push',
            'product_id' => $product->id,
            'event_id' => $event->id,
            'objective' => 'Increase holiday sales',
            'target_audience' => 'Online shoppers',
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(12)->toDateString(),
            'status' => 'active',
        ])
        ->assertRedirect('/campaigns');

    $this->assertDatabaseHas('campaigns', ['name' => 'Holiday Launch', 'user_id' => $user->id]);
});

it('invalid campaign data is rejected', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => '',
            'product_id' => $product->id,
            'event_id' => 999999,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'status' => 'unknown',
        ])
        ->assertSessionHasErrors(['name', 'event_id', 'end_date', 'status']);
});

it('user can view own campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($user)->get('/campaigns/'.$campaign->id)->assertOk();
});

it('user cannot view another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->get('/campaigns/'.$campaign->id)->assertForbidden();
});

it('user can update own campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->put('/campaigns/'.$campaign->id, [
            'name' => 'Updated Campaign',
            'description' => 'Fresh strategy',
            'product_id' => $product->id,
            'event_id' => $event->id,
            'objective' => 'Lift conversions',
            'target_audience' => 'Returning buyers',
            'start_date' => now()->addDays(4)->toDateString(),
            'end_date' => now()->addDays(18)->toDateString(),
            'status' => 'active',
        ])
        ->assertRedirect('/campaigns');

    $this->assertDatabaseHas('campaigns', ['id' => $campaign->id, 'name' => 'Updated Campaign', 'status' => 'active']);
});

it('user cannot update another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->put('/campaigns/'.$campaign->id, [
        'name' => 'Hijack',
        'product_id' => $product->id,
        'event_id' => $event->id,
        'objective' => 'Bad',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
        'status' => 'active',
    ])->assertForbidden();
});

it('user can delete own campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($user)->delete('/campaigns/'.$campaign->id)->assertRedirect('/campaigns');
    $this->assertDatabaseMissing('campaigns', ['id' => $campaign->id]);
});

it('user cannot delete another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->delete('/campaigns/'.$campaign->id)->assertForbidden();
});

it('campaign product ownership is validated', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $ownerBusiness = Business::factory()->create(['user_id' => $user->id]);
    $otherBusiness = Business::factory()->create();
    $otherProduct = Product::factory()->create(['business_id' => $otherBusiness->id]);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Wrong Product',
            'product_id' => $otherProduct->id,
            'event_id' => null,
            'objective' => 'Boost awareness',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'status' => 'draft',
        ])
        ->assertSessionHasErrors('product_id');
});

it('global event can be used by a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->global()->create(['type' => 'holiday']);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Holiday Push',
            'product_id' => $product->id,
            'event_id' => $event->id,
            'objective' => 'Drive holiday demand',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'status' => 'draft',
        ])
        ->assertRedirect('/campaigns');
});

it('campaign detail displays associated designs', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Gift Release',
    ]);

    Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'status' => 'completed',
    ]);

    $this->actingAs($user)->get('/campaigns/'.$campaign->id)->assertOk();
});

it('generator can preselect campaign context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'commercial']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Spring Launch',
        'objective' => 'Drive awareness',
        'target_audience' => 'New customers',
    ]);

    $this->actingAs($user)->get('/generator?campaign='.$campaign->id)->assertOk();
});
