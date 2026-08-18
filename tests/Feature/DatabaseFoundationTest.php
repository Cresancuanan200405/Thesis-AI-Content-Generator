<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;

it('creates the core marketing records and relationships', function () {
    $user = User::factory()->create([
        'name' => 'Foundation User',
        'email' => 'foundation@example.com',
    ]);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Foundation Business',
        'industry' => 'Retail',
        'category' => 'E-commerce',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Foundation Product',
        'price' => 49.99,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Spring Launch',
        'type' => 'seasonal',
        'is_global' => false,
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Spring Campaign',
        'status' => 'scheduled',
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'product_name' => 'Foundation Product',
        'prompt' => 'A clean product image for a spring launch',
        'status' => 'completed',
        'is_favorite' => true,
    ]);

    expect($user->business->id)->toBe($business->id)
        ->and($business->products->first()->id)->toBe($product->id)
        ->and($user->events->first()->id)->toBe($event->id)
        ->and($user->campaigns->first()->id)->toBe($campaign->id)
        ->and($campaign->event->id)->toBe($event->id)
        ->and($campaign->designs->first()->id)->toBe($design->id)
        ->and($design->product->id)->toBe($product->id)
        ->and($design->event->id)->toBe($event->id)
        ->and($design->campaign->id)->toBe($campaign->id);
});
