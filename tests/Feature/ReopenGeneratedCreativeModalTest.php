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

// 1. Successful generation opens GeneratedCreativeModal (verified via generator resolution & initial_draft prop)
it('loads generator with existing draft creative state ready for modal viewing', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Spring Gala Campaign',
    ]);

    Storage::disk('public')->put('designs/spring_gala.png', 'test-content');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Silk Dress',
        'prompt' => 'Elegant silk evening dress in springtime setting',
        'tagline' => 'Elegance for every season.',
        'generated_image_path' => 'designs/spring_gala.png',
        'generation_metadata' => [
            'mode' => 'manual',
            'creative_concept' => 'Haute couture spring elegance',
            'visual_strategy' => 'Centered hero apparel shot',
            'model' => 'gpt-image-2',
            'aspect_ratio' => '1:1',
        ],
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('generator/manual')
            ->has('initial_draft', fn (Assert $draft) => $draft
                ->where('id', $design->id)
                ->where('product_name', 'Silk Dress')
                ->where('status', 'draft')
                ->where('tagline', 'Elegance for every season.')
                ->where('generation_metadata.creative_concept', 'Haute couture spring elegance')
                ->where('generation_metadata.visual_strategy', 'Centered hero apparel shot')
                ->etc()
            )
        );
});

// 2. Closing the modal does not discard the generated creative (state persists on backend and on page)
it('preserves generated creative when navigating or reopening', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Leather Wallet',
        'generated_image_path' => 'designs/wallet.png',
    ]);

    $initialCount = Design::count();

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertOk();
    expect(Design::count())->toBe($initialCount);
    expect(Design::find($design->id)->product_name)->toBe('Leather Wallet');
});

// 3. View Generated Creative reopens the SAME modal without triggering regeneration
it('reopens the same modal for the same design without triggering generation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Ceramic Mug',
        'generated_image_path' => 'designs/mug.png',
    ]);

    // First request: simulate initial view
    $this->actingAs($user)->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}")->assertOk();

    // Second request: simulate clicking "View Generated Creative" (with open_modal=1)
    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('initial_draft.id', $design->id)
            ->where('initial_draft.product_name', 'Ceramic Mug')
        );

    // Design count must remain exactly 1
    expect(Design::count())->toBe(1);
});

// 4. Reopen does not call image generation again
it('reopen does not call image generation again', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Running Shoes',
        'generated_image_path' => 'designs/shoes.png',
    ]);

    // Reopen does not regenerate - image path remains identical
    $this->actingAs($user)->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1")->assertOk();
    expect(Design::find($design->id)->generated_image_path)->toBe('designs/shoes.png');
});

// 5. Reopen does not create a duplicate Design row
it('does not create duplicate Design rows on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Running Shoes',
        'generated_image_path' => 'designs/shoes.png',
    ]);

    expect(Design::count())->toBe(1);

    // Reopen 3 times
    for ($i = 0; $i < 3; $i++) {
        $this->actingAs($user)->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1")->assertOk();
    }

    expect(Design::count())->toBe(1);
});

// 6. Reopen uses the same Design ID when available
it('uses the same authoritative Design ID on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'product_name' => 'Smart Watch',
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.id', $design->id)
    );
});

// 7. Reopened modal shows the same image URL
it('serves the same image URL for the creative on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('designs/headphones.png', 'audio-bytes');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'generated_image_path' => 'designs/headphones.png',
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.generated_image_path', 'designs/headphones.png')
        ->where('initial_draft.image_url', Storage::url('designs/headphones.png'))
    );
});

// 8. Reopened modal shows the same Context (Event, Campaign, Product)
it('preserves campaign, event, and product context on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Summer Sale 2026']);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Sunglasses UV400']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'name' => 'Summer Heat Campaign',
    ]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_id' => $product->id,
        'product_name' => 'Sunglasses UV400',
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('campaign.id', $campaign->id)
        ->where('campaign.name', 'Summer Heat Campaign')
        ->where('selectedEvent.id', $event->id)
        ->where('selectedEvent.name', 'Summer Sale 2026')
        ->where('initial_draft.product_id', $product->id)
        ->where('initial_draft.product_name', 'Sunglasses UV400')
    );
});

// 9. Reopened modal shows the same Creative Direction
it('preserves creative direction metadata on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'brand_tone' => 'Energetic, Bold',
        'visual_theme' => 'Cyberpunk, Neon',
        'generation_metadata' => [
            'creative_concept' => 'Futuristic urban lifestyle',
            'visual_strategy' => 'High contrast neon highlights',
            'render_style' => 'Cinematic 3D',
        ],
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.brand_tone', 'Energetic, Bold')
        ->where('initial_draft.visual_theme', 'Cyberpunk, Neon')
        ->where('initial_draft.generation_metadata.creative_concept', 'Futuristic urban lifestyle')
        ->where('initial_draft.generation_metadata.visual_strategy', 'High contrast neon highlights')
        ->where('initial_draft.generation_metadata.render_style', 'Cinematic 3D')
    );
});

// 10. Reopened modal shows the same Marketing Copy
it('preserves marketing copy and tagline on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'tagline' => 'Power up your summer adventure.',
        'tagline_mode' => 'custom',
        'prompt' => 'Action camera strapped on helmet descending rapid river',
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.tagline', 'Power up your summer adventure.')
        ->where('initial_draft.tagline_mode', 'custom')
        ->where('initial_draft.prompt', 'Action camera strapped on helmet descending rapid river')
    );
});

// 11. Reopened modal preserves Draft status
it('preserves draft status on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.status', 'draft')
    );
});

// 12. Reopened modal preserves Final status
it('preserves final status on reopen', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_FINAL,
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.status', 'final')
    );
});

// 13. Manual generated creative supports reopen
it('supports reopening manual creative generator session', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'generation_metadata' => ['mode' => 'manual'],
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('generator/manual')
            ->where('initial_draft.id', $design->id)
        );
});

// 14. Automatic generated creative supports reopen
it('supports reopening automatic creative generator session', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'generation_metadata' => ['mode' => 'automatic'],
    ]);

    $response = $this->actingAs($user)
        ->get("/generator/automatic?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('generator/automatic')
            ->where('initial_draft.id', $design->id)
        );
});

// 15. Variation-generated creative updates and supports reopen
it('updates design when saving a variation and supports reopen with the variation data', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    Storage::disk('public')->put('designs/original.png', 'bytes-1');
    Storage::disk('public')->put('designs/variation_v2.png', 'bytes-2');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'product_name' => 'Wireless Mouse',
        'generated_image_path' => 'designs/original.png',
        'generation_metadata' => ['variation_index' => 0],
    ]);

    // User saves variation update to the same design via POST /designs
    $this->actingAs($user)->postJson('/designs', [
        'design_id' => $design->id,
        'status' => 'draft',
        'campaign_id' => $campaign->id,
        'product_name' => 'Wireless Mouse',
        'generated_image_path' => 'designs/variation_v2.png',
        'prompt' => 'New variation prompt with side-lighting',
        'generation_metadata' => ['variation_index' => 1, 'is_variation' => true],
    ])->assertOk();

    // Reopen and check that variation is now served
    $response = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}");

    $response->assertInertia(fn (Assert $page) => $page
        ->where('initial_draft.id', $design->id)
        ->where('initial_draft.generated_image_path', 'designs/variation_v2.png')
        ->where('initial_draft.prompt', 'New variation prompt with side-lighting')
        ->where('initial_draft.generation_metadata.variation_index', 1)
    );
});

// 16. Draft resumed from Campaign supports reopen
it('includes generator_url pointing to generator with draft_id and origin in campaign show', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'generation_metadata' => ['mode' => 'manual'],
    ]);

    $response = $this->actingAs($user)->get("/campaigns/{$campaign->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('campaigns/show')
            ->has('campaign.drafts.0', fn (Assert $item) => $item
                ->where('id', $design->id)
                ->where('is_draft', true)
                ->where('generator_url', fn ($url) => str_contains((string) $url, "draft_id={$design->id}") && str_contains((string) $url, 'origin=campaign'))
                ->etc()
            )
        );
});

// 17. Draft resumed from Designs supports reopen
it('includes generator_url pointing to generator with draft_id and origin in designs index', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'generation_metadata' => ['mode' => 'manual'],
    ]);

    $response = $this->actingAs($user)->get('/designs');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('designs/index')
            ->has('designs.data.0', fn (Assert $item) => $item
                ->where('id', $design->id)
                ->where('is_draft', true)
                ->where('generator_url', fn ($url) => str_contains((string) $url, "draft_id={$design->id}") && str_contains((string) $url, 'origin=designs'))
                ->etc()
            )
        );
});

// 18. Final Design opened from Campaign supports reopen
it('includes generator_url for final designs in campaign show', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => ['mode' => 'automatic'],
    ]);

    $response = $this->actingAs($user)->get("/campaigns/{$campaign->id}");

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('campaign.final_designs.0', fn (Assert $item) => $item
                ->where('id', $design->id)
                ->where('is_draft', false)
                ->where('generator_url', fn ($url) => str_contains((string) $url, "draft_id={$design->id}") && str_contains((string) $url, 'origin=campaign'))
                ->etc()
            )
        );
});

// 19. Final Design opened from Designs supports reopen
it('includes generator_url for final designs in designs index', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_FINAL,
        'generation_metadata' => ['mode' => 'manual'],
    ]);

    $response = $this->actingAs($user)->get('/designs');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('designs.data.0', fn (Assert $item) => $item
                ->where('id', $design->id)
                ->where('is_draft', false)
                ->where('generator_url', fn ($url) => str_contains((string) $url, "draft_id={$design->id}") && str_contains((string) $url, 'origin=designs'))
                ->etc()
            )
        );
});

// 20. Breadcrumb origin remains correct
it('preserves origin query parameter in generator response', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
    ]);

    // Origin designs
    $resDesigns = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&origin=designs");
    $resDesigns->assertInertia(fn (Assert $page) => $page->where('origin', 'designs'));

    // Origin campaign
    $resCampaign = $this->actingAs($user)
        ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&origin=campaign");
    $resCampaign->assertInertia(fn (Assert $page) => $page->where('origin', 'campaign'));
});

// 21. No duplicate image generation request occurs on reopen
it('does not dispatch image generation when viewing or reopening', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
        'generated_image_path' => 'designs/static_creative.png',
    ]);

    // Multiple opens must be purely read operations
    for ($i = 0; $i < 5; $i++) {
        $this->actingAs($user)
            ->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1")
            ->assertOk();
    }

    // Image path should remain untouched
    expect(Design::find($design->id)->generated_image_path)->toBe('designs/static_creative.png');
});

// 22. No duplicate Design record is created on reopen
it('maintains strict 1:1 Design record cardinality across reopen cycles', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create(['user_id' => $user->id, 'business_id' => $business->id]);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'campaign_id' => $campaign->id,
        'status' => Design::STATUS_DRAFT,
    ]);

    $countBefore = Design::where('user_id', $user->id)->count();

    $this->actingAs($user)->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}")->assertOk();
    $this->actingAs($user)->get("/generator/manual?campaign_id={$campaign->id}&draft_id={$design->id}&open_modal=1")->assertOk();
    $this->actingAs($user)->get("/generator/automatic?campaign_id={$campaign->id}&draft_id={$design->id}")->assertOk();

    $countAfter = Design::where('user_id', $user->id)->count();

    expect($countAfter)->toBe($countBefore);
});
