<?php

use App\Models\Business;
use App\Models\User;

it('guest cannot access onboarding', function () {
    $response = $this->get('/onboarding');

    $response->assertRedirect('/login');
});

it('authenticated incomplete user can access onboarding', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk();
});

it('authenticated completed user is redirected away from onboarding', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertRedirect('/dashboard');
});

it('incomplete user cannot access dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

it('business information is saved correctly', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'North Star Coffee',
            'industry' => 'Food & Beverage',
            'category' => 'Coffee Shop',
        ])
        ->assertRedirect('/onboarding?step=2');

    $business = $user->fresh()->business;

    expect($business)->not->toBeNull()
        ->and($business->name)->toBe('North Star Coffee')
        ->and($business->industry)->toBe('Food & Beverage')
        ->and($business->category)->toBe('Coffee Shop');
});

it('onboarding can be completed directly after business setup without logo', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'North Star Coffee',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee Shop',
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete', [])
        ->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->onboarding_completed)->toBeTrue();
});

it('user cannot modify another users business record', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    Business::factory()->create([
        'user_id' => $other->id,
        'name' => 'Other Business',
    ]);

    $this->actingAs($owner)
        ->post('/onboarding/business', [
            'name' => 'My Business',
            'industry' => 'Retail',
            'category' => 'Coffee Shop',
        ])
        ->assertRedirect('/onboarding?step=2');

    expect($other->fresh()->business->name)->toBe('Other Business');
});

it('email verification accepts a six digit code', function () {
    $user = User::factory()->create([
        'email_verified_at' => null,
    ]);

    $code = $user->generateEmailVerificationCode();

    $this->actingAs($user)
        ->post('/email/verify-code', [
            'code' => $code,
        ])
        ->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->email_verified_at)->not->toBeNull();
});

it('completing onboarding sets onboarding flags', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete', [])
        ->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->onboarding_completed)->toBeTrue()
        ->and($user->onboarding_completed_at)->not->toBeNull();
});

it('completed user can access dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk();
});

it('registration creates a pending account before onboarding is complete', function () {
    $response = $this->post('/register', [
        'name' => 'New Onboarder',
        'email' => 'new-onboarder@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect('/email/verify');

    $user = User::query()->where('email', 'new-onboarder@example.com')->firstOrFail();

    expect($user->onboarding_completed)->toBeFalse()
        ->and($user->onboarding_completed_at)->toBeNull();
});

it('onboarding business step preserves existing values when revisiting', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Existing Business',
        'industry' => 'Technology',
        'category' => 'Software Company',
    ]);

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Updated Business',
            'industry' => 'Technology',
            'category' => 'SaaS Company',
        ])
        ->assertRedirect('/onboarding?step=2');

    $business = $user->fresh()->business;

    expect($business->name)->toBe('Updated Business')
        ->and($business->category)->toBe('SaaS Company');
});

it('onboarding shows existing saved values in the response', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Saved Business',
        'industry' => 'Retail',
        'category' => 'Clothing Store',
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('business.name', 'Saved Business')
            ->where('business.industry', 'Retail')
        );
});
