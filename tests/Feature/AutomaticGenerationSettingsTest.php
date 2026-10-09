<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\MarketingDesignSystem;
use App\Services\OpenAIUsageService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Config::set('services.openai.api_key', 'sk-test-mock-key-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.image_model', 'gpt-image-2');
    Config::set('services.openai.budget_limit', 10.00);
});

function createAutoSettingsTestSetup(array $businessOverrides = [], array $campaignOverrides = [], array $productOverrides = [], ?array $eventOverrides = null): array
{
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(array_merge([
        'user_id' => $user->id,
        'name' => 'Lumina Artisan Roastery',
        'industry' => 'Food & Beverage',
        'category' => 'Craft Coffee',
    ], $businessOverrides));

    $event = null;
    if ($eventOverrides !== null) {
        $event = Event::factory()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'Autumn Harvest Festival',
            'description' => 'Seasonal autumn coffee blend launch.',
        ], $eventOverrides));
    }

    $campaign = Campaign::factory()->create(array_merge([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event?->id,
        'name' => 'Harvest Blend Campaign',
        'objective' => 'Promote Seasonal Blend',
    ], $campaignOverrides));

    $product = Product::factory()->create(array_merge([
        'business_id' => $business->id,
        'name' => 'Ethiopian Yirgacheffe Beans',
        'price' => 450.00,
        'image_path' => 'products/yirgacheffe.png',
    ], $productOverrides));

    return [$user, $business, $campaign, $product, $event];
}

function fakeAutoAiResponses(array $creativeAttributes = []): array
{
    $recordedPayloads = [];

    $creativeResult = array_merge([
        'tagline' => 'Crafted for Pure Sensation',
        'creative_concept' => 'Artisanal morning brewing with warm sunbeams',
        'visual_strategy' => 'Overhead clean commercial staging with fresh roasted beans',
        'visual_prompt' => 'A matte bag of Ethiopian Yirgacheffe beans on warm rustic slate with morning ambient sunlight',
        'scene_family' => 'tabletop still life',
        'environment_family' => 'warm_wood_terracotta',
        'composition_type' => 'centered hero placement',
        'camera_viewpoint' => 'three-quarters-dynamic',
        'lighting_profile' => 'morning window glow',
        'prop_profile' => 'roasted beans, ceramic dripper',
        'copy_layout' => 'editorial-clean',
        'product_name_style' => 'editorial-serif',
        'price_style' => 'badge',
        'tagline_style' => 'hero-headline',
        'text_depth_mode' => 'flat-graphic',
        'visual_world_archetype' => 'artisanal_workshop',
        'background_style' => 'stone',
        'product_arrangement' => 'hero solitary focus',
        'visual_theme' => 'Seasonal Artisanal',
        'brand_tone' => 'Premium Craft',
        'design_treatment' => 'Editorial',
        'copy_emphasis' => 'Balanced',
        'render_style' => 'Studio Product Still',
    ], $creativeAttributes);

    Http::fake([
        'https://api.openai.com/v1/responses*' => function ($request) use (&$recordedPayloads, $creativeResult) {
            $data = $request->data();
            $recordedPayloads[] = $data;

            return Http::response([
                'id' => 'resp-test-'.uniqid(),
                'status' => 'completed',
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => json_encode($creativeResult),
                            ],
                        ],
                    ],
                ],
                'usage' => [
                    'input_tokens' => 400,
                    'output_tokens' => 200,
                ],
            ], 200);
        },

        'https://api.openai.com/v1/images/edits*' => function ($request) {
            $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

            return Http::response([
                'created' => time(),
                'data' => [
                    [
                        'b64_json' => base64_encode($imgBinary),
                        'revised_prompt' => 'Production rendered visual artwork',
                    ],
                ],
                'usage' => [
                    'input_tokens' => 150,
                    'output_tokens' => 1000,
                ],
            ], 200);
        },

        'https://api.openai.com/v1/images/generations*' => function ($request) {
            $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

            return Http::response([
                'created' => time(),
                'data' => [
                    [
                        'b64_json' => base64_encode($imgBinary),
                        'revised_prompt' => 'Production rendered visual artwork',
                    ],
                ],
                'usage' => [
                    'input_tokens' => 150,
                    'output_tokens' => 1000,
                ],
            ], 200);
        },
    ]);

    return [&$recordedPayloads];
}

// 1. Validation: render_style required when present and blank
test('1. render_style field is required when passed as empty or blank', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => '',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['render_style']);
});

// 2. Validation: invalid render_style rejected
test('2. invalid render_style returns 422 with supported styles information', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Completely Invalid Anime Style',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['render_style']);
    expect($response->json('message'))->toContain('Supported styles');
});

// 3. Supported styles reach prompt
test('3. each supported canonical render style reaches the backend prompt', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();

    foreach (MarketingDesignSystem::RENDER_STYLES as $style) {
        fakeAutoAiResponses(['render_style' => $style]);

        $response = $this->actingAs($user)->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'product_id' => $product->id,
            'render_style' => $style,
            'quantity' => 1,
        ]);

        $response->assertOk();
        $prompt = $response->json('visual_prompt');
        expect($prompt)->toContain("Render style:\n{$style}");
        expect($response->json('preview.render_style'))->toBe($style);
    }
});

// 4. Quantity 1 single-image generation compatibility
test('4. single-image generation works cleanly with quantity 1', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Cinematic Marketing',
        'quantity' => 1,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['quantity'])->toBe(1);
    expect($data['preview'])->not->toBeNull();
    expect($data['previews'])->toHaveCount(1);
    expect(Design::count())->toBe(1);

    $design = Design::first();
    expect($design->status)->toBe(Design::STATUS_DRAFT);
    expect($design->generation_metadata['render_style'])->toBe('Cinematic Marketing');
});

// 5. Multiple-image generation (quantity 1-4) produces multiple designs
test('5. multiple-image generation produces requested quantity and draft designs', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 3,
        'prompt_variation' => 'different',
        'tagline_variation' => 'same',
        'style_variation' => 'same',
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['quantity'])->toBe(3);
    expect($data['previews'])->toHaveCount(3);
    expect(Design::count())->toBe(3);
});

// 6. Quantity out of range (min 1, max 4) rejected
test('6. quantity outside supported range is rejected with 422', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $resTooHigh = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 5,
    ]);
    $resTooHigh->assertStatus(422);
    $resTooHigh->assertJsonValidationErrors(['quantity']);

    $resZero = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 0,
    ]);
    $resZero->assertStatus(422);
    $resZero->assertJsonValidationErrors(['quantity']);
});

// 7. Same prompt variation reuses core direction
test('7. same prompt variation reuses core direction across multiple images', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses([
        'creative_concept' => 'Identical core concept morning mist',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Lifestyle Capture',
        'quantity' => 2,
        'prompt_variation' => 'same',
        'style_variation' => 'same',
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['previews'][0]['creative_concept'])->toBe('Identical core concept morning mist');
    expect($data['previews'][1]['creative_concept'])->toBe('Identical core concept morning mist');
});

// 8. Style variation: same vs different
test('8. different style variation distributes canonical styles across outputs', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 3,
        'style_variation' => 'different',
    ]);

    $response->assertOk();
    $previews = $response->json('previews');

    expect($previews)->toHaveCount(3);
    // Index 0 has the base style
    expect($previews[0]['render_style'])->toBe('Studio Product Still');
    // Index 1 and 2 explore other supported canonical styles
    expect($previews[1]['render_style'])->not->toBe('Studio Product Still');
    expect(MarketingDesignSystem::RENDER_STYLES)->toContain($previews[1]['render_style']);
    expect(MarketingDesignSystem::RENDER_STYLES)->toContain($previews[2]['render_style']);
});

// 9. Tagline variation: same vs different
test('9. same tagline variation preserves headline across multiple outputs', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses([
        'tagline' => 'Unified Brand Promise',
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Minimalist Graphic',
        'quantity' => 2,
        'tagline_variation' => 'same',
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $previews = $response->json('previews');

    expect($previews[0]['tagline'])->toBe('Unified Brand Promise');
    expect($previews[1]['tagline'])->toBe('Unified Brand Promise');
});

// 10. Product identity and exact price preservation
test('10. exact product identity and price are preserved across all outputs', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup([], [], [
        'name' => 'Artisanal Single-Origin Arabica',
        'price' => 599.50,
    ]);
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Cinematic Marketing',
        'quantity' => 2,
        'include_prices' => true,
        'include_product_name' => true,
    ]);

    $response->assertOk();
    $previews = $response->json('previews');

    foreach ($previews as $p) {
        expect($p['visual_prompt'])->toContain('Artisanal Single-Origin Arabica — ₱599.50');
        expect((float) $p['price'])->toBe(599.50);
        expect($p['product_name'])->toBe('Artisanal Single-Origin Arabica');
    }
});

// 11. Custom product flow
test('11. custom product items are orchestrated and preserved', function () {
    [$user, $business, $campaign] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'custom_products' => [
            [
                'name' => 'Matcha Espresso Fusion',
                'price' => 280.00,
                'description' => 'Cold layered organic matcha with fresh espresso',
            ],
        ],
        'render_style' => 'Studio Product Still',
        'quantity' => 1,
        'include_prices' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('visual_prompt');
    expect($prompt)->toContain('Matcha Espresso Fusion');
    expect($prompt)->toContain('₱280.00');
});

// 12. Quota enforcement: blocked when quota limit exceeded
test('12. AI generation is blocked when budget limit quota is exceeded', function () {
    Config::set('services.openai.admin_key', 'sk-admin-test-key-12345');
    Config::set('services.openai.organization', 'org-ZyTriRoIVgLU57NzQNqsvK8g');
    Config::set('services.openai.budget_limit', 10.00);

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

    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 1,
    ]);

    $response->assertStatus(403);
    $response->assertJsonPath('quota_exceeded', true);
});

// 13. Duplicate submission protection: Cache lock prevents concurrent generation
test('13. duplicate submission is prevented by lock when concurrent request in progress', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $lockKey = "automatic_gen_lock_user_{$user->id}_campaign_{$campaign->id}";
    $lock = Cache::lock($lockKey, 120);
    $lock->get();

    try {
        $response = $this->actingAs($user)->postJson('/generator/automatic', [
            'campaign_id' => $campaign->id,
            'product_id' => $product->id,
            'render_style' => 'Studio Product Still',
            'quantity' => 1,
        ]);

        $response->assertStatus(429);
        expect($response->json('message'))->toContain('already in progress');
    } finally {
        $lock->release();
    }
});

// 14. Partial failure persistence: earlier outputs saved even if later output fails
test('14. partial success persists successfully generated designs if subsequent step fails', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();

    $attempt = 0;
    Http::fake([
        'https://api.openai.com/v1/responses*' => function () {
            return Http::response([
                'id' => 'resp-test-'.uniqid(),
                'status' => 'completed',
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => json_encode([
                                    'tagline' => 'Partial Resilience',
                                    'creative_concept' => 'Sunlit coffee ritual',
                                    'visual_strategy' => 'Macro studio lighting',
                                    'visual_prompt' => 'A bag of fresh roasted beans in sunlight',
                                    'render_style' => 'Studio Product Still',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['input_tokens' => 100, 'output_tokens' => 100],
            ], 200);
        },

        'https://api.openai.com/v1/images/edits*' => function () use (&$attempt) {
            $attempt++;
            if ($attempt === 1) {
                $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

                return Http::response([
                    'created' => time(),
                    'data' => [['b64_json' => base64_encode($imgBinary), 'revised_prompt' => 'Image 1 success']],
                    'usage' => ['input_tokens' => 100, 'output_tokens' => 500],
                ], 200);
            }

            return Http::response([
                'error' => ['message' => 'Simulated DALL-E downstream service error'],
            ], 500);
        },

        'https://api.openai.com/v1/images/generations*' => function () use (&$attempt) {
            $attempt++;
            if ($attempt === 1) {
                $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

                return Http::response([
                    'created' => time(),
                    'data' => [['b64_json' => base64_encode($imgBinary), 'revised_prompt' => 'Image 1 success']],
                    'usage' => ['input_tokens' => 100, 'output_tokens' => 500],
                ], 200);
            }

            return Http::response([
                'error' => ['message' => 'Simulated fallback failure'],
            ], 500);
        },
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['partial'])->toBeTrue();
    expect($data['quantity'])->toBe(1);
    expect($data['failed_count'])->toBe(1);
    // Verified: First design was persisted in DB
    expect(Design::count())->toBe(1);
    expect(Design::first()->status)->toBe(Design::STATUS_DRAFT);
});

// 15. Independent tagline variation: prompt same + tagline different generates distinct taglines with identical scene direction
test('15. prompt same + tagline different generates independent taglines while preserving core scene direction', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();

    $callCount = 0;
    Http::fake([
        'https://api.openai.com/v1/responses*' => function () use (&$callCount) {
            $callCount++;
            $tagline = $callCount === 1 ? 'First Core Morning Brew' : 'Fresh Horizons in Every Cup';

            return Http::response([
                'id' => 'resp-test-'.uniqid(),
                'status' => 'completed',
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => json_encode([
                                    'tagline' => $tagline,
                                    'creative_concept' => 'Sunlit Artisan Pour',
                                    'visual_strategy' => 'Macro studio lighting',
                                    'visual_prompt' => 'Artisanal coffee setup in golden morning sunlight',
                                    'render_style' => 'Studio Product Still',
                                ]),
                            ],
                        ],
                    ],
                ],
                'usage' => ['input_tokens' => 100, 'output_tokens' => 100],
            ], 200);
        },

        'https://api.openai.com/v1/images/edits*' => function () {
            $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

            return Http::response([
                'created' => time(),
                'data' => [['b64_json' => base64_encode($imgBinary), 'revised_prompt' => 'Image success']],
                'usage' => ['input_tokens' => 100, 'output_tokens' => 500],
            ], 200);
        },

        'https://api.openai.com/v1/images/generations*' => function () {
            $imgBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

            return Http::response([
                'created' => time(),
                'data' => [['b64_json' => base64_encode($imgBinary), 'revised_prompt' => 'Image success']],
                'usage' => ['input_tokens' => 100, 'output_tokens' => 500],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
        'prompt_variation' => 'same',
        'tagline_variation' => 'different',
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['partial'])->toBeFalse();
    expect($data['quantity'])->toBe(2);

    // Identical core visual concept preserved across both outputs
    expect($data['previews'][0]['creative_concept'])->toBe('Sunlit Artisan Pour');
    expect($data['previews'][1]['creative_concept'])->toBe('Sunlit Artisan Pour');

    // Independent taglines generated for each output
    expect($data['previews'][0]['tagline'])->toBe('First Core Morning Brew');
    expect($data['previews'][1]['tagline'])->toBe('Fresh Horizons in Every Cup');
    expect($data['previews'][0]['tagline'])->not->toBe($data['previews'][1]['tagline']);

    // Persisted designs verify independently generated taglines
    $designs = Design::orderBy('id')->get();
    expect($designs)->toHaveCount(2);
    expect($designs[0]->tagline)->toBe('First Core Morning Brew');
    expect($designs[1]->tagline)->toBe('Fresh Horizons in Every Cup');
});

// 16. User-provided tagline remains fixed across outputs regardless of tagline variation setting
test('16. user provided fixed tagline remains unchanged across outputs even when tagline different variation is set', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
        'prompt_variation' => 'same',
        'tagline_variation' => 'different',
        'tagline' => 'Handcrafted Perfection Every Time',
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['previews'][0]['tagline'])->toBe('Handcrafted Perfection Every Time');
    expect($data['previews'][1]['tagline'])->toBe('Handcrafted Perfection Every Time');

    $designs = Design::orderBy('id')->get();
    expect($designs[0]->tagline)->toBe('Handcrafted Perfection Every Time');
    expect($designs[1]->tagline)->toBe('Handcrafted Perfection Every Time');
});

// 17. Tagline visibility disabled suppresses tagline text across all outputs even when tagline different variation is set
test('17. tagline visibility disabled suppresses tagline text across all outputs even when tagline different variation is set', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
        'prompt_variation' => 'same',
        'tagline_variation' => 'different',
        'include_tagline' => false,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['previews'][0]['tagline'])->toBeNull();
    expect($data['previews'][1]['tagline'])->toBeNull();

    $designs = Design::orderBy('id')->get();
    expect($designs[0]->tagline)->toBeNull();
    expect($designs[1]->tagline)->toBeNull();
});

// 18. Mid-batch quota exhaustion halts generation and returns partial true with clear budget explanation
test('18. mid-batch quota exhaustion returns partial true with clear explanation and preserves completed designs', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $mockUsage = Mockery::mock(OpenAIUsageService::class);
    $callCount = 0;
    $mockUsage->shouldReceive('getUsage')
        ->andReturnUsing(function ($u, $limit = null) use (&$callCount) {
            $callCount++;
            $limitReached = $callCount >= 3;

            return [
                'is_limit_reached' => $limitReached,
                'total_spent' => $limitReached ? 10.50 : 4.00,
                'remaining_budget' => $limitReached ? 0.00 : 6.00,
            ];
        });
    app()->instance(OpenAIUsageService::class, $mockUsage);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['partial'])->toBeTrue();
    expect($data['quantity'])->toBe(1);
    expect($data['requested_quantity'])->toBe(2);
    expect($data['failed_count'])->toBe(1);
    expect($data['message'])->toContain('budget was reached');
    expect($data['errors'])->toContain('Generation stopped: Monthly AI usage budget limit was reached.');
    expect($data['previews'])->toHaveCount(1);

    // Persisted design preserved
    expect(Design::count())->toBe(1);
    expect(Design::first()->status)->toBe(Design::STATUS_DRAFT);
});

// 19. Full batch completed returns partial false
test('19. fully completed batch returns partial false with standard success message', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Studio Product Still',
        'quantity' => 2,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['partial'])->toBeFalse();
    expect($data['quantity'])->toBe(2);
    expect($data['requested_quantity'])->toBe(2);
    expect($data['failed_count'])->toBe(0);
    expect($data['message'])->toBe('Generated 2 visual creatives automatically.');
    expect(Design::count())->toBe(2);
});

// 20. Regenerate single selected image variation with quantity=1
test('20. regenerate selected visual variation generates single output with preserved render style and source design id', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    // Initial draft design
    $originalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'tagline' => 'Original Tagline',
        'status' => Design::STATUS_DRAFT,
        'generation_metadata' => [
            'render_style' => 'Cinematic Marketing',
            'creative_concept' => 'Original Cinematic Concept',
            'visual_strategy' => 'Original Cinematic Strategy',
            'aspect_ratio' => '16:9',
        ],
    ]);

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'is_variation' => true,
        'source_design_id' => $originalDesign->id,
        'render_style' => 'Cinematic Marketing',
        'aspect_ratio' => '16:9',
        'creative_concept' => 'Original Cinematic Concept',
        'visual_strategy' => 'Original Cinematic Strategy',
        'quantity' => 1,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['quantity'])->toBe(1);
    expect($data['previews'])->toHaveCount(1);
    expect($data['preview']['render_style'])->toBe('Cinematic Marketing');
    expect($data['preview']['aspect_ratio'])->toBe('16:9');
    expect($data['preview']['source_design_id'])->toBe($originalDesign->id);
    expect($data['preview']['is_variation'])->toBeTrue();
});

// 21. Regenerate all batch preserves quantity and variation rules
test('21. regenerate all batch uses specified batch quantity and variation settings', function () {
    [$user, $business, $campaign, $product] = createAutoSettingsTestSetup();
    fakeAutoAiResponses();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'is_variation' => true,
        'render_style' => 'Lifestyle Capture',
        'quantity' => 3,
        'prompt_variation' => 'different',
        'tagline_variation' => 'different',
        'style_variation' => 'same',
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['quantity'])->toBe(3);
    expect($data['requested_quantity'])->toBe(3);
    expect($data['previews'])->toHaveCount(3);
    expect(Design::count())->toBe(3);
});
