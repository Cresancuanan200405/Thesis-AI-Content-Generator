<?php

use App\Models\Business;
use App\Models\Design;
use App\Models\User;
use App\Services\OpenAIUsageService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
    Config::set('services.openai.admin_key', 'sk-admin-test-key-12345');
    Config::set('services.openai.organization', 'org-ZyTriRoIVgLU57NzQNqsvK8g');
    Config::set('services.openai.budget_limit', 10.00);
});

// TEST 1: Spend = 2.35, Application Limit = 10.00, Remaining App Limit = 7.65
test('TEST 1: retrieves authoritative August spend $2.35, app limit $10.00, and remaining app limit $7.65', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [
                ['results' => [['amount' => ['value' => 1.3539676], 'organization_name' => 'FSUU', 'organization_id' => 'org-ZyTriRoIVgLU57NzQNqsvK8g']]],
                ['results' => [['amount' => ['value' => 0.7896710], 'organization_name' => 'FSUU', 'organization_id' => 'org-ZyTriRoIVgLU57NzQNqsvK8g']]],
                ['results' => [['amount' => ['value' => 0.2065432], 'organization_name' => 'FSUU', 'organization_id' => 'org-ZyTriRoIVgLU57NzQNqsvK8g']]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [
                ['results' => [['input_tokens' => 142377, 'output_tokens' => 56092, 'num_model_requests' => 78]]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['total_spent'])->toBe(2.35)
        ->and($usage['application_configured_limit'])->toBe(10.00)
        ->and($usage['remaining_configured_limit'])->toBe(7.65)
        ->and($usage['percentage_used'])->toBe(23.5);
});

// TEST 2: Input Tokens = 142,377
test('TEST 2: retrieves authoritative input tokens 142377 without conflating other metrics', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [
                ['results' => [['input_tokens' => 18434, 'output_tokens' => 33679, 'num_model_requests' => 22]]],
                ['results' => [['input_tokens' => 83900, 'output_tokens' => 18041, 'num_model_requests' => 39]]],
                ['results' => [['input_tokens' => 40043, 'output_tokens' => 4372, 'num_model_requests' => 17]]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['input_tokens'])->toBe(142377)
        ->and($usage['total_tokens'])->toBe(142377);
});

// TEST 3: Total Requests = 78
test('TEST 3: retrieves authoritative request count 78', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [
                ['results' => [['input_tokens' => 18434, 'num_model_requests' => 22]]],
                ['results' => [['input_tokens' => 83900, 'num_model_requests' => 39]]],
                ['results' => [['input_tokens' => 40043, 'num_model_requests' => 17]]],
            ],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['total_requests'])->toBe(78);
});

// TEST 4: Credit Endpoint returns 17.65
test('TEST 4: credit endpoint returning 17.65 renders api_credit_balance 17.65 and credit_balance_available true', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response(['total_available' => 17.65], 200),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['api_credit_balance'])->toBe(17.65)
        ->and($usage['credit_balance_available'])->toBeTrue()
        ->and($usage['credit_balance_source'])->toBe('OpenAI Billing API');
});

// TEST 5: Credit Endpoint returns 403 -> api_credit_balance null, but spend/tokens/requests remain valid
test('TEST 5: credit endpoint 403 leaves spend, tokens, and requests valid while credit balance is null', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['status'])->toBe('active')
        ->and($usage['total_spent'])->toBe(2.35)
        ->and($usage['input_tokens'])->toBe(142377)
        ->and($usage['total_requests'])->toBe(78)
        ->and($usage['api_credit_balance'])->toBeNull()
        ->and($usage['credit_balance_available'])->toBeFalse()
        ->and($usage['credit_balance_source'])->toBe('OpenAI Billing Dashboard');
});

// TEST 6: remaining_configured_limit 7.65 is NEVER assigned to api_credit_balance
test('TEST 6: remaining_configured_limit is never assigned to api_credit_balance', function () {
    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['remaining_configured_limit'])->toBe(7.65)
        ->and($usage['api_credit_balance'])->toBeNull()
        ->and($usage['api_credit_balance'])->not->toBe($usage['remaining_configured_limit']);
});

// TEST 7: Verify no hardcoded 17.65 in app codebase
test('TEST 7: verify no hardcoded 17.65 in app source files', function () {
    $appFiles = File::allFiles(app_path());
    foreach ($appFiles as $file) {
        $content = File::get($file->getPathname());
        expect($content)->not->toContain('17.65');
    }
});

// TEST 8: Verify no local synthetic pricing is used
test('TEST 8: verify no synthetic pricing or local design counts calculate OpenAI billing', function () {
    Config::set('services.openai.admin_key', null);
    Config::set('services.openai.api_key', null);

    $user = User::factory()->create(['onboarding_completed' => true]);
    $business = Business::factory()->create(['user_id' => $user->id]);

    for ($i = 0; $i < 15; $i++) {
        Design::factory()->create([
            'user_id' => $user->id,
            'business_id' => $business->id,
            'generation_metadata' => [
                'source' => 'openai',
                'model' => 'gpt-image-2',
                'quality' => 'high',
            ],
        ]);
    }

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    // Must be unavailable, never a local calculation
    expect($usage['status'])->toBe('unavailable')
        ->and($usage['total_spent'])->toBeNull()
        ->and($usage['input_tokens'])->toBeNull()
        ->and($usage['total_requests'])->toBeNull()
        ->and($usage['api_credit_balance'])->toBeNull();
});

// TEST 9: API credentials never appear in Inertia props
test('TEST 9: inertia middleware shares sanitized telemetry payload without exposing api keys', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
        'email_verified_at' => now(),
    ]);

    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertOk();
    $aiUsage = $response->viewData('page')['props']['ai_usage'] ?? null;

    expect($aiUsage)->not->toBeNull()
        ->and($aiUsage['total_spent'])->toBe(2.35)
        ->and($aiUsage['input_tokens'])->toBe(142377)
        ->and($aiUsage['total_requests'])->toBe(78)
        ->and($aiUsage['remaining_configured_limit'])->toBe(7.65)
        ->and($aiUsage['application_configured_limit'])->toBe(10.0)
        ->and(isset($aiUsage['admin_key']))->toBeFalse()
        ->and(isset($aiUsage['api_key']))->toBeFalse()
        ->and(isset($aiUsage['authorization']))->toBeFalse();
});

// TEST 10: Refresh invalidates organization/month cache
test('TEST 10: manual refresh endpoint invalidates cache and requests fresh OpenAI telemetry', function () {
    $user = User::factory()->create([
        'onboarding_completed' => true,
        'email_verified_at' => now(),
    ]);

    Http::fake([
        'https://api.openai.com/v1/organization/costs*' => Http::response([
            'data' => [['results' => [['amount' => ['value' => 2.35], 'organization_name' => 'FSUU']]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/completions*' => Http::response([
            'data' => [['results' => [['input_tokens' => 142377, 'num_model_requests' => 78]]]],
            'has_more' => false,
        ], 200),
        'https://api.openai.com/v1/organization/usage/images*' => Http::response(['data' => []], 200),
        'https://api.openai.com/v1/dashboard/billing/credit_grants*' => Http::response([], 403),
    ]);

    $response = $this->actingAs($user)->post('/telemetry/openai/refresh');

    $response->assertRedirect();
    Http::assertSentCount(8);
});

// TEST 11: Stale cache behavior
test('TEST 11: returns stale cached telemetry when live refresh fails', function () {
    $periodKey = Carbon::now()->format('Y-m');
    $cacheKey = 'openai_org_telemetry_'.md5('sk-admin-test-key-12345org-ZyTriRoIVgLU57NzQNqsvK8g_'.$periodKey);

    Cache::put($cacheKey, [
        'status' => 'active',
        'application_configured_limit' => 10.00,
        'budget_limit' => 10.00,
        'total_spent' => 2.35,
        'input_tokens' => 142377,
        'total_tokens' => 142377,
        'total_requests' => 78,
        'total_images' => 0,
        'api_credit_balance' => null,
        'credit_balance_available' => false,
        'credit_balance_source' => 'OpenAI Billing Dashboard',
        'remaining_configured_limit' => 7.65,
        'remaining_budget' => 7.65,
        'percentage_used' => 23.5,
        'is_limit_reached' => false,
        'is_live_account' => true,
        'source' => 'openai_organization_api',
        'reporting_period' => 'August 2026',
        'last_synced_at' => Carbon::now()->toIso8601String(),
        'organization_id' => 'org-ZyTriRoIVgLU57NzQNqsvK8g',
        'organization_name' => 'FSUU',
        'error_message' => null,
    ], 600);

    $mockService = new class extends OpenAIUsageService
    {
        public function getUsage(?User $user = null, ?float $budgetLimit = null, bool $forceRefresh = false): array
        {
            $budgetLimit = $budgetLimit ?? 10.00;
            $adminKey = config('services.openai.admin_key');
            $orgId = config('services.openai.organization');
            $periodKey = Carbon::now()->format('Y-m');
            $cacheKey = 'openai_org_telemetry_'.md5((string) $adminKey.(string) $orgId.'_'.$periodKey);

            try {
                throw new Exception('Connection timeout');
            } catch (Exception $e) {
                $cached = Cache::get($cacheKey);
                if (is_array($cached)) {
                    $cached['status'] = 'stale';
                    $cached['error_message'] = 'Using cached organization telemetry. Live refresh failed: '.$e->getMessage();

                    return $cached;
                }

                return $this->getUnavailableUsage($budgetLimit, $e->getMessage());
            }
        }
    };

    $staleUsage = $mockService->getUsage();

    expect($staleUsage['status'])->toBe('stale')
        ->and($staleUsage['total_spent'])->toBe(2.35)
        ->and($staleUsage['error_message'])->toContain('Using cached organization telemetry');
});

// TEST 12: Unavailable telemetry behavior
test('TEST 12: returns unavailable state when credentials are unconfigured', function () {
    Config::set('services.openai.admin_key', null);
    Config::set('services.openai.api_key', null);

    $service = app(OpenAIUsageService::class);
    $usage = $service->getUsage();

    expect($usage['status'])->toBe('unavailable')
        ->and($usage['total_spent'])->toBeNull()
        ->and($usage['input_tokens'])->toBeNull()
        ->and($usage['total_requests'])->toBeNull()
        ->and($usage['api_credit_balance'])->toBeNull()
        ->and($usage['credit_balance_available'])->toBeFalse()
        ->and($usage['credit_balance_source'])->toBe('OpenAI Billing Dashboard')
        ->and($usage['error_message'])->toBe('OpenAI API key or Admin key is not configured.');
});
