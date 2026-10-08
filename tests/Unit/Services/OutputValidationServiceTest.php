<?php

use App\Services\OutputValidationResult;
use App\Services\OutputValidationService;

// Helper to construct a valid PNG binary with arbitrary width and height
function createTestPng(int $width, int $height): string
{
    $basePng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    $ihdr = 'IHDR'.pack('NN', $width, $height).substr($basePng, 24, 5);
    $crc = pack('N', crc32($ihdr));

    return substr($basePng, 0, 12).$ihdr.$crc.substr($basePng, 33);
}

// Minimal valid 1x1 JPEG binary
function createTestJpeg(): string
{
    return base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
}

beforeEach(function () {
    $this->validator = new OutputValidationService;
});

it('validates a valid PNG as PASS with matching dimensions and ratio', function () {
    $png = createTestPng(1024, 1024);

    $result = $this->validator->validate(
        binary: $png,
        options: ['aspect_ratio' => '1:1'],
        requestedSize: '1024x1024',
        requestedAspectRatio: '1:1'
    );

    expect($result)->toBeInstanceOf(OutputValidationResult::class)
        ->and($result->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($result->isPass())->toBeTrue()
        ->and($result->isReview())->toBeFalse()
        ->and($result->isRetry())->toBeFalse()
        ->and($result->version)->toBe(1)
        ->and($result->deterministic['binary_present'])->toBeTrue()
        ->and($result->deterministic['decodable'])->toBeTrue()
        ->and($result->deterministic['format'])->toBe('png')
        ->and($result->deterministic['format_supported'])->toBeTrue()
        ->and($result->deterministic['dimensions'])->toBe(['width' => 1024, 'height' => 1024])
        ->and($result->deterministic['requested_dimensions'])->toBe(['width' => 1024, 'height' => 1024])
        ->and($result->deterministic['dimensions_match'])->toBeTrue()
        ->and($result->deterministic['requested_aspect_ratio'])->toBe('1:1')
        ->and($result->deterministic['actual_aspect_ratio'])->toBe('1:1')
        ->and($result->deterministic['aspect_ratio_match'])->toBeTrue()
        ->and($result->getIssues())->toBeEmpty();
});

it('validates a valid JPEG as PASS', function () {
    $jpeg = createTestJpeg();

    $result = $this->validator->validate(
        binary: $jpeg,
        options: []
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($result->deterministic['format'])->toBe('jpeg')
        ->and($result->deterministic['format_supported'])->toBeTrue()
        ->and($result->deterministic['decodable'])->toBeTrue()
        ->and($result->deterministic['binary_present'])->toBeTrue();
});

it('validates empty or null binary as RETRY', function () {
    $emptyResult = $this->validator->validate(null);
    expect($emptyResult->status)->toBe(OutputValidationService::STATUS_RETRY)
        ->and($emptyResult->isRetry())->toBeTrue()
        ->and($emptyResult->deterministic['binary_present'])->toBeFalse()
        ->and($emptyResult->deterministic['decodable'])->toBeFalse()
        ->and($emptyResult->deterministic['file_size_bytes'])->toBe(0)
        ->and($emptyResult->getIssues())->toContain('Image binary is missing or empty.');

    $blankResult = $this->validator->validate('');
    expect($blankResult->status)->toBe(OutputValidationService::STATUS_RETRY)
        ->and($blankResult->deterministic['binary_present'])->toBeFalse();
});

it('validates invalid or corrupt binary as RETRY', function () {
    $corrupt = 'This is random corrupted data not an image';

    $result = $this->validator->validate(
        binary: $corrupt,
        options: ['aspect_ratio' => '1:1'],
        requestedSize: '1024x1024'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_RETRY)
        ->and($result->isRetry())->toBeTrue()
        ->and($result->deterministic['binary_present'])->toBeTrue()
        ->and($result->deterministic['decodable'])->toBeFalse()
        ->and($result->deterministic['format_supported'])->toBeFalse()
        ->and($result->getIssues())->toContain('Image binary could not be decoded as a valid image format.');
});

it('validates a valid image with matching dimensions as PASS', function () {
    $png = createTestPng(1792, 1024);

    $result = $this->validator->validate(
        binary: $png,
        requestedSize: '1792x1024',
        requestedAspectRatio: '16:9'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($result->deterministic['dimensions_match'])->toBeTrue()
        ->and($result->deterministic['aspect_ratio_match'])->toBeTrue();
});

it('validates a valid image with mismatched dimensions as REVIEW', function () {
    $png = createTestPng(512, 512);

    $result = $this->validator->validate(
        binary: $png,
        requestedSize: '1024x1024',
        requestedAspectRatio: '1:1'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_REVIEW)
        ->and($result->isReview())->toBeTrue()
        ->and($result->isPass())->toBeFalse()
        ->and($result->isRetry())->toBeFalse()
        ->and($result->deterministic['dimensions_match'])->toBeFalse()
        ->and($result->deterministic['aspect_ratio_match'])->toBeTrue()
        ->and($result->getIssues()[0])->toContain('Actual dimensions (512x512) do not match requested dimensions (1024x1024)');
});

it('validates matching aspect ratio as PASS for standard ratios', function () {
    // 16:9 landscape
    $landscape = createTestPng(1792, 1024);
    $resLandscape = $this->validator->validate(
        binary: $landscape,
        requestedAspectRatio: '16:9'
    );
    expect($resLandscape->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($resLandscape->deterministic['aspect_ratio_match'])->toBeTrue();

    // 9:16 portrait
    $portrait = createTestPng(1024, 1792);
    $resPortrait = $this->validator->validate(
        binary: $portrait,
        requestedAspectRatio: '9:16'
    );
    expect($resPortrait->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($resPortrait->deterministic['aspect_ratio_match'])->toBeTrue();
});

it('validates mismatched aspect ratio as REVIEW', function () {
    // Generated image is 1024x1792 (9:16), but user requested 1:1
    $portrait = createTestPng(1024, 1792);

    $result = $this->validator->validate(
        binary: $portrait,
        requestedAspectRatio: '1:1'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_REVIEW)
        ->and($result->isReview())->toBeTrue()
        ->and($result->deterministic['actual_aspect_ratio'])->toBe('9:16')
        ->and($result->deterministic['requested_aspect_ratio'])->toBe('1:1')
        ->and($result->deterministic['aspect_ratio_match'])->toBeFalse()
        ->and($result->getIssues())->toContain('Actual aspect ratio (9:16) does not match requested aspect ratio (1:1).');
});

it('does not crash when optional requested dimensions are missing', function () {
    $png = createTestPng(1024, 1024);

    $result = $this->validator->validate(
        binary: $png,
        options: []
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($result->deterministic['requested_dimensions'])->toBeNull()
        ->and($result->deterministic['dimensions_match'])->toBeNull()
        ->and($result->deterministic['dimensions'])->toBe(['width' => 1024, 'height' => 1024]);
});

it('does not crash when optional aspect ratio is missing', function () {
    $png = createTestPng(1024, 1024);

    $result = $this->validator->validate(
        binary: $png,
        requestedSize: '1024x1024'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($result->deterministic['requested_aspect_ratio'])->toBeNull()
        ->and($result->deterministic['aspect_ratio_match'])->toBeNull()
        ->and($result->deterministic['actual_aspect_ratio'])->toBe('1:1');
});

it('provides stable metadata structure with version present', function () {
    $png = createTestPng(1024, 1024);

    $result = $this->validator->validate($png);
    $array = $result->toArray();

    expect($array)->toHaveKeys(['version', 'status', 'validated_at', 'deterministic'])
        ->and($array['version'])->toBe(OutputValidationService::VERSION)
        ->and($array['deterministic'])->toHaveKeys([
            'binary_present',
            'decodable',
            'format',
            'format_supported',
            'file_size_bytes',
            'dimensions',
            'requested_dimensions',
            'dimensions_match',
            'requested_aspect_ratio',
            'actual_aspect_ratio',
            'aspect_ratio_match',
            'issues',
        ]);
});

it('handles decodable vector format like SVG as REVIEW due to non-standard format', function () {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="100%" height="100%"/></svg>';

    $result = $this->validator->validate(
        binary: $svg,
        requestedSize: '1024x1024',
        requestedAspectRatio: '1:1'
    );

    expect($result->status)->toBe(OutputValidationService::STATUS_REVIEW)
        ->and($result->deterministic['decodable'])->toBeTrue()
        ->and($result->deterministic['format'])->toBe('svg')
        ->and($result->deterministic['format_supported'])->toBeFalse()
        ->and($result->deterministic['dimensions'])->toBe(['width' => 1024, 'height' => 1024])
        ->and($result->deterministic['dimensions_match'])->toBeTrue()
        ->and($result->getIssues()[0])->toContain("Image format 'svg' is not in the expected standard formats");
});

it('supports OpenAI canvas mappings for 4:3 and 4:5', function () {
    // 4:3 requests map to 1792x1024 canvas in OpenAI
    $landscape = createTestPng(1792, 1024);
    $res43 = $this->validator->validate(
        binary: $landscape,
        requestedAspectRatio: '4:3'
    );
    expect($res43->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($res43->deterministic['aspect_ratio_match'])->toBeTrue();

    // 4:5 requests map to 1024x1792 canvas in OpenAI
    $portrait = createTestPng(1024, 1792);
    $res45 = $this->validator->validate(
        binary: $portrait,
        requestedAspectRatio: '4:5'
    );
    expect($res45->status)->toBe(OutputValidationService::STATUS_PASS)
        ->and($res45->deterministic['aspect_ratio_match'])->toBeTrue();
});
