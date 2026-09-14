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
            'category' => 'Café / Coffee Shop',
            'main_business_activity' => 'Coffee roasting and café service',
            'business_address' => '123 Rizal Street',
            'city_municipality' => 'Quezon City',
            'province' => 'Metro Manila',
            'region' => 'NCR',
            'business_contact_number' => '+63 917 123 4567',
            'business_email' => 'hello@northstarcoffee.ph',
            'website_social_page' => 'https://northstarcoffee.ph',
            'registration_type' => 'DTI Business Name Registration',
            'registration_number' => 'REG-2024-001',
            'business_permit_number' => 'BP-2024-987',
            'registration_permit_date' => '2024-06-15',
        ])
        ->assertRedirect('/onboarding?step=2');

    $business = $user->fresh()->business;

    expect($business)->not->toBeNull()
        ->and($business->name)->toBe('North Star Coffee')
        ->and($business->industry)->toBe('Food & Beverage')
        ->and($business->category)->toBe('Café / Coffee Shop')
        ->and($business->main_business_activity)->toBe('Coffee roasting and café service')
        ->and($business->business_address)->toBe('123 Rizal Street')
        ->and($business->city_municipality)->toBe('Quezon City')
        ->and($business->province)->toBe('Metro Manila')
        ->and($business->region)->toBe('NCR')
        ->and($business->business_contact_number)->toBe('+63 917 123 4567')
        ->and($business->business_email)->toBe('hello@northstarcoffee.ph')
        ->and($business->website_social_page)->toBe('https://northstarcoffee.ph')
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
        'username' => 'new_onboarder',
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
        'industry' => 'Technology & Digital Services',
        'category' => 'IT Services',
    ]);

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Updated Business',
            'industry' => 'Technology & Digital Services',
            'category' => 'Software / Digital Services',
        ])
        ->assertRedirect('/onboarding?step=2');

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
