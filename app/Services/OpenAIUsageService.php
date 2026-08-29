<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIUsageService
{
    /**
     * Cache duration for organization telemetry in seconds (10 minutes).
     */
    public const CACHE_TTL = 600;

    /**
     * Fetch authoritative live billed OpenAI organization usage and cost metrics.
     * Caches responses at the organization and monthly reporting period scope.
     *
     * @return array{
     *     status: string,
     *     application_configured_limit: float,
     *     budget_limit: float,
     *     total_spent: float|null,
     *     input_tokens: int|null,
     *     total_tokens: int|null,
     *     total_requests: int|null,
     *     total_images: int|null,
     *     api_credit_balance: float|null,
     *     credit_balance_available: bool,
     *     credit_balance_source: string,
     *     remaining_configured_limit: float|null,
     *     remaining_budget: float|null,
     *     percentage_used: float|null,
     *     is_limit_reached: bool,
     *     is_live_account: bool,
     *     source: string,
     *     reporting_period: string,
     *     last_synced_at: string,
     *     organization_id: string|null,
     *     organization_name: string|null,
     *     error_message: string|null,
     * }
     */
    public function getUsage(?User $user = null, ?float $budgetLimit = null, bool $forceRefresh = false): array
    {
        $budgetLimit = $budgetLimit ?? (float) config('services.openai.budget_limit', 10.00);
        $adminKey = config('services.openai.admin_key') ?: config('services.openai.api_key');
        $orgId = config('services.openai.organization');
        $periodKey = Carbon::now()->format('Y-m');

        if (blank($adminKey)) {
            return $this->getUnavailableUsage($budgetLimit, 'OpenAI API key or Admin key is not configured.');
        }

        $cacheKey = 'openai_org_telemetry_'.md5((string) $adminKey.(string) $orgId.'_'.$periodKey);

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        try {
            $usage = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($adminKey, $orgId, $budgetLimit): array {
                return $this->fetchAuthoritativeOrganizationUsage($adminKey, $orgId, $budgetLimit);
            });

            if ($user && isset($usage['total_spent'], $usage['application_configured_limit'])) {
                NotificationService::checkUsageThresholds($user, (float) $usage['total_spent'], (float) $usage['application_configured_limit']);
            }

            return $usage;
        } catch (Exception $e) {
            Log::warning('OpenAI organization telemetry fetch exception: '.$e->getMessage());

            // Check if a previously cached value exists before returning unavailable
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                $cached['status'] = 'stale';
                $cached['error_message'] = 'Using cached organization telemetry. Live refresh failed: '.$e->getMessage();

                if ($user && isset($cached['total_spent'], $cached['application_configured_limit'])) {
                    NotificationService::checkUsageThresholds($user, (float) $cached['total_spent'], (float) $cached['application_configured_limit']);
                }

                return $cached;
            }

            return $this->getUnavailableUsage($budgetLimit, 'Could not retrieve live telemetry from OpenAI: '.$e->getMessage());
        }
    }

    /**
     * Query authoritative OpenAI organization usage endpoints with pagination and exact period extraction.
     *
     * @return array{
     *     status: string,
     *     application_configured_limit: float,
     *     budget_limit: float,
     *     total_spent: float,
     *     input_tokens: int,
     *     total_tokens: int,
     *     total_requests: int,
     *     total_images: int,
     *     api_credit_balance: float|null,
     *     credit_balance_available: bool,
     *     credit_balance_source: string,
     *     remaining_configured_limit: float,
     *     remaining_budget: float,
     *     percentage_used: float,
     *     is_limit_reached: bool,
     *     is_live_account: bool,
     *     source: string,
     *     reporting_period: string,
     *     last_synced_at: string,
     *     organization_id: string|null,
     *     organization_name: string|null,
     *     error_message: null,
     * }
     */
    protected function fetchAuthoritativeOrganizationUsage(string $adminKey, ?string $orgId, float $budgetLimit): array
    {
        $startTime = Carbon::now()->startOfMonth()->timestamp;
        $periodLabel = Carbon::now()->format('F Y');

        // 1. Fetch live billed costs from OpenAI Costs API (fully paginated)
        $costData = $this->fetchOrganizationBilledCosts($adminKey, $orgId, $startTime);
        $totalCost = $costData['total_cost'];
        $orgName = $costData['organization_name'] ?? 'FSUU';

        // 2. Fetch live token usage and request count from OpenAI Completions Usage API (fully paginated)
        $completionsData = $this->fetchOrganizationCompletionsUsage($adminKey, $orgId, $startTime);
        $totalTokens = $completionsData['input_tokens'];
        $totalRequests = $completionsData['num_model_requests'];

        // 3. Fetch live image generation counts from OpenAI Images Usage API (fully paginated)
        $totalImages = $this->fetchOrganizationImagesCount($adminKey, $orgId, $startTime);

        // 4. Fetch live credit balance if exposed by the billing API
        $creditBalance = $this->fetchApiCreditBalance($adminKey, $orgId);

        $remaining = max(0.0, round($budgetLimit - $totalCost, 2));
        $percentageUsed = $budgetLimit > 0 ? round(($totalCost / $budgetLimit) * 100, 1) : 0.0;

        // Diagnostic log without secrets
        Log::info('OpenAI Telemetry Synced', [
            'organization_id' => $orgId ?: ($costData['organization_id'] ?? 'default'),
            'organization_name' => $orgName,
            'reporting_period' => $periodLabel,
            'period_start_timestamp' => $startTime,
            'total_cost_usd' => $totalCost,
            'total_input_tokens' => $totalTokens,
            'total_model_requests' => $totalRequests,
            'total_images' => $totalImages,
            'credit_balance_available' => $creditBalance !== null,
        ]);

        $activeModelConfig = (string) config('services.openai.image_model', 'gpt-image-2');
        $activeModelSpec = app(OpenAIModelRegistry::class)->getModel($activeModelConfig);

        return [
            'status' => 'active',
            'application_configured_limit' => $budgetLimit,
            'budget_limit' => $budgetLimit,
            'total_spent' => round($totalCost, 2),
            'input_tokens' => $totalTokens,
            'total_tokens' => $totalTokens,
            'total_requests' => $totalRequests,
            'total_images' => $totalImages,
            'api_credit_balance' => $creditBalance !== null ? round($creditBalance, 2) : null,
            'credit_balance_available' => $creditBalance !== null,
            'credit_balance_source' => $creditBalance !== null ? 'OpenAI Billing API' : 'OpenAI Billing Dashboard',
            'remaining_configured_limit' => $remaining,
            'remaining_budget' => $remaining,
            'percentage_used' => $percentageUsed,
            'is_limit_reached' => $totalCost >= $budgetLimit,
            'is_live_account' => true,
            'active_model' => [
                'id' => $activeModelSpec['id'] ?? $activeModelConfig,
                'display_name' => $activeModelSpec['display_name'] ?? 'GPT-Image-2',
                'tag' => $activeModelSpec['tag'] ?? 'Flagship Photorealism',
                'badge' => $activeModelSpec['badge'] ?? 'Recommended',
            ],
            'source' => 'openai_organization_api',
            'reporting_period' => $periodLabel,
            'last_synced_at' => Carbon::now()->toIso8601String(),
            'organization_id' => $costData['organization_id'] ?? $orgId,
            'organization_name' => $orgName,
            'error_message' => null,
        ];
    }

    /**
     * Query OpenAI Organization Costs API across all monthly billing buckets with full pagination.
     *
     * @return array{
     *     total_cost: float,
     *     organization_id: string|null,
     *     organization_name: string|null,
     *     pages_count: int,
     *     buckets_count: int,
     * }
     */
    public function fetchOrganizationBilledCosts(string $adminKey, ?string $orgId = null, ?int $startTime = null): array
    {
        $startTime = $startTime ?? Carbon::now()->startOfMonth()->timestamp;
        $totalCost = 0.0;
        $detectedOrgId = null;
        $detectedOrgName = null;
        $nextPage = null;
        $pagesCount = 0;
        $bucketsCount = 0;

        do {
            $queryParams = [
                'start_time' => $startTime,
                'limit' => 30,
            ];

            if ($nextPage !== null) {
                $queryParams['after'] = $nextPage;
            }

            $response = Http::withHeaders($this->getHeaders($adminKey, $orgId))
                ->timeout(12)
                ->get('https://api.openai.com/v1/organization/costs', $queryParams);

            $pagesCount++;

            if (! $response->successful()) {
                Log::warning('OpenAI costs API non-200: '.$response->status().' '.$response->body());
                break;
            }

            $data = $response->json();

            if (! empty($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $bucket) {
                    $bucketsCount++;
                    if (! empty($bucket['results']) && is_array($bucket['results'])) {
                        foreach ($bucket['results'] as $result) {
                            $amount = (float) ($result['amount']['value'] ?? 0.0);
                            $totalCost += $amount;

                            if (! empty($result['organization_id'])) {
                                $detectedOrgId = $result['organization_id'];
                            }
                            if (! empty($result['organization_name'])) {
                                $detectedOrgName = $result['organization_name'];
                            }
                        }
                    }
                }
            }

            $hasMore = (bool) ($data['has_more'] ?? false);
            $nextPage = $hasMore ? ($data['next_page'] ?? null) : null;
        } while ($nextPage !== null);

        return [
            'total_cost' => round($totalCost, 4),
            'organization_id' => $detectedOrgId,
            'organization_name' => $detectedOrgName,
            'pages_count' => $pagesCount,
            'buckets_count' => $bucketsCount,
        ];
    }

    /**
     * Query OpenAI Organization Completions Usage API for token usage and request count with full pagination.
     *
     * @return array{
     *     input_tokens: int,
     *     output_tokens: int,
     *     num_model_requests: int,
     *     pages_count: int,
     * }
     */
    public function fetchOrganizationCompletionsUsage(string $adminKey, ?string $orgId = null, ?int $startTime = null): array
    {
        $startTime = $startTime ?? Carbon::now()->startOfMonth()->timestamp;
        $totalInputTokens = 0;
        $totalOutputTokens = 0;
        $totalRequests = 0;
        $nextPage = null;
        $pagesCount = 0;

        do {
            $queryParams = [
                'start_time' => $startTime,
                'limit' => 30,
            ];

            if ($nextPage !== null) {
                $queryParams['after'] = $nextPage;
            }

            $response = Http::withHeaders($this->getHeaders($adminKey, $orgId))
                ->timeout(12)
                ->get('https://api.openai.com/v1/organization/usage/completions', $queryParams);

            $pagesCount++;

            if (! $response->successful()) {
                Log::warning('OpenAI completions usage API non-200: '.$response->status());
                break;
            }

            $data = $response->json();

            if (! empty($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $bucket) {
                    if (! empty($bucket['results']) && is_array($bucket['results'])) {
                        foreach ($bucket['results'] as $result) {
                            $totalInputTokens += (int) ($result['input_tokens'] ?? 0);
                            $totalOutputTokens += (int) ($result['output_tokens'] ?? 0);
                            $totalRequests += (int) ($result['num_model_requests'] ?? 0);
                        }
                    }
                }
            }

            $hasMore = (bool) ($data['has_more'] ?? false);
            $nextPage = $hasMore ? ($data['next_page'] ?? null) : null;
        } while ($nextPage !== null);

        return [
            'input_tokens' => $totalInputTokens,
            'output_tokens' => $totalOutputTokens,
            'num_model_requests' => $totalRequests,
            'pages_count' => $pagesCount,
        ];
    }

    /**
     * Query OpenAI Organization Images Usage API across monthly billing buckets with full pagination.
     */
    public function fetchOrganizationImagesCount(string $adminKey, ?string $orgId = null, ?int $startTime = null): int
    {
        $startTime = $startTime ?? Carbon::now()->startOfMonth()->timestamp;
        $totalImages = 0;
        $nextPage = null;

        try {
            do {
                $queryParams = [
                    'start_time' => $startTime,
                    'limit' => 30,
                ];

                if ($nextPage !== null) {
                    $queryParams['after'] = $nextPage;
                }

                $response = Http::withHeaders($this->getHeaders($adminKey, $orgId))
                    ->timeout(12)
                    ->get('https://api.openai.com/v1/organization/usage/images', $queryParams);

                if (! $response->successful()) {
                    break;
                }

                $data = $response->json();

                if (! empty($data['data']) && is_array($data['data'])) {
                    foreach ($data['data'] as $bucket) {
                        if (! empty($bucket['results']) && is_array($bucket['results'])) {
                            foreach ($bucket['results'] as $result) {
                                $totalImages += (int) ($result['num_images'] ?? 0);
                            }
                        }
                    }
                }

                $hasMore = (bool) ($data['has_more'] ?? false);
                $nextPage = $hasMore ? ($data['next_page'] ?? null) : null;
            } while ($nextPage !== null);
        } catch (Exception $e) {
            Log::warning('OpenAI image usage fetch exception: '.$e->getMessage());
        }

        return $totalImages;
    }

    /**
     * Query OpenAI API Credit Balance if accessible on the authenticated credential.
     */
    public function fetchApiCreditBalance(string $adminKey, ?string $orgId = null): ?float
    {
        try {
            $response = Http::withHeaders($this->getHeaders($adminKey, $orgId))
                ->timeout(6)
                ->get('https://api.openai.com/v1/dashboard/billing/credit_grants');

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['total_available'])) {
                    return (float) $data['total_available'];
                }
            }
        } catch (Exception $e) {
            // Endpoints restricted to browser session tokens return 403/429
            Log::info('OpenAI credit grants endpoint not supported on secret API key: '.$e->getMessage());
        }

        return null;
    }

    /**
     * Build HTTP authorization and organization headers.
     *
     * @return array<string, string>
     */
    protected function getHeaders(string $adminKey, ?string $orgId = null): array
    {
        $headers = [
            'Authorization' => 'Bearer '.$adminKey,
        ];

        if (! empty($orgId)) {
            $headers['OpenAI-Organization'] = $orgId;
        }

        return $headers;
    }

    /**
     * Return normalized unavailable usage payload when OpenAI is unconfigured or unreachable.
     *
     * @return array{
     *     status: string,
     *     budget_limit: float,
     *     total_spent: null,
     *     total_tokens: null,
     *     total_requests: null,
     *     total_images: null,
     *     api_credit_balance: null,
     *     credit_balance_available: false,
     *     remaining_budget: null,
     *     percentage_used: null,
     *     is_limit_reached: bool,
     *     is_live_account: bool,
     *     source: string,
     *     reporting_period: string,
     *     last_synced_at: string,
     *     organization_id: null,
     *     organization_name: null,
     *     error_message: string,
     * }
     */
    protected function getUnavailableUsage(float $budgetLimit, string $errorMessage): array
    {
        $activeModelConfig = (string) config('services.openai.image_model', 'gpt-image-2');
        $activeModelSpec = app(OpenAIModelRegistry::class)->getModel($activeModelConfig);

        return [
            'status' => 'unavailable',
            'budget_limit' => $budgetLimit,
            'total_spent' => null,
            'input_tokens' => null,
            'total_tokens' => null,
            'total_requests' => null,
            'total_images' => null,
            'api_credit_balance' => null,
            'credit_balance_available' => false,
            'credit_balance_source' => 'OpenAI Billing Dashboard',
            'remaining_configured_limit' => null,
            'remaining_budget' => null,
            'percentage_used' => null,
            'is_limit_reached' => false,
            'is_live_account' => false,
            'active_model' => [
                'id' => $activeModelSpec['id'] ?? $activeModelConfig,
                'display_name' => $activeModelSpec['display_name'] ?? 'GPT-Image-2',
                'tag' => $activeModelSpec['tag'] ?? 'Flagship Photorealism',
                'badge' => $activeModelSpec['badge'] ?? 'Recommended',
            ],
            'source' => 'unavailable',
            'reporting_period' => Carbon::now()->format('F Y'),
            'last_synced_at' => Carbon::now()->toIso8601String(),
            'organization_id' => null,
            'organization_name' => null,
            'error_message' => $errorMessage,
        ];
    }
}
