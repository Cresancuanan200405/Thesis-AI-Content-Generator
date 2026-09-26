<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ModularPromptOrchestrator;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

// Acceptance & Test 1: Multi-product price contract (Two selected products produce two authoritative prices)
it('preserves multi-product prices as an atomic contract in automatic and manual generation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'REVUELE Aloe Daily Sun Barrier',
        'price' => 398.00,
        'image_path' => 'products/images/revuele.jpg',
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'YAJNA Organic Raw Aloe Vera Butter',
        'price' => 599.00,
        'image_path' => 'products/images/yajna.jpg',
    ]);

    Storage::disk('public')->put('products/images/revuele.jpg', 'img-a');
    Storage::disk('public')->put('products/images/yajna.jpg', 'img-b');
    Storage::put('designs/test.png', 'img-test');

    // Test saving via DesignController
    $response = $this->actingAs($user)->postJson('/designs', [
        'status' => 'draft',
        'product_name' => $prodA->name,
        'campaign_id' => $campaign->id,
        'catalog_product_ids' => [$prodA->id, $prodB->id],
        'include_prices' => true,
        'generated_image_path' => 'designs/test.png',
        'prompt' => 'Promotional display for REVUELE and YAJNA',
    ]);

    $response->assertOk();
    $designId = $response->json('design.id');
    $savedDesign = Design::findOrFail($designId);

    // Verify metadata snapshot stores both prices mapped to their IDs
    $meta = $savedDesign->generation_metadata;
    expect($meta)->toHaveKey('prices');
    expect((float) $meta['prices'][(string) $prodA->id])->toBe(398.0);
    expect((float) $meta['prices'][(string) $prodB->id])->toBe(599.0);

    // designs.price column keeps primary product's price for scalar backward compatibility
    expect((float) $savedDesign->price)->toBe(398.0);
});

// Test 2: Prompt generation (Multi-product prompt contains both exact prices as separate entries, prohibits leader lines, and does not emit a conflicting single-price directive)
it('orchestrates multi-product prompt with exact separate prices and leader-line prohibition', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prodA = new Product([
        'id' => 1,
        'name' => 'REVUELE Aloe Daily Sun Barrier',
        'price' => 398.00,
        'image_path' => 'products/images/revuele.jpg',
    ]);
    $prodB = new Product([
        'id' => 2,
        'name' => 'YAJNA Organic Raw Aloe Vera Butter',
        'price' => 599.00,
        'image_path' => 'products/images/yajna.jpg',
    ]);

    Storage::disk('public')->put('products/images/revuele.jpg', 'img-a');
    Storage::disk('public')->put('products/images/yajna.jpg', 'img-b');

    $options = [
        'product_name' => $prodA->name,
        'catalog_products' => collect([$prodA, $prodB]),
        'include_prices' => true,
        'price' => null, // Multi-product contract sets top-level price to null
        'prices' => [
            $prodA->name => '398.00',
            $prodB->name => '599.00',
        ],
        'aspect_ratio' => '1:1',
    ];

    $prompt = $orchestrator->orchestrate($options);

    // Must contain multi-product pricing block with both prices
    expect($prompt)->toContain('MULTI-PRODUCT PRICING (MANDATORY EXACT PRODUCT-PRICE ASSOCIATIONS):')
        ->toContain('• Product 1 ("REVUELE Aloe Daily Sun Barrier"):')
        ->toContain('Exact price: ₱398.00')
        ->toContain('• Product 2 ("YAJNA Organic Raw Aloe Vera Butter"):')
        ->toContain('Exact price: ₱599.00');

    // Must contain prohibition against leader lines, connector lines, and anchor dots
    expect($prompt)->toContain('NO LEADER LINES / NO CALLOUT POINTERS: Do NOT draw leader lines, pointer arrows, connector lines, anchor dots, or floating callout lines between products and prices.')
        ->toContain('Do NOT merge, sum, or combine prices.')
        ->toContain("Do NOT omit any selected product's price.");

    // Must NOT contain a conflicting single price directive
    expect($prompt)->not->toContain('PRICE: "₱398.00"')
        ->not->toContain('PRICE: "₱599.00"')
        ->not->toContain('MARKETING PRICE DISPLAY:');
});

// Test 3: Regeneration (Existing multi-product design regenerates with both product prices preserved)
it('regenerates multi-product design restoring all product prices from authoritative sources', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'REVUELE Aloe Daily Sun Barrier',
        'price' => 398.00,
        'image_path' => 'products/images/revuele.jpg',
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'YAJNA Organic Raw Aloe Vera Butter',
        'price' => 599.00,
        'image_path' => 'products/images/yajna.jpg',
    ]);

    Storage::disk('public')->put('products/images/revuele.jpg', 'img-a');
    Storage::disk('public')->put('products/images/yajna.jpg', 'img-b');

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $prodA->id,
        'product_name' => $prodA->name,
        'prompt' => 'Initial multi-product generation',
        'price' => 398.00, // scalar column contains only primary price
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/orig.png',
        'generation_metadata' => [
            'catalog_product_ids' => [$prodA->id, $prodB->id],
            'include_prices' => true,
            'prices' => [
                (string) $prodA->id => '398.00',
                (string) $prodB->id => '599.00',
            ],
        ],
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $regeneratedDesign = $regenerationService->regenerate($design, $user);

    // Verify regenerated prompt contains both prices and does not collapse to one
    $regeneratedPrompt = $regeneratedDesign->prompt;
    expect($regeneratedPrompt)->toContain('REVUELE Aloe Daily Sun Barrier')
        ->toContain('₱398.00')
        ->toContain('YAJNA Organic Raw Aloe Vera Butter')
        ->toContain('₱599.00')
        ->not->toContain('PRICE: "₱398.00"')
        ->not->toContain('PRICE: "₱599.00"');

    // Verify regenerated design metadata preserves both prices
    $meta = $regeneratedDesign->generation_metadata;
    expect($meta['prices'])->toHaveKey((string) $prodA->id)
        ->toHaveKey((string) $prodB->id);
});

// Test 4: Single-product regression (Existing single-product generation continues to use the scalar price contract)
it('preserves single-product scalar price contract without multi-product overhead', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $singleProd = new Product([
        'id' => 10,
        'name' => 'Single Espresso',
        'price' => 120.00,
        'image_path' => 'products/images/espresso.jpg',
    ]);

    Storage::disk('public')->put('products/images/espresso.jpg', 'img-espresso');

    $options = [
        'product_name' => $singleProd->name,
        'catalog_products' => collect([$singleProd]),
        'include_prices' => true,
        'price' => '120.00',
        'aspect_ratio' => '1:1',
    ];

    $prompt = $orchestrator->orchestrate($options);

    // Single-product contract MUST contain the standard single price directive
    expect($prompt)->toContain('PRICE:')
        ->toContain('"₱120.00"')
        ->toContain('MARKETING PRICE DISPLAY:')
        ->toContain('• PRICE: "₱120.00"')
        ->toContain('• Price: ₱120.00')
        ->not->toContain('MULTI-PRODUCT PRICING (MANDATORY EXACT PRODUCT-PRICE ASSOCIATIONS):');
});

// Test 5: Product ordering (Product, reference, and price ordering remain strictly aligned)
it('maintains strict correspondence between selection order, reference images, and prices', function () {
    $orchestrator = app(ModularPromptOrchestrator::class);

    $prod1 = new Product(['id' => 99, 'name' => 'Product Alpha', 'price' => 100.00, 'image_path' => 'p1.jpg']);
    $prod2 = new Product(['id' => 88, 'name' => 'Product Beta', 'price' => 200.00, 'image_path' => 'p2.jpg']);
    $prod3 = new Product(['id' => 77, 'name' => 'Product Gamma', 'price' => 300.00, 'image_path' => 'p3.jpg']);

    Storage::disk('public')->put('p1.jpg', '1');
    Storage::disk('public')->put('p2.jpg', '2');
    Storage::disk('public')->put('p3.jpg', '3');

    $options = [
        'product_name' => $prod1->name,
        'catalog_products' => collect([$prod1, $prod2, $prod3]),
        'reference_image_paths' => ['p1.jpg', 'p2.jpg', 'p3.jpg'],
        'include_prices' => true,
        'price' => null,
        'prices' => [
            $prod1->name => '100.00',
            $prod2->name => '200.00',
            $prod3->name => '300.00',
        ],
        'aspect_ratio' => '1:1',
    ];

    $prompt = $orchestrator->orchestrate($options);

    // References ordered 1, 2, 3
    expect($prompt)->toContain('REFERENCE IMAGE 1 = Product Alpha')
        ->toContain('REFERENCE IMAGE 2 = Product Beta')
        ->toContain('REFERENCE IMAGE 3 = Product Gamma');

    // Prices ordered 1, 2, 3
    expect($prompt)->toContain('• Product 1 ("Product Alpha"):')
        ->toContain('Exact price: ₱100.00')
        ->toContain('• Product 2 ("Product Beta"):')
        ->toContain('Exact price: ₱200.00')
        ->toContain('• Product 3 ("Product Gamma"):')
        ->toContain('Exact price: ₱300.00');

    // Product 1 must appear before Product 2, Product 2 before Product 3 in prompt
    $pos1 = strpos($prompt, 'Product 1 ("Product Alpha")');
    $pos2 = strpos($prompt, 'Product 2 ("Product Beta")');
    $pos3 = strpos($prompt, 'Product 3 ("Product Gamma")');
    expect($pos1)->toBeLessThan($pos2)
        ->and($pos2)->toBeLessThan($pos3);
});

// Test 6: Missing/deleted product fallback (Do not assign one remaining product's price to another missing product)
it('does not assign remaining product price to missing/deleted products during regeneration', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    // Product A exists in DB with price 398
    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Existing Product A',
        'price' => 398.00,
    ]);

    // Product B (id 9999) does NOT exist in DB and has no historical price
    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_id' => $prodA->id,
        'product_name' => $prodA->name,
        'prompt' => 'Multi-product with deleted item',
        'price' => 398.00,
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/deleted_test.png',
        'generation_metadata' => [
            'catalog_product_ids' => [$prodA->id, 9999], // 9999 does not exist
            'include_prices' => true,
            'prices' => [
                (string) $prodA->id => '398.00',
                // 9999 is missing from prices snapshot too
            ],
        ],
    ]);

    $regenerationService = app(DesignRegenerationService::class);
    $regeneratedDesign = $regenerationService->regenerate($design, $user);

    $meta = $regeneratedDesign->generation_metadata;

    // Existing product A must have its price
    expect((float) ($meta['prices'][(string) $prodA->id] ?? 0))->toBe(398.0);

    // Missing product 9999 must NOT be assigned product A's price
    expect($meta['prices'])->not->toHaveKey('9999');
});
