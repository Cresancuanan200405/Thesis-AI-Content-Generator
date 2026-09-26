<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use App\Services\PhilippineHolidayService;
use Inertia\Testing\AssertableInertia as Assert;

it('guest cannot access the marketing calendar', function () {
    $this->get('/calendar')
        ->assertRedirect('/login');
});

it('authenticated user can view the marketing calendar', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Store Anniversary',
        'date' => now()->addDays(10)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    Event::factory()->global()->create([
        'name' => 'Black Friday',
        'date' => now()->month(11)->day(28)->toDateString(),
        'type' => 'commercial',
    ]);

    $this->actingAs($user)
        ->get('/calendar')
        ->assertOk();
});

it('calendar syncs current year Philippine holidays for display', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    Event::query()->where('country', 'PH')->delete();

    $this->actingAs($user)
        ->get('/calendar')
        ->assertOk();

    expect(Event::query()
        ->where('country', 'PH')
        ->whereYear('date', now()->year)
        ->exists())->toBeTrue();
});

it('user can create an event', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Summer Sale',
            'description' => 'Seasonal campaign for summer products.',
            'start_date' => now()->addDays(6)->toDateString(),
            'end_date' => now()->addDays(9)->toDateString(),
            'type' => 'custom',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'user_id' => $user->id,
        'name' => 'Summer Sale',
        'type' => 'custom',
        'is_global' => false,
    ]);

    $savedEvent = Event::query()->where('user_id', $user->id)->where('name', 'Summer Sale')->firstOrFail();
    expect($savedEvent->date->toDateString())->toBe(now()->addDays(6)->toDateString())
        ->and($savedEvent->end_date->toDateString())->toBe(now()->addDays(9)->toDateString());
});

it('user cannot create invalid event date ranges', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Broken Sale',
            'description' => 'No good dates.',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(8)->toDateString(),
            'type' => 'custom',
        ])
        ->assertSessionHasErrors('end_date');
});

it('user can view own event', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Grand Opening',
        'date' => now()->addDays(14)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($user)
        ->get('/events/'.$event->id)
        ->assertOk();
});

it('user cannot view another users private event', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Private Launch',
        'date' => now()->addDays(20)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($viewer)
        ->get('/events/'.$event->id)
        ->assertForbidden();
});

it('user can update own event', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Original Name',
        'date' => now()->addDays(5)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($user)
        ->put('/events/'.$event->id, [
            'name' => 'Updated Name',
            'description' => 'Updated description',
            'start_date' => now()->addDays(7)->toDateString(),
            'end_date' => now()->addDays(9)->toDateString(),
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'id' => $event->id,
        'name' => 'Updated Name',
        'type' => 'commercial',
    ]);
});

it('user cannot update another users event', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Private Event',
        'date' => now()->addDays(3)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($viewer)
        ->put('/events/'.$event->id, [
            'name' => 'Hacked',
            'description' => 'bad',
            'start_date' => now()->addDays(1)->toDateString(),
            'end_date' => now()->addDays(2)->toDateString(),
            'type' => 'custom',
        ])
        ->assertForbidden();
});

it('user can delete own event', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Delete Me',
        'date' => now()->addDays(12)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($user)
        ->delete('/events/'.$event->id)
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseMissing('events', ['id' => $event->id]);
});

it('user cannot delete another users event', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Locked Event',
        'date' => now()->addDays(15)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($viewer)
        ->delete('/events/'.$event->id)
        ->assertForbidden();
});

it('global events are visible to authenticated users', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $event = Event::factory()->global()->create([
        'name' => 'Christmas',
        'date' => now()->month(12)->day(25)->toDateString(),
        'type' => 'holiday',
    ]);

    $this->actingAs($user)
        ->get('/calendar')
        ->assertOk();

    $this->assertDatabaseHas('events', ['id' => $event->id, 'is_global' => true]);
});

it('global events cannot be modified by normal users', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $event = Event::factory()->global()->create([
        'name' => 'Mother\'s Day',
        'date' => now()->month(5)->day(11)->toDateString(),
        'type' => 'holiday',
    ]);

    $this->actingAs($user)
        ->put('/events/'.$event->id, [
            'name' => 'Changed',
            'description' => 'Nope',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'type' => 'custom',
        ])
        ->assertForbidden();
});

it('generator accepts a valid global event selection', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->global()->create([
        'name' => 'Christmas',
        'date' => now()->month(12)->day(25)->toDateString(),
        'type' => 'holiday',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $this->actingAs($user)
        ->followingRedirects()
        ->get('/generator?campaign_id='.$campaign->id.'&event='.$event->id)
        ->assertOk();
});

it('another users event cannot be attached to a generation', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $owner->id,
        'name' => 'Private Sale',
        'date' => now()->addDays(18)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $this->actingAs($viewer)
        ->post('/generator', [
            'product_name' => 'Private Product',
            'marketing_goal' => 'Drive early interest',
            'event_id' => $event->id,
            'content_style' => ['Product-focused'],
            'brand_tone' => ['Professional'],
        ])
        ->assertSessionHasErrors('event_id');
});

it('calendar filters events by type', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    Event::factory()->create(['user_id' => $user->id, 'name' => 'Weekend Sale', 'date' => now()->addDays(2)->toDateString(), 'type' => 'custom', 'is_global' => false]);
    Event::factory()->global()->create(['name' => 'Halloween', 'date' => now()->month(10)->day(31)->toDateString(), 'type' => 'holiday']);

    $this->actingAs($user)
        ->get('/calendar?filter=holidays')
        ->assertOk();
});

it('syncs all 5 classifications of Philippine holidays including islamic movable and long weekend metadata', function () {
    $holidayService = app(PhilippineHolidayService::class);
    $holidays = $holidayService->generateOfficialPhilippineHolidays(2026);

    $categories = array_unique(array_column($holidays, 'category'));

    expect($categories)->toContain('regular')
        ->and($categories)->toContain('special_non_working')
        ->and($categories)->toContain('special_working')
        ->and($categories)->toContain('islamic')
        ->and($categories)->toContain('commercial');

    // Verify Regular Holidays
    $regularNames = array_column(array_filter($holidays, fn ($h) => $h['category'] === 'regular'), 'name');
    expect($regularNames)->toContain("New Year's Day")
        ->and($regularNames)->toContain('Araw ng Kagitingan (Day of Valor)')
        ->and($regularNames)->toContain('Labor Day (Araw ng Paggawa)')
        ->and($regularNames)->toContain('Independence Day (Araw ng Kasarinlan)')
        ->and($regularNames)->toContain('Christmas Day (Araw ng Pasko)');

    // Verify Islamic movable holidays
    $islamicNames = array_column(array_filter($holidays, fn ($h) => $h['category'] === 'islamic'), 'name');
    expect($islamicNames)->toContain("Eid'l Fitr (Feast of Ramadhan)")
        ->and($islamicNames)->toContain("Eid'l Adha (Feast of the Sacrifice)");

    // Verify Special Non-Working
    $snwNames = array_column(array_filter($holidays, fn ($h) => $h['category'] === 'special_non_working'), 'name');
    expect($snwNames)->toContain("All Saints' Day (Undas)")
        ->and($snwNames)->toContain("All Souls' Day (Additional Special Non-Working Day)")
        ->and($snwNames)->toContain('Chinese New Year (Spring Festival)');

    // Verify Special Working
    $swNames = array_column(array_filter($holidays, fn ($h) => $h['category'] === 'special_working'), 'name');
    expect($swNames)->toContain('EDSA People Power Revolution Anniversary');

    // Verify Long Weekend Metadata
    $longWeekends = array_filter($holidays, fn ($h) => ! empty($h['is_long_weekend']));
    expect(count($longWeekends))->toBeGreaterThan(0);

    $maundyThursday = array_values(array_filter($holidays, fn ($h) => str_contains($h['name'], 'Maundy Thursday')))[0];
    expect($maundyThursday['is_long_weekend'])->toBeTrue()
        ->and($maundyThursday['long_weekend_details'])->toContain('Long Weekend');
});

it('calendar filters missed events where user did not generate visuals', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $pastMissedEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Past Missed Promo',
        'date' => now()->subDays(10)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $pastGeneratedEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Past Handled Promo',
        'date' => now()->subDays(5)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    Design::factory()->create([
        'user_id' => $user->id,
        'event_id' => $pastGeneratedEvent->id,
    ]);

    $upcomingEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Upcoming Event',
        'date' => now()->addDays(5)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $response = $this->actingAs($user)
        ->get('/calendar?filter=missed')
        ->assertOk();

    $pageEvents = collect($response->original->getData()['page']['props']['events']);
    expect($pageEvents->pluck('id'))->toContain($pastMissedEvent->id)
        ->and($pageEvents->pluck('id'))->not->toContain($pastGeneratedEvent->id)
        ->and($pageEvents->pluck('id'))->not->toContain($upcomingEvent->id);

    $missedEventData = $pageEvents->firstWhere('id', $pastMissedEvent->id);
    expect($missedEventData['is_missed'])->toBeTrue()
        ->and($missedEventData['has_design'])->toBeFalse();
});

it('user can create a multi-day custom event with date range', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Mid-Year Flash Sale',
            'description' => 'Multi-day discount campaign.',
            'start_date' => now()->addDays(10)->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'user_id' => $user->id,
        'name' => 'Mid-Year Flash Sale',
        'type' => 'commercial',
    ]);

    $savedEvent = Event::query()->where('user_id', $user->id)->where('name', 'Mid-Year Flash Sale')->firstOrFail();
    expect($savedEvent->date->toDateString())->toBe(now()->addDays(10)->toDateString())
        ->and($savedEvent->end_date->toDateString())->toBe(now()->addDays(14)->toDateString());
});

it('calendar payload includes start_date and end_date for rendering range indicators', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Weeklong Promo',
        'date' => now()->addDays(3)->toDateString(),
        'end_date' => now()->addDays(8)->toDateString(),
        'type' => 'custom',
        'is_global' => false,
    ]);

    $response = $this->actingAs($user)
        ->get('/calendar')
        ->assertOk();

    $events = collect($response->original->getData()['page']['props']['events']);
    $matched = $events->firstWhere('id', $event->id);

    expect($matched)->not->toBeNull()
        ->and($matched['start_date'])->toBe($event->date->toDateString())
        ->and($matched['end_date'])->toBe($event->end_date->toDateString());
});

it('guest cannot access event management', function () {
    $this->get('/events')
        ->assertRedirect('/login');
});

it('authenticated user can access event management', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->get('/events')
        ->assertOk();
});

it('protected global holiday cannot be deleted', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $holiday = Event::factory()->global()->create([
        'name' => 'Independence Day',
        'date' => '2026-06-12',
        'type' => 'holiday',
    ]);

    $this->actingAs($user)
        ->delete('/events/'.$holiday->id)
        ->assertForbidden();

    $this->assertDatabaseHas('events', ['id' => $holiday->id]);
});

it('cannot delete an event linked to active campaigns', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Event With Campaign',
        'date' => now()->addDays(20)->toDateString(),
        'type' => 'custom',
    ]);

    Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Linked Campaign',
    ]);

    $response = $this->actingAs($user)
        ->delete('/events/'.$event->id);

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('events', ['id' => $event->id]);
});

it('creating a custom event does not automatically create a campaign', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $initialCampaignCount = Campaign::count();

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Sole Event Creation',
            'description' => 'Just an event, no campaign.',
            'start_date' => now()->addDays(5)->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
            'type' => 'custom',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'user_id' => $user->id,
        'name' => 'Sole Event Creation',
    ]);

    expect(Campaign::count())->toBe($initialCampaignCount);
});

it('selecting an existing global Philippine holiday reuses the canonical event and does not duplicate', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $globalHoliday = Event::factory()->global()->create([
        'name' => 'Christmas Day',
        'date' => '2026-12-25',
        'type' => 'holiday',
        'category' => 'regular',
        'country' => 'PH',
    ]);

    $initialEventCount = Event::count();

    $response = $this->actingAs($user)
        ->post('/events', [
            'name' => 'Christmas Day',
            'start_date' => '2026-12-25',
            'type' => 'holiday',
        ]);

    $response->assertRedirect(route('events.index'))
        ->assertSessionHas('info');

    // Only 1 canonical Christmas Day event exists on Dec 25, 2026
    expect(Event::where('name', 'like', '%Christmas%')->whereDate('date', '2026-12-25')->count())->toBe(1);

    // Global holiday remains canonical and uncorrupted
    $reloaded = $globalHoliday->fresh();
    expect($reloaded->is_global)->toBeTrue()
        ->and($reloaded->user_id)->toBeNull();

    // No user-owned duplicate was created
    expect(Event::where('user_id', $user->id)->where('name', 'like', '%Christmas%')->exists())->toBeFalse();
});

it('selecting the same holiday via json returns the canonical existing event without duplication', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $globalHoliday = Event::factory()->global()->create([
        'name' => 'Independence Day',
        'date' => '2026-06-12',
        'type' => 'holiday',
        'category' => 'regular',
        'country' => 'PH',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/events', [
            'name' => 'Independence Day',
            'start_date' => '2026-06-12',
            'type' => 'holiday',
        ]);

    $response->assertOk()
        ->assertJson([
            'already_exists' => true,
            'event' => [
                'id' => $globalHoliday->id,
                'is_global' => true,
            ],
        ]);

    // Only 1 canonical Independence Day event exists for 2026
    expect(Event::where('name', 'like', '%Independence%')->whereYear('date', 2026)->count())->toBe(1)
        ->and(Event::where('user_id', $user->id)->count())->toBe(0);
});

it('user can create a marketing event and exact normalized duplicate on same date is prevented', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => '11.11 Flash Sale',
            'start_date' => '2026-11-11',
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    expect(Event::where('user_id', $user->id)->where('name', '11.11 Flash Sale')->count())->toBe(1);

    // Attempt to post exact duplicate with surrounding whitespace and case variation
    $response = $this->actingAs($user)
        ->postJson('/events', [
            'name' => '  11.11 flash sale  ',
            'start_date' => '2026-11-11',
            'type' => 'commercial',
        ]);

    $response->assertOk()
        ->assertJson([
            'already_exists' => true,
        ]);

    // Ensure count remains exactly 1
    expect(Event::where('user_id', $user->id)->whereDate('date', '2026-11-11')->count())->toBe(1);
});

it('user can create a custom event and exact normalized duplicate on same date is prevented', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Store Anniversary',
            'start_date' => '2026-08-15',
            'type' => 'custom',
        ])
        ->assertRedirect(route('events.index'));

    expect(Event::where('user_id', $user->id)->where('name', 'Store Anniversary')->count())->toBe(1);

    // Attempt duplicate
    $response = $this->actingAs($user)
        ->postJson('/events', [
            'name' => 'store anniversary',
            'start_date' => '2026-08-15',
            'type' => 'custom',
        ]);

    $response->assertOk()
        ->assertJson([
            'already_exists' => true,
        ]);

    expect(Event::where('user_id', $user->id)->whereDate('date', '2026-08-15')->count())->toBe(1);
});

it('allows same event name on different dates', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Summer Sale',
            'start_date' => '2026-04-01',
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Summer Sale',
            'start_date' => '2026-06-01',
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    $userEvents = Event::where('user_id', $user->id)->where('name', 'Summer Sale')->get();
    expect($userEvents->count())->toBe(2)
        ->and($userEvents->pluck('date')->map(fn ($d) => $d->format('Y-m-d'))->all())
        ->toEqualCanonicalizing(['2026-04-01', '2026-06-01']);
});

it('events remain tenant-isolated between different users', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $userB = User::factory()->create(['onboarding_completed' => true]);

    // User A creates an event
    $eventA = Event::factory()->create([
        'user_id' => $userA->id,
        'name' => 'VIP Appreciation Day',
        'date' => '2026-09-15',
        'type' => 'custom',
        'is_global' => false,
    ]);

    // User B creates their own event with same name and date
    $this->actingAs($userB)
        ->post('/events', [
            'name' => 'VIP Appreciation Day',
            'start_date' => '2026-09-15',
            'type' => 'custom',
        ])
        ->assertRedirect(route('events.index'));

    expect(Event::where('user_id', $userB->id)->where('name', 'VIP Appreciation Day')->exists())->toBeTrue();

    // User B cannot edit User A's event
    $this->actingAs($userB)
        ->putJson("/events/{$eventA->id}", [
            'name' => 'Hacked Event',
        ])
        ->assertForbidden();

    // User B cannot delete User A's event
    $this->actingAs($userB)
        ->deleteJson("/events/{$eventA->id}")
        ->assertForbidden();
});

it('campaign creation references existing event and does not create another event', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Mega Mid-Year Launch',
        'date' => '2026-07-01',
        'type' => 'commercial',
    ]);

    $initialEventCount = Event::count();

    $this->actingAs($user)
        ->post('/campaigns', [
            'business_id' => $business->id,
            'event_id' => $event->id,
            'name' => 'Summer Clearance Wave',
            'start_date' => '2026-07-01',
            'end_date' => '2026-07-05',
        ])
        ->assertRedirect();

    $campaign = Campaign::where('user_id', $user->id)->where('name', 'Summer Clearance Wave')->firstOrFail();
    expect($campaign->event_id)->toBe($event->id);

    // Event count must not change
    expect(Event::count())->toBe($initialEventCount);
});

it('event bank and marketing calendar reference the same canonical event records', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Anniversary Blowout',
        'date' => '2026-10-20',
        'type' => 'custom',
    ]);

    // View Event Bank
    $bankResponse = $this->actingAs($user)->get('/events')->assertOk();
    $bankEvents = collect($bankResponse->original->getData()['page']['props']['events']);
    expect($bankEvents->pluck('id'))->toContain($event->id);

    // View Calendar
    $calendarResponse = $this->actingAs($user)->get('/calendar')->assertOk();
    $calendarEvents = collect($calendarResponse->original->getData()['page']['props']['events']);
    expect($calendarEvents->pluck('id'))->toContain($event->id);
});

it('existing event_id reaches generator unchanged and selectedEvent resolves correctly', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Autumn Coffee Launch',
        'date' => '2026-09-30',
        'type' => 'seasonal',
    ]);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Caramel Cold Brew',
    ]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'name' => 'Fall Coffee Wave',
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('campaign.id', $campaign->id)
            ->where('campaign.event_id', $event->id)
            ->where('selectedEvent.id', $event->id)
            ->where('selectedEvent.name', 'Autumn Coffee Launch')
        );
});

it('campaigns index can filter by event_id', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $event1 = Event::factory()->create(['user_id' => $user->id, 'name' => 'Event 1', 'date' => '2026-05-01']);
    $event2 = Event::factory()->create(['user_id' => $user->id, 'name' => 'Event 2', 'date' => '2026-06-01']);

    $campaign1 = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event1->id,
        'name' => 'Campaign For Event 1',
    ]);

    $campaign2 = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event2->id,
        'name' => 'Campaign For Event 2',
    ]);

    $response = $this->actingAs($user)
        ->get("/campaigns?event_id={$event1->id}")
        ->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->has('campaigns', 1)
        ->where('campaigns.0.id', $campaign1->id)
    );
});

it('Philippine holiday synchronization remains idempotent', function () {
    $holidayService = app(PhilippineHolidayService::class);

    $sync1 = $holidayService->syncHolidays(2026);
    $count1 = Event::where('country', 'PH')->whereYear('date', 2026)->count();

    $sync2 = $holidayService->syncHolidays(2026);
    $count2 = Event::where('country', 'PH')->whereYear('date', 2026)->count();

    expect($count2)->toBe($count1)
        ->and($sync2['synced'])->toBe(0)
        ->and($sync2['skipped'])->toBeGreaterThan(0);
});

it('event bank defaults to current year dynamically and provides current_year prop', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $response = $this->actingAs($user)
        ->get('/events')
        ->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('events/index')
        ->where('current_year', now()->year)
        ->where('selected_year', (string) now()->year)
        ->has('events')
    );
});

it('event bank supports selecting a specific year via query parameter', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $targetYear = (string) (now()->year + 1);

    $response = $this->actingAs($user)
        ->get("/events?year={$targetYear}")
        ->assertOk();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('events/index')
        ->where('current_year', now()->year)
        ->where('selected_year', $targetYear)
    );
});

it('event bank retains multi-year access including historical and future events', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $pastYear = now()->year - 1;
    $futureYear = now()->year + 1;

    $pastEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Historical Black Friday',
        'date' => "{$pastYear}-11-27",
        'type' => 'commercial',
    ]);

    $futureEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Future New Year Bash',
        'date' => "{$futureYear}-01-01",
        'type' => 'custom',
    ]);

    $response = $this->actingAs($user)
        ->get('/events')
        ->assertOk();

    $events = collect($response->original->getData()['page']['props']['events']);
    expect($events->pluck('id'))->toContain($pastEvent->id)
        ->and($events->pluck('id'))->toContain($futureEvent->id);
});

it('user can create a marketing event and custom event with valid dates', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    // Create Marketing Event
    $this->actingAs($user)
        ->post('/events', [
            'name' => '11.11 Flash Sale Promo',
            'start_date' => now()->addMonths(2)->format('Y-m-d'),
            'end_date' => now()->addMonths(2)->format('Y-m-d'),
            'description' => 'Annual 11.11 marketing discount campaign.',
            'type' => 'commercial',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'user_id' => $user->id,
        'name' => '11.11 Flash Sale Promo',
        'type' => 'commercial',
        'is_global' => false,
    ]);

    // Create Custom Event
    $this->actingAs($user)
        ->post('/events', [
            'name' => 'Main Branch 10th Anniversary',
            'start_date' => now()->addMonths(3)->format('Y-m-d'),
            'end_date' => now()->addMonths(3)->format('Y-m-d'),
            'description' => 'Celebrating 10 years of business excellence.',
            'type' => 'custom',
        ])
        ->assertRedirect(route('events.index'));

    $this->assertDatabaseHas('events', [
        'user_id' => $user->id,
        'name' => 'Main Branch 10th Anniversary',
        'type' => 'custom',
        'is_global' => false,
    ]);
});

it('existing Philippine holiday can be viewed and linked to campaign without duplication', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $holiday = Event::factory()->create([
        'user_id' => null,
        'is_global' => true,
        'name' => 'Rizal Day',
        'date' => now()->year.'-12-30',
        'type' => 'holiday',
        'category' => 'regular',
    ]);

    // View Event
    $this->actingAs($user)
        ->get("/events/{$holiday->id}")
        ->assertOk();

    // Create Campaign referencing existing holiday
    $initialEventCount = Event::count();

    $this->actingAs($user)
        ->post('/campaigns', [
            'business_id' => $business->id,
            'name' => 'Rizal Day Commemoration Campaign',
            'event_id' => $holiday->id,
            'status' => 'draft',
        ])
        ->assertRedirect();

    expect(Event::count())->toBe($initialEventCount);

    $createdCampaign = Campaign::where('user_id', $user->id)->where('name', 'Rizal Day Commemoration Campaign')->firstOrFail();
    expect($createdCampaign->event_id)->toBe($holiday->id);
});
