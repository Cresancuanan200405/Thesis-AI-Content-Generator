<?php

use App\Models\Business;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('profile settings page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('settings/profile')
        );
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
});

test('attempting to change email directly via profile update is rejected', function () {
    $user = User::factory()->create(['email' => 'original@example.com']);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'new-direct@example.com',
        ]);

    $response
        ->assertSessionHasErrors(['email'])
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh()->email)->toBe('original@example.com');
});

test('personal information fields can be saved for the account owner', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Jane Santos Dela Cruz',
            'email' => $user->email,
            'first_name' => 'Jane',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'suffix' => 'MBA',
            'mobile_number' => '+639171234567',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->first_name)->toBe('Jane')
        ->and($user->middle_name)->toBe('Santos')
        ->and($user->last_name)->toBe('Dela Cruz')
        ->and($user->suffix)->toBe('MBA')
        ->and($user->mobile_number)->toBe('+639171234567');
});

test('business profile can store philippine address selections', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.business'))
        ->post(route('profile.business.update'), [
            'name' => 'Updated Studio Labs',
            'industry' => 'Technology & Digital Services',
            'category' => 'Software / Digital Services',
            'description' => 'A cutting-edge SaaS platform for creators.',
            'business_address' => '123 Example Street',
            'barangay' => 'San Antonio',
            'city_municipality' => 'Pasig City',
            'province' => 'Metro Manila',
            'region' => 'NCR',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.business'));

    $business = $user->fresh()->business;

    expect($business->business_address)->toBe('123 Example Street')
        ->and($business->barangay)->toBe('San Antonio')
        ->and($business->city_municipality)->toBe('Pasig City')
        ->and($business->province)->toBe('Metro Manila')
        ->and($business->region)->toBe('NCR');
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('my profile page is displayed with account overview', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Acme Creative Studio',
        'industry' => 'Fashion & Apparel',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.show'));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('profile/my-profile')
            ->has('profile.name')
            ->has('profile.email')
            ->has('business')
            ->has('stats')
        );
});

test('business profile page is displayed with commercial context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Acme Creative Studio',
        'industry' => 'Fashion & Apparel',
        'category' => 'Clothing',
        'description' => 'A premier fashion house.',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.business'));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('profile/business')
            ->where('business.name', 'Acme Creative Studio')
            ->where('business.industry', 'Fashion & Apparel')
            ->where('business.category', 'Clothing')
            ->where('business.description', 'A premier fashion house.')
        );
});

test('user can update business identity and setup details', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'industry' => 'Retail & E-Commerce',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.business'))
        ->post(route('profile.business.update'), [
            'name' => 'Updated Studio Labs',
            'industry' => 'Technology & Digital Services',
            'category' => 'Software / Digital Services',
            'description' => 'A cutting-edge SaaS platform for creators.',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.business'));

    $business->refresh();
    expect($business->name)->toBe('Updated Studio Labs')
        ->and($business->industry)->toBe('Technology & Digital Services')
        ->and($business->category)->toBe('Software / Digital Services')
        ->and($business->description)->toBe('A cutting-edge SaaS platform for creators.');
});

test('business profile update rejects invalid industry or mismatched category', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.business'))
        ->post(route('profile.business.update'), [
            'name' => 'Invalid Studio',
            'industry' => 'Invalid Industry Name',
            'category' => 'Something',
        ]);

    $response->assertSessionHasErrors(['industry']);

    $response2 = $this
        ->actingAs($user)
        ->from(route('profile.business'))
        ->post(route('profile.business.update'), [
            'name' => 'Mismatched Studio',
            'industry' => 'Food & Beverage',
            'category' => 'Auto Repair',
        ]);

    $response2->assertSessionHasErrors(['category']);
});
