<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
    Config::set('services.openai.api_key', 'sk-test-key-mock-12345');
    Config::set('services.openai.text_model', 'gpt-5.6-luna');
    Config::set('services.openai.budget_limit', 20.00);
});

test('1. All four Copy Emphasis values map to distinct instructions in ModularPromptOrchestrator', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $balanced = $orchestrator->resolveCopyEmphasisInstruction('Balanced', [
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'has_tagline' => true,
    ]);
    expect($balanced)->toBe('Create a cohesive, balanced typographic hierarchy among the permitted copy elements (product name, price, tagline, and event title) so no single text element dominates inappropriately. Keep all copy legible and harmonious.');

    $product = $orchestrator->resolveCopyEmphasisInstruction('Product', [
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'has_tagline' => true,
    ]);
    expect($product)->toBe('Keep the exact product name as the dominant advertising headline (prominent, editorial, legible, and visually connected to the actual product; do not repeat the full product name across multiple advertising text areas). Keep its corresponding price associated with that product when price visibility is enabled. Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines. Keep the supplied tagline visually coherent and readable, with its complete wording preserved. Keep the event title visible as secondary campaign information. Allow creative typography, layering, and composition, but avoid giving multiple text elements equal headline prominence.');

    $price = $orchestrator->resolveCopyEmphasisInstruction('Price', [
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'has_tagline' => true,
    ]);
    expect($price)->toBe('Make the exact permitted product price the primary promotional emphasis, clearly associated with the product and shown once in the layout without inventing discounts or promotional claims. Treat product name, tagline, and event title as supporting copy. Background typography must remain subordinate.');

    $tagline = $orchestrator->resolveCopyEmphasisInstruction('Tagline', [
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'has_tagline' => true,
    ]);
    expect($tagline)->toBe('Make the supplied tagline the primary advertising text. Preserve its exact wording and meaning; creative line breaks and typographic styling are allowed, but keep the phrase visually coherent and readable rather than looking like unrelated fragments. Treat product name, price, and event title as supporting copy. Background typography must remain subordinate.');

    // Verify all four instructions are pairwise distinct
    $instructions = [$balanced, $product, $price, $tagline];
    expect(count(array_unique($instructions)))->toBe(4);
});

test('2. Selected Render Style reaches the final prompt unchanged in both Manual and Automatic modes', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'Roast Lab']);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Ethiopian Yirgacheffe', 'price' => 320.00]);

    $styles = ['Studio Product Still', 'Cinematic Marketing', 'Lifestyle Capture', 'Minimalist Graphic'];

    foreach ($styles as $style) {
        $manualPrompt = $orchestrator->orchestrateManualCampaignBrief([
            'generation_mode' => 'manual',
            'product_name' => $product->name,
            'price' => $product->price,
            'catalog_products' => [$product],
            'render_style' => $style,
            'scene_prompt' => 'A steaming porcelain cup on marble.',
        ], $business);

        expect($manualPrompt)->toContain("Render style: {$style}")
            ->and($manualPrompt)->toContain("selected render style (\"{$style}\")");

        $autoPrompt = $orchestrator->orchestrateAutomaticCampaignBrief([
            'generation_mode' => 'automatic',
            'product_name' => $product->name,
            'price' => $product->price,
            'catalog_products' => [$product],
            'render_style' => $style,
            'scene_prompt' => 'A steaming porcelain cup on marble.',
        ], $business);

        expect($autoPrompt)->toContain("Render style:\n{$style}")
            ->and($autoPrompt)->toContain("selected render style (\"{$style}\")");
    }
});

test('3. Visual concept and Render Style are supplied together without one silently overriding the other', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create(['name' => 'Artisan Roastery']);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'South Indian Kaapi', 'price' => 180.00]);

    $prompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'render_style' => 'Minimalist Graphic',
        'scene_prompt' => 'Steaming brass tumbler on a dark teak table with roasted chicory beans scattered around.',
    ], $business);

    // Both the user scene direction AND the render style coexist harmoniously
    expect($prompt)->toContain('Creative direction:')
        ->and($prompt)->toContain('Steaming brass tumbler on a dark teak table with roasted chicory beans scattered around.')
        ->and($prompt)->toContain('Render style: Minimalist Graphic')
        ->and($prompt)->toContain('Render Style Synergy:')
        ->and($prompt)->toContain('The visual creative direction and selected render style ("Minimalist Graphic") work together as complementary inputs');
});

test('4. Suggest Visual Prompt does not mutate the selected Render Style across repeated suggestions', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Cold Brew Bottle', 'price' => 150.00]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'creative_concept' => 'Minimal Frost Glass',
                                'visual_strategy' => 'Geometric paper backdrop with condensation beads.',
                                'visual_prompt' => 'A sleek amber glass cold brew bottle placed before cream and sage color-block geometry with crisp studio lighting.',
                                'render_style' => 'Cinematic Marketing', // AI model raw suggestion differs from user choice
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['total_tokens' => 200],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    // Request 1: User chose Minimalist Graphic
    $res1 = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'render_style' => 'Minimalist Graphic',
    ]);

    $res1->assertOk()
        ->assertJson([
            'success' => true,
            'render_style' => 'Minimalist Graphic',
        ]);

    // Request 2 (repeated call): User still has Minimalist Graphic
    $res2 = $this->actingAs($user)->postJson(route('generator.prompt'), [
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$product->id],
        'render_style' => 'Minimalist Graphic',
    ]);

    $res2->assertOk()
        ->assertJson([
            'success' => true,
            'render_style' => 'Minimalist Graphic',
        ]);
});

test('5. Hidden prices are absent from render-facing product text', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create(['name' => 'Kape Hub']);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 180.00,
    ]);

    // When include_prices is false
    $manualPrompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'include_prices' => false,
    ], $business);

    expect($manualPrompt)->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi')
        ->and($manualPrompt)->not->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi — ₱180.00')
        ->and($manualPrompt)->not->toContain('₱180.00')
        ->and($manualPrompt)->toContain('• Do not render prices.');

    $autoPrompt = $orchestrator->orchestrateAutomaticCampaignBrief([
        'generation_mode' => 'automatic',
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'include_prices' => false,
    ], $business);

    expect($autoPrompt)->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi')
        ->and($autoPrompt)->not->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi — ₱180.00')
        ->and($autoPrompt)->not->toContain('₱180.00')
        ->and($autoPrompt)->toContain('• Do not render prices.');
});

test('6. Hidden copy elements are not introduced by emphasis instructions', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create();
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Nitro Cold Brew', 'price' => 190.00]);

    // Case A: Price emphasis chosen, but prices are hidden
    $promptPriceHidden = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'Nitro Cold Brew',
        'price' => 190.00,
        'include_prices' => false,
        'copy_emphasis' => 'Price',
    ], $business);

    expect($promptPriceHidden)->toContain('Copy emphasis: Price — Product price is hidden; create a cohesive hierarchy among the remaining permitted copy elements')
        ->and($promptPriceHidden)->not->toContain('Give the exact permitted product price primary promotional emphasis')
        ->and($promptPriceHidden)->not->toContain('₱190.00');

    // Case B: Tagline emphasis chosen, but tagline is disabled / unavailable
    $promptTaglineHidden = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'Nitro Cold Brew',
        'price' => 190.00,
        'include_tagline' => false,
        'copy_emphasis' => 'Tagline',
    ], $business);

    expect($promptTaglineHidden)->toContain('Copy emphasis: Tagline — Tagline is hidden or unavailable; create a cohesive hierarchy among the remaining permitted copy elements')
        ->and($promptTaglineHidden)->not->toContain('Give the supplied tagline primary typographic emphasis');

    // Case C: Product name emphasis chosen, but product name is disabled
    $promptProductHidden = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'Nitro Cold Brew',
        'price' => 190.00,
        'include_product_name' => false,
        'copy_emphasis' => 'Product',
    ], $business);

    expect($promptProductHidden)->toContain('Copy emphasis: Product — Product name is hidden; create a cohesive hierarchy among the remaining permitted copy elements')
        ->and($promptProductHidden)->not->toContain('Give the exact product name primary typographic emphasis');
});

test('7. Exact product-name/price associations and tagline wording are preserved', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create(['name' => 'Kaapi Artisans']);
    $event = Event::factory()->create(['name' => '10.10 Perfect 10 Shopping Festival']);
    $campaign = Campaign::factory()->create([
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 180.00,
    ]);

    $prompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'show_event_text' => true,
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 180.00,
        'tagline' => 'Make Your 10.10 Perfectly Brewed',
        'include_tagline' => true,
        'include_prices' => true,
        'copy_emphasis' => 'Price',
        'render_style' => 'Studio Product Still',
    ], $business);

    // Exact association preserved
    expect($prompt)->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi — ₱180.00')
        ->and($prompt)->toContain('Tagline: "Make Your 10.10 Perfectly Brewed"')
        ->and($prompt)->toContain('Copy emphasis: Price — Make the exact permitted product price the primary promotional emphasis, clearly associated with the product and shown once in the layout without inventing discounts or promotional claims. Treat product name, tagline, and event title as supporting copy. Background typography must remain subordinate.')
        ->and($prompt)->toContain('Event: 10.10 Perfect 10 Shopping Festival')
        ->and($prompt)->toContain('Event visibility: Allowed');
});

test('8. Manual and Automatic Studio follow consistent emphasis and visibility semantics', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create(['name' => 'Cafe Artisan']);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Cold Brew Can',
        'price' => 120.00,
    ]);

    $options = [
        'catalog_products' => [$product],
        'product_name' => 'Cold Brew Can',
        'price' => 120.00,
        'tagline' => 'Freshly Chilled Fuel',
        'include_tagline' => true,
        'include_prices' => true,
        'include_product_name' => true,
        'copy_emphasis' => 'Tagline',
        'render_style' => 'Cinematic Marketing',
    ];

    $manualPrompt = $orchestrator->orchestrateManualCampaignBrief(array_merge($options, ['generation_mode' => 'manual']), $business);
    $autoPrompt = $orchestrator->orchestrateAutomaticCampaignBrief(array_merge($options, ['generation_mode' => 'automatic']), $business);

    // Both include identical emphasis instructions and style
    $expectedInstruction = 'Make the supplied tagline the primary advertising text. Preserve its exact wording and meaning; creative line breaks and typographic styling are allowed, but keep the phrase visually coherent and readable rather than looking like unrelated fragments. Treat product name, price, and event title as supporting copy. Background typography must remain subordinate.';

    expect($manualPrompt)->toContain("Copy emphasis: Tagline — {$expectedInstruction}")
        ->and($manualPrompt)->toContain('Render style: Cinematic Marketing')
        ->and($manualPrompt)->toContain('• REFERENCE IMAGE 1 = Cold Brew Can — ₱120.00');

    expect($autoPrompt)->toContain("Copy emphasis:\nTagline — {$expectedInstruction}")
        ->and($autoPrompt)->toContain("Render style:\nCinematic Marketing")
        ->and($autoPrompt)->toContain('• REFERENCE IMAGE 1 = Cold Brew Can — ₱120.00');
});

test('9. Existing batch generation and variation settings retain preserved render style and copy emphasis', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Specialty Roast', 'price' => 350.00]);

    Http::fake([
        'https://api.openai.com/v1/responses' => Http::response([
            'output' => [
                [
                    'content' => [
                        [
                            'type' => 'output_text',
                            'text' => json_encode([
                                'creative_concept' => 'Minimal Studio Pedestal',
                                'visual_strategy' => 'Product centered on light limestone pedestal with morning sunlight.',
                                'visual_prompt' => 'A clean bag of specialty roast beans centered on a limestone block with golden morning illumination.',
                                'render_style' => 'Minimalist Graphic',
                                'copy_emphasis' => 'Product',
                                'tagline' => 'Crafted for Pure Focus',
                            ]),
                        ],
                    ],
                ],
            ],
            'usage' => ['total_tokens' => 220],
        ], 200),
        'https://api.openai.com/v1/images/*' => Http::response([
            'data' => [
                ['b64_json' => base64_encode('mock-generated-image')],
            ],
        ], 200),
        'https://api.openai.com/v1/organization/*' => Http::response(['data' => []], 200),
    ]);

    // Post to Automatic Generator with explicit render style and copy emphasis
    $response = $this->actingAs($user)->postJson(route('generator.automatic'), [
        'campaign_id' => $campaign->id,
        'product_id' => $product->id,
        'render_style' => 'Minimalist Graphic',
        'copy_emphasis' => 'Product',
        'preview_count' => 1,
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $prompt = $response->json('visual_prompt');
    expect($prompt)->toContain("Render style:\nMinimalist Graphic")
        ->and($prompt)->toContain("Copy emphasis:\nProduct — Keep the exact product name as the dominant advertising headline");
});

test('10. Reference Coffee Poster: South Indian Kaapi preserves exact hierarchy, copy, and layout balance under Copy Emphasis: Product', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create([
        'name' => 'Kapekol',
        'industry' => 'Food & Beverage',
        'category' => 'Coffee & Café',
    ]);
    $event = Event::factory()->create([
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $campaign = Campaign::factory()->create([
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => '10.10 Perfect 10 Shopping Festival',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'South Indian Kaapi',
        'price' => 540.00,
    ]);

    $creativeDirection = "Create a premium editorial coffee advertising poster featuring the supplied coffee product as the hero. Use a warm cream and deep espresso-brown palette, soft directional studio lighting, realistic coffee beans, a ceramic cup of freshly brewed coffee, and subtle natural shadows.\n\nExplore a bold, layered magazine-ad composition: oversized cropped typography behind the product, the package overlapping the background lettering, and smaller supporting text areas arranged with generous spacing. Keep the product visually dominant and the overall design refined, balanced, and sophisticated rather than cluttered.\n\nIntegrate the enabled campaign copy naturally into the composition. Use clear typographic hierarchy, elegant editorial lettering, and readable supporting text. Preserve the supplied product's actual appearance and packaging. Use only the product details and promotional wording provided by the system; do not invent product claims, prices, or slogans.";

    $prompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'show_event_text' => true,
        'catalog_products' => [$product],
        'product_name' => 'South Indian Kaapi',
        'price' => 540.00,
        'include_product_name' => true,
        'include_prices' => true,
        'include_business_name' => false,
        'include_tagline' => true,
        'tagline' => 'Make Your 10.10 Brew Perfect',
        'copy_emphasis' => 'Product',
        'render_style' => 'Studio Product Still',
        'aspect_ratio' => '1:1',
        'scene_prompt' => $creativeDirection,
    ], $business);

    // 1. Dominant Product headline instruction with supporting tagline & event guidance
    expect($prompt)->toContain('Copy emphasis: Product — Keep the exact product name as the dominant advertising headline (prominent, editorial, legible, and visually connected to the actual product; do not repeat the full product name across multiple advertising text areas). Keep its corresponding price associated with that product when price visibility is enabled. Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines. Keep the supplied tagline visually coherent and readable, with its complete wording preserved. Keep the event title visible as secondary campaign information. Allow creative typography, layering, and composition, but avoid giving multiple text elements equal headline prominence.')
        ->and($prompt)->toContain('Product name typography: "South Indian Kaapi"');

    // 2. Exact tagline with preservation directive
    expect($prompt)->toContain('Tagline: "Make Your 10.10 Brew Perfect" (Preserve exact wording and meaning; creative line breaks and typographic styling are allowed, but keep the phrase visually coherent and readable rather than looking like unrelated fragments)');

    // 3. Exact event title with supporting role directive
    expect($prompt)->toContain('Event: 10.10 Perfect 10 Shopping Festival')
        ->and($prompt)->toContain('Event visibility: Allowed (Keep exact event title "10.10 Perfect 10 Shopping Festival" visible as supporting campaign information, subordinate to the selected copy emphasis; preserve exact wording and do not invent event slogans or allow event typography to overpower the hero product).');

    // 4. Exact product and price pairing
    expect($prompt)->toContain('• REFERENCE IMAGE 1 = South Indian Kaapi — ₱540.00');

    // 5. Business branding disabled
    expect($prompt)->toContain('(Do not include business/shop name or branding text)')
        ->and($prompt)->toContain('• Business Branding: Disabled. Do not include any business/shop name or branding text in the artwork.');

    // 6. Hard rules enforce typography layering without overpowering the hero product
    expect($prompt)->toContain('• Editorial Typography & Background Typography: Respect the active copy emphasis priority (here: Product). When Product is emphasized, keep the exact product name as the dominant advertising headline, visually connected to the actual product without repeating the full product name across multiple text areas. Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines. Keep the supplied tagline visually coherent and readable with its complete wording preserved, and keep the event title visible as secondary campaign information. Allow creative typography, layering, and composition, but avoid giving multiple text elements equal headline prominence.')
        ->and($prompt)->toContain('• Exact Copy Preservation: When rendering visible text, preserve the exact supplied wording and meaning for the product name, tagline, and event title. Creative line breaks and typographic styling are allowed, but keep the tagline phrase visually coherent and readable rather than looking like unrelated fragments. Do not invent marketing claims, promotional slogans, or unprovided discounts.')
        ->and($prompt)->toContain('• Price Association & Packaging: Preserve the exact supplied price and its association with the product. Show the price once in the advertising layout without inventing discounts or promotional claims. Preserve packaging text naturally present in the reference image.')
        ->and($prompt)->toContain('• Creative Freedom & Direction: Follow the user\'s creative direction while letting the model choose typography, placement, scale, and composition without imposing fixed coordinates, mandatory fonts, or rigid poster templates. Keep the product as the hero.');
});

test('11. Editorial typography and copy hierarchy refinements enforce creative freedom without rigid templates', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create();
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Blend',
        'price' => 450.00,
    ]);

    $prompt = $orchestrator->orchestrateManualCampaignBrief([
        'generation_mode' => 'manual',
        'catalog_products' => [$product],
        'product_name' => 'Signature Blend',
        'price' => 450.00,
        'include_product_name' => true,
        'include_prices' => true,
        'include_tagline' => true,
        'tagline' => 'Crafted With Intention',
        'copy_emphasis' => 'Product',
        'render_style' => 'Minimalist Graphic',
        'aspect_ratio' => '1:1',
    ], $business);

    // Verify creative freedom rule is present
    expect($prompt)->toContain('Creative Freedom & Direction: Follow the user\'s creative direction while letting the model choose typography, placement, scale, and composition without imposing fixed coordinates, mandatory fonts, or rigid poster templates.')
        ->and($prompt)->toContain('Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines.')
        ->and($prompt)->toContain('Show the price once in the advertising layout without inventing discounts or promotional claims.')
        ->and($prompt)->toContain('Creative line breaks and typographic styling are allowed, but keep the tagline phrase visually coherent and readable rather than looking like unrelated fragments');
});

test('12. Copy Emphasis: Product in both Manual and Automatic Studio enforces dominant headline, supporting numerals, and coherent tagline', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);
    $business = Business::factory()->create(['name' => 'Roast Lab']);
    $event = Event::factory()->create(['name' => '10.10 Perfect 10 Shopping Festival']);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Monsoon Malabar',
        'price' => 520.00,
    ]);

    $options = [
        'catalog_products' => [$product],
        'product_name' => 'Monsoon Malabar',
        'price' => 520.00,
        'event_name' => '10.10 Perfect 10 Shopping Festival',
        'show_event_text' => true,
        'tagline' => 'Unveil The Autumn Aroma',
        'include_tagline' => true,
        'include_prices' => true,
        'include_product_name' => true,
        'copy_emphasis' => 'Product',
        'render_style' => 'Studio Product Still',
    ];

    $manualPrompt = $orchestrator->orchestrateManualCampaignBrief(array_merge($options, ['generation_mode' => 'manual']), $business);
    $autoPrompt = $orchestrator->orchestrateAutomaticCampaignBrief(array_merge($options, ['generation_mode' => 'automatic']), $business);

    // Manual Studio assertions
    expect($manualPrompt)->toContain('Copy emphasis: Product — Keep the exact product name as the dominant advertising headline')
        ->and($manualPrompt)->toContain('Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines.')
        ->and($manualPrompt)->toContain('Keep the supplied tagline visually coherent and readable, with its complete wording preserved.')
        ->and($manualPrompt)->toContain('Keep the event title visible as secondary campaign information.')
        ->and($manualPrompt)->toContain('avoid giving multiple text elements equal headline prominence.');

    // Automatic Studio assertions
    expect($autoPrompt)->toContain("Copy emphasis:\nProduct — Keep the exact product name as the dominant advertising headline")
        ->and($autoPrompt)->toContain('Treat campaign numerals (such as "10.10") and oversized background lettering as supporting visual elements, not competing headlines.')
        ->and($autoPrompt)->toContain('Keep the supplied tagline visually coherent and readable, with its complete wording preserved.')
        ->and($autoPrompt)->toContain('Keep the event title visible as secondary campaign information.')
        ->and($autoPrompt)->toContain('avoid giving multiple text elements equal headline prominence.');
});
