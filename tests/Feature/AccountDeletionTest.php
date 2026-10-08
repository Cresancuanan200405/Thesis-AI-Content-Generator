<?php

use App\Models\Business;
use App\Models\Campaign;
use App\Models\Design;
use App\Models\Event;
use App\Models\GenerationRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\AccountDeletionService;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');
    Storage::fake('local');
});

test('1. basic account deletion: user and business are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect(User::find($user->id))->toBeNull()
        ->and(Business::find($business->id))->toBeNull();
});

test('2. product cleanup: product rows and image files are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $imagePath = 'products/images/product_test_123.jpg';

    Storage::disk('public')->put($imagePath, 'fake-image-data');
    Storage::disk('public')->assertExists($imagePath);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'image_path' => $imagePath,
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Product::find($product->id))->toBeNull();
    Storage::disk('public')->assertMissing($imagePath);
});

test('3. soft-deleted product cleanup: soft-deleted product and image are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $imagePath = 'products/images/product_soft_deleted_456.jpg';

    Storage::disk('public')->put($imagePath, 'fake-soft-product-image');
    Storage::disk('public')->assertExists($imagePath);

    $product = Product::factory()->create([
        'business_id' => $business->id,
        'image_path' => $imagePath,
    ]);

    // Soft delete the product prior to account deletion
    $product->delete();
    expect($product->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Product::withTrashed()->find($product->id))->toBeNull();
    Storage::disk('public')->assertMissing($imagePath);
});

test('4. design cleanup: generated design rows and image files are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $designImage = 'designs/design_complete_789.png';

    Storage::disk('public')->put($designImage, 'fake-generated-design-image');
    Storage::disk('public')->assertExists($designImage);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'generated_image_path' => $designImage,
        'status' => Design::STATUS_COMPLETED,
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Design::find($design->id))->toBeNull();
    Storage::disk('public')->assertMissing($designImage);
});

test('5. soft-deleted design cleanup: soft-deleted designs and their files are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);
    $designImage = 'designs/design_soft_deleted_321.png';

    Storage::disk('public')->put($designImage, 'fake-soft-design-image');
    Storage::disk('public')->assertExists($designImage);

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'generated_image_path' => $designImage,
    ]);

    // Soft delete the design
    $design->delete();
    expect($design->fresh()->trashed())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Design::withTrashed()->find($design->id))->toBeNull();
    Storage::disk('public')->assertMissing($designImage);
});

test('6. reference image cleanup: generation request and design reference files are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $designRefPath = 'generation-requests/design_ref_999.png';
    $genReqRefPath = 'generation-requests/request_ref_888.png';

    Storage::disk('public')->put($designRefPath, 'fake-design-ref');
    Storage::disk('public')->put($genReqRefPath, 'fake-genreq-ref');

    $design = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'reference_image_path' => $designRefPath,
    ]);

    $genRequest = GenerationRequest::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Sample Product',
        'marketing_goal' => 'Brand awareness',
        'prompt' => 'Sample prompt for test',
        'reference_image_path' => $genReqRefPath,
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(GenerationRequest::find($genRequest->id))->toBeNull()
        ->and(Design::find($design->id))->toBeNull();

    Storage::disk('public')->assertMissing($designRefPath);
    Storage::disk('public')->assertMissing($genReqRefPath);
});

test('7. business document cleanup: private registration document is removed from local disk', function () {
    $user = User::factory()->create();
    $docPath = 'business-documents/'.$user->id.'/permit_123.pdf';

    Storage::disk('local')->put($docPath, 'fake-confidential-pdf');
    Storage::disk('local')->assertExists($docPath);

    $business = Business::factory()->create([
        'user_id' => $user->id,
        'business_registration_document_path' => $docPath,
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    Storage::disk('local')->assertMissing($docPath);
});

test('8. campaign cleanup: campaign records are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $campaign = Campaign::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'name' => 'Summer Sale 2026',
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Campaign::find($campaign->id))->toBeNull();
});

test('9. custom event cleanup: user-owned non-global events are permanently removed', function () {
    $user = User::factory()->create();

    $customEvent = Event::factory()->create([
        'user_id' => $user->id,
        'name' => 'Store Anniversary Special',
        'is_global' => false,
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Event::find($customEvent->id))->toBeNull();
});

test('10. global event preservation: global Philippine holidays remain untouched', function () {
    $user = User::factory()->create();

    $globalHoliday = Event::factory()->global()->create([
        'name' => 'Philippine Independence Day',
        'date' => '2026-06-12',
        'is_global' => true,
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Event::find($globalHoliday->id))->not->toBeNull()
        ->and(Event::find($globalHoliday->id)->name)->toBe('Philippine Independence Day')
        ->and(Event::find($globalHoliday->id)->is_global)->toBeTrue();
});

test('11. design lineage: regenerated designs with lineage can be deleted without FK failure', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $originalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'generated_image_path' => 'designs/orig_111.png',
        'status' => Design::STATUS_COMPLETED,
    ]);

    $regeneratedDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'generated_image_path' => 'designs/regen_222.png',
        'generation_metadata' => [
            'source_design_id' => $originalDesign->id,
            'generation_mode' => 'automatic',
        ],
        'status' => Design::STATUS_COMPLETED,
    ]);

    Storage::disk('public')->put('designs/orig_111.png', 'orig');
    Storage::disk('public')->put('designs/regen_222.png', 'regen');

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Design::find($originalDesign->id))->toBeNull()
        ->and(Design::find($regeneratedDesign->id))->toBeNull();
    Storage::disk('public')->assertMissing('designs/orig_111.png');
    Storage::disk('public')->assertMissing('designs/regen_222.png');
});

test('12. draft cleanup: draft designs and generation requests are removed', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $draftDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'status' => Design::STATUS_DRAFT,
    ]);

    $genRequest = GenerationRequest::create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Draft Product',
        'marketing_goal' => 'Launch',
        'prompt' => 'Draft prompt',
        'status' => 'draft',
    ]);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(Design::find($draftDesign->id))->toBeNull()
        ->and(GenerationRequest::find($genRequest->id))->toBeNull();
});

test('13. tenant isolation: deleting User A leaves User B data and files completely untouched', function () {
    // User A
    $userA = User::factory()->create();
    $prodImageA = 'products/images/user_a_product.jpg';
    $designImageA = 'designs/user_a_design.png';
    $docPathA = 'business-documents/'.$userA->id.'/permit_a.pdf';

    $businessA = Business::factory()->create([
        'user_id' => $userA->id,
        'business_registration_document_path' => $docPathA,
    ]);

    Storage::disk('public')->put($prodImageA, 'user-a-product');
    Storage::disk('public')->put($designImageA, 'user-a-design');
    Storage::disk('local')->put($docPathA, 'user-a-doc');

    $productA = Product::factory()->create(['business_id' => $businessA->id, 'image_path' => $prodImageA]);
    $designA = Design::factory()->create(['user_id' => $userA->id, 'business_id' => $businessA->id, 'generated_image_path' => $designImageA]);
    $campaignA = Campaign::factory()->create(['user_id' => $userA->id, 'business_id' => $businessA->id]);
    $eventA = Event::factory()->create(['user_id' => $userA->id, 'is_global' => false]);

    // User B
    $userB = User::factory()->create();
    $prodImageB = 'products/images/user_b_product.jpg';
    $designImageB = 'designs/user_b_design.png';
    $docPathB = 'business-documents/'.$userB->id.'/permit_b.pdf';

    $businessB = Business::factory()->create([
        'user_id' => $userB->id,
        'business_registration_document_path' => $docPathB,
    ]);

    Storage::disk('public')->put($prodImageB, 'user-b-product');
    Storage::disk('public')->put($designImageB, 'user-b-design');
    Storage::disk('local')->put($docPathB, 'user-b-doc');

    $productB = Product::factory()->create(['business_id' => $businessB->id, 'image_path' => $prodImageB]);
    $designB = Design::factory()->create(['user_id' => $userB->id, 'business_id' => $businessB->id, 'generated_image_path' => $designImageB]);
    $campaignB = Campaign::factory()->create(['user_id' => $userB->id, 'business_id' => $businessB->id]);
    $eventB = Event::factory()->create(['user_id' => $userB->id, 'is_global' => false]);

    // Delete User A
    $this->actingAs($userA)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    // User A resources are gone
    expect(User::find($userA->id))->toBeNull()
        ->and(Business::find($businessA->id))->toBeNull()
        ->and(Product::find($productA->id))->toBeNull()
        ->and(Design::find($designA->id))->toBeNull()
        ->and(Campaign::find($campaignA->id))->toBeNull()
        ->and(Event::find($eventA->id))->toBeNull();
    Storage::disk('public')->assertMissing($prodImageA);
    Storage::disk('public')->assertMissing($designImageA);
    Storage::disk('local')->assertMissing($docPathA);

    // User B resources and files remain perfectly preserved!
    expect(User::find($userB->id))->not->toBeNull()
        ->and(Business::find($businessB->id))->not->toBeNull()
        ->and(Product::find($productB->id))->not->toBeNull()
        ->and(Design::find($designB->id))->not->toBeNull()
        ->and(Campaign::find($campaignB->id))->not->toBeNull()
        ->and(Event::find($eventB->id))->not->toBeNull();
    Storage::disk('public')->assertExists($prodImageB);
    Storage::disk('public')->assertExists($designImageB);
    Storage::disk('local')->assertExists($docPathB);
});

test('14. oauth deletion: an OAuth user without a usable local password can delete account via confirmation flow', function () {
    $oauthUser = User::factory()->create([
        'provider_name' => 'google',
        'provider_id' => 'google-oauth-id-998877',
    ]);

    expect($oauthUser->hasUsablePassword())->toBeFalse();

    // Attempting to delete without confirmation fails with validation error
    $this->actingAs($oauthUser)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'confirmation' => '',
        ])
        ->assertSessionHasErrors(['confirmation'])
        ->assertRedirect(route('profile.edit'));

    expect(User::find($oauthUser->id))->not->toBeNull();

    // Attempting with wrong confirmation keyword also fails
    $this->actingAs($oauthUser)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'confirmation' => 'NOT_DELETE',
        ])
        ->assertSessionHasErrors(['confirmation'])
        ->assertRedirect(route('profile.edit'));

    expect(User::find($oauthUser->id))->not->toBeNull();

    // Deleting with correct confirmation keyword succeeds
    $this->actingAs($oauthUser)
        ->delete(route('profile.destroy'), [
            'confirmation' => 'DELETE',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect(User::find($oauthUser->id))->toBeNull();
});

test('15. missing file resilience: account deletion succeeds even if recorded files do not physically exist', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create([
        'user_id' => $user->id,
        'business_registration_document_path' => 'business-documents/'.$user->id.'/already_gone.pdf',
    ]);
    Product::factory()->create([
        'business_id' => $business->id,
        'image_path' => 'products/images/missing_photo.png',
    ]);
    Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'generated_image_path' => 'designs/already_missing.png',
        'reference_image_path' => 'generation-requests/already_missing_ref.png',
    ]);

    // Verify none of the files exist in storage
    Storage::disk('public')->assertMissing('products/images/missing_photo.png');
    Storage::disk('public')->assertMissing('designs/already_missing.png');
    Storage::disk('public')->assertMissing('generation-requests/already_missing_ref.png');
    Storage::disk('local')->assertMissing('business-documents/'.$user->id.'/already_gone.pdf');

    // Account deletion should complete smoothly without error
    $this->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    expect(User::find($user->id))->toBeNull()
        ->and(Business::find($business->id))->toBeNull();
});

test('16. storage failure behavior: filesystem exception does not rollback database deletion and is logged', function () {
    Log::spy();

    $user = User::factory()->create();
    $business = Business::factory()->create([
        'user_id' => $user->id,
    ]);
    $filePath = 'products/images/throw_exception.jpg';
    Product::factory()->create([
        'business_id' => $business->id,
        'image_path' => $filePath,
    ]);

    Storage::disk('public')->put($filePath, 'content');

    // Create a mock disk that throws on delete
    $mockDisk = Mockery::mock(Filesystem::class);
    $mockDisk->shouldReceive('exists')->with($filePath)->andReturn(true);
    $mockDisk->shouldReceive('delete')->with($filePath)->andThrow(new RuntimeException('Simulated storage disk failure'));

    Storage::set('public', $mockDisk);

    $service = app(AccountDeletionService::class);
    $result = $service->deleteUser($user);

    // The user database record was successfully committed and removed
    expect(User::find($user->id))->toBeNull()
        ->and(Business::find($business->id))->toBeNull()
        ->and($result['failed_files_count'])->toBe(1);

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn ($message) => str_contains($message, 'Simulated storage disk failure'));
});

test('17. repeated or idempotent cleanup: deleting nonexistent files is safely handled', function () {
    $user = User::factory()->create();
    $business = Business::factory()->create(['user_id' => $user->id]);

    $service = app(AccountDeletionService::class);
    $paths = $service->collectTenantFilePaths($user);

    expect($paths)->toBeArray()
        ->and($paths['public'])->toBeArray()
        ->and($paths['local'])->toBeArray();

    $result = $service->deleteUser($user);
    expect($result['user_id'])->toBe($user->id)
        ->and(User::find($user->id))->toBeNull();
});
