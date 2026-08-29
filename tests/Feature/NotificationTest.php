<?php

use App\Models\AppNotification;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot access notifications or endpoints', function () {
    $this->get('/notifications')->assertRedirect(route('login'));
    $this->post('/notifications/read-all')->assertRedirect(route('login'));
    $this->delete('/notifications')->assertRedirect(route('login'));
});

test('user can view notifications with strict tenant isolation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $otherUser = User::factory()->create(['onboarding_completed' => true]);

    $userNotification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'event',
        'title' => 'Upcoming Holiday: Independence Day',
        'message' => 'An upcoming Philippine holiday is approaching.',
        'action_url' => '/calendar',
    ]);

    $otherNotification = AppNotification::create([
        'user_id' => $otherUser->id,
        'type' => 'security',
        'title' => 'Other User Login',
        'message' => 'Private login information.',
        'action_url' => '/settings/security',
    ]);

    $response = $this->actingAs($user)->get('/notifications');

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('notifications/index')
        ->where('unread_count', 1)
        ->where('total_count', 1)
        ->has('notifications', 1)
        ->where('notifications.0.id', $userNotification->id)
        ->where('notifications.0.title', 'Upcoming Holiday: Independence Day')
    );
});

test('user cannot mark or delete another user notification', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $otherUser = User::factory()->create(['onboarding_completed' => true]);

    $otherNotification = AppNotification::create([
        'user_id' => $otherUser->id,
        'type' => 'security',
        'title' => 'Secret',
        'message' => 'Other user notification',
    ]);

    $this->actingAs($user)
        ->post("/notifications/{$otherNotification->id}/read")
        ->assertForbidden();

    $this->actingAs($user)
        ->delete("/notifications/{$otherNotification->id}")
        ->assertForbidden();
});

test('user can mark a notification as read and unread', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $notification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'campaign',
        'title' => 'Campaign Scheduled',
        'message' => 'Your campaign has been scheduled.',
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->post("/notifications/{$notification->id}/read")
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();

    $this->actingAs($user)
        ->post("/notifications/{$notification->id}/unread")
        ->assertRedirect();

    expect($notification->fresh()->read_at)->toBeNull();
});

test('user can mark all notifications as read and clear all notifications', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'event',
        'title' => 'Holiday 1',
        'message' => 'Details 1',
        'read_at' => null,
    ]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'event',
        'title' => 'Holiday 2',
        'message' => 'Details 2',
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/notifications/read-all')
        ->assertRedirect();

    expect($user->appNotifications()->unread()->count())->toBe(0);

    $this->actingAs($user)
        ->delete('/notifications')
        ->assertRedirect();

    expect($user->appNotifications()->count())->toBe(0);
});

test('login creates a single semantic success notification', function () {
    $user = User::factory()->create(['password' => bcrypt('Password123!')]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'Password123!',
    ])->assertRedirect('/dashboard');

    $notification = $user->appNotifications()->latest()->first();

    expect($notification)->not->toBeNull();
    expect($notification->title)->toBe('Signed in successfully');
    expect($notification->type)->toBe('success');
    expect($notification->message)->toContain('successfully signed in');
});

test('logout does not leave unread popup notification for next login', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post('/logout')->assertRedirect('/');

    $logoutNotification = $user->appNotifications()->where('title', 'Signed out successfully')->first();

    if ($logoutNotification) {
        expect($logoutNotification->read_at)->not->toBeNull();
    }
});
