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

    expect($manifest3['exact_content']['tagline'])->toBe('Taste the magic!');
});
