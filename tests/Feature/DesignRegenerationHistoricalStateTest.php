<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\DesignRegenerationService;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config(['services.openai.api_key' => 'sk-test-variation-key']);
    config(['services.openai.budget_limit' => 100.00]);

    Http::fake([
        'https://api.openai.com/v1/images/*' => function (ClientRequest $request) {
            return Http::response([
                'data' => [
                    ['b64_json' => base64_encode('fake-regenerated-image-content')],
                ],
            ], 200);
        },
    ]);
});

it('preserves historical product prices even when current catalog prices have changed', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $prodA = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Signature Blend Coffee',
        'price' => 250.00,
        'image_path' => 'products/coffee.png',
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Glazed Croissant',
        'price' => 180.00,
        'image_path' => 'products/croissant.png',
    ]);

    Storage::disk('public')->put('products/coffee.png', 'fake-coffee');
    Storage::disk('public')->put('products/croissant.png', 'fake-croissant');

    $originalDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $prodA->id,
        'product_name' => $prodA->name,
        'prompt' => 'Commercial prompt for coffee and croissant',
        'price' => 250.00,
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/orig_coffee.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'catalog_product_ids' => [$prodA->id, $prodB->id],
            'include_prices' => true,
            'prices' => [
                (string) $prodA->id => '250.00',
                (string) $prodB->id => '180.00',
            ],
            'reference_image_paths' => ['products/coffee.png', 'products/croissant.png'],
        ],
    ]);

    // Merchant later updates the catalog prices to higher values
    $prodA->update(['price' => 999.00]);
    $prodB->update(['price' => 777.00]);

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($originalDesign);

    // 1. Regenerated design preserves the historical prices, NOT the updated catalog prices
    $meta = $regenerated->generation_metadata;
    expect($meta['prices'][(string) $prodA->id])->toBe('250.00')
        ->and($meta['prices'][(string) $prodB->id])->toBe('180.00');

    // 2. Regenerated prompt contains the historical prices, not the changed catalog prices
    $prompt = $regenerated->prompt;
    expect($prompt)->toContain('250.00')
        ->and($prompt)->toContain('180.00')
        ->and($prompt)->not->toContain('999.00')
        ->and($prompt)->not->toContain('777.00');

    // 3. Catalog products in database remain untouched
    expect((float) $prodA->fresh()->price)->toBe(999.00)
        ->and((float) $prodB->fresh()->price)->toBe(777.00);
});

it('preserves exact multi-product ordering regardless of database ordering', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $p1 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Prod 1', 'price' => 10]);
    $p2 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Prod 2', 'price' => 20]);
    $p3 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Prod 3', 'price' => 30]);
    $p4 = Product::factory()->create(['business_id' => $business->id, 'name' => 'Prod 4', 'price' => 40]);

    // Intentionally out of sequential/DB order: 3, 1, 4, 2
    $historicalOrder = [$p3->id, $p1->id, $p4->id, $p2->id];

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $p3->id,
        'product_name' => $p3->name,
        'prompt' => 'Ordered products prompt',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/ordered.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'catalog_product_ids' => $historicalOrder,
        ],
    ]);

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($design);

    expect($regenerated->generation_metadata['catalog_product_ids'])->toBe($historicalOrder);
});

it('restores and persists show_event_text=false', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['name' => 'Valentine Special Promo']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'product_name' => 'Rose Bouquet',
        'prompt' => 'Valentine promo prompt',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/event_design.png',
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'event_id' => $event->id,
            'show_event_text' => false,
        ],
    ]);

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($design);

    expect($regenerated->generation_metadata['show_event_text'])->toBeFalse()
        ->and($regenerated->prompt)->toContain('FORBIDDEN EVENT TEXT');
});

it('resolves canonical Manual and Automatic generation modes including legacy mode', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    // Design A: explicit generation_mode = 'manual'
    $designA = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Item A',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/a.png',
        'generation_metadata' => ['generation_mode' => 'manual'],
    ]);

    // Design B: legacy mode = 'manual'
    $designB = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Item B',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/b.png',
        'generation_metadata' => ['mode' => 'manual'],
    ]);

    // Design C: explicit generation_mode = 'automatic'
    $designC = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Item C',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/c.png',
        'generation_metadata' => ['generation_mode' => 'automatic'],
    ]);

    $service = app(DesignRegenerationService::class);

    $regenA = $service->regenerate($designA);
    $regenB = $service->regenerate($designB);
    $regenC = $service->regenerate($designC);

    expect($regenA->generation_metadata['generation_mode'])->toBe('manual')
        ->and($regenB->generation_metadata['generation_mode'])->toBe('manual')
        ->and($regenC->generation_metadata['generation_mode'])->toBe('automatic');
});

it('falls back to generation_metadata.event_id when design.event_id column is null', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['name' => 'Summer Kickoff Fest']);

    $design = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => null, // Column is null
        'product_name' => 'Beach Towel',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/summer.png',
        'generation_metadata' => [
            'event_id' => $event->id,
            'event_name' => 'Summer Kickoff Fest',
        ],
    ]);

    $service = app(DesignRegenerationService::class);
    $regenerated = $service->regenerate($design);

    expect($regenerated->event_id)->toBe($event->id)
        ->and($regenerated->generation_metadata['event_id'])->toBe($event->id)
        ->and($regenerated->generation_metadata['event_name'])->toBe('Summer Kickoff Fest');
});

it('creates a new design leaving the original design record completely unchanged', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $originalDesign = Design::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Original Artisan Soap',
        'prompt' => 'Handcrafted soap bar on wooden dish',
        'price' => 120.00,
        'brand_tone' => 'Warm, Earthy',
        'visual_theme' => 'Minimalist',
        'status' => Design::STATUS_COMPLETED,
        'generated_image_path' => 'designs/soap_orig.png',
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'product_name' => 'Original Artisan Soap',
            'price' => '₱120.00',
        ],
    ]);

    $origPrompt = $originalDesign->prompt;
    $origImagePath = $originalDesign->generated_image_path;
    $origPrice = $originalDesign->price;
    $origMeta = $originalDesign->generation_metadata;

    $service = app(DesignRegenerationService::class);
    $newDesign = $service->regenerate($originalDesign);

    // New design is a distinct record
    expect($newDesign->id)->not->toBe($originalDesign->id)
        ->and($newDesign->generation_metadata['regenerated_from_design_id'])->toBe($originalDesign->id)
        ->and($newDesign->generation_metadata['source_design_id'])->toBe($originalDesign->id);

    // Original design remains identical in database
    $freshOriginal = $originalDesign->fresh();
    expect($freshOriginal->prompt)->toBe($origPrompt)
        ->and($freshOriginal->generated_image_path)->toBe($origImagePath)
        ->and((float) $freshOriginal->price)->toBe((float) $origPrice)
        ->and($freshOriginal->generation_metadata)->toBe($origMeta)
        ->and($freshOriginal->status)->toBe(Design::STATUS_COMPLETED);
});
