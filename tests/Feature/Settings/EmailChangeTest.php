<?php

use App\Models\User;
use App\Notifications\EmailChangeVerificationNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

test('unauthenticated user cannot access email change endpoints', function () {
    $this->postJson(route('settings.email.verify-identity'), ['password' => 'password'])
        ->assertUnauthorized();

    $this->postJson(route('settings.email.request-change'), ['email' => 'new@example.com'])
        ->assertUnauthorized();

    $this->postJson(route('settings.email.confirm-change'), ['code' => '123456'])
        ->assertUnauthorized();

    $this->postJson(route('settings.email.resend-code'))
        ->assertUnauthorized();

    $this->deleteJson(route('settings.email.cancel-change'))
        ->assertUnauthorized();
});

test('identity verification requires correct current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('secret-password'),
    ]);

    $this->actingAs($user)
        ->postJson(route('settings.email.verify-identity'), [
            'password' => 'wrong-password',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);

    expect(Cache::has("email_change_auth:{$user->id}"))->toBeFalse();

    $this->actingAs($user)
        ->postJson(route('settings.email.verify-identity'), [
            'password' => 'secret-password',
        ])
        ->assertOk()
        ->assertJson(['success' => true]);

    expect(Cache::has("email_change_auth:{$user->id}"))->toBeTrue();
});

test('cannot request email change without prior identity verification', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'candidate@example.com',
            'email_confirmation' => 'candidate@example.com',
        ])
        ->assertForbidden();
});

test('requesting email change enforces format, confirmation, and uniqueness', function () {
    Notification::fake();

    $user = User::factory()->create(['email' => 'current@example.com']);
    $existingUser = User::factory()->create(['email' => 'taken@example.com']);

    // Authorize identity first
    Cache::put("email_change_auth:{$user->id}", ['verified_at' => now()->timestamp], now()->addMinutes(15));

    // Invalid format
    $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'not-an-email',
            'email_confirmation' => 'not-an-email',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    // Current email rejected
    $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'current@example.com',
            'email_confirmation' => 'current@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    // Taken email rejected
    $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'taken@example.com',
            'email_confirmation' => 'taken@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    // Confirmation mismatch
    $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'new@example.com',
            'email_confirmation' => 'different@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    // Successful request
    $response = $this->actingAs($user)
        ->postJson(route('settings.email.request-change'), [
            'email' => 'new@example.com',
            'email_confirmation' => 'new@example.com',
        ])
        ->assertOk()
        ->assertJson(['success' => true]);

    expect($response->json('masked_email'))->toBe('n•••••@example.com');
    expect(Cache::has("pending_email_change:{$user->id}"))->toBeTrue();
    expect($user->fresh()->email)->toBe('current@example.com'); // primary email unchanged!

    Notification::assertSentOnDemand(
        EmailChangeVerificationNotification::class,
        function ($notification, $channels, $notifiable) {
            return $notifiable->routes['mail'] === 'new@example.com';
        }
    );
});

test('confirming email change requires matching code and updates user email upon success', function () {
    $user = User::factory()->create([
        'email' => 'original@example.com',
        'email_verified_at' => now()->subYear(),
    ]);

    $code = '654321';
    Cache::put("pending_email_change:{$user->id}", [
        'new_email' => 'verified-new@example.com',
        'code_hash' => Hash::make($code),
        'expires_at' => now()->addMinutes(15)->timestamp,
        'attempts' => 0,
    ], now()->addMinutes(15));

    // Wrong code fails
    $this->actingAs($user)
        ->postJson(route('settings.email.confirm-change'), [
            'code' => '999999',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['code']);

    expect($user->fresh()->email)->toBe('original@example.com');

    // Correct code succeeds
    $this->actingAs($user)
        ->postJson(route('settings.email.confirm-change'), [
            'code' => '654321',
        ])
        ->assertOk()
        ->assertJson([
            'success' => true,
            'new_email' => 'verified-new@example.com',
        ]);

    $user->refresh();
    expect($user->email)->toBe('verified-new@example.com');
    expect($user->email_verified_at)->not->toBeNull();
    expect(Cache::has("pending_email_change:{$user->id}"))->toBeFalse();
});

test('expired verification code is rejected', function () {
    $user = User::factory()->create(['email' => 'user@example.com']);

    Cache::put("pending_email_change:{$user->id}", [
        'new_email' => 'new@example.com',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->subMinute()->timestamp,
        'attempts' => 0,
    ], now()->addMinutes(5));

    $this->actingAs($user)
        ->postJson(route('settings.email.confirm-change'), [
            'code' => '123456',
        ])
        ->assertStatus(422);

    expect($user->fresh()->email)->toBe('user@example.com');
});

test('exceeding maximum verification attempts locks out and clears request', function () {
    $user = User::factory()->create(['email' => 'user@example.com']);

    Cache::put("pending_email_change:{$user->id}", [
        'new_email' => 'new@example.com',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(15)->timestamp,
        'attempts' => 5,
    ], now()->addMinutes(15));

    $this->actingAs($user)
        ->postJson(route('settings.email.confirm-change'), [
            'code' => '000000',
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Too many invalid attempts. For your security, this verification request has been cancelled.']);

    expect(Cache::has("pending_email_change:{$user->id}"))->toBeFalse();
    expect($user->fresh()->email)->toBe('user@example.com');
});

test('resending code generates new code and enforces cooldown', function () {
    Notification::fake();

    $user = User::factory()->create();

    Cache::put("pending_email_change:{$user->id}", [
        'new_email' => 'new@example.com',
        'code_hash' => Hash::make('111111'),
        'expires_at' => now()->addMinutes(15)->timestamp,
        'attempts' => 0,
        'resend_available_at' => now()->subSecond()->timestamp,
    ], now()->addMinutes(15));

    // First resend succeeds
    $this->actingAs($user)
        ->postJson(route('settings.email.resend-code'))
        ->assertOk()
        ->assertJson(['success' => true]);

    // Immediate second resend is rate-limited
    $this->actingAs($user)
        ->postJson(route('settings.email.resend-code'))
        ->assertStatus(429);
});

test('cancelling email change removes pending state and keeps current email', function () {
    $user = User::factory()->create(['email' => 'stay@example.com']);

    Cache::put("pending_email_change:{$user->id}", [
        'new_email' => 'abandoned@example.com',
        'code_hash' => Hash::make('123456'),
        'expires_at' => now()->addMinutes(15)->timestamp,
    ], now()->addMinutes(15));

    $this->actingAs($user)
        ->deleteJson(route('settings.email.cancel-change'))
        ->assertOk()
        ->assertJson(['success' => true]);

    expect(Cache::has("pending_email_change:{$user->id}"))->toBeFalse();
    expect($user->fresh()->email)->toBe('stay@example.com');
});

test('direct modification of email via profile.update is rejected', function () {
    $user = User::factory()->create(['email' => 'current@example.com']);

    $response = $this->actingAs($user)
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => 'different@example.com',
        ]);

    $response->assertSessionHasErrors(['email']);
    expect($user->fresh()->email)->toBe('current@example.com');
});

test('profile.update allows submitting unchanged email alongside profile details', function () {
    $user = User::factory()->create(['email' => 'same@example.com']);

    $response = $this->actingAs($user)
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => 'same@example.com',
            'first_name' => 'NewFirst',
            'last_name' => 'NewLast',
        ]);

    $response->assertSessionHasNoErrors();
    expect($user->fresh()->name)->toBe('Updated Name');
    expect($user->fresh()->email)->toBe('same@example.com');
    expect($user->fresh()->first_name)->toBe('NewFirst');
});
