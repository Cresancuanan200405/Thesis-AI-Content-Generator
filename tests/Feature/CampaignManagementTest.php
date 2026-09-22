<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('guest cannot view campaigns', function () {
    $this->get('/campaigns')->assertRedirect('/login');
});

it('authenticated user can view campaigns', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Q4 Promotion',
        'status' => 'active',
    ]);

    $this->actingAs($user)->get('/campaigns')->assertOk();
});

it('user can create a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Holiday Launch',
            'description' => 'Seasonal product push',
            'product_id' => $product->id,
            'event_id' => $event->id,
            'objective' => 'Increase holiday sales',
            'target_audience' => 'Online shoppers',
            'start_date' => now()->addDays(2)->toDateString(),
            'end_date' => now()->addDays(12)->toDateString(),
            'status' => 'active',
        ])
        ->assertRedirect('/campaigns');

    $this->assertDatabaseHas('campaigns', ['name' => 'Holiday Launch', 'user_id' => $user->id]);
});

it('invalid campaign data is rejected', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => '',
            'product_id' => $product->id,
            'event_id' => 999999,
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
            'status' => 'unknown',
        ])
        ->assertSessionHasErrors(['name', 'event_id', 'end_date', 'status']);
});

it('user can view own campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($user)->get('/campaigns/'.$campaign->id)->assertOk();
});

it('user cannot view another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->get('/campaigns/'.$campaign->id)->assertForbidden();
});

it('user can update own campaign name, start date, and end date', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Initial Campaign',
        'status' => 'draft',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDays(5)->toDateString(),
    ]);

    $newStart = now()->addDays(4)->toDateString();
    $newEnd = now()->addDays(18)->toDateString();

    $this->actingAs($user)
        ->put('/campaigns/'.$campaign->id, [
            'name' => 'Updated Campaign Name',
            'start_date' => $newStart,
            'end_date' => $newEnd,
        ])
        ->assertRedirect();

    $fresh = $campaign->fresh();
    expect($fresh->name)->toBe('Updated Campaign Name');
    expect($fresh->start_date->toDateString())->toBe($newStart);
    expect($fresh->end_date->toDateString())->toBe($newEnd);
});

it('rejects invalid date range where start date is after end date on campaign update', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Date Test Campaign',
    ]);

    $this->actingAs($user)
        ->put('/campaigns/'.$campaign->id, [
            'name' => 'Date Test Campaign',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
        ])
        ->assertSessionHasErrors('end_date');
});

it('does not allow manual status change through edit campaign update endpoint and keeps system-managed status', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    // Future dates -> system-managed status is scheduled
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'scheduled',
        'start_date' => now()->addDays(5)->toDateString(),
        'end_date' => now()->addDays(10)->toDateString(),
    ]);

    // Attempt to manually pass status => 'completed'
    $this->actingAs($user)
        ->put('/campaigns/'.$campaign->id, [
            'name' => 'Scheduled Campaign',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(10)->toDateString(),
            'status' => 'completed',
        ])
        ->assertRedirect();

    expect($campaign->fresh()->status)->toBe('scheduled');
});

it('does not allow modifying linked event through edit campaign update endpoint', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $event1 = Event::factory()->create(['user_id' => $user->id, 'name' => "Mother's Day Special"]);
    $event2 = Event::factory()->create(['user_id' => $user->id, 'name' => 'Father Day Special']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event1->id,
        'name' => "Mother's Day Campaign",
    ]);

    // Attempt to pass event_id of event2
    $this->actingAs($user)
        ->put('/campaigns/'.$campaign->id, [
            'name' => "Renamed Mother's Day Campaign",
            'event_id' => $event2->id,
        ])
        ->assertRedirect();

    $fresh = $campaign->fresh();
    expect($fresh->name)->toBe("Renamed Mother's Day Campaign");
    expect($fresh->event_id)->toBe($event1->id);
});

it('user cannot update another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->put('/campaigns/'.$campaign->id, [
        'name' => 'Hijack',
        'start_date' => now()->toDateString(),
        'end_date' => now()->addDay()->toDateString(),
    ])->assertForbidden();
});

it('user can delete own campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($user)->delete('/campaigns/'.$campaign->id)->assertRedirect('/campaigns');
    $this->assertDatabaseMissing('campaigns', ['id' => $campaign->id]);
});

it('user cannot delete another users campaign', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $owner->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $owner->id, 'type' => 'custom']);

    $campaign = Campaign::factory()->create([
        'user_id' => $owner->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($viewer)->delete('/campaigns/'.$campaign->id)->assertForbidden();
});

it('campaign product ownership is validated', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $ownerBusiness = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);
    $otherBusiness = Business::factory()->create();
    $otherProduct = Product::factory()->create(['business_id' => $otherBusiness->id]);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Wrong Product',
            'product_id' => $otherProduct->id,
            'event_id' => $event->id,
            'objective' => 'Boost awareness',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'status' => 'active',
        ])
        ->assertSessionHasErrors('product_id');
});

it('global event can be used by a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->global()->create(['type' => 'holiday']);

    $this->actingAs($user)
        ->post('/campaigns', [
            'name' => 'Holiday Push',
            'product_id' => $product->id,
            'event_id' => $event->id,
            'objective' => 'Drive holiday demand',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'status' => 'active',
        ])
        ->assertRedirect('/campaigns');
});

it('user can archive and unarchive a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'active',
    ]);

    $this->actingAs($user)
        ->post('/campaigns/'.$campaign->id.'/archive')
        ->assertRedirect();

    expect($campaign->fresh()->status)->toBe('archived');

    $this->actingAs($user)
        ->post('/campaigns/'.$campaign->id.'/unarchive')
        ->assertRedirect();

    expect($campaign->fresh()->status)->toBe('active');
});

it('auto-archives completed campaigns older than 2 days', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $oldCompleted = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'completed',
        'end_date' => now()->subDays(3)->toDateString(),
    ]);

    $recentCompleted = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'completed',
        'end_date' => now()->subDay()->toDateString(),
    ]);

    $this->actingAs($user)->get('/campaigns')->assertOk();

    expect($oldCompleted->fresh()->status)->toBe('archived');
    expect($recentCompleted->fresh()->status)->toBe('completed');
});

it('campaign detail displays associated designs', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Gift Release',
    ]);

    Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'status' => 'completed',
    ]);

    $this->actingAs($user)->get('/campaigns/'.$campaign->id)->assertOk();
});

it('generator can preselect campaign context', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'commercial']);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Spring Launch',
        'objective' => 'Drive awareness',
        'target_audience' => 'New customers',
    ]);

    $this->actingAs($user)->get('/generator?campaign='.$campaign->id)->assertOk();
});

it('restricts campaigns events to account creation or finalization year and excludes prior or future years', function () {
    Carbon::setTestNow('2026-06-15 12:00:00');

    $user = User::factory()->create([
        'onboarding_completed' => true,
        'onboarding_completed_at' => Carbon::parse('2026-02-15 10:00:00'),
        'created_at' => Carbon::parse('2026-01-10 10:00:00'),
    ]);
    Business::factory()->create(['user_id' => $user->id]);

    // Create 2025 event (prior year)
    Event::factory()->global()->create([
        'name' => 'Past Year Holiday 2025',
        'date' => '2025-12-25',
        'type' => 'holiday',
    ]);

    // Create 2026 event (account year)
    $event2026 = Event::factory()->global()->create([
        'name' => 'Current Year Holiday 2026',
        'date' => '2026-07-04',
        'type' => 'holiday',
    ]);

    // Create 2027 event (future year)
    Event::factory()->global()->create([
        'name' => 'Next Year Holiday 2027',
        'date' => '2027-01-01',
        'type' => 'holiday',
    ]);

    $response = $this->actingAs($user)->get('/campaigns');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) use ($event2026) {
        $props = $page->toArray()['props'];
        expect($props['campaign_year'])->toBe(2026);
        expect($props['account_year'])->toBe(2026);

        $events = collect($props['events']);
        expect($events->pluck('id')->all())->toContain($event2026->id);

        foreach ($events as $event) {
            expect(str_starts_with($event['date'], '2026-'))->toBeTrue();
        }
    });

    Carbon::setTestNow();
});

it('does not classify events before account finalization date as missed promotional opportunities', function () {
    Carbon::setTestNow('2026-06-15 12:00:00');

    // Account finalized on 2026-02-15
    $user = User::factory()->create([
        'onboarding_completed' => true,
        'onboarding_completed_at' => Carbon::parse('2026-02-15 10:00:00'),
        'created_at' => Carbon::parse('2026-01-10 10:00:00'),
    ]);
    Business::factory()->create(['user_id' => $user->id]);

    // Event on 2026-02-14 (before account finalized)
    $preAccountEvent = Event::factory()->global()->create([
        'name' => "Valentine's Day 2026",
        'date' => '2026-02-14',
        'type' => 'holiday',
    ]);

    // Event on 2026-03-01 (after account finalized, before test now, no campaign)
    $postAccountPastEvent = Event::factory()->global()->create([
        'name' => 'Spring Festival 2026',
        'date' => '2026-03-01',
        'type' => 'commercial',
    ]);

    $response = $this->actingAs($user)->get('/campaigns');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) use ($preAccountEvent, $postAccountPastEvent) {
        $events = collect($page->toArray()['props']['events']);

        $val = $events->firstWhere('id', $preAccountEvent->id);
        expect($val)->not->toBeNull();
        expect($val['is_missed'])->toBeFalse();
        expect($val['is_past'])->toBeTrue();

        $spring = $events->firstWhere('id', $postAccountPastEvent->id);
        expect($spring)->not->toBeNull();
        expect($spring['is_missed'])->toBeTrue();
        expect($spring['is_past'])->toBeTrue();
    });

    Carbon::setTestNow();
});

it('correctly provides upcoming opportunities with relative timing ordered chronologically', function () {
    Carbon::setTestNow('2026-09-01 00:00:00');

    $user = User::factory()->create([
        'onboarding_completed' => true,
        'onboarding_completed_at' => Carbon::parse('2026-01-15 10:00:00'),
        'created_at' => Carbon::parse('2026-01-15 10:00:00'),
    ]);
    Business::factory()->create(['user_id' => $user->id]);

    Event::factory()->global()->create([
        'name' => 'Christmas Day 2026',
        'date' => '2026-12-25',
        'type' => 'holiday',
    ]);

    Event::factory()->global()->create([
        'name' => 'Autumn Launch 2026',
        'date' => '2026-09-04',
        'type' => 'commercial',
    ]);

    Event::factory()->global()->create([
        'name' => 'Labor Holiday 2026',
        'date' => '2026-09-01',
        'type' => 'holiday',
    ]);

    $response = $this->actingAs($user)->get('/campaigns');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) {
        $upcoming = collect($page->toArray()['props']['upcoming_opportunities']);

        expect($upcoming->count())->toBeGreaterThanOrEqual(3);

        $first = $upcoming->first();
        expect($first['date'])->toBe('2026-09-01');
        expect($first['relative_timing'])->toBe('Today');
        expect($first['is_upcoming'])->toBeTrue();

        $dates = $upcoming->pluck('date')->all();
        $sortedDates = $dates;
        sort($sortedDates);
        expect($dates)->toEqual($sortedDates);
    });

    Carbon::setTestNow();
});

it('links existing campaign to event and marks has_campaign as true', function () {
    Carbon::setTestNow('2026-09-01 00:00:00');

    $user = User::factory()->create([
        'onboarding_completed' => true,
        'onboarding_completed_at' => Carbon::parse('2026-01-15 10:00:00'),
        'created_at' => Carbon::parse('2026-01-15 10:00:00'),
    ]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);

    $event = Event::factory()->global()->create([
        'name' => 'Special Sales 2026',
        'date' => '2026-10-10',
        'type' => 'commercial',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => '10.10 Super Sale',
        'status' => 'active',
    ]);

    $response = $this->actingAs($user)->get('/campaigns');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) use ($event, $campaign) {
        $events = collect($page->toArray()['props']['events']);
        $matched = $events->firstWhere('id', $event->id);

        expect($matched)->not->toBeNull();
        expect($matched['has_campaign'])->toBeTrue();
        expect($matched['campaign_id'])->toBe($campaign->id);
        expect($matched['campaign_name'])->toBe('10.10 Super Sale');
    });

    Carbon::setTestNow();
});

it('redirects /generator to /campaigns when accessed without campaign_id', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->get('/generator')
        ->assertRedirect('/campaigns');
});

it('defaults /campaigns view to opportunities', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/campaigns');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) {
        $page->component('campaigns/index')
            ->where('view', 'opportunities')
            ->has('upcoming_opportunities')
            ->has('events')
            ->has('campaigns')
            ->has('currentCampaignYear');
    });
});

it('supports explicitly switching to opportunities view', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/campaigns?view=opportunities');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) {
        $page->component('campaigns/index')
            ->where('view', 'opportunities');
    });
});

it('supports switching to campaign hub view', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/campaigns?view=hub');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) {
        $page->component('campaigns/index')
            ->where('view', 'hub')
            ->has('campaigns');
    });
});

it('falls back to opportunities for invalid view param', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/campaigns?view=invalid_view');
    $response->assertOk();

    $response->assertInertia(function (Assert $page) {
        $page->component('campaigns/index')
            ->where('view', 'opportunities');
    });
});
