<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

test('Google user must verify ownership of current Google account before changing', function () {
    $user = User::factory()->create([
        'name' => 'Original User',
        'email' => 'original@gmail.com',
        'provider_name' => 'google',
        'provider_id' => 'google_orig_111',
        'password' => Hash::make('placeholder'),
    ]);

    config([
        'services.google.client_id' => 'mock-client-id',
        'services.google.client_secret' => 'mock-client-secret',
    ]);

    // 1. Trying to directly jump to change without verification is rejected
    $this->actingAs($user)
        ->get(route('settings.google.change'))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    // 2. Initiate verification of current Google account
    $redirect = $this->actingAs($user)
        ->get(route('settings.google.verify-current'));

    $redirect->assertRedirect();
    $sessionState = session('google_verify_current_state');
    expect($sessionState)->not->toBeNull()
        ->and($sessionState['user_id'])->toBe($user->id);

    // 3. Callback with matching current provider ID succeeds
    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn('google_orig_111');
    $mockSocialite->shouldReceive('getEmail')->andReturn('original@gmail.com');

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $callback = $this->actingAs($user)
        ->withSession(['google_verify_current_state' => $sessionState])
        ->get(route('settings.google.verify-current.callback', ['state' => $sessionState['state']]));

    $callback->assertRedirect(route('profile.edit'))
        ->assertSessionHas('success');

    expect(Cache::has("google_account_change_auth:{$user->id}"))->toBeTrue();
});

test('Current Google verification fails if a different Google account is selected', function () {
    $user = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_orig_111',
    ]);

    $sessionState = [
        'user_id' => $user->id,
        'state' => 'test-state-token',
        'initiated_at' => now()->timestamp,
    ];

    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn('google_impostor_999');

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $this->actingAs($user)
        ->withSession(['google_verify_current_state' => $sessionState])
        ->get(route('settings.google.verify-current.callback', ['state' => 'test-state-token']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    expect(Cache::has("google_account_change_auth:{$user->id}"))->toBeFalse();
});

test('Password-based user can verify ownership via password to connect a Google account', function () {
    $user = User::factory()->create([
        'provider_name' => null,
        'provider_id' => null,
        'password' => Hash::make('secret12345'),
    ]);

    // Wrong password fails
    $this->actingAs($user)
        ->postJson(route('settings.google.verify-password'), ['password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);

    expect(Cache::has("google_account_change_auth:{$user->id}"))->toBeFalse();

    // Correct password succeeds
    $this->actingAs($user)
        ->postJson(route('settings.google.verify-password'), ['password' => 'secret12345'])
        ->assertOk()
        ->assertJson(['success' => true]);

    expect(Cache::has("google_account_change_auth:{$user->id}"))->toBeTrue();
});

test('Successful Google account replacement updates the SAME user and preserves all associated data (CASE A)', function () {
    $user = User::factory()->create([
        'name' => 'Workspace Owner',
        'first_name' => 'Workspace',
        'last_name' => 'Owner',
        'email' => 'old_account@gmail.com',
        'provider_name' => 'google',
        'provider_id' => 'google_old_100',
        'password' => Hash::make('random-placeholder'),
        'onboarding_completed' => true,
    ]);

    // Attach business, product, campaign, design, event
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'My Business']);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Coffee Blend']);
    $campaign = Campaign::factory()->create(['business_id' => $business->id, 'name' => 'Spring Promo']);
    $design = Design::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Launch Party']);

    $originalUserId = $user->id;
    $initialUserCount = User::count();

    // Authorize identity first
    Cache::put("google_account_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    // Initiate change
    config([
        'services.google.client_id' => 'mock-client-id',
        'services.google.client_secret' => 'mock-client-secret',
    ]);

    $this->actingAs($user)
        ->get(route('settings.google.change'))
        ->assertRedirect();

    $sessionState = session('google_change_oauth_state');
    expect($sessionState)->not->toBeNull()
        ->and($sessionState['user_id'])->toBe($user->id);

    // Mock new Google account authentication
    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn('google_new_200');
    $mockSocialite->shouldReceive('getName')->andReturn('Workspace Owner');
    $mockSocialite->shouldReceive('getEmail')->andReturn('new_account@gmail.com');
    $mockSocialite->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar_new.jpg');

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->once()->andReturn($mockProvider);

    // Callback execution
    $callback = $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => $sessionState])
        ->get(route('settings.google.change.callback', ['state' => $sessionState['state']]));

    $callback->assertRedirect(route('profile.edit'))
        ->assertSessionHas('success');

    // Verification: NO new MarketPilot user created
    expect(User::count())->toBe($initialUserCount);

    $user->refresh();

    // SAME user ID preserved
    expect($user->id)->toBe($originalUserId);
    expect($user->provider_name)->toBe('google');
    expect($user->provider_id)->toBe('google_new_200');
    expect($user->email)->toBe('new_account@gmail.com');
    expect($user->email_verified_at)->not->toBeNull();

    // All business relationships remain intact with the same user
    expect($user->business->id)->toBe($business->id);
    expect(Product::where('business_id', $business->id)->count())->toBe(1);
    expect(Campaign::where('business_id', $business->id)->count())->toBe(1);
    expect(Design::where('business_id', $business->id)->count())->toBe(1);
    expect(Event::where('user_id', $originalUserId)->count())->toBe(1);

    // Normal Google login now resolves using NEW provider ID (CASE K)
    $mockSocialiteLogin = Mockery::mock(SocialiteUser::class);
    $mockSocialiteLogin->shouldReceive('getId')->andReturn('google_new_200');
    $mockSocialiteLogin->shouldReceive('getName')->andReturn('Workspace Owner');
    $mockSocialiteLogin->shouldReceive('getEmail')->andReturn('new_account@gmail.com');
    $mockSocialiteLogin->shouldReceive('getAvatar')->andReturn(null);

    $mockProviderLogin = Mockery::mock(GoogleProvider::class);
    $mockProviderLogin->shouldReceive('stateless')->andReturnSelf();
    $mockProviderLogin->shouldReceive('user')->andReturn($mockSocialiteLogin);

    Socialite::shouldReceive('driver')->with('google')->once()->andReturn($mockProviderLogin);

    $this->app['auth']->forgetGuards();
    $login = $this->get(route('auth.social.callback', ['provider' => 'google']));
    $login->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);

    // Old Google account does NOT log into this account (CASE L)
    $mockSocialiteOld = Mockery::mock(SocialiteUser::class);
    $mockSocialiteOld->shouldReceive('getId')->andReturn('google_old_100');
    $mockSocialiteOld->shouldReceive('getName')->andReturn('Old Google Account');
    $mockSocialiteOld->shouldReceive('getEmail')->andReturn('old_account@gmail.com');
    $mockSocialiteOld->shouldReceive('getAvatar')->andReturn(null);

    $mockProviderOld = Mockery::mock(GoogleProvider::class);
    $mockProviderOld->shouldReceive('stateless')->andReturnSelf();
    $mockProviderOld->shouldReceive('user')->andReturn($mockSocialiteOld);

    Socialite::shouldReceive('driver')->with('google')->once()->andReturn($mockProviderOld);

    Auth::logout();
    $this->flushSession();

    $oldLogin = $this->get(route('auth.social.callback', ['provider' => 'google']));

    // Old account is treated as brand new social signup, NOT authenticated as the existing user
    $this->assertGuest();
    $oldLogin->assertRedirect(route('onboarding.show'));
});

test('Selecting the same Google account already linked is handled safely without duplicate changes (CASE B)', function () {
    $user = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_same_300',
        'email' => 'same@gmail.com',
    ]);

    Cache::put("google_account_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    $sessionState = [
        'user_id' => $user->id,
        'state' => 'same-state',
        'initiated_at' => now()->timestamp,
    ];

    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn('google_same_300');
    $mockSocialite->shouldReceive('getEmail')->andReturn('same@gmail.com');
    $mockSocialite->shouldReceive('getAvatar')->andReturn(null);

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => $sessionState])
        ->get(route('settings.google.change.callback', ['state' => 'same-state']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('info');

    $user->refresh();
    expect($user->provider_id)->toBe('google_same_300');
    expect($user->email)->toBe('same@gmail.com');
});

test('Linking a Google account already attached to another MarketPilot user is rejected (CASE C)', function () {
    $userA = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_user_a',
        'email' => 'usera@gmail.com',
    ]);

    $userB = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_user_b',
        'email' => 'userb@gmail.com',
    ]);

    Cache::put("google_account_change_auth:{$userA->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    $sessionState = [
        'user_id' => $userA->id,
        'state' => 'collision-state',
        'initiated_at' => now()->timestamp,
    ];

    // User A tries to link User B's Google account
    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn('google_user_b');
    $mockSocialite->shouldReceive('getEmail')->andReturn('userb@gmail.com');
    $mockSocialite->shouldReceive('getAvatar')->andReturn(null);

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $this->actingAs($userA)
        ->withSession(['google_change_oauth_state' => $sessionState])
        ->get(route('settings.google.change.callback', ['state' => 'collision-state']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    // Verify neither user was modified
    expect($userA->fresh()->provider_id)->toBe('google_user_a');
    expect($userB->fresh()->provider_id)->toBe('google_user_b');
});

test('Missing or unexpected provider ID is rejected (CASE D)', function () {
    $user = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_active',
    ]);

    Cache::put("google_account_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    $sessionState = [
        'user_id' => $user->id,
        'state' => 'valid-state',
        'initiated_at' => now()->timestamp,
    ];

    $mockSocialite = Mockery::mock(SocialiteUser::class);
    $mockSocialite->shouldReceive('getId')->andReturn(''); // Empty ID
    $mockSocialite->shouldReceive('getEmail')->andReturn('any@gmail.com');
    $mockSocialite->shouldReceive('getAvatar')->andReturn(null);

    $mockProvider = Mockery::mock(GoogleProvider::class);
    $mockProvider->shouldReceive('redirectUrl')->andReturnSelf();
    $mockProvider->shouldReceive('stateless')->andReturnSelf();
    $mockProvider->shouldReceive('user')->andReturn($mockSocialite);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => $sessionState])
        ->get(route('settings.google.change.callback', ['state' => 'valid-state']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    expect($user->fresh()->provider_id)->toBe('google_active');
});

test('Invalid or expired OAuth state is rejected (CASE E & F)', function () {
    $user = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_active',
    ]);

    Cache::put("google_account_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    // Invalid state token
    $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => [
            'user_id' => $user->id,
            'state' => 'real-state',
            'initiated_at' => now()->timestamp,
        ]])
        ->get(route('settings.google.change.callback', ['state' => 'tampered-state']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    // Expired state (> 10 minutes)
    $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => [
            'user_id' => $user->id,
            'state' => 'expired-state',
            'initiated_at' => now()->subMinutes(15)->timestamp,
        ]])
        ->get(route('settings.google.change.callback', ['state' => 'expired-state']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');
});

test('User cancelling Google OAuth causes no account changes (CASE I)', function () {
    $user = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google_active',
        'email' => 'stay_same@gmail.com',
    ]);

    Cache::put("google_account_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    $this->actingAs($user)
        ->withSession(['google_change_oauth_state' => [
            'user_id' => $user->id,
            'state' => 'cancel-state',
            'initiated_at' => now()->timestamp,
        ]])
        ->get(route('settings.google.change.callback', ['error' => 'access_denied']))
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHas('error');

    $user->refresh();
    expect($user->provider_id)->toBe('google_active');
    expect($user->email)->toBe('stay_same@gmail.com');
});
