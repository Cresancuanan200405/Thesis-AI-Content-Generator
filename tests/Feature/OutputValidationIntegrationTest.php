<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\OpenAIImageService;
use App\Services\OutputValidationService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    config()->set('services.openai.api_key', 'sk-test-fake-key');

    $this->user = User::factory()->create(['onboarding_completed' => true]);
    $this->business = Business::factory()->create([
        'user_id' => $this->user->id,
        'industry' => 'Food & Beverage',
        'category' => 'Café / Coffee Shop',
    ]);
    $this->product = Product::factory()->create([
        'business_id' => $this->business->id,
        'name' => 'Signature Cold Brew',
        'price' => 180.00,
        'image_path' => 'products/coldbrew.png',
    ]);
    Storage::disk('public')->put('products/coldbrew.png', 'fake-product-bytes');

    $this->campaign = Campaign::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'product_id' => $this->product->id,
        'name' => 'Summer Chill Campaign',
    ]);

    // Create a 1024x1024 valid PNG binary
    $basePng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    $ihdr = 'IHDR'.pack('NN', 1024, 1024).substr($basePng, 24, 5);
    $crc = pack('N', crc32($ihdr));
    $this->validPng = substr($basePng, 0, 12).$ihdr.$crc.substr($basePng, 33);
});

test('OpenAIImageService embeds deterministic validation in generation metadata without altering existing fields', function () {
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['composition' => 'hero product centered'])]],
            ],
        ], 200),
        'https://api.openai.com/v1/images/edits' => Http::response([
            'data' => [
                ['b64_json' => base64_encode($this->validPng)],
            ],
        ], 200),
    ]);

    $service = app(OpenAIImageService::class);
    $path = $service->generate('Premium cold brew visual', [
        'product_name' => $this->product->name,
        'reference_image_path' => $this->product->image_path,
        'aspect_ratio' => '1:1',
        'price' => '180.00',
        'tagline' => 'Chill to the drop',
    ]);

    expect($path)->toStartWith('designs/design_')
        ->and(Storage::disk('public')->exists($path))->toBeTrue();

    $meta = $service->getLastGenerationMetadata();
    expect($meta)->not->toBeNull()
        ->and($meta)->toHaveKey('validation')
        ->and($meta['validation']['status'])->toBe(OutputValidationService::STATUS_PASS)
        ->and($meta['validation']['version'])->toBe(1)
        ->and($meta['validation']['deterministic']['format'])->toBe('png')
        ->and($meta['validation']['deterministic']['dimensions'])->toBe(['width' => 1024, 'height' => 1024])
        ->and($meta['validation']['deterministic']['dimensions_match'])->toBeTrue()
        // Confirm all existing generation metadata fields remain completely intact
        ->and($meta)->toHaveKeys([
            'model',
            'generation_method',
            'generation_mode',
            'prompt',
            'product_preserved',
            'authoritative_copy',
            'compositor_result',
            'duration_seconds',
        ]);
});

test('DesignController store persists validation metadata into designs table without loss', function () {
    $meta = [
        'source' => 'openai',
        'model' => 'gpt-image-2',
        'aspect_ratio' => '1:1',
        'validation' => [
            'version' => 1,
            'status' => 'PASS',
            'validated_at' => now()->toIso8601String(),
            'deterministic' => [
                'binary_present' => true,
                'decodable' => true,
                'format' => 'png',
                'format_supported' => true,
                'file_size_bytes' => 12345,
                'dimensions' => ['width' => 1024, 'height' => 1024],
                'requested_dimensions' => ['width' => 1024, 'height' => 1024],
                'dimensions_match' => true,
                'requested_aspect_ratio' => '1:1',
                'actual_aspect_ratio' => '1:1',
                'aspect_ratio_match' => true,
                'issues' => [],
            ],
        ],
    ];

    Storage::disk('public')->put('designs/saved_image.png', $this->validPng);

    $response = $this->actingAs($this->user)
        ->postJson(route('designs.store'), [
            'campaign_id' => $this->campaign->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'prompt' => 'A refreshing cold brew scene',
            'generated_image_path' => 'designs/saved_image.png',
            'generation_metadata' => $meta,
        ]);

    $response->assertOk();

    $design = Design::query()->where('user_id', $this->user->id)->latest('id')->first();
    expect($design)->not->toBeNull()
        ->and($design->generation_metadata)->toHaveKey('validation')
        ->and($design->generation_metadata['validation']['status'])->toBe('PASS')
        ->and($design->generation_metadata['validation']['version'])->toBe(1)
        ->and($design->generation_metadata['validation']['deterministic']['format'])->toBe('png');
});

test('DesignRegenerationService preserves validation metadata on newly created design', function () {
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['composition' => 'hero product centered'])]],
            ],
        ], 200),
        'https://api.openai.com/v1/images/edits' => Http::response([
            'data' => [
                ['b64_json' => base64_encode($this->validPng)],
            ],
        ], 200),
    ]);

    $originalDesign = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_id' => $this->product->id,
        'product_name' => $this->product->name,
        'price' => 180.00,
        'generation_metadata' => [
            'mode' => 'automatic',
            'generation_mode' => 'automatic',
            'prices' => [
                (string) $this->product->id => '180.00',
            ],
            'show_event_text' => false,
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('designs.regenerate', $originalDesign));

    $response->assertOk();

    $newDesign = Design::query()->where('id', '!=', $originalDesign->id)->latest('id')->first();
    expect($newDesign)->not->toBeNull()
        ->and($newDesign->generation_metadata)->toHaveKey('validation')
        ->and($newDesign->generation_metadata['validation']['status'])->toBe(OutputValidationService::STATUS_PASS)
        ->and($newDesign->generation_metadata['prices'][(string) $this->product->id])->toBe('180.00')
        ->and($originalDesign->fresh()->id)->toBe($originalDesign->id);
});

test('Edit in AI Studio parameter restoration remains intact with validation metadata', function () {
    $design = Design::factory()->create([
        'user_id' => $this->user->id,
        'business_id' => $this->business->id,
        'campaign_id' => $this->campaign->id,
        'product_id' => $this->product->id,
        'product_name' => $this->product->name,
        'generation_metadata' => [
            'generation_mode' => 'manual',
            'render_style' => 'Cinematic Marketing',
            'aspect_ratio' => '16:9',
            'validation' => [
                'version' => 1,
                'status' => 'PASS',
                'validated_at' => now()->toIso8601String(),
            ],
        ],
    ]);

    $response = $this->actingAs($this->user)
        ->get("/generator/manual?campaign_id={$this->campaign->id}&draft_id={$design->id}&origin=designs");

    $response->assertOk();
    $pageProps = $response->original->getData()['page']['props'];

    expect($pageProps)->toHaveKey('initial_draft')
        ->and($pageProps['initial_draft']['id'])->toBe($design->id)
        ->and($pageProps['initial_draft']['generation_metadata']['validation']['status'])->toBe('PASS');
});
