<?php

use App\Models\User;

test('guests are redirected to the login page when visiting subscriptions', function () {
    $response = $this->get(route('subscriptions.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view the subscriptions and plan page', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $response = $this->actingAs($user)->get(route('subscriptions.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('subscriptions/index')
        ->has('plan.name')
        ->has('plan.status')
        ->has('plan.features')
        ->has('plan.capabilities')
        ->has('quota.application_configured_limit')
        ->where('plan.name', 'Studio Pro Workspace')
        ->where('plan.status', 'Active')
    );
});

test('subscriptions page does not expose fake payment methods or transactions', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $response = $this->actingAs($user)->get(route('subscriptions.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('subscriptions/index')
        ->missing('payment_method')
        ->missing('credit_card')
        ->missing('transactions')
        ->missing('invoices')
    );
});
