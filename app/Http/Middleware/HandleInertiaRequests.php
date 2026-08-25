<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'unread_notifications_count' => $user ? $user->appNotifications()->unread()->count() : 0,
            'recent_notifications' => $user ? $user->appNotifications()->latest()->take(5)->get() : [],
            'ai_usage' => $user ? [
                'budget_limit' => 20.00,
                'total_spent' => $user->getAiTotalSpent(),
                'total_generations' => $user->designs()->count(),
                'remaining_budget' => $user->getAiRemainingBudget(20.00),
                'is_limit_reached' => $user->hasReachedAiBudgetLimit(20.00),
                'model_counts' => [
                    'gpt-image-1-mini' => $user->designs()->whereJsonContains('generation_metadata->model', 'gpt-image-1-mini')->count(),
                    'gpt-image-1' => $user->designs()->where(function ($q) {
                        $q->whereJsonContains('generation_metadata->model', 'gpt-image-1')
                            ->orWhereNull('generation_metadata');
                    })->count(),
                    'chatgpt-image-latest' => $user->designs()->whereJsonContains('generation_metadata->model', 'chatgpt-image-latest')->count(),
                    'gpt-image-1.5' => $user->designs()->whereJsonContains('generation_metadata->model', 'gpt-image-1.5')->count(),
                    'gpt-image-2' => $user->designs()->whereJsonContains('generation_metadata->model', 'gpt-image-2')->count(),
                ],
                'quality_counts' => [
                    'low' => $user->designs()->whereJsonContains('generation_metadata->quality', 'low')->count(),
                    'medium' => $user->designs()->where(function ($q) {
                        $q->whereJsonContains('generation_metadata->quality', 'medium')
                            ->orWhereNull('generation_metadata->quality');
                    })->count(),
                    'high' => $user->designs()->whereJsonContains('generation_metadata->quality', 'high')->count(),
                ],
            ] : null,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'message' => $request->session()->get('message'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
