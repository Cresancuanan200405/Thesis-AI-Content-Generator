<?php

use App\Models\BrandKit;
use App\Models\Business;
use App\Models\User;
use App\Services\MarketingPromptBuilder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('authenticated user can view own brand kit', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    BrandKit::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->get('/brand-kit')
        ->assertOk();
});

it('unauthenticated user cannot access brand kit management', function () {
    $this->get('/brand-kit')
        ->assertRedirect('/login');
});

it('user can update their own brand kit', function () {
    Storage::fake('public');

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $brandKit = BrandKit::factory()->create([
        'business_id' => $business->id,
        'primary_color' => '#111827',
        'secondary_color' => '#F59E0B',
        'accent_color' => '#E5E7EB',
        'brand_tone' => '[]',
        'typography' => 'Modern Sans',
    ]);

    $logo = UploadedFile::fake()->create('brand-logo.png', 100, 'image/png');

    $this->actingAs($user)
        ->from('/brand-kit')
        ->put('/brand-kit', [
            'primary_color' => '#1F2937',
            'secondary_color' => '#F97316',
            'accent_color' => '#F3F4F6',
            'brand_tone' => ['Professional', 'Warm'],
            'typography' => 'Minimal Sans',
            'brand_guidelines' => 'Keep it premium and clean.',
            'visual_preferences' => 'Warm editorial photography.',
            'logo' => $logo,
        ])
        ->assertRedirect('/brand-kit');

    $brandKit->refresh();

    expect($brandKit->primary_color)->toBe('#1F2937')
        ->and($brandKit->secondary_color)->toBe('#F97316')
        ->and($brandKit->accent_color)->toBe('#F3F4F6')
        ->and($brandKit->typography)->toBe('Minimal Sans')
        ->and($brandKit->brand_guidelines)->toBe('Keep it premium and clean.')
        ->and($brandKit->visual_preferences)->toBe('Warm editorial photography.')
        ->and($brandKit->logo_path)->not->toBeNull();
});

it('user cannot update another users brand kit', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $otherBusiness = Business::factory()->create(['user_id' => $other->id]);
    $brandKit = BrandKit::factory()->create(['business_id' => $otherBusiness->id]);

    expect($owner->can('update', $brandKit))->toBeFalse()
        ->and($owner->can('view', $brandKit))->toBeFalse();
});

it('user cannot view another users brand kit', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $otherBusiness = Business::factory()->create(['user_id' => $other->id]);
    $brandKit = BrandKit::factory()->create(['business_id' => $otherBusiness->id]);

    expect($owner->can('view', $brandKit))->toBeFalse();
});

it('brand kit primary color is validated', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'primary_color' => 'not-a-color',
        ])
        ->assertSessionHasErrors('primary_color');
});

it('brand kit secondary color is validated', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'secondary_color' => 'blue',
        ])
        ->assertSessionHasErrors('secondary_color');
});

it('brand kit accent color is validated', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'accent_color' => '#12',
        ])
        ->assertSessionHasErrors('accent_color');
});

it('invalid logo files are rejected', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'logo' => UploadedFile::fake()->create('bad.txt', 500, 'text/plain'),
        ])
        ->assertSessionHasErrors('logo');
});

it('valid logo upload works', function () {
    Storage::fake('public');
    $user = User::factory()->create(['onboarding_completed' => true]);
    Business::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'logo' => UploadedFile::fake()->create('logo.png', 100, 'image/png'),
            'brand_tone' => ['Professional'],
        ])
        ->assertRedirect('/brand-kit');

    $this->assertDatabaseHas('brand_kits', ['brand_tone' => '["Professional"]']);
});

it('existing logo can be replaced', function () {
    Storage::fake('public');
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $brandKit = BrandKit::factory()->create(['business_id' => $business->id, 'logo_path' => 'brand-logos/old.png']);
    Storage::disk('public')->put('brand-logos/old.png', 'old');

    $this->actingAs($user)
        ->put('/brand-kit', [
            'logo' => UploadedFile::fake()->create('new-logo.png', 100, 'image/png'),
        ])
        ->assertRedirect('/brand-kit');

    $brandKit->refresh();
    expect($brandKit->logo_path)->not->toBe('brand-logos/old.png')
        ->and(Storage::disk('public')->exists($brandKit->logo_path))->toBeTrue();
});

it('existing logo can be removed', function () {
    Storage::fake('public');
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $brandKit = BrandKit::factory()->create(['business_id' => $business->id, 'logo_path' => 'brand-logos/existing.png']);
    Storage::disk('public')->put('brand-logos/existing.png', 'existing');

    $this->actingAs($user)
        ->put('/brand-kit', [
            'remove_logo' => true,
        ])
        ->assertRedirect('/brand-kit');

    $brandKit->refresh();
    expect($brandKit->logo_path)->toBeNull();
});

it('brand tone persists', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    BrandKit::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'brand_tone' => ['Professional', 'Premium'],
        ])
        ->assertRedirect('/brand-kit');

    $this->assertDatabaseHas('brand_kits', ['brand_tone' => '["Professional","Premium"]']);
});

it('typography persists', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    BrandKit::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'typography' => 'Editorial Sans',
        ])
        ->assertRedirect('/brand-kit');

    $this->assertDatabaseHas('brand_kits', ['typography' => 'Editorial Sans']);
});

it('brand guidelines persist', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    BrandKit::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'brand_guidelines' => 'Be confident and minimal.',
        ])
        ->assertRedirect('/brand-kit');

    $this->assertDatabaseHas('brand_kits', ['brand_guidelines' => 'Be confident and minimal.']);
});

it('visual preferences persist', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    BrandKit::factory()->create(['business_id' => $business->id]);

    $this->actingAs($user)
        ->put('/brand-kit', [
            'visual_preferences' => 'Warm studio lighting and clean layouts.',
        ])
        ->assertRedirect('/brand-kit');

    $this->assertDatabaseHas('brand_kits', ['visual_preferences' => 'Warm studio lighting and clean layouts.']);
});

it('generator prompt contains brand colors and brand attributes', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Northstar',
        'industry' => 'Retail',
        'category' => 'Home Goods',
    ]);
    $business->brandKit()->create([
        'primary_color' => '#111827',
        'secondary_color' => '#F59E0B',
        'accent_color' => '#E5E7EB',
        'brand_tone' => '["Professional","Warm"]',
        'typography' => 'Modern Sans',
        'brand_guidelines' => 'Clean and premium.',
        'visual_preferences' => 'Warm studio lighting.',
    ]);

    $payload = [
        'product_name' => 'Signature Candle',
        'marketing_goal' => 'Increase awareness',
        'content_style' => ['Lifestyle'],
        'brand_tone' => ['Professional', 'Warm'],
    ];

    $prompt = app(MarketingPromptBuilder::class)->build($payload, $business);

    expect($prompt)->toContain('Brand colors:')
        ->and($prompt)->toContain('#111827')
        ->and($prompt)->toContain('#F59E0B')
        ->and($prompt)->toContain('#E5E7EB')
        ->and($prompt)->toContain('Professional')
        ->and($prompt)->toContain('Clean and premium.')
        ->and($prompt)->toContain('Warm studio lighting.');
});
