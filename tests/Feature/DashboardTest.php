<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page when visiting dashboard', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('authenticated user can view dashboard with authentic metrics and scoped data', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Apit Burger Joint',
        'industry' => 'Food & Beverage',
        'category' => 'Restaurant',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Double Cheese Burger',
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Araw ng Kagitingan',
        'type' => 'holiday',
        'date' => now()->addDays(10)->toDateString(),
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'event_id' => $event->id,
        'name' => 'Hero Day Burger Promo',
        'status' => 'active',
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_name' => 'Double Cheese Burger',
        'status' => 'completed',
    ]);

    // Create another user's data to test strict tenant isolation
    $otherUser = User::factory()->create(['onboarding_completed' => true]);
    $otherBusiness = Business::factory()->create(['user_id' => $otherUser->id]);
    Product::factory()->count(5)->create(['business_id' => $otherBusiness->id]);
    Campaign::factory()->count(3)->create(['user_id' => $otherUser->id]);
    Design::factory()->count(4)->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('business.name', 'Apit Burger Joint')
        ->where('stats.total_designs', 1)
        ->where('stats.active_campaigns', 1)
        ->where('stats.total_products', 1)
        ->where('stats.products_with_visuals', 1)
        ->where('stats.products_without_visuals', 0)
        ->where('stats.catalog_coverage', 100)
        ->has('campaign_status_breakdown.active')
        ->has('campaign_status_breakdown.scheduled')
        ->has('campaign_status_breakdown.draft')
        ->has('campaign_status_breakdown.completed')
        ->has('campaign_status_breakdown.archived')
        ->has('system_health.ai_generation')
        ->has('system_health.event_calendar')
        ->has('system_health.product_catalog')
        ->has('system_health.campaign_engine')
        ->where('campaigns.0.id', $campaign->id)
        ->where('recent_designs.0.id', $design->id)
    );
});

test('dashboard displays honest zero states when user has no activity', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('stats.total_designs', 0)
        ->where('stats.active_campaigns', 0)
        ->where('stats.total_products', 0)
        ->where('stats.products_with_visuals', 0)
        ->where('stats.products_without_visuals', 0)
        ->where('stats.catalog_coverage', 0)
        ->where('campaigns', [])
        ->where('recent_designs', [])
    );
});

test('dashboard detects missing visuals for products without automatically generating designs', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Pastry Hub',
    ]);

    // 3 products, none have designs
    Product::factory()->count(3)->create([
        'business_id' => $business->id,
    ]);

    // Upcoming event exists
    Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Independence Day',
        'date' => now()->addDays(5)->toDateString(),
    ]);

    $initialDesignCount = Design::count();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('stats.total_products', 3)
        ->where('stats.products_with_visuals', 0)
        ->where('stats.products_without_visuals', 3)
        ->where('stats.catalog_coverage', 0)
    );

    // CRITICAL: Visual generation was NOT triggered automatically
    expect(Design::count())->toBe($initialDesignCount);
});
