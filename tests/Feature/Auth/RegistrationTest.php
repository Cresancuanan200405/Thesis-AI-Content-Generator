<?php

use App\Models\PendingOnboarding;
use App\Models\User;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register with a username and without a full name', function () {
    $response = $this->post(route('register.store'), [
        'username' => 'testuser',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertGuest();
    $user = User::where('email', 'test@example.com')->first();
    $pending = PendingOnboarding::where('email', 'test@example.com')->first();

    expect($user)->toBeNull()
        ->and($pending)->not->toBeNull()
        ->and($pending->username)->toBe('testuser');

    $response->assertRedirect(route('verification.notice', absolute: false));
    $response->assertSessionHas('toast', [
        'type' => 'success',
        'message' => 'Account created successfully. Please verify your email to continue onboarding.',
    ]);
});

test('duplicate usernames are rejected during registration', function () {
    User::factory()->create(['username' => 'takenuser']);

    $response = $this->from(route('register'))->post(route('register.store'), [
        'username' => 'takenuser',
        'email' => 'new@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('username');
    $this->assertGuest();
});

test('unverified user is redirected to the verification notice instead of onboarding', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get(route('onboarding.show'))
        ->assertRedirect(route('verification.notice', absolute: false));
});
