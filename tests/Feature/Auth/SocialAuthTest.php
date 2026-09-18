<?php

use App\Models\PendingOnboarding;
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

test('it creates pending onboarding without permanent user row from socialite callback', function () {
    $mockSocialiteUser = Mockery::mock(SocialiteUser::class);
    $mockSocialiteUser->shouldReceive('getId')->andReturn('google_123456789');
    $mockSocialiteUser->shouldReceive('getName')->andReturn('Alex Creator');
    $mockSocialiteUser->shouldReceive('getEmail')->andReturn('alex.creator@example.com');
    $mockSocialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/avatar.jpg');

    $mockProvider = Mockery::mock(Provider::class);
    $mockProvider->shouldReceive('user')->andReturn($mockSocialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $response = $this->get(route('auth.social.callback', ['provider' => 'google']));

    $this->assertGuest();

    $user = User::where('email', 'alex.creator@example.com')->first();
    $pending = PendingOnboarding::where('email', 'alex.creator@example.com')->first();

    expect($user)->toBeNull()
        ->and($pending)->not->toBeNull()
        ->and($pending->provider_name)->toBe('google')
        ->and($pending->provider_id)->toBe('google_123456789')
        ->and($pending->email_verified_at)->not->toBeNull()
        ->and($pending->first_name)->toBe('Alex')
        ->and($pending->last_name)->toBe('Creator');

    $response->assertRedirect(route('onboarding.show'));
});

test('it links existing user by email from socialite callback', function () {
    $existingUser = User::factory()->create([
        'email' => 'sarah.existing@example.com',
        'first_name' => 'Sarah',
        'last_name' => 'Existing',
        'username' => 'sarah_existing',
        'password' => bcrypt('existing-password'),
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
        ->and($existingUser->provider_id)->toBe('fb_99887766')
        ->and($existingUser->username)->toBe('sarah_existing')
        ->and($existingUser->first_name)->toBe('Sarah')
        ->and($existingUser->last_name)->toBe('Existing')
        ->and($existingUser->email_verified_at)->not->toBeNull();

    $response->assertRedirect(route('dashboard'));
});

test('it reuses an existing provider user and preserves their password and profile', function () {
    $existingUser = User::factory()->create([
        'name' => 'Google Member',
        'username' => 'google_member',
        'email' => 'google.member@example.com',
        'first_name' => 'Google',
        'last_name' => 'Member',
        'password' => bcrypt('keep-this-password'),
        'provider_name' => 'google',
        'provider_id' => 'google_existing',
        'email_verified_at' => null,
        'onboarding_completed' => true,
    ]);
    $passwordHash = $existingUser->password;

    $mockSocialiteUser = Mockery::mock(SocialiteUser::class);
    $mockSocialiteUser->shouldReceive('getId')->andReturn('google_existing');
    $mockSocialiteUser->shouldReceive('getName')->andReturn('Changed Google Name');
    $mockSocialiteUser->shouldReceive('getEmail')->andReturn('google.member@example.com');
    $mockSocialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/a/new-avatar.jpg');

    $mockProvider = Mockery::mock(Provider::class);
    $mockProvider->shouldReceive('user')->andReturn($mockSocialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $response = $this->get(route('auth.social.callback', ['provider' => 'google']));

    $this->assertAuthenticatedAs($existingUser);
    expect(User::where('email', 'google.member@example.com')->count())->toBe(1);

    $existingUser->refresh();
    expect($existingUser->password)->toBe($passwordHash)
        ->and($existingUser->username)->toBe('google_member')
        ->and($existingUser->first_name)->toBe('Google')
        ->and($existingUser->last_name)->toBe('Member')
        ->and($existingUser->email_verified_at)->not->toBeNull();

    $response->assertRedirect(route('dashboard'));
});
