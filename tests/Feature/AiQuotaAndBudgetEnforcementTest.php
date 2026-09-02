<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Cache::flush();
    Storage::fake('public');
    Config::set('services.openai.admin_key', 'sk-admin-test-key-12345');
    Config::set('services.openai.organization', 'org-ZyTriRoIVgLU57NzQNqsvK8g');
    Config::set('services.openai.budget_limit', 10.00);
});

test('user hasReachedAiBudgetLimit returns false when total spent is below limit', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);

    expect($user->hasReachedAiBudgetLimit(10.00))->toBeFalse()
        ->and($user->getAiRemainingBudget(10.00))->toBe(7.65)
        ->and($user->getAiTotalSpent())->toBe(2.35);
});

test('user hasReachedAiBudgetLimit returns true when total spent meets or exceeds limit', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 10.00], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 250000, 'num_model_requests' => 120]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);

    expect($user->hasReachedAiBudgetLimit(10.00))->toBeTrue()
        ->and($user->getAiRemainingBudget(10.00))->toBe(0.0);
});

test('generator store endpoint blocks new generation when budget limit is reached', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 10.50], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 300000, 'num_model_requests' => 150]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('generator.store'), [
        'product_name' => 'Sample Product',
        'marketing_goal' => 'Holiday Sale',
        'event_id' => $event->id,
    ]);

    $response->assertRedirect(route('generator.index'));
    $response->assertSessionHas('error');
    expect(session('error'))->toContain('AI generation limit quota. Visual generation is disabled.');
});

test('generator direct visual endpoint blocks generation with json response when budget limit is reached', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 12.00], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 350000, 'num_model_requests' => 200]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->postJson(route('generator.preview'), [
        'product_name' => 'Premium Coffee',
        'marketing_goal' => 'Brand Awareness',
        'event_id' => $event->id,
    ]);

    $response->assertStatus(403);
    $response->assertJson([
        'success' => false,
        'quota_exceeded' => true,
    ]);
});

test('design regeneration blocks request when budget limit is reached', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 10.00], 'organization_name' => 'FSUU']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 300000, 'num_model_requests' => 150]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'completed',
    ]);

    $response = $this->actingAs($user)->post(route('designs.regenerate', $design), [
        'feedback' => 'Make the background warmer',
    ]);

    $response->assertRedirect(route('designs.index'));
    $response->assertSessionHas('error');
    expect(session('error'))->toContain('AI generation limit quota. Visual regeneration is disabled.');
});

test('tenant isolation ensures user cannot access another users generation requests or designs', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $businessA = Business::factory()->create(['user_id' => $userA->id]);
    $designA = Design::factory()->create([
        'user_id' => $userA->id,
        'business_id' => $businessA->id,
    ]);

    $userB = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $userB->id]);

    $response = $this->actingAs($userB)->get(route('designs.show', $designA));
    $response->assertStatus(403);
});
