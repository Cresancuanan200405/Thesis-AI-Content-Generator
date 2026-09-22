<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config()->set('services.openai.api_key', 'test-key');
});

test('Test 1 — long user instruction does not block tagline suggestion', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Artisan Pour-Over',
        'price' => 180.00,
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Morning Roast Campaign',
    ]);

    $longInstruction = str_repeat('Detailed scene staging with rustic oak wood textures and golden morning light. ', 30);
    expect(strlen($longInstruction))->toBeGreaterThan(1000);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode(['tagline' => 'Crafted for Pure Morning Focus']),
                        ],
                    ],
                ],
            ],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'catalog_product_ids' => [$product->id],
            'product_name' => $product->name,
            'user_instruction' => $longInstruction,
            'render_style' => 'Studio Product Still',
            'visual_theme' => ['Minimal', 'Commercial'],
            'brand_tone' => ['Warm', 'Artisanal'],
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => 'Crafted for Pure Morning Focus',
        ]);
});

test('Test 2 — visual prompt validation still protects existing endpoint with 422 on long user_instruction', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $longInstruction = str_repeat('Extremely long visual instruction text exceeding limits. ', 30);
    expect(strlen($longInstruction))->toBeGreaterThan(1000);

    $response = $this->actingAs($user)
        ->postJson('/generator/prompt', [
            'campaign_id' => $campaign->id,
            'generation_mode' => 'manual',
            'user_instruction' => $longInstruction,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['user_instruction']);
});

test('Test 3 — AI tagline is actually used in response', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $expectedTagline = 'A Thoughtful Sip for Every Lesson';

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode(['tagline' => $expectedTagline]),
                        ],
                    ],
                ],
            ],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Signature Blend',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'tagline' => $expectedTagline,
        ]);
});

test('Test 4 — no hardcoded tagline fallback when AI returns empty tagline', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode(['tagline' => '']),
                        ],
                    ],
                ],
            ],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Signature Blend',
        ]);

    $response->assertStatus(500)
        ->assertJson([
            'success' => false,
        ]);
});

test('Test 5 — tenant isolation prevents using another users campaign or product', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $userB = User::factory()->create(['onboarding_completed' => true]);

    $businessB = Business::factory()->create(['user_id' => $userB->id]);
    $productB = Product::factory()->create(['business_id' => $businessB->id]);
    $campaignB = Campaign::factory()->create([
        'user_id' => $userB->id,
        'business_id' => $businessB->id,
    ]);

    // User A attempts to suggest tagline using User B's campaign
    $responseCampaign = $this->actingAs($userA)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaignB->id,
        ]);

    $responseCampaign->assertStatus(422)
        ->assertJsonValidationErrors(['campaign_id']);

    // User A with their own campaign attempts to include User B's product
    $businessA = Business::factory()->create(['user_id' => $userA->id]);
    $campaignA = Campaign::factory()->create([
        'user_id' => $userA->id,
        'business_id' => $businessA->id,
    ]);

    $responseProduct = $this->actingAs($userA)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaignA->id,
            'catalog_product_ids' => [$productB->id],
        ]);

    $responseProduct->assertStatus(422)
        ->assertJsonValidationErrors(['catalog_product_ids']);
});

test('Test 6 — budget protection blocks suggestion when quota is reached', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 15.00], 'organization_name' => 'FSUU']]],
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

    config()->set('services.openai.budget_limit', 10.00);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Artisan Pour-Over',
        ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'quota_exceeded' => true,
        ]);
});

test('Test 7 — AI-returned tagline passes through normalization behavior', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    // Model returns tagline wrapped in quotes with trailing punctuation
    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode(['tagline' => '"A Thoughtful Sip for Every Lesson."']),
                        ],
                    ],
                ],
            ],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    $response = $this->actingAs($user)
        ->postJson('/generator/manual/suggest-tagline', [
            'campaign_id' => $campaign->id,
            'product_name' => 'Specialty Blend',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            // Assert surrounding quotes and trailing period were normalized away
            'tagline' => 'A Thoughtful Sip for Every Lesson',
        ]);
});
