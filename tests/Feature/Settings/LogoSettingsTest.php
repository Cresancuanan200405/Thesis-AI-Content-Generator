<?php

use App\Models\Business;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
});

it('user can view brand logo settings page', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/settings/logo');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/logo')
        ->has('business')
        ->where('business.id', $business->id)
    );
});

it('user can upload a new brand logo', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id, 'logo_path' => null]);

    $file = UploadedFile::fake()->create('logo.png', 100, 'image/png');

    $response = $this->actingAs($user)->post('/settings/logo', [
        'logo' => $file,
    ]);

    $response->assertRedirect('/settings/logo');

    $business->refresh();
    expect($business->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($business->logo_path);
});

it('user can delete their brand logo', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $logoPath = UploadedFile::fake()->create('old_logo.png', 100, 'image/png')->store('logos', 'public');
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'logo_path' => $logoPath,
    ]);

    Storage::disk('public')->assertExists($logoPath);

    $response = $this->actingAs($user)->delete('/settings/logo');

    $response->assertRedirect('/settings/logo');

    $business->refresh();
    expect($business->logo_path)->toBeNull();
    Storage::disk('public')->assertMissing($logoPath);
});
