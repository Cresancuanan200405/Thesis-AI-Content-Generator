<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-key-for-manual-e2e']);
    config(['services.openai.budget_limit' => 100.00]);
});

test('manual creative direction end to end: proves all 17 regression requirements', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Kapekol Luxury Skincare',
        'industry' => 'Beauty & Cosmetics',
        'category' => 'Skincare',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Futuristic Skincare Launch',
        'objective' => 'Showcase new luxury serum',
    ]);

    Storage::disk('public')->put('products/serum_a.png', 'fake-binary-serum-a');
    Storage::disk('public')->put('products/serum_b.png', 'fake-binary-serum-b');

    $productA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Lavender Glow Serum',
        'price' => 180.00,
        'image_path' => 'products/serum_a.png',
        'description' => 'Organic calming serum with botanical extract',
    ]);

    $productB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Night Repair Elixir',
        'price' => 220.00,
        'image_path' => 'products/serum_b.png',
        'description' => 'Deep restorative hydration formula',
    ]);

    // 1. Generate Visual Prompt performs request and returns visual_prompt
    $interceptedPrompt = null;
    $attachedFilenames = [];

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output_text' => json_encode([
                'creative_concept' => 'Futuristic Glass Skincare Lab',
                'visual_strategy' => 'Highlight translucent glass packaging with water caustics',
                'visual_prompt' => 'Create a futuristic luxury skincare advertisement using translucent glass, water reflections, dramatic side lighting, and an unusual asymmetric composition.',
                'tagline' => 'Next-Gen Skin Science',
            ]),
            'usage' => [
                'input_tokens' => 50,
                'output_tokens' => 70,
                'total_tokens' => 120,
            ],
        ], 200),
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'layout' => 'asymmetric',
                            'palette' => ['#ffffff', '#800080'],
                        ]),
                    ],
                ],
            ],
        ], 200),
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedPrompt, &$attachedFilenames) {
            $body = $request->body();
            if (preg_match('/name="prompt".*?\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches)) {
                $interceptedPrompt = $matches[1];
            } else {
                $interceptedPrompt = $body;
            }

            if (str_contains($body, 'serum_a.png')) {
                $attachedFilenames[] = 'serum_a.png';
            }
            if (str_contains($body, 'serum_b.png')) {
                $attachedFilenames[] = 'serum_b.png';
            }

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-image-binary')],
                ],
            ], 200);
        },
    ]);

    $promptRes = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'campaign_id' => $campaign->id,
        'generation_mode' => 'manual',
        'target' => 'prompt',
        'catalog_product_ids' => [$productA->id],
        'user_instruction' => 'Futuristic skincare',
    ]);

    $promptRes->assertOk();
    $generatedPrompt = $promptRes->json('visual_prompt');
    expect($generatedPrompt)->toContain('translucent glass');

    // 2 & 3. User edits the generated prompt, and edited scenePrompt reaches final production prompt
    $editedScenePrompt = $generatedPrompt.' Place the bottle on a floating translucent disc.';

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Lavender Glow Serum',
        'catalog_product_ids' => [$productA->id, $productB->id],
        'scene_prompt' => $editedScenePrompt,
        'image_prompt' => $editedScenePrompt,
        'prompt' => $editedScenePrompt,
        'aspect_ratio' => '1:1',
        'render_style' => 'Studio Product Still',
        'design_treatment' => 'Auto',
        'copy_emphasis' => 'Balanced',
        'include_prices' => true,
        'price' => '180.00',
        'include_tagline' => true,
        'tagline' => 'Next-Gen Skin Science',
        'include_business_name' => true,
        'business_name' => 'Kapekol Luxury Skincare',
    ]);

    $response->assertOk();
    expect($interceptedPrompt)->not->toBeNull();

    // 3. Edited scenePrompt reached the final prompt
    expect($interceptedPrompt)->toContain($editedScenePrompt);
    expect($interceptedPrompt)->toContain('floating translucent disc');

    // 4. Scene fallback is suppressed (no generic studio world)
    expect($interceptedPrompt)->toContain('Scene World: DERIVE FROM PRIMARY USER SCENE DIRECTION');
    expect($interceptedPrompt)->not->toContain('Scene Family: studio');

    // 5. Environment fallback is suppressed (no clean seamless studio cyclorama)
    expect($interceptedPrompt)->toContain('Environment Setting: DERIVE FROM PRIMARY USER SCENE DIRECTION');
    expect($interceptedPrompt)->not->toContain('Environment Setting: clean_seamless_studio');

    // 6. Composition fallback is suppressed (no centered hero)
    expect($interceptedPrompt)->toContain('Composition Geometry: DERIVE FROM PRIMARY USER SCENE DIRECTION');
    expect($interceptedPrompt)->not->toContain('Composition Geometry: centered hero');

    // 7. Lighting fallback is suppressed (no soft diffused softbox)
    expect($interceptedPrompt)->toContain('Lighting Profile: DERIVE FROM PRIMARY USER SCENE DIRECTION');
    expect($interceptedPrompt)->not->toContain('Lighting Profile: soft diffused');

    // 8. Prop fallback is suppressed (no minimalist pedestals)
    expect($interceptedPrompt)->toContain('Prop Staging Profile: DERIVE FROM PRIMARY USER SCENE DIRECTION');
    expect($interceptedPrompt)->not->toContain('Prop Staging Profile: minimalist pedestals');

    // 9. Manual prompt remains compatible with explicit user Render Style with subordination rule
    expect($interceptedPrompt)->toContain('RENDER STYLE:');
    expect($interceptedPrompt)->toContain('Studio Product Still');
    expect($interceptedPrompt)->toContain('Subordination Rule: When PRIMARY USER SCENE DIRECTION specifies a distinctive environment');

    // 10. Manual prompt remains compatible with explicit user Themes/Tones with subordination rule
    expect($interceptedPrompt)->toContain('VISUAL THEME:');
    expect($interceptedPrompt)->toContain('Commercial');

    // 11. Manual controls remain authoritative (Section 1 Supreme User Priority)
    expect($interceptedPrompt)->toContain('SUPREME USER CREATIVE AUTHORITY');

    // 12 & 13. Final production prompt is orchestrated exactly once, no prompt nesting
    $occurrencesOfTaskHeader = substr_count($interceptedPrompt, 'FINAL MARKETING DESIGN TASK');
    expect($occurrencesOfTaskHeader)->toBe(1);

    // 14. Enabled copy remains
    expect($interceptedPrompt)->toContain('Lavender Glow Serum');
    expect($interceptedPrompt)->toContain('₱180.00');
    expect($interceptedPrompt)->toContain('Next-Gen Skin Science');
    expect($interceptedPrompt)->toContain('Kapekol Luxury Skincare');

    // 16 & 17. Multi-product references remain N->N without downgrade
    expect($attachedFilenames)->toHaveCount(2);
    expect($attachedFilenames)->toEqual(['serum_a.png', 'serum_b.png']);
    expect($interceptedPrompt)->toContain('Night Repair Elixir');
});

test('manual mode: disabled copy toggles strictly suppress copy without removing products', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Botanical Essence',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Minimal Campaign',
    ]);

    Storage::disk('public')->put('products/rose_oil.png', 'fake-binary-rose-oil');

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Pure Rosehip Oil',
        'price' => 350.00,
        'image_path' => 'products/rose_oil.png',
    ]);

    $interceptedPrompt = null;

    Http::fake([
        'https://api.openai.com/v1/images/edits' => function (ClientRequest $request) use (&$interceptedPrompt) {
            $body = $request->body();
            if (preg_match('/name="prompt".*?\r?\n\r?\n(.*?)\r?\n--/s', $body, $matches)) {
                $interceptedPrompt = $matches[1];
            } else {
                $interceptedPrompt = $body;
            }

            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-generated-image-binary')],
                ],
            ], 200);
        },
    ]);

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'product_name' => 'Pure Rosehip Oil',
        'catalog_product_ids' => [$product->id],
        'scene_prompt' => 'Dewy morning forest with natural moss and morning mist',
        'include_prices' => false,
        'include_tagline' => false,
        'include_business_name' => false,
    ]);

    $response->assertOk();

    // 15. Disabled copy remains forbidden
    expect($interceptedPrompt)->toContain('Do not render prices');
    expect($interceptedPrompt)->toContain('Do not render any tagline');
    expect($interceptedPrompt)->toContain('Do not render the business/shop name');

    // Product remains fully preserved even when prices are disabled
    expect($interceptedPrompt)->toContain('Pure Rosehip Oil');
    expect($interceptedPrompt)->toContain('PRIMARY PRODUCT IMAGE:');
});
