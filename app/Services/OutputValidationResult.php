<?php

namespace App\Services;

class OutputValidationResult
{
    /**
     * @param  array{
     *     binary_present: bool,
     *     decodable: bool,
     *     format: string|null,
     *     format_supported: bool,
     *     file_size_bytes: int,
     *     dimensions: array{width: int, height: int}|null,
     *     requested_dimensions: array{width: int, height: int}|null,
     *     dimensions_match: bool|null,
     *     requested_aspect_ratio: string|null,
     *     actual_aspect_ratio: string|null,
     *     aspect_ratio_match: bool|null,
     *     issues: array<int, string>,
     * }  $deterministic
     */
    public function __construct(
        public readonly int $version,
        public readonly string $status,
        public readonly string $validatedAt,
        public readonly array $deterministic
    ) {}

    public function isPass(): bool
    {
        return $this->status === OutputValidationService::STATUS_PASS;
    }

    public function isReview(): bool
    {
        return $this->status === OutputValidationService::STATUS_REVIEW;
    }

    public function isRetry(): bool
    {
        return $this->status === OutputValidationService::STATUS_RETRY;
    }

    /**
     * @return array<int, string>
     */
    public function getIssues(): array
    {
        return $this->deterministic['issues'] ?? [];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'version' => $this->version,
            'status' => $this->status,
            'validated_at' => $this->validatedAt,
            'deterministic' => $this->deterministic,
        ];
    }
}
