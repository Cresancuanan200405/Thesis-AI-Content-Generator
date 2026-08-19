<?php

use App\Models\User;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

test('it handles google redirect route', function () {
    $response = $this->get(route('auth.social.redirect', ['provider' => 'google']));

    $response->assertRedirect();
});

test('it handles facebook redirect route', function () {
    $response = $this->get(route('auth.social.redirect', ['provider' => 'facebook']));

    $response->assertRedirect();
});

test('it rejects unsupported provider', function () {
    $response = $this->get(route('auth.social.redirect', ['provider' => 'twitter']));

    $response->assertRedirect(route('login'));
    $response->assertSessionHas('error');
});

test('it creates a new user and authenticates from socialite callback', function () {
    $mockSocialiteUser = Mockery::mock(SocialiteUser::class);
    $mockSocialiteUser->shouldReceive('getId')->andReturn('google_123456789');
    $mockSocialiteUser->shouldReceive('getName')->andReturn('Alex Creator');
    $mockSocialiteUser->shouldReceive('getEmail')->andReturn('alex.creator@example.com');
    $mockSocialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/avatar.jpg');

    $mockProvider = Mockery::mock(Provider::class);
    $mockProvider->shouldReceive('user')->andReturn($mockSocialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $response = $this->get(route('auth.social.callback', ['provider' => 'google']));

    $this->assertAuthenticated();

    $user = User::where('email', 'alex.creator@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->provider_name)->toBe('google')
        ->and($user->provider_id)->toBe('google_123456789')
        ->and($user->email_verified_at)->not->toBeNull();

    $response->assertRedirect(route('onboarding.show'));
});

test('it links existing user by email from socialite callback', function () {
    $existingUser = User::factory()->create([
        'email' => 'sarah.existing@example.com',
        'provider_name' => null,
        'provider_id' => null,
        'onboarding_completed' => true,
    ]);

    $mockSocialiteUser = Mockery::mock(SocialiteUser::class);
    $mockSocialiteUser->shouldReceive('getId')->andReturn('fb_99887766');
    $mockSocialiteUser->shouldReceive('getName')->andReturn('Sarah Existing');
    $mockSocialiteUser->shouldReceive('getEmail')->andReturn('sarah.existing@example.com');
    $mockSocialiteUser->shouldReceive('getAvatar')->andReturn('https://graph.facebook.com/avatar.jpg');

    $mockProvider = Mockery::mock(Provider::class);
    $mockProvider->shouldReceive('user')->andReturn($mockSocialiteUser);

    Socialite::shouldReceive('driver')->with('facebook')->andReturn($mockProvider);

    $response = $this->get(route('auth.social.callback', ['provider' => 'facebook']));

    $this->assertAuthenticatedAs($existingUser);

    $existingUser->refresh();
    expect($existingUser->provider_name)->toBe('facebook')
        ->and($existingUser->provider_id)->toBe('fb_99887766');

    $response->assertRedirect(route('dashboard'));
});
