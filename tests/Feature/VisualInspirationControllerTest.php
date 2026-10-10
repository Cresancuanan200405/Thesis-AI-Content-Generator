<?php

use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function makeFakeImageUpload(string $name = 'reference.png', string $mime = 'image/png'): UploadedFile
{
    // Valid 1x1 PNG binary
    $pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    $tempFile = tempnam(sys_get_temp_dir(), 'test_upload_');
    file_put_contents($tempFile, $pngBinary);

    return new UploadedFile($tempFile, $name, $mime, null, true);
}

beforeEach(function () {
    config()->set('services.gemini.api_key', 'test-fake-key-for-testing-only');
    config()->set('services.gemini.model', 'gemini-3.1-pro-preview');
    config()->set('services.gemini.fallback_model', 'gemini-3.6-flash');
});

test('guests are redirected to login when attempting to visit visual inspiration tool', function () {
    $response = $this->get(route('generator.inspiration.index'));

    $response->assertRedirect(route('login'));
});

test('guests are redirected to login when attempting to post image for analysis', function () {
    $file = makeFakeImageUpload('reference.png');

    $response = $this->post(route('generator.inspiration.analyze'), [
        'image' => $file,
    ]);

    $response->assertRedirect(route('login'));
});

test('authenticated user can view visual inspiration page with configured models', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $response = $this->actingAs($user)->get(route('generator.inspiration.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('generator/inspiration')
        ->where('primaryModel', 'gemini-3.1-pro-preview')
        ->where('fallbackModel', 'gemini-3.6-flash')
    );
});

test('validation rejects missing image upload', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('validation rejects non-image or unsupported mime types', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('validation rejects oversized images exceeding 10 MB', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    // 10241 KB is > 10240 KB limit
    $file = UploadedFile::fake()->create('huge.jpg', 10241, 'image/jpeg');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['image']);
});

test('successfully analyzes reference image with mocked Gemini vision response', function () {
    Storage::fake('public');

    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $validAnalysisPayload = [
        'visual_analysis' => [
            'composition_and_framing' => 'Clean geometric flat lay on matte slate surface with asymmetric negative space.',
            'color_palette' => 'Charcoal grey, brushed brass, muted sage green, and clean off-white.',
            'lighting_and_shadows' => 'Soft diffused window light from top-left creating long gentle penumbra shadows.',
            'typography_character_and_hierarchy' => 'Minimalist modern serif header paired with understated sans-serif detail.',
            'mood_and_visual_direction' => 'Sophisticated, premium architectural calm with Scandinavian restraint.',
            'reusable_visual_style_prompt' => 'Clean flat lay overhead view on matte charcoal slate with warm brass accents and soft diffused daylight shadows.',
        ],
        'marketpilot_recommendations' => [
            'render_style' => 'Studio Product Still',
            'copy_emphasis' => 'Product',
            'visibility_suggestions' => [
                'product_name' => true,
                'price' => false,
                'tagline' => true,
                'business_name' => false,
                'event_text' => false,
            ],
            'confidence_notes' => 'High clarity composition perfectly aligns with Studio Product Still aesthetics.',
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode($validAnalysisPayload),
                            ],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $initialDesignCount = Design::count();
    $initialProductCount = Product::count();
    $initialCampaignCount = Campaign::count();

    $file = makeFakeImageUpload('reference.png');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
        ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'model_used' => 'gemini-3.1-pro-preview',
        'visual_analysis' => $validAnalysisPayload['visual_analysis'],
        'marketpilot_recommendations' => $validAnalysisPayload['marketpilot_recommendations'],
    ]);

    // ABSENCE OF STORAGE & DATABASE PERSISTENCE
    expect(Design::count())->toBe($initialDesignCount);
    expect(Product::count())->toBe($initialProductCount);
    expect(Campaign::count())->toBe($initialCampaignCount);
    expect(Storage::disk('public')->allFiles())->toBeEmpty();
});

test('handles force fallback model parameter properly', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    $fallbackPayload = [
        'visual_analysis' => [
            'composition_and_framing' => 'Eye-level studio pedestal shot.',
            'color_palette' => 'Monochrome black and silver.',
            'lighting_and_shadows' => 'Direct spotlight with sharp reflections.',
            'typography_character_and_hierarchy' => 'Bold uppercase geometric headline.',
            'mood_and_visual_direction' => 'Futuristic and sleek.',
            'reusable_visual_style_prompt' => 'Centered pedestal still life with hard directional spotlighting on dark background.',
        ],
        'marketpilot_recommendations' => [
            'render_style' => 'Cinematic Commercial',
            'copy_emphasis' => 'Balanced',
            'visibility_suggestions' => [
                'product_name' => true,
                'price' => true,
                'tagline' => false,
                'business_name' => false,
                'event_text' => false,
            ],
            'confidence_notes' => 'Fallback model identified high contrast dramatic lighting.',
        ],
    ];

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => json_encode($fallbackPayload),
                            ],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $file = makeFakeImageUpload('reference.png');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
            'force_fallback' => true,
        ]);

    $response->assertOk();
    $response->assertJson([
        'success' => true,
        'model_used' => 'gemini-3.6-flash',
    ]);
});

test('handles API errors safely without exposing sensitive credentials', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/*' => Http::response([
            'error' => [
                'code' => 503,
                'message' => 'The model is overloaded. Please try again later.',
            ],
        ], 503),
    ]);

    $file = makeFakeImageUpload('reference.png');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
        ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
    ]);
    expect($response->json('error'))->not->toContain('test-fake-key-for-testing-only');
});

test('handles malformed Gemini response safely', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'onboarding_completed' => true,
    ]);

    Http::fake([
        'https://generativelanguage.googleapis.com/v1beta/models/*' => Http::response([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            [
                                'text' => 'Not valid json at all {{ bad syntax',
                            ],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $file = makeFakeImageUpload('reference.png');

    $response = $this->actingAs($user)
        ->postJson(route('generator.inspiration.analyze'), [
            'image' => $file,
        ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
    ]);
});
