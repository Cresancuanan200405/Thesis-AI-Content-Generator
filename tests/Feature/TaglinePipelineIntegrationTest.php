<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\User;
use App\Services\DesignRegenerationService;
use App\Services\ImageCompositorService;
use App\Services\ModularPromptOrchestrator;
use App\Services\TaglineNormalizationService;
use Illuminate\Support\Facades\Storage;

it('verifies TaglineNormalizationService handles all required user prompt normalization cases', function () {
    // Basic cleanup
    expect(TaglineNormalizationService::normalize('  Rich coffee taste  '))->toBe('Rich coffee taste');

    // Outer quotes
    expect(TaglineNormalizationService::normalize('"Rich coffee taste"'))->toBe('Rich coffee taste');
    expect(TaglineNormalizationService::normalize('“Rich coffee taste”'))->toBe('Rich coffee taste');
    expect(TaglineNormalizationService::normalize("'Rich coffee taste'"))->toBe('Rich coffee taste');

    // Trailing period
    expect(TaglineNormalizationService::normalize('Rich coffee taste.'))->toBe('Rich coffee taste');

    // Exclamation mark preserved
    expect(TaglineNormalizationService::normalize('Rich coffee taste!'))->toBe('Rich coffee taste!');

    // Question mark preserved
    expect(TaglineNormalizationService::normalize('Want better coffee?'))->toBe('Want better coffee?');

    // Dangling connectors
    expect(TaglineNormalizationService::normalize('Fresh taste &'))->toBe('Fresh taste');
    expect(TaglineNormalizationService::normalize('Made for you -'))->toBe('Made for you');
    expect(TaglineNormalizationService::normalize('Better coffee —'))->toBe('Better coffee');
    expect(TaglineNormalizationService::normalize('Coffee for everyone /'))->toBe('Coffee for everyone');
    expect(TaglineNormalizationService::normalize('Fresh coffee |'))->toBe('Fresh coffee');

    // Internal punctuation preserved
    expect(TaglineNormalizationService::normalize('Fresh, bold, and delicious'))->toBe('Fresh, bold, and delicious');

    // No rewriting of wording
    expect(TaglineNormalizationService::normalize('Rich caramel sweetness, brewed to perfection'))
        ->toBe('Rich caramel sweetness, brewed to perfection');
});

it('verifies normalized tagline is included in ModularPromptOrchestrator with strict verbatim rule', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $prompt = $orchestrator->orchestrate([
        'product_name' => 'Caramel Machiato',
        'tagline' => '"Rich caramel sweetness, brewed to perfection."',
    ]);

    expect($prompt)->toContain('• TAGLINE: "Rich caramel sweetness, brewed to perfection"')
        ->not->toContain('"Rich caramel sweetness, brewed to perfection."')
        ->toContain('Strict Verbatim Rule: Use the exact wording');
});

it('omits tagline section when tagline is empty or null in ModularPromptOrchestrator', function () {
    $orchestrator = new ModularPromptOrchestrator;

    $promptNull = $orchestrator->orchestrate([
        'product_name' => 'Espresso',
        'tagline' => null,
    ]);

    expect($promptNull)->not->toContain('Tagline:');

    $promptEmpty = $orchestrator->orchestrate([
        'product_name' => 'Espresso',
        'tagline' => '   ',
    ]);

    expect($promptEmpty)->not->toContain('Tagline:');
});

it('ensures ImageCompositorService receives and formats exact normalized tagline', function () {
    $compositor = new ImageCompositorService;

    $manifest = $compositor->generateCompositingManifest([
        'product_name' => 'Caramel Machiato',
        'tagline' => '"Rich caramel sweetness, brewed to perfection..."',
        'aspect_ratio' => '1:1',
    ]);

    expect($manifest['exact_content']['tagline'])->toBe('Rich caramel sweetness, brewed to perfection');
});

it('preserves exact normalized tagline throughout design regeneration', function () {
    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    $originalDesign = Design::factory()->create([
        'user_id' => $user->id,
        'business_id' => $business->id,
        'product_name' => 'Caramel Machiato',
        'tagline' => 'Rich caramel sweetness, brewed to perfection... &',
        'status' => 'completed',
        'generated_image_path' => 'designs/test.png',
        'generation_metadata' => [
            'model' => 'gpt-image-2',
            'scene_prompt' => 'A warm cafe counter setting',
            'aspect_ratio' => '16:9',
        ],
    ]);

    Storage::fake('public');
    Storage::disk('public')->put('designs/test.png', 'dummy');

    $regenerationService = app(DesignRegenerationService::class);
    $regenerated = $regenerationService->regenerate($originalDesign);

    expect($regenerated->tagline)->toBe('Rich caramel sweetness, brewed to perfection')
        ->and($regenerated->tagline)->not->toContain('&')
        ->and($regenerated->tagline)->not->toContain('...');
});
