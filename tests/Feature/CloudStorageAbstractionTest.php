<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\ReferenceImageAnalyzer;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\AwsS3V3\AwsS3V3Adapter;

it('respects the configured filesystem default disk and generates cloud-compatible URLs', function () {
    Storage::fake();

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $file = UploadedFile::fake()->create('barako_coffee.jpg', 100, 'image/jpeg');

    $response = $this->actingAs($user)->post('/products', [
        'name' => 'Barako Reserve',
        'description' => 'Dark roast whole beans',
        'price' => 350.00,
        'image' => $file,
    ]);

    $response->assertRedirect(route('products.index'));

    $product = Product::query()->where('business_id', $business->id)->first();
    expect($product)->not->toBeNull()
        ->and($product->image_path)->not->toBeNull()
        ->and(Storage::exists($product->image_path))->toBeTrue();

    // Verify URL does not assume static local path
    $generatedUrl = Storage::url($product->image_path);
    expect($generatedUrl)->not->toBeEmpty();
});

it('downloads design files through Storage abstraction without requiring local path', function () {
    Storage::fake();

    $user = User::factory()->create(['onboarding_completed' => true]);
    $design = Design::factory()->create([
        'user_id' => $user->id,
        'product_name' => 'Signature Latte',
        'generated_image_path' => 'designs/openai_sample_test_uuid.png',
        'status' => 'completed',
    ]);

    Storage::put($design->generated_image_path, 'mock-png-binary-bytes');

    $response = $this->actingAs($user)->get(route('designs.download', $design));

    $response->assertOk();
});

it('can resolve S3 storage disk driver without missing class errors', function () {
    expect(class_exists(AwsS3V3Adapter::class))->toBeTrue();
});

it('preserves product image in storage when referenced in historical design upon product deletion', function () {
    Storage::fake();

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $imagePath = 'products/images/test_preserve.jpg';
    Storage::put($imagePath, 'fake-binary-product-data');

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'image_path' => $imagePath,
    ]);

    Design::factory()->create([
        'user_id' => $user->id,
        'product_id' => $product->id,
        'reference_image_path' => $imagePath,
    ]);

    $response = $this->actingAs($user)->delete(route('products.destroy', $product));

    $response->assertRedirect(route('products.index'));
    expect(Product::find($product->id))->toBeNull()
        ->and(Storage::exists($imagePath))->toBeTrue();
});

it('retrieves reference image contents using Storage::get in ReferenceImageAnalyzer', function () {
    Storage::fake();

    $imagePath = 'generation-requests/test_ref.jpg';
    Storage::put($imagePath, 'dummy-image-contents-for-vision');

    config()->set('services.openai.api_key', 'sk-test-key');

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['composition' => 'minimalist', 'layout' => 'centered'])]],
            ],
        ], 200),
    ]);

    $analyzer = app(ReferenceImageAnalyzer::class);
    $result = $analyzer->analyze($imagePath);

    expect($result)->not->toBeNull()
        ->and($result['composition'])->toBe('minimalist');
});
