<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

it('authenticated user can view their own designs', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
    ]);

    Design::factory()->count(3)->create([
        'user_id' => $user->id,
        'status' => 'completed',
        'generated_image_path' => 'designs/test/one.png',
    ]);

    $this->actingAs($user)
        ->get('/designs')
        ->assertOk();
});

it('unauthenticated user cannot access designs', function () {
    $this->get('/designs')
        ->assertRedirect('/login');
});

it('user cannot view another users design', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $design = Design::factory()->create([
        'user_id' => $owner->id,
        'status' => 'completed',
    ]);

    $this->actingAs($viewer)
        ->get('/designs/'.$design->id)
        ->assertForbidden();
});

it('user can delete their own design', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'generated_image_path' => 'designs/test/delete.png',
        'status' => 'completed',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/delete.png', 'image-content');

    $this->actingAs($user)
        ->delete('/designs/'.$design->id)
        ->assertRedirect('/designs');

    $this->assertSoftDeleted('designs', ['id' => $design->id]);
});

it('user cannot delete another users design', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $design = Design::factory()->create([
        'user_id' => $owner->id,
        'status' => 'completed',
    ]);

    $this->actingAs($viewer)
        ->delete('/designs/'.$design->id)
        ->assertForbidden();
});

it('user can download their own design', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'generated_image_path' => 'designs/test/download.png',
        'status' => 'completed',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/download.png', 'image-content');

    $this->actingAs($user)
        ->get('/designs/'.$design->id.'/download')
        ->assertOk();
});

it('user cannot download another users design', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);

    $design = Design::factory()->create([
        'user_id' => $owner->id,
        'generated_image_path' => 'designs/test/private.png',
        'status' => 'completed',
    ]);

    $this->actingAs($viewer)
        ->get('/designs/'.$design->id.'/download')
        ->assertForbidden();
});

it('missing image file is handled gracefully', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'generated_image_path' => 'designs/missing/file.png',
        'status' => 'completed',
    ]);

    $this->actingAs($user)
        ->get('/designs/'.$design->id.'/download')
        ->assertNotFound();
});

it('my designs pagination works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Design::factory()->count(25)->create(['user_id' => $user->id, 'status' => 'completed']);

    $this->actingAs($user)
        ->get('/designs?page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('pagination.current_page', 2));
});

it('event filtering works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $event = $user->events()->create(['name' => 'Spring Launch', 'date' => now()->addDays(5), 'type' => 'seasonal']);

    Design::factory()->create(['user_id' => $user->id, 'event_id' => $event->id, 'status' => 'completed']);

    $this->actingAs($user)
        ->get('/designs?event_id='.$event->id)
        ->assertOk();
});

it('search works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    Design::factory()->create(['user_id' => $user->id, 'product_name' => 'Signature Latte', 'status' => 'completed']);

    $this->actingAs($user)
        ->get('/designs?search=Signature')
        ->assertOk();
});

it('product filtering works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $productA = Product::factory()->create(['business_id' => $business->id, 'name' => 'Salmon Serum']);
    $productB = Product::factory()->create(['business_id' => $business->id, 'name' => 'Saffron Oil']);

    Design::factory()->create(['user_id' => $user->id, 'business_id' => $business->id, 'product_id' => $productA->id, 'product_name' => $productA->name, 'status' => 'completed']);
    Design::factory()->create(['user_id' => $user->id, 'business_id' => $business->id, 'product_id' => $productB->id, 'product_name' => $productB->name, 'status' => 'completed']);

    $this->actingAs($user)
        ->get('/designs?product_id='.$productA->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('designs.data.0.product_name', $productA->name));
});

it('campaign filtering works', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'holiday']);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id, 'product_id' => $product->id, 'event_id' => $event->id]);

    Design::factory()->create(['user_id' => $user->id, 'business_id' => $business->id, 'product_id' => $product->id, 'campaign_id' => $campaign->id, 'event_id' => $event->id, 'product_name' => 'Filtered Product', 'status' => 'completed']);

    $this->actingAs($user)
        ->get('/designs?campaign_id='.$campaign->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('designs.data.0.campaign_name', $campaign->name));
});

it('user can regenerate their own design and keep the original', function () {
    config(['services.openai.api_key' => 'test-key']);

    Http::fake([
        'https://api.openai.com/v1/images/generations' => Http::response([
            'data' => [['b64_json' => base64_encode('fake-image-data')]],
        ], 200),
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'type' => 'seasonal']);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'product_name' => 'Regenerated Product',
        'brand_tone' => 'Professional',
        'visual_theme' => 'Modern',
        'tagline' => 'Launch better',
        'status' => 'completed',
        'generated_image_path' => 'designs/test/original.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/original.png', 'original-content');

    $this->actingAs($user)
        ->post('/designs/'.$design->id.'/regenerate')
        ->assertRedirect('/designs/'.Design::query()->where('user_id', $user->id)->latest('id')->value('id'));

    expect(Design::query()->where('user_id', $user->id)->count())->toBe(2)
        ->and(Design::query()->where('id', $design->id)->exists())->toBeTrue();
});

it('user cannot regenerate another users design', function () {
    $owner = User::factory()->create(['onboarding_completed' => true]);
    $viewer = User::factory()->create(['onboarding_completed' => true]);
    $design = Design::factory()->create(['user_id' => $owner->id, 'status' => 'completed']);

    $this->actingAs($viewer)
        ->post('/designs/'.$design->id.'/regenerate')
        ->assertForbidden();
});

it('failed generation does not produce a completed design record', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_name' => 'Failed Product',
            'marketing_goal' => 'Create a design',
            'content_style' => ['Product-focused'],
            'brand_tone' => ['Professional'],
        ]);

    expect(Design::query()->where('user_id', $user->id)->where('status', 'completed')->exists())->toBeFalse();
});

it('user can bulk delete multiple designs', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);

    $designs = Design::factory()->count(3)->create([
        'user_id' => $user->id,
        'status' => 'completed',
    ]);

    $otherUserDesign = Design::factory()->create([
        'status' => 'completed',
    ]);

    $idsToDelete = $designs->pluck('id')->toArray();

    $this->actingAs($user)
        ->post('/designs/bulk-delete', ['ids' => $idsToDelete])
        ->assertRedirect('/designs');

    foreach ($idsToDelete as $id) {
        $this->assertSoftDeleted('designs', ['id' => $id]);
    }

    expect(Design::query()->where('id', $otherUserDesign->id)->exists())->toBeTrue();
});
