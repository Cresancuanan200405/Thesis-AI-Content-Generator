<?php

namespace App\Services;

use App\Models\Design;
use Illuminate\Database\Eloquent\Collection;

class ValidationTelemetryService
{
    /**
     * Determine if a Design record satisfies the canonical AI-generated predicate.
     */
    public function isAiDesign(Design $design): bool
    {
        $meta = is_array($design->generation_metadata)
            ? $design->generation_metadata
            : [];

        $source = $meta['source'] ?? null;

        return ! empty($design->generated_image_path)
            && is_array($design->generation_metadata)
            && (
                $source === 'openai'
                || isset($meta['model'])
                || isset($meta['generation_mode'])
                || isset($meta['validation'])
            )
            && $source !== 'demo';
    }

    /**
     * Determine if an AI Design contains a valid validation status object.
     *
     * @param  array<string, mixed>  $meta
     */
    public function isValidated(array $meta): bool
    {
        return isset($meta['validation'])
            && is_array($meta['validation'])
            && isset($meta['validation']['status'])
            && is_string($meta['validation']['status']);
    }

    /**
     * Calculate normalized product count for an AI Design using verified historical fallback.
     *
     * @param  array<string, mixed>  $meta
     */
    public function calculateProductCount(Design $design, array $meta): int
    {
        $catalogCount = count(
            is_array($meta['catalog_product_ids'] ?? null)
                ? array_unique($meta['catalog_product_ids'])
                : []
        );

        $customCount = count(
            is_array($meta['custom_products'] ?? null)
                ? $meta['custom_products']
                : []
        );

        $totalCount = $catalogCount + $customCount;

        if (
            $totalCount === 0
            && (
                ! empty($design->product_id)
                || ! empty($design->product_name)
                || ! empty($meta['product_name'])
            )
        ) {
            $totalCount = 1;
        }

        return $totalCount;
    }

    /**
     * Format product count into a readable display bucket.
     */
    public function formatProductCountBucket(int $count): string
    {
        return match (true) {
            $count === 1 => '1 product',
            $count === 2 => '2 products',
            $count >= 3 => '3+ products',
            default => '0 products',
        };
    }

    /**
     * Generate comprehensive telemetry diagnostics report from persisted designs.
     *
     * @return array{
     *     population: array{
     *         ai_designs: int,
     *         validated: int,
     *         unvalidated: int,
     *         coverage_percent: float,
     *     },
     *     statuses: array{
     *         PASS: array{count: int, percent_of_validated: float},
     *         REVIEW: array{count: int, percent_of_validated: float},
     *         RETRY: array{count: int, percent_of_validated: float},
     *     },
     *     issues: array<string, int>,
     *     generation_mode: array<string, int>,
     *     generation_method: array<string, int>,
     *     model: array<string, int>,
     *     aspect_ratio: array<string, int>,
     *     product_count: array<string, int>,
     *     industry: array<string, int>,
     *     category: array<string, int>,
     *     lineage: array<string, int>,
     *     campaign: array{with_campaign: int, no_campaign: int},
     *     event: array{with_event: int, no_event: int},
     * }
     */
    public function generateReport(?int $businessId = null, bool $includeDeleted = true): array
    {
        $query = Design::query()->with('business');

        if ($includeDeleted) {
            $query->withTrashed();
        }

        if ($businessId !== null) {
            $query->where('business_id', $businessId);
        }

        /** @var Collection<int, Design> $designs */
        $designs = $query->get();

        return $this->aggregateDesigns($designs);
    }

    /**
     * Aggregate telemetry data from an existing collection of Design models.
     *
     * @param  iterable<Design>  $designs
     * @return array{
     *     population: array{
     *         ai_designs: int,
     *         validated: int,
     *         unvalidated: int,
     *         coverage_percent: float,
     *     },
     *     statuses: array<string, array{count: int, percent_of_validated: float}>,
     *     issues: array<string, int>,
     *     generation_mode: array<string, int>,
     *     generation_method: array<string, int>,
     *     model: array<string, int>,
     *     aspect_ratio: array<string, int>,
     *     product_count: array<string, int>,
     *     industry: array<string, int>,
     *     category: array<string, int>,
     *     lineage: array<string, int>,
     *     campaign: array{with_campaign: int, no_campaign: int},
     *     event: array{with_event: int, no_event: int},
     * }
     */
    public function aggregateDesigns(iterable $designs): array
    {
        $aiDesignsCount = 0;
        $validatedCount = 0;
        $unvalidatedCount = 0;

        $statuses = [
            'PASS' => 0,
            'REVIEW' => 0,
            'RETRY' => 0,
        ];

        $issuesMap = [];
        $generationModeMap = [];
        $generationMethodMap = [];
        $modelMap = [];
        $aspectRatioMap = [];
        $productCountMap = [
            '1 product' => 0,
            '2 products' => 0,
            '3+ products' => 0,
        ];
        $industryMap = [];
        $categoryMap = [];
        $lineageMap = [
            'Original / non-regenerated' => 0,
            'Regenerated' => 0,
        ];
        $campaignMap = [
            'with_campaign' => 0,
            'no_campaign' => 0,
        ];
        $eventMap = [
            'with_event' => 0,
            'no_event' => 0,
        ];

        foreach ($designs as $design) {
            if (! $this->isAiDesign($design)) {
                continue;
            }

            $aiDesignsCount++;
            $meta = is_array($design->generation_metadata) ? $design->generation_metadata : [];

            $isValidated = $this->isValidated($meta);

            if ($isValidated) {
                $validatedCount++;
                $status = strtoupper((string) ($meta['validation']['status'] ?? ''));

                if (isset($statuses[$status])) {
                    $statuses[$status]++;
                } else {
                    $statuses[$status] = 1;
                }

                // Aggregate issues exactly as stored
                $issues = $meta['validation']['deterministic']['issues'] ?? [];
                if (is_array($issues)) {
                    foreach ($issues as $issue) {
                        if (is_string($issue) && trim($issue) !== '') {
                            $issuesMap[$issue] = ($issuesMap[$issue] ?? 0) + 1;
                        }
                    }
                }
            } else {
                $unvalidatedCount++;
            }

            // Existing dimensions for eligible AI Designs
            // Generation mode
            $mode = ! empty($meta['generation_mode']) ? (string) $meta['generation_mode'] : 'unknown';
            $generationModeMap[$mode] = ($generationModeMap[$mode] ?? 0) + 1;

            // Generation method
            $method = ! empty($meta['generation_method']) ? (string) $meta['generation_method'] : 'unknown';
            $generationMethodMap[$method] = ($generationMethodMap[$method] ?? 0) + 1;

            // Model
            $model = ! empty($meta['model']) ? (string) $meta['model'] : 'unknown';
            $modelMap[$model] = ($modelMap[$model] ?? 0) + 1;

            // Aspect ratio
            $aspectRatio = ! empty($meta['aspect_ratio']) ? (string) $meta['aspect_ratio'] : 'unknown';
            $aspectRatioMap[$aspectRatio] = ($aspectRatioMap[$aspectRatio] ?? 0) + 1;

            // Product count with historical normalization
            $prodCount = $this->calculateProductCount($design, $meta);
            $bucket = $this->formatProductCountBucket($prodCount);
            $productCountMap[$bucket] = ($productCountMap[$bucket] ?? 0) + 1;

            // Industry & Category
            $industry = $design->business?->industry ?: 'unknown';
            $category = $design->business?->category ?: 'unknown';
            $industryMap[$industry] = ($industryMap[$industry] ?? 0) + 1;
            $categoryMap[$category] = ($categoryMap[$category] ?? 0) + 1;

            // Lineage
            $isRegenerated = ! empty($meta['regenerated_from_design_id']);
            $lineageKey = $isRegenerated ? 'Regenerated' : 'Original / non-regenerated';
            $lineageMap[$lineageKey] = ($lineageMap[$lineageKey] ?? 0) + 1;

            // Campaign & Event
            if (! empty($design->campaign_id)) {
                $campaignMap['with_campaign']++;
            } else {
                $campaignMap['no_campaign']++;
            }

            if (! empty($design->event_id)) {
                $eventMap['with_event']++;
            } else {
                $eventMap['no_event']++;
            }
        }

        // Calculate percentages
        $coveragePercent = $aiDesignsCount > 0 ? round(($validatedCount / $aiDesignsCount) * 100, 2) : 0.0;

        $statusesReport = [];
        foreach (['PASS', 'REVIEW', 'RETRY'] as $st) {
            $cnt = $statuses[$st] ?? 0;
            $statusesReport[$st] = [
                'count' => $cnt,
                'percent_of_validated' => $validatedCount > 0 ? round(($cnt / $validatedCount) * 100, 2) : 0.0,
            ];
        }

        // Include any non-standard status if encountered
        foreach ($statuses as $stKey => $stCount) {
            if (! isset($statusesReport[$stKey])) {
                $statusesReport[$stKey] = [
                    'count' => $stCount,
                    'percent_of_validated' => $validatedCount > 0 ? round(($stCount / $validatedCount) * 100, 2) : 0.0,
                ];
            }
        }

        // Clean empty 0-count bucket from product count if not applicable
        if (($productCountMap['0 products'] ?? 0) === 0) {
            unset($productCountMap['0 products']);
        }

        // Sort issues by frequency descending
        arsort($issuesMap);

        return [
            'population' => [
                'ai_designs' => $aiDesignsCount,
                'validated' => $validatedCount,
                'unvalidated' => $unvalidatedCount,
                'coverage_percent' => $coveragePercent,
            ],
            'statuses' => $statusesReport,
            'issues' => $issuesMap,
            'generation_mode' => $generationModeMap,
            'generation_method' => $generationMethodMap,
            'model' => $modelMap,
            'aspect_ratio' => $aspectRatioMap,
            'product_count' => $productCountMap,
            'industry' => $industryMap,
            'category' => $categoryMap,
            'lineage' => $lineageMap,
            'campaign' => $campaignMap,
            'event' => $eventMap,
        ];
    }
}
