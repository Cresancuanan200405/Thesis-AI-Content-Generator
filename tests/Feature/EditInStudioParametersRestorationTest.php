<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create(['onboarding_completed' => true]);
    $this->business = Business::factory()->create(['user_id' => $this->user->id]);
    $this->campaign = Campaign::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'name' => 'Active Fall Campaign',
        'status' => 'active',
        'start_date' => now()->startOfMonth(),
        'end_date' => now()->addMonth(),
    ]);
});

it('routes manual design to generator.manual.index via Design::getGenerationSource()', function () {
    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_name' => 'Artisan Coffee Beans',
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'render_style' => 'Studio Product Still',
            'aspect_ratio' => '1:1',
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('designs.index'));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($design) {
        $page->component('designs/index')
            ->has('designs.data', 1)
            ->where('designs.data.0.id', $design->id)
            ->where('designs.data.0.generator_url', fn ($url) => str_contains((string) $url, '/generator/manual') &&
                str_contains((string) $url, "draft_id={$design->id}") &&
                str_contains((string) $url, 'origin=designs')
            );
    });
});

it('routes automatic design to generator.automatic.index via Design::getGenerationSource()', function () {
    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_name' => 'Botanical Body Mist',
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'render_style' => 'Lifestyle Capture',
            'aspect_ratio' => '9:16',
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('designs.index'));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($design) {
        $page->component('designs/index')
            ->has('designs.data', 1)
            ->where('designs.data.0.id', $design->id)
            ->where('designs.data.0.generator_url', fn ($url) => str_contains((string) $url, '/generator/automatic') &&
                str_contains((string) $url, "draft_id={$design->id}") &&
                str_contains((string) $url, 'origin=designs')
            );
    });
});

it('prioritizes historical draft event over campaign event in generator context', function () {
    $campaignEvent = Event::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Campaign Summer Fest',
    ]);
    $this->campaign->update(['event_id' => $campaignEvent->id]);

    $designEvent = Event::factory()->create([
        'user_id' => $this->user->id,
        'name' => 'Historical Holiday Celebration',
    ]);

    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'event_id' => $designEvent->id,
        'product_name' => 'Holiday Gift Basket',
        'status' => Design::STATUS_DRAFT,
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'event_id' => $designEvent->id,
            'show_event_text' => true,
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('generator.manual.index', [
        'campaign_id' => $this->campaign->id,
        'draft_id' => $design->id,
        'origin' => 'designs',
    ]));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($designEvent) {
        $page->component('generator/manual')
            ->where('selectedEvent.id', $designEvent->id)
            ->where('selectedEvent.name', 'Historical Holiday Celebration')
            ->where('initial_event_id', (string) $designEvent->id);
    });
});

it('restores complete historical generation metadata and multi-product ordering', function () {
    $prodA = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Product Alpha',
        'price' => 100.00,
    ]);
    $prodB = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Product Beta',
        'price' => 200.00,
    ]);
    $prodC = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Product Gamma',
        'price' => 300.00,
    ]);

    $orderedIds = [$prodC->id, $prodA->id, $prodB->id];
    $historicalPrices = [
        (string) $prodC->id => '280.00',
        (string) $prodA->id => '85.00',
        (string) $prodB->id => '190.00',
    ];

    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_id' => $prodC->id,
        'product_name' => $prodC->name,
        'tagline' => 'Exclusive Autumn Trio Bundle',
        'tagline_mode' => 'manual',
        'prompt' => 'Three beauty bottles arranged harmoniously on warm marble pedestal',
        'visual_theme' => 'Warm, Minimal, Luxury',
        'brand_tone' => 'Sophisticated, Elegant',
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'catalog_product_ids' => $orderedIds,
            'prices' => $historicalPrices,
            'include_prices' => true,
            'include_tagline' => true,
            'render_style' => 'Studio Product Still',
            'aspect_ratio' => '9:16',
            'quality' => 'high',
            'include_business_name' => true,
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('generator.manual.index', [
        'campaign_id' => $this->campaign->id,
        'draft_id' => $design->id,
        'origin' => 'designs',
    ]));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($design, $orderedIds, $historicalPrices) {
        $page->component('generator/manual')
            ->where('initial_draft.id', $design->id)
            ->where('initial_draft.product_name', 'Product Gamma')
            ->where('initial_draft.tagline', 'Exclusive Autumn Trio Bundle')
            ->where('initial_draft.generation_metadata.catalog_product_ids', $orderedIds)
            ->where('initial_draft.generation_metadata.prices', $historicalPrices)
            ->where('initial_draft.generation_metadata.include_prices', true)
            ->where('initial_draft.generation_metadata.render_style', 'Studio Product Still')
            ->where('initial_draft.generation_metadata.aspect_ratio', '9:16');
    });

    // Verify canonical product prices in database are NOT mutated
    expect($prodA->fresh()->price)->toEqual('100.00');
    expect($prodB->fresh()->price)->toEqual('200.00');
    expect($prodC->fresh()->price)->toEqual('300.00');
});

it('restores automatic studio generation configuration including concept and strategy', function () {
    $prod = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Organic Glow Serum',
        'price' => 75.00,
    ]);

    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_id' => $prod->id,
        'product_name' => $prod->name,
        'tagline' => 'Awaken Natural Radiance',
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => [
            'generation_mode' => 'automatic',
            'catalog_product_ids' => [$prod->id],
            'creative_concept' => 'Morning Dew Garden Pause',
            'visual_strategy' => 'Overhead botanical flat-lay with warm natural lighting',
            'design_treatment' => 'Editorial',
            'copy_emphasis' => 'Balanced',
            'aspect_ratio' => '4:5',
            'include_prices' => true,
            'include_tagline' => true,
            'include_business_name' => false,
            'quality' => 'medium',
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('generator.automatic.index', [
        'campaign_id' => $this->campaign->id,
        'draft_id' => $design->id,
        'origin' => 'designs',
    ]));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($design, $prod) {
        $page->component('generator/automatic')
            ->where('initial_draft.id', $design->id)
            ->where('initial_draft.product_name', 'Organic Glow Serum')
            ->where('initial_draft.generation_metadata.catalog_product_ids', [$prod->id])
            ->where('initial_draft.generation_metadata.creative_concept', 'Morning Dew Garden Pause')
            ->where('initial_draft.generation_metadata.visual_strategy', 'Overhead botanical flat-lay with warm natural lighting')
            ->where('initial_draft.generation_metadata.design_treatment', 'Editorial')
            ->where('initial_draft.generation_metadata.aspect_ratio', '4:5')
            ->where('initial_draft.generation_metadata.include_business_name', false);
    });
});

it('restores custom products alongside catalog products', function () {
    $prod = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Signature Matte Lipstick',
        'price' => 50.00,
    ]);

    $customProducts = [
        ['name' => 'Limited Edition Velvet Pouch', 'price' => '25.00', 'description' => 'Gold embroidered pouch'],
    ];

    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_id' => $prod->id,
        'product_name' => $prod->name,
        'status' => Design::STATUS_DRAFT,
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'catalog_product_ids' => [$prod->id],
            'custom_products' => $customProducts,
        ],
    ]);

    $response = $this->actingAs($this->user)->get(route('generator.manual.index', [
        'campaign_id' => $this->campaign->id,
        'draft_id' => $design->id,
        'origin' => 'designs',
    ]));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) use ($design, $customProducts) {
        $page->component('generator/manual')
            ->where('initial_draft.id', $design->id)
            ->where('initial_draft.generation_metadata.custom_products', $customProducts);
    });
});
