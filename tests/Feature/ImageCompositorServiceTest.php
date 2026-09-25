<?php

use App\Models\Business;
use App\Models\User;
use App\Services\ImageCompositorService;

it('generates compositing manifest with normalized tagline', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id, 'name' => 'CoffeYessir']);

    $compositor = new ImageCompositorService;

    // Trailing period stripped
    $manifest1 = $compositor->generateCompositingManifest([
        'product_name' => 'Iced Caramel Macchiato',
        'price' => '₱149',
        'tagline' => 'Fresh Taste.',
        'aspect_ratio' => '1:1',
    ], $business);

    expect($manifest1['exact_content']['tagline'])->toBe('Fresh Taste');

    // Dangling connector stripped
    $manifest2 = $compositor->generateCompositingManifest([
        'product_name' => 'Iced Caramel Macchiato',
        'tagline' => 'Fresh Taste &',
        'aspect_ratio' => '9:16',
    ], $business);

    expect($manifest2['exact_content']['tagline'])->toBe('Fresh Taste');

    // Intentional exclamation preserved
    $manifest3 = $compositor->generateCompositingManifest([
        'product_name' => 'Iced Caramel Macchiato',
        'tagline' => 'Taste the magic!',
        'aspect_ratio' => '16:9',
    ], $business);

    expect($manifest3['exact_content']['tagline'])->toBe('Taste the magic!')
        ->and($manifest3['exact_content']['brand_name'])->toBe('CoffeYessir');

    // Business name disabled
    $manifestDisabled = $compositor->generateCompositingManifest([
        'product_name' => 'Iced Caramel Macchiato',
        'tagline' => 'Taste the magic!',
        'include_business_name' => false,
        'business_name' => 'CoffeYessir',
        'aspect_ratio' => '1:1',
    ], $business);

    expect($manifestDisabled['exact_content']['brand_name'])->toBeNull();
});

it('detects compositor capabilities accurately', function () {
    $compositor = new ImageCompositorService;
    $caps = $compositor->detectCapabilities();

    expect($caps)->toHaveKeys([
        'engine_detected',
        'raster_rendering_available',
        'production_safe',
        'supports_gd',
        'supports_imagick',
        'supports_powershell',
        'supports_svg',
    ]);

    expect($caps['supports_svg'])->toBeTrue();
    if (PHP_OS_FAMILY === 'Windows') {
        expect($caps['supports_powershell'])->toBeTrue()
            ->and($caps['raster_rendering_available'])->toBeTrue();
    }
});

it('enforces distinct layout properties across all design treatments', function () {
    $compositor = new ImageCompositorService;

    $treatments = ['Classic', 'Editorial', 'Bold Promo', 'Minimal', 'Premium'];
    $manifests = [];

    foreach ($treatments as $treatment) {
        $manifest = $compositor->generateCompositingManifest([
            'product_name' => 'Signature Coffee Blend',
            'price' => '₱180',
            'tagline' => 'Crafted for perfection',
            'business_name' => 'Artisan Roastery',
            'design_treatment' => $treatment,
            'aspect_ratio' => '1:1',
        ]);

        $manifests[$treatment] = $manifest['layout_properties'];
    }

    // Verify Classic vs Editorial
    expect($manifests['Classic']['alignment'])->toBe('center')
        ->and($manifests['Editorial']['alignment'])->toBe('left')
        ->and($manifests['Editorial']['hierarchy'])->toBe('refined_editorial_asymmetry')
        ->and($manifests['Classic']['hierarchy'])->toBe('product_name_prominent');

    // Verify Bold Promo has highest price size and high contrast scrim
    expect($manifests['Bold Promo']['price_size'])->toBeGreaterThan($manifests['Classic']['price_size'])
        ->and($manifests['Bold Promo']['scrim_alpha'])->toBe(180)
        ->and($manifests['Bold Promo']['hierarchy'])->toBe('promotional_price_emphasis');

    // Verify Minimal has 0 scrim alpha (pure negative space) and restrained sizes
    expect($manifests['Minimal']['scrim_alpha'])->toBe(0)
        ->and($manifests['Minimal']['title_size'])->toBeLessThan($manifests['Classic']['title_size'])
        ->and($manifests['Minimal']['hierarchy'])->toBe('uncluttered_restraint');

    // Verify Premium has refined typography and opulent scrim
    expect($manifests['Premium']['hierarchy'])->toBe('understated_prestige')
        ->and($manifests['Premium']['scrim_alpha'])->toBe(140);
});

it('enforces 20% safe margins across all 5 aspect ratios', function () {
    $compositor = new ImageCompositorService;

    $ratios = [
        '1:1' => [1024, 1024],
        '4:5' => [1024, 1280],
        '9:16' => [1024, 1792],
        '16:9' => [1792, 1024],
        '4:3' => [1365, 1024],
    ];

    foreach ($ratios as $ratio => [$expectedW, $expectedH]) {
        $manifest = $compositor->generateCompositingManifest([
            'product_name' => 'Signature Coffee Blend',
            'aspect_ratio' => $ratio,
            'design_treatment' => 'Classic',
        ]);

        $canvas = $manifest['canvas'];
        $margins = $manifest['safe_margins'];
        $layout = $manifest['layout_properties'];

        expect($canvas['width'])->toBe($expectedW)
            ->and($canvas['height'])->toBe($expectedH)
            ->and($margins['margin_percent'])->toBe(20);

        $expectedSafeMarginX = (int) round($expectedW * 0.20);
        $expectedSafeMarginY = (int) round($expectedH * 0.20);

        expect($margins['left'])->toBe($expectedSafeMarginX)
            ->and($margins['right'])->toBe($expectedSafeMarginX)
            ->and($margins['top'])->toBe($expectedSafeMarginY)
            ->and($margins['bottom'])->toBe($expectedSafeMarginY);

        // Coordinates of the scrim box must remain inside the safe margins
        $scrim = $layout['scrim_box'];
        expect($scrim['x'])->toBeGreaterThanOrEqual($margins['left'])
            ->and($scrim['x'] + $scrim['width'])->toBeLessThanOrEqual($canvas['width'] - $margins['right'])
            ->and($scrim['y'])->toBeGreaterThanOrEqual($margins['top'])
            ->and($scrim['y'] + $scrim['height'])->toBeLessThanOrEqual($canvas['height'] - $margins['bottom']);
    }
});

it('fails with explicit actionable exception in production if no raster engine is available', function () {
    app()->detectEnvironment(fn () => 'production');

    $compositor = new class extends ImageCompositorService
    {
        public function detectCapabilities(): array
        {
            return [
                'engine_detected' => 'none',
                'raster_rendering_available' => false,
                'production_safe' => false,
                'supports_gd' => false,
                'supports_imagick' => false,
                'supports_powershell' => false,
                'supports_svg' => true,
            ];
        }
    };

    Storage::fake('public');
    Storage::disk('public')->put('designs/test.png', 'dummy_png_bytes');

    expect(fn () => $compositor->composite('designs/test.png', ['product_name' => 'Test']))
        ->toThrow(RuntimeException::class, "Deterministic raster compositing requires 'ext-gd' or 'ext-imagick' in production environments.");

    app()->detectEnvironment(fn () => 'testing');
});

it('executes visual acceptance fixtures across treatments and ratios, verifying pixel modification and metadata', function () {
    Storage::fake('public');

    $compositor = new ImageCompositorService;
    $treatments = ['Classic', 'Editorial', 'Bold Promo', 'Minimal', 'Premium'];
    $ratios = ['1:1', '4:5', '9:16', '16:9'];

    $fixtureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#1e293b"/></svg>';

    foreach ($treatments as $treatment) {
        foreach ($ratios as $ratio) {
            $path = "designs/fixture_{$treatment}_{$ratio}.svg";
            Storage::disk('public')->put($path, $fixtureSvg);
            $initialBytes = strlen(Storage::disk('public')->get($path));

            $compositor->composite($path, [
                'product_name' => 'Premium Roast Coffee',
                'price' => '₱250',
                'tagline' => 'Awaken Your Senses',
                'business_name' => 'Mountain Brews',
                'include_tagline' => true,
                'include_prices' => true,
                'include_business_name' => true,
                'design_treatment' => $treatment,
                'aspect_ratio' => $ratio,
            ]);

            $result = $compositor->getLastCompositingResult();
            $updatedContent = Storage::disk('public')->get($path);

            expect(Storage::disk('public')->exists($path))->toBeTrue()
                ->and(strlen($updatedContent))->toBeGreaterThan($initialBytes)
                ->and($updatedContent)->toContain('id="authoritative-marketing-text-overlay"')
                ->and($updatedContent)->toContain('Premium Roast Coffee')
                ->and($updatedContent)->toContain('Awaken Your Senses')
                ->and($updatedContent)->toContain('₱250')
                ->and($updatedContent)->toContain('Mountain Brews');

            expect($result['raster_modified'])->toBeTrue()
                ->and($result['engine'])->toBe('svg_compositor')
                ->and($result['authoritative_copy']['product_name'])->toBe('Premium Roast Coffee')
                ->and($result['text_layers_rendered'])->toContain('product_name', 'business_name', 'tagline', 'price')
                ->and($result['fallback_state'])->toBe('none');
        }
    }
});

it('accurately omits disabled text layers without false rendered flags in metadata', function () {
    Storage::fake('public');

    $compositor = new ImageCompositorService;
    $path = 'designs/suppressed.svg';
    $fixtureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%" fill="#0f172a"/></svg>';
    Storage::disk('public')->put($path, $fixtureSvg);

    $compositor->composite($path, [
        'product_name' => 'Single Origin Pour Over',
        'price' => '₱200',
        'tagline' => 'Rich Aromas',
        'business_name' => 'Artisan Co',
        'include_tagline' => false,
        'include_prices' => false,
        'include_business_name' => false,
    ]);

    $result = $compositor->getLastCompositingResult();
    $updatedSvg = Storage::disk('public')->get($path);

    expect($result['text_layers_rendered'])->toEqual(['product_name'])
        ->and($result['text_layers_rendered'])->not->toContain('tagline')
        ->and($result['text_layers_rendered'])->not->toContain('price')
        ->and($result['text_layers_rendered'])->not->toContain('business_name');

    expect($updatedSvg)->toContain('Single Origin Pour Over')
        ->and($updatedSvg)->not->toContain('Rich Aromas')
        ->and($updatedSvg)->not->toContain('₱200')
        ->and($updatedSvg)->not->toContain('Artisan Co');
});
