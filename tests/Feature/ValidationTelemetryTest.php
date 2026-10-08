<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\Product;
use App\Models\User;
use App\Services\ValidationTelemetryService;

beforeEach(function () {
    $this->service = app(ValidationTelemetryService::class);
    $this->user = User::factory()->create();
    $this->business = Business::factory()->create([
        'user_id' => $this->user->id,
        'industry' => 'Retail & E-commerce',
        'category' => 'Fashion & Apparel',
    ]);
});

function makeAiDesign(array $attributes = [], array $meta = []): Design
{
    $defaultMeta = array_merge([
        'source' => 'openai',
        'model' => 'gpt-image-2',
        'generation_mode' => 'automatic',
        'generation_method' => 'image_to_image_edit',
        'aspect_ratio' => '1:1',
        'catalog_product_ids' => [1],
    ], $meta);

    return Design::factory()->create(array_merge([
        'generated_image_path' => 'designs/test_design_1.png',
        'generation_metadata' => $defaultMeta,
        'status' => Design::STATUS_FINAL,
    ], $attributes));
}

it('includes valid AI Design in population', function () {
    $design = makeAiDesign(['business_id' => $this->business->id]);

    expect($this->service->isAiDesign($design))->toBeTrue();

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(1);
});

it('excludes demo fixtures with source=demo', function () {
    $demoDesign = Design::factory()->create([
        'business_id' => $this->business->id,
        'generated_image_path' => null,
        'generation_metadata' => ['source' => 'demo'],
    ]);

    expect($this->service->isAiDesign($demoDesign))->toBeFalse();

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(0);
});

it('excludes design without generated image path', function () {
    $noImageDesign = Design::factory()->create([
        'business_id' => $this->business->id,
        'generated_image_path' => null,
        'generation_metadata' => ['source' => 'openai', 'model' => 'gpt-image-2'],
    ]);

    expect($this->service->isAiDesign($noImageDesign))->toBeFalse();

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(0);
});

it('counts AI Design without validation metadata as unvalidated', function () {
    makeAiDesign([
        'business_id' => $this->business->id,
    ], [
        'validation' => null,
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(1)
        ->and($report['population']['validated'])->toBe(0)
        ->and($report['population']['unvalidated'])->toBe(1)
        ->and($report['population']['coverage_percent'])->toBe(0.0);
});

it('counts validated AI Design as validated and computes coverage', function () {
    makeAiDesign([
        'business_id' => $this->business->id,
    ], [
        'validation' => [
            'version' => 1,
            'status' => 'PASS',
            'validated_at' => now()->toIso8601String(),
            'deterministic' => ['issues' => []],
        ],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(1)
        ->and($report['population']['validated'])->toBe(1)
        ->and($report['population']['unvalidated'])->toBe(0)
        ->and($report['population']['coverage_percent'])->toBe(100.0);
});

it('aggregates PASS status count', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => ['status' => 'PASS'],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['statuses']['PASS']['count'])->toBe(1)
        ->and($report['statuses']['PASS']['percent_of_validated'])->toBe(100.0)
        ->and($report['statuses']['REVIEW']['count'])->toBe(0)
        ->and($report['statuses']['RETRY']['count'])->toBe(0);
});

it('aggregates REVIEW status count', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => ['status' => 'REVIEW'],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['statuses']['REVIEW']['count'])->toBe(1)
        ->and($report['statuses']['REVIEW']['percent_of_validated'])->toBe(100.0);
});

it('aggregates RETRY status count', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => ['status' => 'RETRY'],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['statuses']['RETRY']['count'])->toBe(1)
        ->and($report['statuses']['RETRY']['percent_of_validated'])->toBe(100.0);
});

it('calculates status percentages using validated Designs as denominator', function () {
    makeAiDesign(['business_id' => $this->business->id], ['validation' => ['status' => 'PASS']]);
    makeAiDesign(['business_id' => $this->business->id], ['validation' => ['status' => 'PASS']]);
    makeAiDesign(['business_id' => $this->business->id], ['validation' => ['status' => 'REVIEW']]);
    makeAiDesign(['business_id' => $this->business->id], ['validation' => null]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(4)
        ->and($report['population']['validated'])->toBe(3)
        ->and($report['population']['unvalidated'])->toBe(1)
        ->and($report['population']['coverage_percent'])->toBe(75.0)
        ->and($report['statuses']['PASS']['count'])->toBe(2)
        ->and($report['statuses']['PASS']['percent_of_validated'])->toBe(66.67)
        ->and($report['statuses']['REVIEW']['count'])->toBe(1)
        ->and($report['statuses']['REVIEW']['percent_of_validated'])->toBe(33.33)
        ->and($report['statuses']['RETRY']['count'])->toBe(0)
        ->and($report['statuses']['RETRY']['percent_of_validated'])->toBe(0.0);
});

it('does not divide by zero when zero validated designs exist', function () {
    $report = $this->service->generateReport($this->business->id);
    expect($report['population']['ai_designs'])->toBe(0)
        ->and($report['population']['validated'])->toBe(0)
        ->and($report['population']['coverage_percent'])->toBe(0.0)
        ->and($report['statuses']['PASS']['percent_of_validated'])->toBe(0.0)
        ->and($report['statuses']['REVIEW']['percent_of_validated'])->toBe(0.0)
        ->and($report['statuses']['RETRY']['percent_of_validated'])->toBe(0.0);
});

it('aggregates existing validation issue strings exactly as stored', function () {
    $issueA = 'Actual dimensions (512x512) do not match requested dimensions (1024x1024).';
    $issueB = 'Actual aspect ratio (16:9) does not match requested aspect ratio (1:1).';

    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => [
            'status' => 'REVIEW',
            'deterministic' => ['issues' => [$issueA, $issueB]],
        ],
    ]);
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => [
            'status' => 'REVIEW',
            'deterministic' => ['issues' => [$issueA]],
        ],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['issues'][$issueA])->toBe(2)
        ->and($report['issues'][$issueB])->toBe(1);
});

it('does not produce issue entries when issues are empty or absent', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => [
            'status' => 'PASS',
            'deterministic' => ['issues' => []],
        ],
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['issues'])->toBeEmpty();
});

it('counts unique modern catalog product IDs', function () {
    $design = makeAiDesign(['business_id' => $this->business->id], [
        'catalog_product_ids' => [101, 102],
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(2);
});

it('does not inflate count when duplicate catalog IDs exist in metadata', function () {
    $design = makeAiDesign(['business_id' => $this->business->id], [
        'catalog_product_ids' => [101, 101, 102],
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(2);
});

it('counts custom products in metadata', function () {
    $design = makeAiDesign(['business_id' => $this->business->id], [
        'catalog_product_ids' => [],
        'custom_products' => [
            ['name' => 'Custom Item A', 'price' => 50],
            ['name' => 'Custom Item B', 'price' => 75],
        ],
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(2);
});

it('counts mixed catalog and custom products correctly', function () {
    $design = makeAiDesign(['business_id' => $this->business->id], [
        'catalog_product_ids' => [201, 202],
        'custom_products' => [
            ['name' => 'Custom Item C'],
        ],
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(3);

    $bucket = $this->service->formatProductCountBucket($count);
    expect($bucket)->toBe('3+ products');
});

it('falls back to 1 product for historical records without catalog_product_ids', function () {
    $product = Product::factory()->create(['business_id' => $this->business->id]);

    $design = makeAiDesign([
        'business_id' => $this->business->id,
        'product_id' => $product->id,
        'product_name' => 'Classic Vintage Shirt',
    ], [
        'catalog_product_ids' => null,
        'custom_products' => null,
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(1);
    expect($this->service->formatProductCountBucket($count))->toBe('1 product');
});

it('keeps product count as 0 when metadata and model lack product evidence', function () {
    $design = makeAiDesign([
        'business_id' => $this->business->id,
        'product_id' => null,
        'product_name' => '',
    ], [
        'catalog_product_ids' => [],
        'custom_products' => [],
        'product_name' => null,
    ]);

    $count = $this->service->calculateProductCount($design, $design->generation_metadata);
    expect($count)->toBe(0);
    expect($this->service->formatProductCountBucket($count))->toBe('0 products');
});

it('aggregates generation mode correctly', function () {
    makeAiDesign(['business_id' => $this->business->id], ['generation_mode' => 'automatic']);
    makeAiDesign(['business_id' => $this->business->id], ['generation_mode' => 'manual']);
    makeAiDesign(['business_id' => $this->business->id], ['generation_mode' => null]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['generation_mode']['automatic'])->toBe(1)
        ->and($report['generation_mode']['manual'])->toBe(1)
        ->and($report['generation_mode']['unknown'])->toBe(1);
});

it('aggregates generation method correctly', function () {
    makeAiDesign(['business_id' => $this->business->id], ['generation_method' => 'multi_image_to_image_edit']);
    makeAiDesign(['business_id' => $this->business->id], ['generation_method' => 'image_to_image_edit']);

    $report = $this->service->generateReport($this->business->id);
    expect($report['generation_method']['multi_image_to_image_edit'])->toBe(1)
        ->and($report['generation_method']['image_to_image_edit'])->toBe(1);
});

it('aggregates model correctly', function () {
    makeAiDesign(['business_id' => $this->business->id], ['model' => 'gpt-image-2']);

    $report = $this->service->generateReport($this->business->id);
    expect($report['model']['gpt-image-2'])->toBe(1);
});

it('aggregates aspect ratio correctly', function () {
    makeAiDesign(['business_id' => $this->business->id], ['aspect_ratio' => '16:9']);
    makeAiDesign(['business_id' => $this->business->id], ['aspect_ratio' => '1:1']);

    $report = $this->service->generateReport($this->business->id);
    expect($report['aspect_ratio']['16:9'])->toBe(1)
        ->and($report['aspect_ratio']['1:1'])->toBe(1);
});

it('aggregates industry and category through business relationship', function () {
    makeAiDesign(['business_id' => $this->business->id]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['industry']['Retail & E-commerce'])->toBe(1)
        ->and($report['category']['Fashion & Apparel'])->toBe(1);
});

it('classifies regenerated design correctly via lineage metadata', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'regenerated_from_design_id' => 42,
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['lineage']['Regenerated'])->toBe(1)
        ->and($report['lineage']['Original / non-regenerated'])->toBe(0);
});

it('classifies original design correctly', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'regenerated_from_design_id' => null,
    ]);

    $report = $this->service->generateReport($this->business->id);
    expect($report['lineage']['Original / non-regenerated'])->toBe(1)
        ->and($report['lineage']['Regenerated'])->toBe(0);
});

it('does not leak other tenants data when businessId is specified', function () {
    $otherBusiness = Business::factory()->create();

    makeAiDesign(['business_id' => $this->business->id]);
    makeAiDesign(['business_id' => $otherBusiness->id]);

    $tenantReport = $this->service->generateReport($this->business->id);
    expect($tenantReport['population']['ai_designs'])->toBe(1);

    $otherReport = $this->service->generateReport($otherBusiness->id);
    expect($otherReport['population']['ai_designs'])->toBe(1);
});

it('executes artisan validation:telemetry command successfully', function () {
    makeAiDesign(['business_id' => $this->business->id], [
        'validation' => [
            'status' => 'PASS',
            'deterministic' => ['issues' => []],
        ],
    ]);

    $this->artisan('validation:telemetry', ['--business' => $this->business->id])
        ->expectsOutputToContain('MarketPilot Validation Telemetry')
        ->expectsOutputToContain("Scope: Business #{$this->business->id}")
        ->expectsOutputToContain('AI Designs:             1')
        ->expectsOutputToContain('Validated:               1')
        ->expectsOutputToContain('Coverage:              100.00%')
        ->expectsOutputToContain('PASS:                    1  (100.00%)')
        ->assertSuccessful();
});
