<?php

use App\Models\AppNotification;
use App\Models\Business;
use App\Models\User;

test('authenticated users can view notifications page', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'system',
        'title' => 'Welcome Notification',
        'message' => 'Welcome to MarketPilot.',
    ]);

    $response = $this->actingAs($user)->get(route('notifications.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('notifications/index')
        ->has('notifications', 1)
        ->where('unread_count', 1)
    );
});

test('users can mark a notification as read and unread', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $notification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'product_created',
        'title' => 'Product Created',
        'message' => 'Your product was created.',
    ]);

    expect($notification->read_at)->toBeNull();

    $response = $this->actingAs($user)->post(route('notifications.read', $notification));
    $response->assertRedirect();

    $notification->refresh();
    expect($notification->read_at)->not->toBeNull();

    $response2 = $this->actingAs($user)->post(route('notifications.unread', $notification));
    $response2->assertRedirect();

    $notification->refresh();
    expect($notification->read_at)->toBeNull();
});

test('users can mark all notifications as read', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'campaign_created',
        'title' => 'Campaign 1',
        'message' => 'Message 1',
    ]);

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'campaign_created',
        'title' => 'Campaign 2',
        'message' => 'Message 2',
    ]);

    expect($user->appNotifications()->unread()->count())->toBe(2);

    $response = $this->actingAs($user)->post(route('notifications.read-all'));
    $response->assertRedirect();

    expect($user->appNotifications()->unread()->count())->toBe(0);
});

test('users can delete and clear all notifications', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $notification = AppNotification::create([
        'user_id' => $user->id,
        'type' => 'design_created',
        'title' => 'Design 1',
        'message' => 'Message 1',
    ]);

    $response = $this->actingAs($user)->delete(route('notifications.destroy', $notification));
    $response->assertRedirect();

    expect(AppNotification::find($notification->id))->toBeNull();

    AppNotification::create([
        'user_id' => $user->id,
        'type' => 'event_created',
        'title' => 'Event 1',
        'message' => 'Message 1',
    ]);

    $response2 = $this->actingAs($user)->delete(route('notifications.clear-all'));
    $response2->assertRedirect();

    expect($user->appNotifications()->count())->toBe(0);
});
