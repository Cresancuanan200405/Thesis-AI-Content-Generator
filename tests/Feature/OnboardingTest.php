<?php

use App\Models\Business;
use App\Models\PendingOnboarding;
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
            'category' => 'Café / Coffee Shop',
            'business_address' => '123 Rizal Street',
            'city_municipality' => 'Quezon City',
            'province' => 'Metro Manila',
            'region' => 'NCR',
            'registration_type' => 'DTI Business Name Registration',
            'registration_number' => 'REG-2024-001',
            'business_permit_number' => 'BP-2024-987',
            'registration_permit_date' => '2024-06-15',
        ])
        ->assertRedirect('/onboarding?step=4');

    $business = $user->fresh()->business;

    expect($business)->not->toBeNull()
        ->and($business->name)->toBe('North Star Coffee')
        ->and($business->industry)->toBe('Food & Beverage')
        ->and($business->category)->toBe('Café / Coffee Shop')
        ->and($business->business_address)->toBe('123 Rizal Street')
        ->and($business->city_municipality)->toBe('Quezon City')
        ->and($business->province)->toBe('Metro Manila')
        ->and($business->region)->toBe('NCR')
        ->and($business->registration_type)->toBe('DTI Business Name Registration')
        ->and($business->registration_number)->toBe('REG-2024-001')
        ->and($business->business_permit_number)->toBe('BP-2024-987')
        ->and($business->registration_permit_date->format('Y-m-d'))->toBe('2024-06-15');
});

it('rejects invalid industry and incompatible category in onboarding', function () {
    $user = User::factory()->create();

    // Invalid industry
    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Invalid Business',
            'industry' => 'Cryptocurrency & Mining',
            'category' => 'Mining Farm',
        ])
        ->assertSessionHasErrors(['industry']);

    // Incompatible category for valid industry
    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Mismatched Business',
            'industry' => 'Food & Beverage',
            'category' => 'Auto Repair',
        ])
        ->assertSessionHasErrors(['category']);
});

it('onboarding can be completed directly after business setup', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'North Star Coffee',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
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
            'industry' => 'Retail & E-Commerce',
            'category' => 'General Retail',
        ])
        ->assertRedirect('/onboarding?step=3');

    expect($other->fresh()->business->name)->toBe('Other Business');
});

it('saves operating location on sub_step 1 without requiring legal agreements', function () {
    $user = User::factory()->create(['onboarding_completed' => false]);
    $user->business()->create([
        'name' => 'My Coffee Hub',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
    ]);

    $response = $this->actingAs($user)->post('/onboarding/business', [
        'name' => 'My Coffee Hub',
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
        'description' => 'A cozy neighborhood cafe in Laguna.',
        'business_address' => 'Unit 12, Rizal St.',
        'region' => 'Region IV-A',
        'province' => 'Laguna',
        'city_municipality' => 'Calamba City',
        'barangay' => 'Real',
        'sub_step' => 1,
    ]);

    $response->assertRedirect('/onboarding?step=3');

    $business = $user->fresh()->business;
    expect($business->region)->toBe('Region IV-A')
        ->and($business->province)->toBe('Laguna')
        ->and($business->city_municipality)->toBe('Calamba City')
        ->and($business->barangay)->toBe('Real')
        ->and($business->business_address)->toBe('Unit 12, Rizal St.')
        ->and($business->description)->toBe('A cozy neighborhood cafe in Laguna.');
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
        ->assertRedirect('/onboarding');

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
        'username' => 'new_onboarder',
        'email' => 'new-onboarder@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect('/email/verify');

    $user = User::query()->where('email', 'new-onboarder@example.com')->first();
    $pending = PendingOnboarding::query()->where('email', 'new-onboarder@example.com')->firstOrFail();

    expect($user)->toBeNull()
        ->and($pending->username)->toBe('new_onboarder');
});

it('onboarding business step preserves existing values when revisiting', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Existing Business',
        'industry' => 'Technology & Digital Services',
        'category' => 'IT Services',
    ]);

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Updated Business',
            'industry' => 'Technology & Digital Services',
            'category' => 'Software / Digital Services',
        ])
        ->assertRedirect('/onboarding?step=3');

    $business = $user->fresh()->business;

    expect($business->name)->toBe('Updated Business')
        ->and($business->category)->toBe('Software / Digital Services');
});

it('onboarding shows existing saved values in the response', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Saved Business',
        'industry' => 'Retail & E-Commerce',
        'category' => 'General Retail',
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('business.name', 'Saved Business')
            ->where('business.industry', 'Retail & E-Commerce')
        );
});
