<?php

use App\Models\Business;
use App\Models\LegalAcceptance;
use App\Models\PendingOnboarding;
use App\Models\User;
use App\Services\PendingOnboardingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

test('new normal registration creates pending onboarding and no permanent user row', function () {
    $initialUserCount = User::count();

    $response = $this->post(route('register.store'), [
        'username' => 'pending_johndoe',
        'email' => 'johndoe@example.com',
        'password' => 'SecurePass123!',
        'password_confirmation' => 'SecurePass123!',
    ]);

    $response->assertRedirect(route('verification.notice'));
    $response->assertSessionHas(PendingOnboardingService::SESSION_KEY);

    // CRITICAL: Verify ZERO new rows in users table
    expect(User::count())->toBe($initialUserCount)
        ->and(User::where('email', 'johndoe@example.com')->exists())->toBeFalse();

    // Verify pending onboarding row created
    $pending = PendingOnboarding::where('email', 'johndoe@example.com')->first();
    expect($pending)->not->toBeNull()
        ->and($pending->username)->toBe('pending_johndoe')
        ->and($pending->registration_type)->toBe('normal')
        ->and($pending->email_verification_code)->not->toBeNull()
        ->and($pending->email_verified_at)->toBeNull();
});

test('new google social auth creates pending onboarding and no permanent user row', function () {
    $initialUserCount = User::count();

    $mockSocialiteUser = Mockery::mock(SocialiteUser::class);
    $mockSocialiteUser->shouldReceive('getId')->andReturn('google_987654321');
    $mockSocialiteUser->shouldReceive('getName')->andReturn('Elena Vance');
    $mockSocialiteUser->shouldReceive('getEmail')->andReturn('elena.vance@example.com');
    $mockSocialiteUser->shouldReceive('getAvatar')->andReturn('https://lh3.googleusercontent.com/avatar.jpg');

    $mockProvider = Mockery::mock(Provider::class);
    $mockProvider->shouldReceive('user')->andReturn($mockSocialiteUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($mockProvider);

    $response = $this->get(route('auth.social.callback', ['provider' => 'google']));

    $response->assertRedirect(route('onboarding.show'));
    $this->assertGuest(); // Not permanently authenticated

    // CRITICAL: Verify ZERO new rows in users table
    expect(User::count())->toBe($initialUserCount)
        ->and(User::where('email', 'elena.vance@example.com')->exists())->toBeFalse();

    // Verify pending onboarding created with Google data prefilled
    $pending = PendingOnboarding::where('email', 'elena.vance@example.com')->first();
    expect($pending)->not->toBeNull()
        ->and($pending->provider_id)->toBe('google_987654321')
        ->and($pending->first_name)->toBe('Elena')
        ->and($pending->last_name)->toBe('Vance')
        ->and($pending->email_verified_at)->not->toBeNull();
});

test('email verification works on pending onboarding without creating user row', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'verify.pending@example.com',
        'username' => 'verify_pending',
        'password_hash' => Hash::make('password123'),
    ]);

    $code = $pending->generateEmailVerificationCode();

    $response = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post('/email/verify-code', [
            'code' => $code,
        ]);

    $response->assertRedirect(route('onboarding.show'));

    expect(User::where('email', 'verify.pending@example.com')->exists())->toBeFalse()
        ->and($pending->fresh()->isEmailVerified())->toBeTrue();
});

test('step 1 personal information validates required fields', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'personal.step@example.com',
        'username' => 'personal_step',
        'email_verified_at' => now(),
    ]);

    // First and last name required
    $response = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post(route('onboarding.personal'), [
            'first_name' => '',
            'last_name' => '',
        ]);

    $response->assertSessionHasErrors(['first_name', 'last_name']);

    // Valid personal information saves to pending
    $response2 = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post(route('onboarding.personal'), [
            'first_name' => 'Maria Clara',
            'middle_name' => 'de los Santos',
            'last_name' => 'Ibarra',
            'suffix' => 'MD',
            'mobile_number' => '+63 917 888 9999',
        ]);

    $response2->assertRedirect(route('onboarding.show', ['step' => 2]));

    $pending->refresh();
    expect($pending->first_name)->toBe('Maria Clara')
        ->and($pending->middle_name)->toBe('de los Santos')
        ->and($pending->last_name)->toBe('Ibarra')
        ->and($pending->suffix)->toBe('MD')
        ->and($pending->mobile_number)->toBe('+63 917 888 9999')
        ->and(User::where('email', 'personal.step@example.com')->exists())->toBeFalse();
});

test('step 2 business and step 3 about save to pending onboarding without creating permanent tables', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'biz.step@example.com',
        'username' => 'biz_step',
        'email_verified_at' => now(),
        'first_name' => 'Crisostomo',
        'last_name' => 'Ibarra',
    ]);

    // Step 2: Save business basic info
    $response1 = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post(route('onboarding.business'), [
            'name' => 'San Diego Artisan Roasters',
            'industry' => 'Food & Beverage',
            'category' => 'Café / Coffee Shop',
        ]);

    $response1->assertRedirect(route('onboarding.show', ['step' => 3]));

    $pending->refresh();
    expect($pending->business_name)->toBe('San Diego Artisan Roasters')
        ->and(Business::where('name', 'San Diego Artisan Roasters')->exists())->toBeFalse();

    // Step 3: Save about & legal info
    $response2 = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post(route('onboarding.business'), [
            'name' => 'San Diego Artisan Roasters',
            'industry' => 'Food & Beverage',
            'category' => 'Café / Coffee Shop',
            'description' => 'Specialty coffee roasting in Laguna.',
            'business_address' => '456 Heritage Road',
            'city_municipality' => 'Calamba',
            'province' => 'Laguna',
            'region' => 'Region IV-A',
            'terms_of_service' => true,
            'privacy_notice' => true,
            'content_ip_responsibility' => true,
            'ai_content_responsibility' => true,
        ]);

    $response2->assertRedirect(route('onboarding.show', ['step' => 4]));

    $pending->refresh();
    expect($pending->business_description)->toBe('Specialty coffee roasting in Laguna.')
        ->and($pending->accepted_legal_documents)->toContain('terms_of_service', 'privacy_notice', 'content_ip_responsibility', 'ai_content_responsibility')
        ->and(User::where('email', 'biz.step@example.com')->exists())->toBeFalse()
        ->and(Business::where('name', 'San Diego Artisan Roasters')->exists())->toBeFalse()
        ->and(LegalAcceptance::count())->toBe(0);
});

test('abandoned onboarding leaves no permanent rows in users or businesses', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'abandoned@example.com',
        'username' => 'abandoned_user',
        'email_verified_at' => now(),
        'first_name' => 'Abandoned',
        'last_name' => 'User',
        'business_name' => 'Abandoned Enterprise',
        'industry' => 'Retail & E-Commerce',
        'category' => 'General Retail',
    ]);

    // User simply closes browser or stops here without completing
    expect(User::where('email', 'abandoned@example.com')->exists())->toBeFalse()
        ->and(Business::where('name', 'Abandoned Enterprise')->exists())->toBeFalse();
});

test('launch workspace creates permanent users, businesses, and legal acceptances in atomic transaction', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'launch.ready@example.com',
        'username' => 'launch_ready',
        'password_hash' => Hash::make('SuperSecretPass!'),
        'email_verified_at' => now(),
        'first_name' => 'Gabriela',
        'middle_name' => 'Cariño',
        'last_name' => 'Silang',
        'suffix' => null,
        'mobile_number' => '+63 918 123 4567',
        'business_name' => 'Silang Marketing Hub',
        'industry' => 'Technology & Digital Services',
        'category' => 'Software / Digital Services',
        'business_description' => 'Digital agency empowerer.',
        'business_address' => '789 Revolution Way',
        'city_municipality' => 'Vigan City',
        'province' => 'Ilocos Sur',
        'region' => 'Region I',
        'accepted_legal_documents' => [
            'terms_of_service',
            'privacy_notice',
            'content_ip_responsibility',
            'ai_content_responsibility',
        ],
    ]);

    $response = $this->withSession([PendingOnboardingService::SESSION_KEY => $pending->token])
        ->post(route('onboarding.complete'));

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    // Verify permanent user created
    $user = User::where('email', 'launch.ready@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->first_name)->toBe('Gabriela')
        ->and($user->middle_name)->toBe('Cariño')
        ->and($user->last_name)->toBe('Silang')
        ->and($user->onboarding_completed)->toBeTrue()
        ->and($user->onboarding_completed_at)->not->toBeNull();

    // Verify business row created
    $business = $user->business;
    expect($business)->not->toBeNull()
        ->and($business->name)->toBe('Silang Marketing Hub')
        ->and($business->industry)->toBe('Technology & Digital Services')
        ->and($business->category)->toBe('Software / Digital Services');

    // Verify 4 legal acceptances created
    expect($user->legalAcceptances()->count())->toBe(4);

    // Verify pending onboarding cleaned up
    expect(PendingOnboarding::where('email', 'launch.ready@example.com')->exists())->toBeFalse();
});

test('launch workspace rolls back completely if transaction encounters failure', function () {
    $pending = PendingOnboarding::create([
        'token' => PendingOnboarding::generateToken(),
        'registration_type' => 'normal',
        'email' => 'fail.test@example.com',
        'username' => 'fail_test',
        'password_hash' => Hash::make('password123'),
        'email_verified_at' => now(),
        'first_name' => 'Fail',
        'last_name' => 'Test',
        'business_name' => 'Fail Business',
        'industry' => 'Retail & E-Commerce',
        'category' => 'General Retail',
        'accepted_legal_documents' => [
            'terms_of_service',
            'privacy_notice',
            'content_ip_responsibility',
            'ai_content_responsibility',
        ],
    ]);

    // Force an exception during transaction by intercepting User::created or DB
    $service = app(PendingOnboardingService::class);

    // Let's create an existing user with duplicate email right before call to trigger rollback
    User::factory()->create(['email' => 'fail.test@example.com']);

    expect(fn () => $service->launchWorkspace($pending, request()))
        ->toThrow(InvalidArgumentException::class);

    // Ensure business was not partially created
    expect(Business::where('name', 'Fail Business')->exists())->toBeFalse()
        ->and(LegalAcceptance::whereHas('user', fn ($q) => $q->where('email', 'fail.test@example.com'))->exists())->toBeFalse()
        // Pending onboarding remains for retry
        ->and(PendingOnboarding::where('email', 'fail.test@example.com')->exists())->toBeTrue();
});

test('existing completed users can authenticate and continue normally', function () {
    $existing = User::factory()->create([
        'username' => 'existing_active',
        'email' => 'existing.active@example.com',
        'first_name' => 'Active',
        'last_name' => 'Existing',
        'onboarding_completed' => true,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => 'existing.active@example.com',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($existing);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('google connected accounts cannot alter first name, last name or suffix during onboarding', function () {
    $pending = PendingOnboarding::create([
        'token' => Str::random(64),
        'registration_type' => 'social',
        'provider_name' => 'google',
        'provider_id' => 'google_123456',
        'email' => 'google.user@example.com',
        'first_name' => 'OriginalGoogleFirst',
        'last_name' => 'OriginalGoogleLast',
        'suffix' => null,
        'email_verified_at' => now(),
        'current_step' => 1,
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->withSession([
        PendingOnboardingService::SESSION_KEY => $pending->token,
    ])->post(route('onboarding.personal'), [
        'first_name' => 'HackedFirst',
        'middle_name' => 'Middle',
        'last_name' => 'HackedLast',
        'suffix' => 'Jr.',
        'mobile_number' => '+63 917 123 4567',
    ]);

    $response->assertRedirect(route('onboarding.show', ['step' => 2]));

    $pending->refresh();
    expect($pending->first_name)->toBe('OriginalGoogleFirst')
        ->and($pending->last_name)->toBe('OriginalGoogleLast')
        ->and($pending->suffix)->toBeNull()
        ->and($pending->middle_name)->toBe('Middle')
        ->and($pending->mobile_number)->toBe('+63 917 123 4567');
});
