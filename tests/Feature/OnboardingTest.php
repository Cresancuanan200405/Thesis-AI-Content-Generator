<?php

use App\Models\BrandKit;
use App\Models\Business;
use App\Models\User;
use Illuminate\Http\UploadedFile;

it('guest cannot access onboarding', function () {
    $response = $this->get('/onboarding');

    $response->assertRedirect('/login');
});

it('authenticated incomplete user can access onboarding', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk();
});

it('authenticated completed user is redirected away from onboarding', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertRedirect('/dashboard');
});

it('incomplete user cannot access dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/onboarding');
});

it('business information is saved correctly', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'North Star Coffee',
            'industry' => 'Food & Beverage',
            'category' => 'Coffee Shop',
            'description' => 'A premium neighborhood coffee roaster serving specialty drinks.',
        ])
        ->assertRedirect('/onboarding?step=brand');

    $business = $user->fresh()->business;

    expect($business)->not->toBeNull()
        ->and($business->name)->toBe('North Star Coffee')
        ->and($business->industry)->toBe('Food & Beverage')
        ->and($business->category)->toBe('Coffee Shop')
        ->and($business->description)->toBe('A premium neighborhood coffee roaster serving specialty drinks.');
});

it('brand information is saved correctly', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/onboarding/brand', [
            'brand_tone' => ['Professional', 'Warm'],
            'typography' => 'Modern Sans',
            'brand_guidelines' => 'Keep the design sharp and modern.',
            'visual_preferences' => 'Warm lighting and clean studio shots.',
        ])
        ->assertRedirect('/onboarding?step=preferences');

    $brandKit = $user->fresh()->business->brandKit;

    expect($brandKit)->not->toBeNull()
        ->and($brandKit->brand_tone)->toBe('["Professional","Warm"]')
        ->and($brandKit->typography)->toBe('Modern Sans')
        ->and($brandKit->brand_guidelines)->toBe('Keep the design sharp and modern.')
        ->and($brandKit->visual_preferences)->toBe('Warm lighting and clean studio shots.');
});

it('marketing preferences are saved correctly', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/onboarding/preferences', [
            'target_audience' => 'Young professionals aged 25-40',
            'unique_selling_point' => 'Small-batch roasting with local ingredients',
            'content_style' => ['Product-focused', 'Lifestyle'],
            'default_tagline_behavior' => 'Always generate automatically',
        ])
        ->assertRedirect('/onboarding?step=complete');

    $business = $user->fresh()->business;

    expect($business)->not->toBeNull()
        ->and($business->target_audience)->toBe('Young professionals aged 25-40')
        ->and($business->unique_selling_point)->toBe('Small-batch roasting with local ingredients')
        ->and($business->content_style)->toBe('["Product-focused","Lifestyle"]')
        ->and($business->default_tagline_behavior)->toBe('Always generate automatically');
});

it('user cannot modify another users business record', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    Business::factory()->create([
        'user_id' => $other->id,
        'name' => 'Other Business',
    ]);

    $this->actingAs($owner)
        ->post('/onboarding/business', [
            'name' => 'My Business',
            'industry' => 'Retail',
            'category' => 'Coffee Shop',
            'description' => 'Updated from owner account',
        ])
        ->assertRedirect('/onboarding?step=brand');

    expect($other->fresh()->business->name)->toBe('Other Business');
});

it('user cannot modify another users brand kit record', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();

    $business = Business::factory()->create(['user_id' => $other->id]);
    BrandKit::factory()->create([
        'business_id' => $business->id,
        'brand_tone' => 'Luxury',
    ]);

    $this->actingAs($owner)
        ->post('/onboarding/brand', [
            'brand_tone' => ['Minimal'],
            'typography' => 'Classic Serif',
        ])
        ->assertRedirect('/onboarding?step=preferences');

    expect($other->fresh()->business->brandKit->brand_tone)->toBe('Luxury');
});

it('completing onboarding sets onboarding flags', function () {
    $user = User::factory()->create([
        'onboarding_completed' => false,
    ]);

    $this->actingAs($user)
        ->post('/onboarding/complete', [])
        ->assertRedirect('/dashboard');

    $user->refresh();

    expect($user->onboarding_completed)->toBeTrue()
        ->and($user->onboarding_completed_at)->not->toBeNull();
});

it('completed user can access dashboard', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk();
});

it('registration redirects to email verification before onboarding', function () {
    $response = $this->post('/register', [
        'name' => 'New Onboarder',
        'email' => 'new-onboarder@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ]);

    $response->assertRedirect('/email/verify');
    $this->assertDatabaseHas('users', ['email' => 'new-onboarder@example.com']);
});

it('logo upload validation works', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post('/onboarding/brand', [
            'logo' => UploadedFile::fake()->create('bad.txt', 500, 'text/plain'),
            'brand_tone' => ['Professional'],
        ]);

    $response->assertSessionHasErrors('logo');
});

it('onboarding business step preserves existing values when revisiting', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Existing Business',
        'industry' => 'Technology',
        'category' => 'Software Company',
        'description' => 'Existing description',
    ]);

    $this->actingAs($user)
        ->post('/onboarding/business', [
            'name' => 'Updated Business',
            'industry' => 'Technology',
            'category' => 'SaaS Company',
            'description' => 'Updated description',
        ])
        ->assertRedirect('/onboarding?step=brand');

    $business = $user->fresh()->business;

    expect($business->name)->toBe('Updated Business')
        ->and($business->category)->toBe('SaaS Company');
});

it('onboarding shows existing saved values in the response', function () {
    $user = User::factory()->create();
    $user->business()->create([
        'name' => 'Saved Business',
        'industry' => 'Retail',
        'category' => 'Clothing Store',
        'description' => 'Saved description',
    ]);

    $this->actingAs($user)
        ->get('/onboarding')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('business.name', 'Saved Business')
            ->where('business.industry', 'Retail')
        );
});
