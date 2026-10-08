<?php

namespace App\Services;

class OutputValidationService
{
    public const VERSION = 1;

    public const STATUS_PASS = 'PASS';

    public const STATUS_REVIEW = 'REVIEW';

    public const STATUS_RETRY = 'RETRY';

    /**
     * Standard MarketPilot target sizes mapped to OpenAI gpt-image-2 dimensions.
     */
    protected const CANONICAL_RATIO_SIZES = [
        '1:1' => ['width' => 1024, 'height' => 1024],
        '16:9' => ['width' => 1792, 'height' => 1024],
        '9:16' => ['width' => 1024, 'height' => 1792],
        '4:5' => ['width' => 1024, 'height' => 1792],
        '4:3' => ['width' => 1792, 'height' => 1024],
    ];

    /**
     * Determine whether the returned generated-image binary is structurally valid
     * and whether its actual image properties match the requested generation contract.
     *
     * @param  string|null  $binary  Raw image data returned by generation pipeline
     * @param  array<string, mixed>  $options  Generation options/contract parameters
     * @param  string|null  $requestedSize  e.g. '1024x1024' or '1792x1024'
     * @param  string|null  $requestedAspectRatio  e.g. '1:1', '9:16', '16:9', '4:5', '4:3'
     */
    public function validate(
        ?string $binary,
        array $options = [],
        ?string $requestedSize = null,
        ?string $requestedAspectRatio = null
    ): OutputValidationResult {
        $validatedAt = now()->toIso8601String();
        $issues = [];
        $status = self::STATUS_PASS;

        // 1. Resolve requested dimensions and aspect ratio from parameters or options
        $reqAspectRatio = $requestedAspectRatio ?: ($options['aspect_ratio'] ?? null);
        $reqDimensions = $this->resolveRequestedDimensions($requestedSize ?: ($options['size'] ?? null), $reqAspectRatio);

        // 2. Binary existence check
        $binaryPresent = ! empty($binary);
        $fileSizeBytes = $binaryPresent ? strlen((string) $binary) : 0;

        if (! $binaryPresent) {
            $issues[] = 'Image binary is missing or empty.';

            return new OutputValidationResult(
                version: self::VERSION,
                status: self::STATUS_RETRY,
                validatedAt: $validatedAt,
                deterministic: [
                    'binary_present' => false,
                    'decodable' => false,
                    'format' => null,
                    'format_supported' => false,
                    'file_size_bytes' => 0,
                    'dimensions' => null,
                    'requested_dimensions' => $reqDimensions,
                    'dimensions_match' => null,
                    'requested_aspect_ratio' => $reqAspectRatio,
                    'actual_aspect_ratio' => null,
                    'aspect_ratio_match' => null,
                    'issues' => $issues,
                ]
            );
        }

        // 3. Image decodability and format identification
        $decodable = false;
        $format = null;
        $formatSupported = false;
        $actualWidth = null;
        $actualHeight = null;

        $imageInfo = @getimagesizefromstring($binary);
        if ($imageInfo !== false && ! empty($imageInfo[0]) && ! empty($imageInfo[1])) {
            $decodable = true;
            $actualWidth = (int) $imageInfo[0];
            $actualHeight = (int) $imageInfo[1];
            $mime = strtolower((string) ($imageInfo['mime'] ?? ''));

            if ($mime === 'image/png' || str_starts_with($binary, "\x89PNG\r\n\x1a\n")) {
                $format = 'png';
                $formatSupported = true;
            } elseif ($mime === 'image/jpeg' || str_starts_with($binary, "\xFF\xD8\xFF")) {
                $format = 'jpeg';
                $formatSupported = true;
            } elseif ($mime === 'image/svg+xml' || $mime === 'image/svg') {
                $format = 'svg';
                $formatSupported = false;
                $status = self::STATUS_REVIEW;
                $issues[] = "Image format 'svg' is not in the expected standard formats (PNG, JPEG).";
            } else {
                $format = str_replace('image/', '', $mime) ?: 'unknown';
                $formatSupported = false;
                $status = self::STATUS_REVIEW;
                $issues[] = "Image format '{$format}' is not in the expected standard formats (PNG, JPEG).";
            }
        } else {
            // Check for SVG vector graphics (often used in test mocks)
            $trimmed = ltrim($binary);
            if (str_starts_with($trimmed, '<svg') || str_contains(substr($trimmed, 0, 300), '<svg')) {
                $decodable = true;
                $format = 'svg';
                $formatSupported = false;
                $status = self::STATUS_REVIEW;
                $issues[] = "Image format 'svg' is not in the expected standard formats (PNG, JPEG).";

                // Extract dimensions from SVG attributes if present
                if (preg_match('/width=["\']([0-9]+)/i', $trimmed, $wMatches) && preg_match('/height=["\']([0-9]+)/i', $trimmed, $hMatches)) {
                    $actualWidth = (int) $wMatches[1];
                    $actualHeight = (int) $hMatches[1];
                } elseif (preg_match('/viewBox=["\']\s*[0-9.]+\s+[0-9.]+\s+([0-9.]+)\s+([0-9.]+)/i', $trimmed, $vbMatches)) {
                    $actualWidth = (int) round((float) $vbMatches[1]);
                    $actualHeight = (int) round((float) $vbMatches[2]);
                }
            } else {
                $decodable = false;
                $status = self::STATUS_RETRY;
                $issues[] = 'Image binary could not be decoded as a valid image format.';
            }
        }

        // If undecodable, early return with RETRY
        if (! $decodable) {
            return new OutputValidationResult(
                version: self::VERSION,
                status: self::STATUS_RETRY,
                validatedAt: $validatedAt,
                deterministic: [
                    'binary_present' => true,
                    'decodable' => false,
                    'format' => null,
                    'format_supported' => false,
                    'file_size_bytes' => $fileSizeBytes,
                    'dimensions' => null,
                    'requested_dimensions' => $reqDimensions,
                    'dimensions_match' => null,
                    'requested_aspect_ratio' => $reqAspectRatio,
                    'actual_aspect_ratio' => null,
                    'aspect_ratio_match' => null,
                    'issues' => $issues,
                ]
            );
        }

        $actualDimensions = ($actualWidth && $actualHeight)
            ? ['width' => $actualWidth, 'height' => $actualHeight]
            : null;

        // 4. Dimension comparison
        $dimensionsMatch = null;
        if ($actualDimensions && $reqDimensions) {
            $dimensionsMatch = ($actualDimensions['width'] === $reqDimensions['width'] && $actualDimensions['height'] === $reqDimensions['height']);
            if (! $dimensionsMatch) {
                if ($status === self::STATUS_PASS) {
                    $status = self::STATUS_REVIEW;
                }
                $issues[] = "Actual dimensions ({$actualDimensions['width']}x{$actualDimensions['height']}) do not match requested dimensions ({$reqDimensions['width']}x{$reqDimensions['height']}).";
            }
        }

        // 5. Aspect ratio calculation and comparison
        $actualAspectRatio = null;
        $aspectRatioMatch = null;
        if ($actualWidth && $actualHeight && $actualWidth > 0 && $actualHeight > 0) {
            $actualAspectRatio = $this->calculateCanonicalAspectRatio($actualWidth, $actualHeight);

            if ($reqAspectRatio) {
                $aspectRatioMatch = $this->matchesRequestedAspectRatio($actualAspectRatio, $reqAspectRatio, $actualWidth, $actualHeight);
                if (! $aspectRatioMatch) {
                    if ($status === self::STATUS_PASS) {
                        $status = self::STATUS_REVIEW;
                    }
                    $issues[] = "Actual aspect ratio ({$actualAspectRatio}) does not match requested aspect ratio ({$reqAspectRatio}).";
                }
            }
        }

        return new OutputValidationResult(
            version: self::VERSION,
            status: $status,
            validatedAt: $validatedAt,
            deterministic: [
                'binary_present' => true,
                'decodable' => true,
                'format' => $format,
                'format_supported' => $formatSupported,
                'file_size_bytes' => $fileSizeBytes,
                'dimensions' => $actualDimensions,
                'requested_dimensions' => $reqDimensions,
                'dimensions_match' => $dimensionsMatch,
                'requested_aspect_ratio' => $reqAspectRatio,
                'actual_aspect_ratio' => $actualAspectRatio,
                'aspect_ratio_match' => $aspectRatioMatch,
                'issues' => $issues,
            ]
        );
    }

    /**
     * Resolve expected image dimensions based on requested size string or aspect ratio.
     *
     * @return array{width: int, height: int}|null
     */
    protected function resolveRequestedDimensions(?string $requestedSize, ?string $aspectRatio): ?array
    {
        if (! empty($requestedSize) && str_contains(strtolower($requestedSize), 'x')) {
            $parts = explode('x', strtolower($requestedSize));
            if (count($parts) === 2 && is_numeric($parts[0]) && is_numeric($parts[1])) {
                return [
                    'width' => (int) $parts[0],
                    'height' => (int) $parts[1],
                ];
            }
        }

        if (! empty($aspectRatio) && isset(self::CANONICAL_RATIO_SIZES[$aspectRatio])) {
            return self::CANONICAL_RATIO_SIZES[$aspectRatio];
        }

        return null;
    }

    /**
     * Calculate closest canonical MarketPilot aspect ratio string from dimensions.
     */
    protected function calculateCanonicalAspectRatio(int $width, int $height): string
    {
        if ($width === $height) {
            return '1:1';
        }

        $ratio = $width / $height;

        // 16:9 nominal = 1.7778, OpenAI landscape = 1792x1024 = 1.75
        if (abs($ratio - 1.7778) <= 0.06 || abs($ratio - 1.75) <= 0.05) {
            return '16:9';
        }

        // 9:16 nominal = 0.5625, OpenAI portrait = 1024x1792 = 0.5714
        if (abs($ratio - 0.5625) <= 0.06 || abs($ratio - 0.5714) <= 0.05) {
            return '9:16';
        }

        // 4:5 nominal = 0.80
        if (abs($ratio - 0.8) <= 0.04) {
            return '4:5';
        }

        // 4:3 nominal = 1.3333
        if (abs($ratio - 1.3333) <= 0.06) {
            return '4:3';
        }

        return "{$width}:{$height}";
    }

    /**
     * Compare actual aspect ratio with requested aspect ratio, accounting for OpenAI dimension mapping.
     */
    protected function matchesRequestedAspectRatio(string $actualRatio, string $requestedRatio, int $width, int $height): bool
    {
        if ($actualRatio === $requestedRatio) {
            return true;
        }

        // In OpenAIImageService, '4:3' maps to '1792x1024' (which is the landscape canvas)
        if ($requestedRatio === '4:3' && $width === 1792 && $height === 1024) {
            return true;
        }

        // In OpenAIImageService, '4:5' maps to '1024x1792' (which is the portrait canvas)
        if ($requestedRatio === '4:5' && $width === 1024 && $height === 1792) {
            return true;
        }

        return false;
    }
}
