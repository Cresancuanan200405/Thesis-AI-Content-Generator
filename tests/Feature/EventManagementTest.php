<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\User;
use App\Services\PhilippineHolidayService;

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
