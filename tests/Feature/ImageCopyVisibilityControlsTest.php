<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Config::set('services.openai.api_key', 'sk-test-copy-controls-key');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.image_model', 'gpt-image-2');
    Config::set('services.openai.budget_limit', 50.00);
});

function setupCopyControlsTestEnvironment(): array
{
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Artisan Craft Roasters',
        'industry' => 'Cafe & Bakery',
        'category' => 'Specialty Coffee',
        'description' => 'Single-origin specialty coffee roaster based in Manila.',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Autumn Harvest Festival',
        'description' => 'Seasonal celebrations with warm spiced beverages.',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Signature Harvest Blend',
        'objective' => 'Drive Seasonal Awareness',
    ]);

    Storage::disk('public')->put('products/harvest_beans.png', 'fake-binary-beans-data');

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Golden Harvest Roast',
        'price' => 380.00,
        'image_path' => 'products/harvest_beans.png',
        'description' => 'Light roast notes of honeycomb and cinnamon.',
    ]);

    return [$user, $business, $campaign, $product, $event];
}

function fakeCopyControlOpenAi(): array
{
    $recordedPayloads = [];

    $creativeResult = [
        'tagline' => 'Taste Autumn in Every Sip',
        'creative_concept' => 'Rustic wooden table with golden sun and cinnamon sticks',
        'visual_strategy' => 'Warm backlight highlighting coffee bean texture',
        'visual_prompt' => 'A pack of Golden Harvest Roast coffee on aged rustic timber with warm cinnamon sticks and soft morning light',
        'scene_family' => 'warm_wood_terracotta',
        'composition_type' => 'centered hero',
        'camera_viewpoint' => 'eye-level',
        'lighting_profile' => 'golden hour',
        'prop_profile' => 'raw ingredients',
        'copy_layout' => 'editorial-center',
        'product_name_style' => 'editorial-serif',
        'price_style' => 'badge',
        'tagline_style' => 'hero-headline',
        'text_depth_mode' => 'flat-graphic',
        'visual_world_archetype' => 'artisanal_workshop',
        'background_style' => 'timber',
        'product_arrangement' => 'single hero',
        'render_style' => 'Studio Product Still',
    ];

    Http::fake([
        'https://api.openai.com/v1/responses*' => function ($request) use (&$recordedPayloads, $creativeResult) {
            $recordedPayloads[] = ['type' => 'responses', 'data' => $request->data()];

            return Http::response([
                'id' => 'resp-test-'.uniqid(),
                'choices' => [
                    ['message' => ['content' => json_encode($creativeResult)]],
                ],
            ], 200);
        },
        'https://api.openai.com/v1/chat/completions*' => function ($request) use (&$recordedPayloads, $creativeResult) {
            $recordedPayloads[] = ['type' => 'chat', 'data' => $request->data()];

            return Http::response([
                'choices' => [
                    ['message' => ['content' => json_encode($creativeResult)]],
                ],
            ], 200);
        },
        'https://api.openai.com/v1/images/edits*' => function ($request) use (&$recordedPayloads) {
            $recordedPayloads[] = [
                'type' => 'edits',
                'body' => $request->body(),
            ];

            return Http::response([
                'data' => [
                    ['url' => 'https://example.com/fake-image-result.png'],
                ],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations*' => function ($request) use (&$recordedPayloads) {
            $recordedPayloads[] = [
                'type' => 'generations',
                'body' => $request->body(),
            ];

            return Http::response([
                'data' => [
                    ['url' => 'https://example.com/fake-image-result.png'],
                ],
            ], 200);
        },
        'https://example.com/fake-image-result.png' => Http::response('FAKE_IMAGE_BINARY', 200),
    ]);

    return [
        'getPayloads' => function () use (&$recordedPayloads) {
            return $recordedPayloads;
        },
    ];
}

/*
|--------------------------------------------------------------------------
| SECTION 15: AUTOMATIC TESTS (A through P)
|--------------------------------------------------------------------------
*/

test('Auto A-D: Automatic endpoint validates and accepts all 4 copy visibility flags', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    fakeCopyControlOpenAi();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_product_name' => true,
        'include_product_price' => true,
        'include_business_name' => false,
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['include_product_name'])->toBeTrue();
    expect($data['include_prices'])->toBeTrue();
    expect($data['include_business_name'])->toBeFalse();
    expect($data['include_tagline'])->toBeTrue();
    expect($data['preview']['include_product_name'])->toBeTrue();
    expect($data['preview']['include_prices'])->toBeTrue();
    expect($data['preview']['include_business_name'])->toBeFalse();
    expect($data['preview']['include_tagline'])->toBeTrue();
});

test('Auto E & F: Include Product Name = ON and OFF reach final generation context in Automatic', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // E: Include Product Name = ON
    $promptOn = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_product_name' => true,
    ], $business);

    expect($promptOn)
        ->toContain('Product name: Allowed')
        ->not->toContain('Do not render product names as visible text');

    // F: Include Product Name = OFF
    $promptOff = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_product_name' => false,
    ], $business);

    expect($promptOff)
        ->toContain('Product name: Hidden')
        ->toContain('Do not render product names as visible text');
});

test('Auto G & H: Include Product Price = ON and OFF reach final generation context in Automatic', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // G: Include Product Price = ON
    $promptOn = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_prices' => true,
    ], $business);

    expect($promptOn)
        ->toContain('Product price: Allowed')
        ->not->toContain('Do not render prices as visible copy');

    // H: Include Product Price = OFF
    $promptOff = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_prices' => false,
    ], $business);

    expect($promptOff)
        ->toContain('Product price: Hidden')
        ->toContain('Do not render prices as visible copy');
});

test('Auto I & J: Include Business Name = ON and OFF reach final generation context in Automatic', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // I: Include Business Name = ON
    $promptOn = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'include_business_name' => true,
    ], $business);

    expect($promptOn)
        ->toContain('Business name: Allowed')
        ->toContain("Business:\nArtisan Craft Roasters")
        ->not->toContain('Do not include business/shop name or branding text');

    // J: Include Business Name = OFF
    $promptOff = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'include_business_name' => false,
    ], $business);

    expect($promptOff)
        ->toContain('Business name: Hidden')
        ->toContain("Business:\nArtisan Craft Roasters (Factual context only. Do not render business name as visible copy)")
        ->toContain('Do not include business/shop name or branding text');
});

test('Auto K & L: Include Tagline = ON and OFF reach final generation context in Automatic', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // K: Include Tagline = ON
    $promptOn = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'tagline' => 'Taste Autumn in Every Sip',
        'include_tagline' => true,
    ], $business);

    expect($promptOn)
        ->toContain('Tagline: Allowed')
        ->toContain("Tagline:\n\"Taste Autumn in Every Sip\"");

    // L: Include Tagline = OFF
    $promptOff = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'tagline' => 'Taste Autumn in Every Sip',
        'include_tagline' => false,
    ], $business);

    expect($promptOff)
        ->toContain('Tagline: Hidden')
        ->toContain("Tagline:\nDisabled");
});

test('Auto M: Exact product name and price factual identity remain preserved regardless of visibility toggles', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // Both visibility toggles are OFF
    $prompt = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'catalog_products' => [$product],
        'include_product_name' => false,
        'include_prices' => false,
    ], $business);

    // Factual product binding line MUST still be present
    expect($prompt)
        ->toContain('• REFERENCE IMAGE 1 = Golden Harvest Roast — ₱380.00')
        // But copy controls forbid visible rendering
        ->toContain('Product name: Hidden')
        ->toContain('Product price: Hidden')
        ->toContain('• Do not render product names as visible text.')
        ->toContain('• Do not render prices.');
});

test('Auto N: Actual catalog product image remains attached to OpenAI image edit request', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $recorder = fakeCopyControlOpenAi();

    $response = $this->actingAs($user)->postJson('/generator/automatic', [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'include_product_name' => false,
        'include_product_price' => false,
        'include_business_name' => false,
        'include_tagline' => false,
    ]);

    $response->assertOk();

    $payloads = $recorder['getPayloads']();
    $editCalls = array_filter($payloads, fn ($p) => ($p['type'] ?? '') === 'edits');

    expect($editCalls)->not->toBeEmpty();
    $lastEdit = end($editCalls);
    expect($lastEdit['body'])->toContain('harvest_beans.png');
});

test('Auto O & P: Automatic compact prompt architecture remains intact and free from legacy blocks', function () {
    [$user, $business, $campaign, $product, $event] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrateAutomaticCampaignBrief([
        'campaign_name' => $campaign->name,
        'event_name' => $event->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'tagline' => 'Taste Autumn in Every Sip',
        'visual_prompt' => 'A rustic wooden table with golden sun and cinnamon sticks',
        'render_style' => 'Studio Product Still',
        'copy_emphasis' => 'Balanced',
        'aspect_ratio' => '1:1',
        'include_product_name' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'include_tagline' => true,
    ], $business);

    // Word count < 350 words, char count < 2500 chars
    $wordCount = str_word_count($prompt);
    $charCount = strlen($prompt);

    expect($wordCount)->toBeLessThan(350);
    expect($charCount)->toBeLessThan(2500);

    // No legacy verbose modules
    $forbiddenLegacy = [
        'VISUAL THEME:',
        'BRAND TONE:',
        'DESIGN TREATMENT:',
        'CAMERA VIEWPOINT:',
        'CAMERA PERSPECTIVE:',
        'LENS PROFILE:',
        'LIGHTING PROFILE:',
        'INDUSTRY ART DIRECTION:',
        'HOLIDAY ART DIRECTION:',
        'TYPOGRAPHY SYSTEM:',
        'SAFE MARGIN:',
        'CO-FEATURED PRODUCTS & SERVICES:',
    ];

    foreach ($forbiddenLegacy as $token) {
        expect($prompt)->not->toContain($token);
    }
});

/*
|--------------------------------------------------------------------------
| SECTION 16: MANUAL TESTS & REGRESSION (A through I)
|--------------------------------------------------------------------------
*/

test('Manual A: Existing Include Product Name behavior remains unchanged', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptOn = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_product_name' => true,
    ], $business);

    $promptOff = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_product_name' => false,
    ], $business);

    expect($promptOn)->not->toContain('• Do not render product names as visible text.');
    expect($promptOff)->toContain('• Do not render product names as visible text.');
});

test('Manual B: Existing Include Product Price behavior remains unchanged', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptOn = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_prices' => true,
    ], $business);

    $promptOff = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'include_prices' => false,
    ], $business);

    expect($promptOn)->not->toContain('• Do not render prices.');
    expect($promptOff)->toContain('• Do not render prices.');
});

test('Manual C: Existing Include Tagline behavior remains unchanged', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    $promptOn = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'tagline' => 'Handcrafted Daily',
        'include_tagline' => true,
    ], $business);

    $promptOff = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'tagline' => 'Handcrafted Daily',
        'include_tagline' => false,
    ], $business);

    expect($promptOn)->toContain('Tagline: "Handcrafted Daily"');
    expect($promptOff)->toContain('Tagline: Disabled');
});

test('Manual D & E: New Include Business Name = ON and OFF work in Manual generation', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    // D: Include Business Name = ON
    $promptOn = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'include_business_name' => true,
    ], $business);

    expect($promptOn)
        ->toContain('for Artisan Craft Roasters')
        ->not->toContain('Business Branding: Disabled');

    // E: Include Business Name = OFF
    $promptOff = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'include_business_name' => false,
    ], $business);

    expect($promptOff)
        ->not->toContain('for Artisan Craft Roasters')
        ->toContain('(Do not include business/shop name or branding text)')
        ->toContain('Business Branding: Disabled. Do not include any business/shop name or branding text in the artwork.');
});

test('Manual F & G: Product identity and price remain intact when visibility is OFF in Manual', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prompt = $orchestrator->orchestrateManualCampaignBrief([
        'campaign_name' => $campaign->name,
        'product_name' => $product->name,
        'price' => $product->price,
        'catalog_products' => [$product],
        'include_product_name' => false,
        'include_prices' => false,
    ], $business);

    // Factual pairing preserved
    expect($prompt)
        ->toContain('• REFERENCE IMAGE 1 = Golden Harvest Roast — ₱380.00')
        ->toContain('• Do not render product names as visible text.')
        ->toContain('• Do not render prices.');
});

test('Manual H: Manual generation still uses compact prompt', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    fakeCopyControlOpenAi();

    $response = $this->actingAs($user)->postJson(route('generator.manual'), [
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'product_name' => $product->name,
        'price' => $product->price,
        'scene_prompt' => 'A cup on aged wood with soft natural morning light',
        'aspect_ratio' => '1:1',
        'render_style' => 'Studio Product Still',
        'copy_emphasis' => 'Balanced',
        'include_product_name' => true,
        'include_prices' => true,
        'include_business_name' => true,
        'include_tagline' => true,
    ]);

    $response->assertOk();
    $prompt = $response->json('prompt');

    expect(str_word_count($prompt))->toBeLessThan(350);
    expect($prompt)->toContain('Artisan Craft Roasters');
    expect($prompt)->toContain('Golden Harvest Roast — ₱380.00');
    expect($prompt)->toContain('RULES:');
    expect($prompt)->not->toContain('VISUAL THEME:');
    expect($prompt)->not->toContain('CAMERA VIEWPOINT:');
});

test('Manual & Auto I: Regeneration restores all 4 copy visibility flags correctly', function () {
    [$user, $business, $campaign, $product] = setupCopyControlsTestEnvironment();
    fakeCopyControlOpenAi();

    // Create a design with explicit copy visibility metadata
    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'price' => $product->price,
        'image_path' => 'designs/saved_copy_controls.png',
        'reference_image_path' => $product->image_path,
        'aspect_ratio' => '1:1',
        'prompt' => 'Existing prompt',
        'tagline' => 'Harvest Fresh',
        'generation_source' => 'automatic',
        'generation_metadata' => [
            'include_product_name' => false,
            'include_prices' => false,
            'include_business_name' => false,
            'include_tagline' => true,
            'tagline' => 'Harvest Fresh',
            'render_style' => 'Studio Product Still',
        ],
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $regenerated = $regenerationService->regenerate($design);

    expect($regenerated)->not->toBeNull();
    $meta = $regenerated->generation_metadata;

    expect($meta['include_product_name'])->toBeFalse();
    expect($meta['include_prices'])->toBeFalse();
    expect($meta['include_business_name'])->toBeFalse();
    expect($meta['include_tagline'])->toBeTrue();
});
