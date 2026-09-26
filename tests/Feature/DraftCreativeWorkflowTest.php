<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

it('saves generated manual creative as draft', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Teachers Day']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Teachers Day Campaign',
    ]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Skincare Kit']);

    Storage::disk('public')->put('designs/mock_manual_draft.png', 'mock-content');

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'status' => 'draft',
            'campaign_id' => $campaign->id,
            'event_id' => $event->id,
            'product_id' => $product->id,
            'product_name' => 'Skincare Kit',
            'prompt' => 'An elegant skincare gift box set for teachers celebration',
            'tagline' => 'To the teachers who inspire us every day.',
            'price' => 79.99,
            'aspect_ratio' => '1:1',
            'brand_tone' => ['Warm', 'Appreciative'],
            'visual_theme' => ['Floral', 'Minimal'],
            'render_style' => 'Studio Product Still',
            'generated_image_path' => 'designs/mock_manual_draft.png',
            'generation_metadata' => [
                'mode' => 'manual',
                'creative_concept' => 'Inspiring gratitude gift',
                'visual_strategy' => 'Hero gift packaging with floral accents',
                'show_event_text' => true,
                'include_business_name' => true,
                'prices' => ['Skincare Kit' => '79.99'],
            ],
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Draft saved',
            'design' => [
                'status' => 'draft',
                'product_name' => 'Skincare Kit',
                'tagline' => 'To the teachers who inspire us every day',
            ],
        ]);

    $this->assertDatabaseHas('designs', [
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'status' => 'draft',
        'product_name' => 'Skincare Kit',
    ]);

    $design = Design::where('product_name', 'Skincare Kit')->first();
    expect($design->isDraft())->toBeTrue();
    expect($design->isFinal())->toBeFalse();
});

it('saves generated automatic creative as draft', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Automated Campaign',
    ]);

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'status' => 'draft',
            'campaign_id' => $campaign->id,
            'product_name' => 'Organic Honey Jar',
            'prompt' => 'Golden organic honey jar with gentle morning sun glow',
            'tagline' => 'Pure nature in every spoonful.',
            'price' => 15.00,
            'aspect_ratio' => '4:5',
            'brand_tone' => ['Natural', 'Warm'],
            'visual_theme' => ['Rustic'],
            'generation_metadata' => [
                'mode' => 'automatic',
                'creative_concept' => 'Pure natural vitality',
            ],
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Draft saved',
            'design' => [
                'status' => 'draft',
                'product_name' => 'Organic Honey Jar',
            ],
        ]);

    $this->assertDatabaseHas('designs', [
        'user_id' => $user->id,
        'status' => 'draft',
        'product_name' => 'Organic Honey Jar',
    ]);
});

it('preserves complete creative state required for editing in draft', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Summer Kickoff']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
    ]);

    $payload = [
        'status' => 'draft',
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_name' => 'Sunscreen Lotion',
        'prompt' => 'Crisp modern summer beauty product render on beach sand',
        'tagline' => 'Shield your glow all summer long.',
        'price' => 24.50,
        'aspect_ratio' => '9:16',
        'render_style' => 'Vibrant Outdoor Light',
        'brand_tone' => ['Energetic', 'Bold'],
        'visual_theme' => ['Summer', 'Coastal'],
        'generation_metadata' => [
            'mode' => 'manual',
            'creative_concept' => 'High-energy summer beauty',
            'visual_strategy' => 'Macro splash of water and sand backdrop',
            'show_event_text' => false,
            'include_business_name' => true,
            'custom_products' => [
                ['name' => 'Summer Towel'],
                ['name' => 'Beach Tote'],
            ],
            'prices' => ['Sunscreen Lotion' => '24.50'],
        ],
    ];

    $this->actingAs($user)->postJson('/designs', $payload)->assertOk();

    $design = Design::where('product_name', 'Sunscreen Lotion')->first();
    expect($design)->not->toBeNull();
    expect($design->campaign_id)->toBe($campaign->id);
    expect($design->event_id)->toBe($event->id);
    expect($design->prompt)->toBe($payload['prompt']);
    expect($design->tagline)->toBe('Shield your glow all summer long');
    expect((float) $design->price)->toBe(24.50);
    expect($design->generation_metadata['aspect_ratio'])->toBe('9:16');
    expect($design->generation_metadata['mode'])->toBe('manual');
    expect($design->generation_metadata['show_event_text'])->toBeFalse();
    expect($design->generation_metadata['custom_products'])->toBe([
        ['name' => 'Summer Towel'],
        ['name' => 'Beach Tote'],
    ]);
});

it('draft appears in campaign creatives drafts and not in final designs', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Brand Showcase Campaign',
    ]);

    // Create 1 draft and 1 final design
    $draftDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'draft',
        'product_name' => 'Draft Serum',
    ]);

    $finalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'final',
        'product_name' => 'Final Serum Ad',
    ]);

    $response = $this->actingAs($user)->get("/campaigns/{$campaign->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campaigns/show')
            ->has('campaign.designs', 2)
            ->has('campaign.drafts', 1)
            ->has('campaign.final_designs', 1)
            ->where('campaign.creative_counts.drafts', 1)
            ->where('campaign.creative_counts.final', 1)
            ->where('campaign.creative_counts.total', 2)
            ->where('campaign.drafts.0.id', $draftDesign->id)
            ->where('campaign.drafts.0.is_draft', true)
            ->where('campaign.final_designs.0.id', $finalDesign->id)
            ->where('campaign.final_designs.0.is_draft', false)
        );
});

it('draft appears in designs library drafts and respects status filter', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'draft',
        'product_name' => 'Draft Design Alpha',
    ]);

    $final = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'final',
        'product_name' => 'Final Design Beta',
    ]);

    // Test filter status=draft
    $this->actingAs($user)
        ->get('/designs?status=draft')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('designs/index')
            ->has('designs.data', 1)
            ->where('designs.data.0.id', $draft->id)
            ->where('designs.data.0.is_draft', true)
            ->where('status_counts.drafts', 1)
            ->where('status_counts.final', 1)
            ->where('status_counts.all', 2)
        );

    // Test filter status=final
    $this->actingAs($user)
        ->get('/designs?status=final')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('designs/index')
            ->has('designs.data', 1)
            ->where('designs.data.0.id', $final->id)
            ->where('designs.data.0.is_draft', false)
        );
});

it('same database record is used in campaign and designs view without duplication', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'draft',
        'product_name' => 'Single Draft',
    ]);

    expect(Design::count())->toBe(1);

    // In campaign
    $campaignDesigns = $campaign->designs()->get();
    expect($campaignDesigns)->toHaveCount(1);
    expect($campaignDesigns->first()->id)->toBe($draft->id);

    // In user designs
    $userDesigns = $user->designs()->get();
    expect($userDesigns)->toHaveCount(1);
    expect($userDesigns->first()->id)->toBe($draft->id);
});

it('saving draft again or updating draft does not create duplicate rows', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    // Initial save as draft
    $response = $this->actingAs($user)->postJson('/designs', [
        'status' => 'draft',
        'campaign_id' => $campaign->id,
        'product_name' => 'Initial Draft',
        'tagline' => 'Draft tagline 1',
        'prompt' => 'Prompt 1',
    ]);

    $response->assertOk();
    $draftId = $response->json('design.id');
    expect(Design::count())->toBe(1);

    // Second save as draft referencing the same design_id
    $updateResponse = $this->actingAs($user)->postJson('/designs', [
        'design_id' => $draftId,
        'status' => 'draft',
        'campaign_id' => $campaign->id,
        'product_name' => 'Updated Draft Name',
        'tagline' => 'Draft tagline 2',
        'prompt' => 'Prompt 2',
    ]);

    $updateResponse->assertOk();
    expect(Design::count())->toBe(1);

    $updatedDesign = Design::find($draftId);
    expect($updatedDesign->product_name)->toBe('Updated Draft Name');
    expect($updatedDesign->tagline)->toBe('Draft tagline 2');
    expect($updatedDesign->status)->toBe('draft');
});

it('finalizing draft updates status to final in-place without creating duplicate rows', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'draft',
        'product_name' => 'Draft To Finalize',
    ]);

    expect(Design::count())->toBe(1);

    $response = $this->actingAs($user)->post("/designs/{$draft->id}/finalize");
    $response->assertRedirect();

    expect(Design::count())->toBe(1);
    $draft->refresh();
    expect($draft->status)->toBe('final');
    expect($draft->isFinal())->toBeTrue();
    expect($draft->isDraft())->toBeFalse();
});

it('finalizing via store endpoint updates draft to final in-place', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'draft',
        'product_name' => 'Draft Saved Earlier',
    ]);

    expect(Design::count())->toBe(1);

    $response = $this->actingAs($user)->postJson('/designs', [
        'design_id' => $draft->id,
        'status' => 'final',
        'product_name' => 'Finalized Product Ad',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'design' => [
                'id' => $draft->id,
                'status' => 'final',
            ],
        ]);

    expect(Design::count())->toBe(1);
    $draft->refresh();
    expect($draft->status)->toBe('final');
    expect($draft->product_name)->toBe('Finalized Product Ad');
});

it('final draft moves from campaign drafts to campaign final designs', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'draft',
    ]);

    // Check before: is draft
    $this->actingAs($user)->get("/campaigns/{$campaign->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('campaign.creative_counts.drafts', 1)
            ->where('campaign.creative_counts.final', 0)
        );

    // Finalize
    $this->actingAs($user)->post("/designs/{$design->id}/finalize")->assertRedirect();

    // Check after: is final
    $this->actingAs($user)->get("/campaigns/{$campaign->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('campaign.creative_counts.drafts', 0)
            ->where('campaign.creative_counts.final', 1)
            ->where('campaign.final_designs.0.id', $design->id)
        );
});

it('downloading draft does not change draft status', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    Storage::disk('public')->put('designs/test_download.png', 'test-image-content');

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => 'draft',
        'generated_image_path' => 'designs/test_download.png',
    ]);

    $response = $this->actingAs($user)->get("/designs/{$draft->id}/download");
    $response->assertOk();

    $draft->refresh();
    expect($draft->status)->toBe('draft');
});

it('tenant isolation prevents unauthorized user from accessing or finalizing another users draft', function () {
    $user1 = User::factory()->create(['onboarding_completed' => true]);
    $business1 = Business::factory()->create(['user_id' => $user1->id]);

    $user2 = User::factory()->create(['onboarding_completed' => true]);
    $business2 = Business::factory()->create(['user_id' => $user2->id]);

    $draft = Design::factory()->create([
        'user_id' => $user1->id,
        'business_id' => $business1->id,
        'status' => 'draft',
    ]);

    // User 2 cannot finalize User 1's draft
    $this->actingAs($user2)
        ->post("/designs/{$draft->id}/finalize")
        ->assertForbidden();

    // User 2 cannot update User 1's draft via store
    $this->actingAs($user2)
        ->postJson('/designs', [
            'design_id' => $draft->id,
            'status' => 'final',
        ])
        ->assertUnprocessable();

    // User 2 cannot see User 1's draft in their designs list
    $this->actingAs($user2)
        ->get('/designs?status=draft')
        ->assertInertia(fn (Assert $page) => $page
            ->where('status_counts.drafts', 0)
            ->has('designs.data', 0)
        );
});

it('generator resolves draft context and origin for resume workflow', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Resume Campaign Test',
    ]);

    $draft = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => 'draft',
        'product_name' => 'Resume Product',
        'tagline' => 'Resume Tagline',
        'prompt' => 'Resume Prompt',
        'price' => 50.00,
        'generation_metadata' => [
            'mode' => 'automatic',
            'aspect_ratio' => '16:9',
            'creative_concept' => 'Resume concept',
        ],
    ]);

    // Resuming in automatic generator from campaign
    $this->actingAs($user)
        ->get("/generator/automatic?draft_id={$draft->id}&origin=campaign")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('generator/automatic')
            ->where('initial_draft.id', $draft->id)
            ->where('initial_draft.product_name', 'Resume Product')
            ->where('initial_draft.tagline', 'Resume Tagline')
            ->where('initial_draft.aspect_ratio', '16:9')
            ->where('origin', 'campaign')
        );

    // Resuming in manual generator from designs
    $this->actingAs($user)
        ->get("/generator/manual?draft_id={$draft->id}&origin=designs")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('generator/manual')
            ->where('initial_draft.id', $draft->id)
            ->where('origin', 'designs')
        );
});
