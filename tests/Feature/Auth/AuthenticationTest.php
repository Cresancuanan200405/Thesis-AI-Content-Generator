<?php

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('users can authenticate using the login screen with their email', function () {
    $user = User::factory()->create([
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'onboarding_completed' => true,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can authenticate using their username', function () {
    $user = User::factory()->create([
        'username' => 'demo_user',
        'first_name' => 'Demo',
        'last_name' => 'User',
        'onboarding_completed' => true,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'demo_user',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('incomplete onboarding users are redirected to onboarding after login', function () {
    $user = User::factory()->create([
        'username' => 'incomplete_user',
        'first_name' => null,
        'last_name' => null,
        'onboarding_completed' => false,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'incomplete_user',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('onboarding.show', absolute: false));
});

test('incomplete personal information users with completed onboarding are redirected to the profile form after login', function () {
    $user = User::factory()->create([
        'username' => 'incomplete_personal_user',
        'first_name' => null,
        'last_name' => null,
        'onboarding_completed' => true,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'incomplete_personal_user',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('profile.edit', absolute: false));
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->withTwoFactor()->create();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('home'));

    $this->assertGuest();
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});
