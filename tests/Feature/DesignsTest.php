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

    $regenerated = Design::query()->where('user_id', $user->id)->latest('id')->first();
    expect($regenerated->product_name)->toBe('Regenerated Product')
        ->and($regenerated->tagline)->toBe('Launch better')
        ->and($regenerated->brand_tone)->toBe('Professional')
        ->and($regenerated->visual_theme)->toBe('Modern')
        ->and($regenerated->generation_metadata['regenerated_from_design_id'])->toBe($design->id);
});

it('restores all original creative inputs, scene prompt, brand tone, render style, event, and price during regeneration', function () {
    config(['services.openai.api_key' => 'test-key']);

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$capturedPrompt) {
            $data = json_decode($request->body(), true);
            $capturedPrompt = $data['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-data')]],
            ], 200);
        },
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Apit Burger',
        'industry' => 'Restaurant & Food',
    ]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Classic Cheeseburger',
        'description' => 'Juicy flame-grilled beef with melted cheddar.',
        'price' => 100.00,
    ]);
    $event = Event::factory()->create([
        'user_id' => $user->id,
        'name' => "Mother's Day",
        'type' => 'holiday',
    ]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'event_id' => $event->id,
        'name' => 'Summer Special Sale',
        'objective' => 'Drive in-store foot traffic and combo sales',
    ]);

    $originalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'campaign_id' => $campaign->id,
        'event_id' => $event->id,
        'product_name' => 'Classic Cheeseburger',
        'price' => 100.00,
        'brand_tone' => 'Warm & Welcoming',
        'visual_theme' => 'Cozy Cafe Vibe',
        'tagline' => 'Big taste, no compromise.',
        'tagline_mode' => 'manual',
        'reference_image_path' => null,
        'prompt' => 'Custom cozy evening burger scene on wooden table with warm restaurant lighting',
        'generation_metadata' => [
            'scene_prompt' => 'Create a cozy evening burger advertisement on a wooden table with warm restaurant lighting, fries beside the burger, and a refreshing drink in the background.',
            'price' => '₱100',
            'render_style' => 'Lifestyle Capture',
            'aspect_ratio' => '16:9',
            'include_business_name' => true,
            'business_name' => 'Apit Burger',
            'model' => 'gpt-image-2',
            'quality' => 'high',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test/original-burger.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/original-burger.png', 'fake-image');

    $response = $this->actingAs($user)
        ->post('/designs/'.$originalDesign->id.'/regenerate');

    if (session('error')) {
        throw new Exception('Regenerate redirected with error: '.session('error'));
    }

    $response->assertRedirect();

    $newDesign = Design::query()->where('user_id', $user->id)->latest('id')->first();
    expect($newDesign->id)->not->toBe($originalDesign->id)
        ->and($newDesign->product_name)->toBe('Classic Cheeseburger')
        ->and((float) $newDesign->price)->toBe(100.00)
        ->and($newDesign->tagline)->toBe('Big taste, no compromise')
        ->and($newDesign->brand_tone)->toBe('Warm & Welcoming')
        ->and($newDesign->visual_theme)->toBe('Cozy Cafe Vibe')
        ->and($newDesign->generation_metadata['render_style'])->toBe('Lifestyle Capture')
        ->and($newDesign->generation_metadata['aspect_ratio'])->toBe('16:9')
        ->and($newDesign->generation_metadata['include_business_name'])->toBeTrue()
        ->and($newDesign->generation_metadata['business_name'])->toBe('Apit Burger')
        ->and($newDesign->generation_metadata['scene_prompt'])->toContain('Create a cozy evening burger advertisement')
        ->and($newDesign->generation_metadata['regenerated_from_design_id'])->toBe($originalDesign->id);

    // Verify complete modular prompt delivered to OpenAI
    expect($capturedPrompt)->not->toBeNull()
        ->and($capturedPrompt)->toContain('Classic Cheeseburger')
        ->and($capturedPrompt)->toContain('Create a cozy evening burger advertisement on a wooden table')
        ->and($capturedPrompt)->toContain('₱100')
        ->and($capturedPrompt)->toContain('BUSINESS / SHOP: "Apit Burger"')
        ->and($capturedPrompt)->toContain('Warm & Welcoming')
        ->and($capturedPrompt)->toContain('Lifestyle Capture')
        ->and($capturedPrompt)->not->toContain('logo_path')
        ->and($capturedPrompt)->not->toContain('CRITICAL LOGO DIRECTIVE');
});

it('omits business name from brief when include_business_name is false during regeneration', function () {
    config(['services.openai.api_key' => 'test-key']);

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$capturedPrompt) {
            $data = json_decode($request->body(), true);
            $capturedPrompt = $data['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-data')]],
            ], 200);
        },
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'Secret Brand Inc',
    ]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Mystery Box',
        'generation_metadata' => [
            'include_business_name' => false,
            'scene_prompt' => 'A mysterious glowing package floating in neon mist',
            'render_style' => 'Cinematic Marketing',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test/mystery.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/mystery.png', 'fake-image');

    $this->actingAs($user)
        ->post('/designs/'.$design->id.'/regenerate')
        ->assertRedirect();

    expect($capturedPrompt)->toContain('Mystery Box')
        ->and($capturedPrompt)->toContain('A mysterious glowing package floating in neon mist')
        ->and($capturedPrompt)->not->toContain('BUSINESS / SHOP: Secret Brand Inc')
        ->and($capturedPrompt)->not->toContain('Secret Brand Inc');
});

it('preserves reference product image mode during regeneration when original design had catalog image', function () {
    config(['services.openai.api_key' => 'test-key']);

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/edits' => function ($request) use (&$capturedPrompt) {
            if (is_array($request->data())) {
                foreach ($request->data() as $field) {
                    if (is_array($field) && ($field['name'] ?? '') === 'prompt') {
                        $capturedPrompt = $field['contents'] ?? '';
                    }
                }
                if (! $capturedPrompt && isset($request->data()['prompt'])) {
                    $capturedPrompt = $request->data()['prompt'];
                }
            }
            if (! $capturedPrompt) {
                $capturedPrompt = (string) $request->body();
            }

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-data')]],
            ], 200);
        },
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$capturedPrompt) {
            $data = json_decode($request->body(), true);
            $capturedPrompt = $data['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-data')]],
            ], 200);
        },
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create([
        'business_id' => $business->id,
        'name' => 'Iced Matcha Latte',
        'image_path' => 'products/test-matcha.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('products/test-matcha.png', 'matcha-bytes');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'product_name' => 'Iced Matcha Latte',
        'reference_image_path' => 'products/test-matcha.png',
        'generation_metadata' => [
            'generation_mode' => 'PRODUCT_PRESERVING',
            'product_preserved' => true,
            'scene_prompt' => 'Placed on a sunlit marble counter with bamboo whisk and green tea leaves.',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test/matcha-gen.png',
    ]);
    Storage::disk('public')->put('designs/test/matcha-gen.png', 'matcha-gen-bytes');

    $this->actingAs($user)
        ->post('/designs/'.$design->id.'/regenerate')
        ->assertRedirect();

    $newDesign = Design::query()->where('user_id', $user->id)->latest('id')->first();
    expect($newDesign->reference_image_path)->toBe('products/test-matcha.png')
        ->and($newDesign->generation_metadata['product_preserved'])->toBeTrue()
        ->and($capturedPrompt)->toContain('PRIMARY PRODUCT IMAGE:')
        ->and($capturedPrompt)->toContain('REFERENCE PRODUCT PRESERVATION MODE')
        ->and($capturedPrompt)->toContain('Placed on a sunlit marble counter with bamboo whisk');
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
    $event = Event::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/generator', [
            'product_name' => 'Failed Product',
            'marketing_goal' => 'Create a design',
            'event_id' => $event->id,
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

it('preserves all five aspect ratios and their responsive compositions during regeneration', function () {
    config(['services.openai.api_key' => 'test-key']);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $ratios = ['1:1', '9:16', '16:9', '4:5', '4:3'];

    foreach ($ratios as $ratio) {
        $capturedPrompt = null;
        $capturedSize = null;

        Http::fake([
            'https://api.openai.com/v1/images/generations' => function ($request) use (&$capturedPrompt, &$capturedSize) {
                $data = json_decode($request->body(), true);
                $capturedPrompt = $data['prompt'] ?? '';
                $capturedSize = $data['size'] ?? '';

                return Http::response([
                    'data' => [['b64_json' => base64_encode('fake-image-data')]],
                ], 200);
            },
        ]);

        $design = Design::factory()->create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'product_name' => 'Signature Coffee '.$ratio,
            'generation_metadata' => [
                'aspect_ratio' => $ratio,
                'model' => 'gpt-image-2',
                'scene_prompt' => 'A beautifully staged coffee on a cafe counter',
            ],
            'status' => 'completed',
            'generated_image_path' => 'designs/test/sig-'.$ratio.'.png',
        ]);

        Storage::fake('public');
        Storage::disk('public')->put('designs/test/sig-'.$ratio.'.png', 'fake-image');

        $this->actingAs($user)
            ->post('/designs/'.$design->id.'/regenerate')
            ->assertRedirect();

        $newDesign = Design::query()->where('user_id', $user->id)->latest('id')->first();
        expect($newDesign->generation_metadata['aspect_ratio'])->toBe($ratio)
            ->and($newDesign->generation_metadata['prompt'])->toContain("RESPONSIVE COMPOSITION PROFILE: {$ratio}");
    }
});

it('normalizes historical taglines with dangling symbols or terminal periods during regeneration', function () {
    config(['services.openai.api_key' => 'test-key']);

    $capturedPrompt = null;
    Http::fake([
        'https://api.openai.com/v1/images/generations' => function ($request) use (&$capturedPrompt) {
            $data = json_decode($request->body(), true);
            $capturedPrompt = $data['prompt'] ?? '';

            return Http::response([
                'data' => [['b64_json' => base64_encode('fake-image-data')]],
            ], 200);
        },
    ]);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'name' => 'CoffeYessir',
    ]);

    $historicalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Iced Vanilla Latte',
        'tagline' => 'Fresh, Hot & Delicious... &',
        'generation_metadata' => [
            'model' => 'gpt-image-2',
            'scene_prompt' => 'A cozy cafe scene',
        ],
        'status' => 'completed',
        'generated_image_path' => 'designs/test/vanilla.png',
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test/vanilla.png', 'fake-image');

    $this->actingAs($user)
        ->post('/designs/'.$historicalDesign->id.'/regenerate')
        ->assertRedirect();

    $newDesign = Design::query()->where('user_id', $user->id)->latest('id')->first();
    expect($newDesign->tagline)->toBe('Fresh, Hot & Delicious')
        ->and($capturedPrompt)->toContain('• TAGLINE: "Fresh, Hot & Delicious"');
});

it('can save automatic design with exact prompt and metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Signature Blend']);
    $event = Event::factory()->create(['user_id' => $user->id, 'name' => 'Weekend Special']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'event_id' => $event->id,
        'name' => 'Autumn Warmth',
    ]);

    Storage::fake('public');
    $imagePath = 'designs/openai_auto_test_123.png';
    Storage::disk('public')->put($imagePath, 'fake-rendered-png');

    $productionPrompt = 'COMMERCIAL ADVERTISEMENT BRIEF — AUTOMATIC MODE: High-end cafe staging for Signature Blend with rich espresso crema.';

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Signature Blend',
            'prompt' => $productionPrompt,
            'image_prompt' => $productionPrompt,
            'campaign_id' => $campaign->id,
            'event_id' => $event->id,
            'product_id' => $product->id,
            'catalog_product_ids' => [$product->id],
            'custom_products' => [
                ['name' => 'Artisan Biscotti', 'price' => '120.00', 'description' => 'Crisp almond biscotti'],
            ],
            'generated_image_path' => $imagePath,
            'creative_concept' => 'Autumn cozy morning aesthetic',
            'visual_strategy' => 'Overhead artisanal table setting',
            'design_treatment' => 'Editorial Minimalist',
            'copy_emphasis' => 'Headline Focused',
            'render_style' => 'Studio Product Still',
            'tagline' => 'Awaken Your Senses',
            'include_tagline' => true,
            'include_prices' => true,
            'include_business_name' => true,
            'business_name' => $business->name,
            'aspect_ratio' => '1:1',
            'generation_mode' => 'automatic',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Design saved to My Designs.',
        ]);

    $saved = Design::query()->where('user_id', $user->id)->first();
    expect($saved)->not->toBeNull()
        ->and($saved->prompt)->toBe($productionPrompt)
        ->and($saved->generated_image_path)->toBe($imagePath)
        ->and($saved->generation_metadata['generation_mode'])->toBe('automatic')
        ->and($saved->generation_metadata['creative_concept'])->toBe('Autumn cozy morning aesthetic')
        ->and($saved->generation_metadata['custom_products'])->toHaveCount(1);
});

it('can save manual design with exact prompt and metadata', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $product = Product::factory()->create(['business_id' => $business->id, 'name' => 'Cold Brew Nitro']);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_id' => $product->id,
        'name' => 'Summer Nitro Blast',
    ]);

    Storage::fake('public');
    $imagePath = 'designs/openai_manual_test_456.png';
    Storage::disk('public')->put($imagePath, 'fake-rendered-png');

    $productionPrompt = 'DIRECTOR-COMPOSED PRODUCTION BRIEF — MANUAL MODE: Nitro cascade glass with frost droplets on black slate.';

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Cold Brew Nitro',
            'prompt' => $productionPrompt,
            'image_prompt' => $productionPrompt,
            'scene_prompt' => 'Nitro cascade glass with frost droplets',
            'campaign_id' => $campaign->id,
            'product_id' => $product->id,
            'catalog_product_ids' => [$product->id],
            'generated_image_path' => $imagePath,
            'render_style' => 'Macro Commercial',
            'brand_tone' => ['Bold', 'Punchy'],
            'content_style' => ['Modern Minimalist'],
            'design_treatment' => 'High Contrast Bold',
            'copy_emphasis' => 'Balanced',
            'include_tagline' => true,
            'tagline' => 'Velvet Smooth Energy',
            'tagline_mode' => 'custom',
            'include_prices' => false,
            'include_business_name' => true,
            'business_name' => $business->name,
            'aspect_ratio' => '9:16',
            'generation_mode' => 'manual',
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Design saved to My Designs.',
        ]);

    $saved = Design::query()->where('user_id', $user->id)->first();
    expect($saved)->not->toBeNull()
        ->and($saved->prompt)->toBe($productionPrompt)
        ->and($saved->generated_image_path)->toBe($imagePath)
        ->and($saved->generation_metadata['generation_mode'])->toBe('manual')
        ->and($saved->generation_metadata['aspect_ratio'])->toBe('9:16');
});

it('can save design with prompt exceeding 3000 characters up to 32000 characters without truncation', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Mega Prompt Campaign',
    ]);

    Storage::fake('public');
    $imagePath = 'designs/openai_long_prompt.png';
    Storage::disk('public')->put($imagePath, 'fake-image');

    // Create a 6,500-character realistic structured prompt
    $segment = 'VISUAL DIRECTIVE LAYER: Ensure immaculate depth of field, balanced volumetric illumination, crisp micro-contrast on product branding, and photorealistic ambient textures. ';
    $longPrompt = trim(str_repeat($segment, 40)); // ~6,400 chars without trailing space
    expect(strlen($longPrompt))->toBeGreaterThan(3000)
        ->and(strlen($longPrompt))->toBeLessThan(32000);

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Ultra Long Prompt Product',
            'prompt' => $longPrompt,
            'image_prompt' => $longPrompt,
            'campaign_id' => $campaign->id,
            'generated_image_path' => $imagePath,
            'aspect_ratio' => '1:1',
        ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    $saved = Design::query()->where('user_id', $user->id)->latest('id')->first();
    expect($saved)->not->toBeNull()
        ->and(strlen($saved->prompt))->toBe(strlen($longPrompt))
        ->and($saved->prompt)->toBe($longPrompt);
});

it('resolves the actual second validation error for image_prompt over 3000 characters', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Dual Long Prompt Campaign',
    ]);

    Storage::fake('public');
    $imagePath = 'designs/openai_dual_long_prompt.png';
    Storage::disk('public')->put($imagePath, 'fake-image');

    $longPrompt = str_repeat('COMMERCIAL DETAIL: Hyper-detailed coffee bean macro with warm backlighting. ', 50); // ~3,800 chars

    $response = $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Dual Prompt Product',
            'prompt' => $longPrompt,
            'image_prompt' => $longPrompt,
            'campaign_id' => $campaign->id,
            'generated_image_path' => $imagePath,
        ]);

    $response->assertOk()
        ->assertJson(['success' => true])
        ->assertJsonMissingValidationErrors(['prompt', 'image_prompt']);
});

it('enforces generated_image_path storage security against traversal and arbitrary paths', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Security Campaign',
    ]);

    // 1. Path traversal attempt
    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Traversal Attempt',
            'campaign_id' => $campaign->id,
            'generated_image_path' => '../../etc/passwd',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['generated_image_path']);

    // 2. Absolute root path attempt
    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Root Path Attempt',
            'campaign_id' => $campaign->id,
            'generated_image_path' => '/var/www/secret.png',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['generated_image_path']);

    // 3. Unauthorized directory attempt
    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Unauthorized Dir Attempt',
            'campaign_id' => $campaign->id,
            'generated_image_path' => 'private_uploads/secret.png',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['generated_image_path']);

    // 4. Non-existent file in designs/ directory
    Storage::fake('public');
    $this->actingAs($user)
        ->postJson('/designs', [
            'product_name' => 'Missing File Attempt',
            'campaign_id' => $campaign->id,
            'generated_image_path' => 'designs/does_not_exist_at_all.png',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['generated_image_path']);
});

it('enforces catalog_product_ids ownership validation', function () {
    $userA = User::factory()->create(['onboarding_completed' => true]);
    $businessA = Business::factory()->create(['user_id' => $userA->id]);
    $productA = Product::factory()->create(['business_id' => $businessA->id, 'name' => 'Product A']);
    $campaignA = Campaign::factory()->create([
        'user_id' => $userA->id,
        'business_id' => $businessA->id,
        'name' => 'Campaign A',
    ]);

    $userB = User::factory()->create(['onboarding_completed' => true]);
    $businessB = Business::factory()->create(['user_id' => $userB->id]);
    $foreignProduct = Product::factory()->create(['business_id' => $businessB->id, 'name' => 'Foreign Product']);

    Storage::fake('public');
    $imagePath = 'designs/owned_test.png';
    Storage::disk('public')->put($imagePath, 'fake-image');

    // Attempt to save design referencing another business's product ID
    $this->actingAs($userA)
        ->postJson('/designs', [
            'product_name' => 'Product A',
            'campaign_id' => $campaignA->id,
            'product_id' => $productA->id,
            'catalog_product_ids' => [$productA->id, $foreignProduct->id],
            'generated_image_path' => $imagePath,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['catalog_product_ids']);
});

it('handles duplicate save requests safely without creating redundant records', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);
    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Deduplication Campaign',
    ]);

    Storage::fake('public');
    $imagePath = 'designs/duplicate_check_123.png';
    Storage::disk('public')->put($imagePath, 'fake-image');

    $payload = [
        'product_name' => 'Dedup Product',
        'prompt' => 'Commercial prompt for dedup',
        'campaign_id' => $campaign->id,
        'generated_image_path' => $imagePath,
    ];

    // First save request
    $response1 = $this->actingAs($user)->postJson('/designs', $payload);
    $response1->assertOk()->assertJson(['success' => true, 'message' => 'Design saved to My Designs.']);

    expect(Design::query()->where('user_id', $user->id)->count())->toBe(1);

    // Immediate second save request with the same generated_image_path
    $response2 = $this->actingAs($user)->postJson('/designs', $payload);
    $response2->assertOk()->assertJson([
        'success' => true,
        'message' => 'Design is already saved in My Designs.',
    ]);

    expect(Design::query()->where('user_id', $user->id)->count())->toBe(1);
});

it('generated creative modal download menu contains exactly PNG and JPEG and excludes SVG', function () {
    $modalContent = file_get_contents(resource_path('js/pages/generator/components/GeneratedCreativeModal.tsx'));

    // Verify exactly PNG and JPEG are present in the download menu
    expect($modalContent)->toContain("onDownload('png')")
        ->and($modalContent)->toContain('Download PNG')
        ->and($modalContent)->toContain("onDownload('jpeg')")
        ->and($modalContent)->toContain('Download JPEG');

    // Verify SVG is completely excluded from the modal download menu
    expect($modalContent)->not->toContain("onDownload('svg')")
        ->and($modalContent)->not->toContain('Download SVG');

    // Also verify StudioModals FullscreenViewerModal and CreativeCanvas do not offer SVG download
    $studioModals = file_get_contents(resource_path('js/pages/generator/components/StudioModals.tsx'));
    expect($studioModals)->not->toContain("onDownload('svg')");

    $creativeCanvas = file_get_contents(resource_path('js/pages/generator/components/CreativeCanvas.tsx'));
    expect($creativeCanvas)->not->toContain("onDownload('svg')");
});
