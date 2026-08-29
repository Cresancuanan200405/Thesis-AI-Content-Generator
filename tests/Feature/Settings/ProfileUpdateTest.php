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
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
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
        'category' => 'Clothing Store',
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
            ->where('business.category', 'Clothing Store')
            ->where('business.description', 'A premier fashion house.')
        );
});

test('user can update business identity and setup details', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'industry' => 'Retail',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.business'))
        ->post(route('profile.business.update'), [
            'name' => 'Updated Studio Labs',
            'industry' => 'Technology',
            'category' => 'SaaS Business',
            'description' => 'A cutting-edge SaaS platform for creators.',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.business'));

    $business->refresh();
    expect($business->name)->toBe('Updated Studio Labs')
        ->and($business->industry)->toBe('Technology')
        ->and($business->category)->toBe('SaaS Business')
        ->and($business->description)->toBe('A cutting-edge SaaS platform for creators.');
});
