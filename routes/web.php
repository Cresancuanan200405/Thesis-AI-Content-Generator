<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GeneratorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserProfileController;
use App\Models\Event;
use App\Services\OpenAIUsageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])
    ->name('auth.social.redirect');
Route::get('auth/{provider}/callback', [SocialAuthController::class, 'callback'])
    ->name('auth.social.callback');

Route::get('/test-resend', function () {
    Mail::raw('This is a test email from MarketPilot using Resend.', function ($message) {
        $message->to('cresancuanan182@gmail.com')
            ->subject('MarketPilot Resend Test')
            ->from(config('mail.from.address'), config('mail.from.name'));
    });

    return response()->json([
        'status' => 'queued',
        'recipient' => 'cresancuanan182@gmail.com',
    ]);
})->name('test.resend');

Route::middleware('auth')->group(function () {
    Route::post('email/verify-code', function (Request $request) {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $user = $request->user();

        if (! $user || ! $user->verifyEmailCode($request->string('code')->toString())) {
            return back()->withErrors([
                'code' => 'That verification code is invalid or has expired.',
            ])->withInput();
        }

        return redirect()->intended('/dashboard');
    })->name('verification.code');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('onboarding/business', [OnboardingController::class, 'saveBusiness'])->name('onboarding.business');
    Route::post('onboarding/preferences', [OnboardingController::class, 'savePreferences'])->name('onboarding.preferences');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
});

Route::middleware(['auth', 'verified', 'onboarding.complete'])->group(function () {
    Route::get('profile', [UserProfileController::class, 'show'])->name('profile.show');
    Route::match(['post', 'patch'], 'profile/business', [UserProfileController::class, 'updateBusiness'])->name('profile.business.update');

    Route::get('dashboard', function (Request $request) {
        $user = $request->user();

        $campaigns = $user->campaigns()
            ->with(['event', 'designs'])
            ->latest('updated_at')
            ->limit(6)
            ->get()
            ->map(fn ($campaign) => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
                'event_name' => $campaign->event?->name,
                'design_count' => $campaign->designs()->count(),
            ])->values()->all();

        $recentDesigns = $user->designs()
            ->with(['campaign', 'event', 'product'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn ($design) => [
                'id' => $design->id,
                'product_name' => $design->product_name,
                'campaign_name' => $design->campaign?->name,
                'event_name' => $design->event?->name,
                'status' => $design->status,
                'created_at' => $design->created_at?->format('M j, Y'),
                'image_url' => $design->generated_image_path ? asset('storage/'.$design->generated_image_path) : null,
                'url' => route('designs.show', $design),
            ])->values()->all();

        $totalDesigns = $user->designs()->count();
        $activeCampaigns = $user->campaigns()->whereIn('status', ['active', 'scheduled'])->count();
        $totalProducts = $user->business?->products()->count() ?? 0;

        $productsWithVisuals = $user->business
            ? $user->business->products()->where(function ($query) use ($user) {
                $query->has('designs')->orWhereIn('name', $user->designs()->whereNotNull('product_name')->select('product_name'));
            })->count()
            : 0;
        $productsWithoutVisuals = max(0, $totalProducts - $productsWithVisuals);
        $catalogCoveragePercent = $totalProducts > 0 ? (int) min(100, round(($productsWithVisuals / $totalProducts) * 100)) : 0;

        $events = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->orderBy('date')
            ->get()
            ->map(fn ($event): array => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date?->format('Y-m-d'),
                'type' => $event->type,
            ])
            ->values()
            ->all();

        $upcomingEvents = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->where('date', '>=', now()->toDateString())
            ->orderBy('date')
            ->limit(5)
            ->get()
            ->map(fn ($event) => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date ? $event->date->format('M j, Y') : null,
                'category' => $event->type,
                'days' => $event->date ? now()->diffInDays($event->date, false).' days left' : null,
            ])
            ->values()
            ->all();

        $upcomingEventsCount = Event::query()
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_global', true))
            ->where('date', '>=', now()->toDateString())
            ->count();

        // 6-Month Monthly Activity Data for interactive chart
        $monthlyActivity = collect(range(5, 0))->map(function ($monthsAgo) use ($user) {
            $date = now()->subMonths($monthsAgo);
            $monthLabel = $date->format('M');
            $year = $date->year;
            $month = $date->month;

            $designsCount = $user->designs()
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();

            $campaignsCount = $user->campaigns()
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();

            return [
                'period' => $monthLabel,
                'designs' => $designsCount,
                'campaigns' => $campaignsCount,
            ];
        })->values()->all();

        // 7-Day Weekly Activity Data for interactive toggle
        $weeklyActivity = collect(range(6, 0))->map(function ($daysAgo) use ($user) {
            $date = now()->subDays($daysAgo);
            $dayLabel = $date->format('D');
            $dateString = $date->toDateString();

            $designsCount = $user->designs()
                ->whereDate('created_at', $dateString)
                ->count();

            $campaignsCount = $user->campaigns()
                ->whereDate('created_at', $dateString)
                ->count();

            return [
                'period' => $dayLabel,
                'designs' => $designsCount,
                'campaigns' => $campaignsCount,
            ];
        })->values()->all();

        // Campaign Pipeline Status Counts
        $campaignsByStatus = [
            'active' => $user->campaigns()->where('status', 'active')->count(),
            'scheduled' => $user->campaigns()->where('status', 'scheduled')->count(),
            'draft' => $user->campaigns()->where('status', 'draft')->count(),
            'completed' => $user->campaigns()->where('status', 'completed')->count(),
            'archived' => $user->campaigns()->where('status', 'archived')->count(),
        ];

        // Authentic workspace pipeline status
        $hasOpenAiConfigured = (bool) (config('services.openai.api_key') || config('services.openai.admin_key'));
        $hasEvents = Event::count() > 0;
        $hasBusiness = $user->business !== null;

        $systemHealth = [
            'ai_generation' => $hasOpenAiConfigured ? 'operational' : 'attention_required',
            'event_calendar' => $hasEvents ? 'operational' : 'attention_required',
            'product_catalog' => $hasBusiness ? 'operational' : 'attention_required',
            'campaign_engine' => ($hasBusiness && $hasEvents) ? 'operational' : 'attention_required',
        ];

        return inertia('dashboard', [
            'campaigns' => $campaigns,
            'events' => $events,
            'upcoming_events' => $upcomingEvents,
            'recent_designs' => $recentDesigns,
            'stats' => [
                'total_designs' => $totalDesigns,
                'active_campaigns' => $activeCampaigns,
                'total_products' => $totalProducts,
                'upcoming_events' => $upcomingEventsCount,
                'products_with_visuals' => $productsWithVisuals,
                'products_without_visuals' => $productsWithoutVisuals,
                'catalog_coverage' => $catalogCoveragePercent,
            ],
            'monthly_activity' => $monthlyActivity,
            'weekly_activity' => $weeklyActivity,
            'campaign_status_breakdown' => $campaignsByStatus,
            'system_health' => $systemHealth,
            'business' => [
                'name' => $user->business?->name,
                'industry' => $user->business?->industry,
                'category' => $user->business?->category,
                'tagline' => $user->business?->tagline,
            ],
        ]);
    })->name('dashboard');
    Route::get('generator', [GeneratorController::class, 'index'])->name('generator.index');
    Route::post('generator', [GeneratorController::class, 'store'])->name('generator.store');
    Route::post('generator/preview', [GeneratorController::class, 'generatePreview'])->name('generator.preview');
    Route::get('designs', [DesignController::class, 'index'])->name('designs.index');
    Route::post('designs', [DesignController::class, 'store'])->name('designs.store');
    Route::post('designs/bulk-delete', [DesignController::class, 'bulkDestroy'])->name('designs.bulk-delete');
    Route::get('designs/{design}', [DesignController::class, 'show'])->name('designs.show');
    Route::post('designs/{design}/favorite', [DesignController::class, 'toggleFavorite'])->name('designs.favorite');
    Route::post('designs/{design}/attach-campaign', [DesignController::class, 'attachCampaign'])->name('designs.attach-campaign');
    Route::get('designs/{design}/download', [DesignController::class, 'download'])->name('designs.download');
    Route::post('designs/{design}/regenerate', [DesignController::class, 'regenerate'])->name('designs.regenerate');
    Route::delete('designs/{design}', [DesignController::class, 'destroy'])->name('designs.destroy');
    Route::get('calendar', [EventController::class, 'index'])->name('calendar.index');
    Route::get('calendar/events-year', [EventController::class, 'getYearEvents'])->name('calendar.year-events');
    Route::post('events', [EventController::class, 'store'])->name('events.store');
    Route::get('events/{event}', [EventController::class, 'show'])->name('events.show');
    Route::put('events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

    Route::get('campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
    Route::get('campaigns/create', fn () => redirect()->route('campaigns.index', ['create' => 'true']))->name('campaigns.create');
    Route::post('campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');
    Route::post('campaigns/{campaign}/attach-designs', [CampaignController::class, 'attachDesigns'])->name('campaigns.attach-designs');
    Route::post('campaigns/{campaign}/archive', [CampaignController::class, 'archive'])->name('campaigns.archive');
    Route::post('campaigns/{campaign}/unarchive', [CampaignController::class, 'unarchive'])->name('campaigns.unarchive');
    Route::put('campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
    Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::post('products/bulk-delete', [ProductController::class, 'bulkDestroy'])->name('products.bulk-delete');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('profile', [UserProfileController::class, 'show'])->name('profile.show');
    Route::get('profile/business', [UserProfileController::class, 'showBusiness'])->name('profile.business');
    Route::match(['post', 'patch'], 'profile/business', [UserProfileController::class, 'updateBusiness'])->name('profile.business.update');

    Route::get('subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');

    Route::post('telemetry/openai/refresh', function (Request $request) {
        app(OpenAIUsageService::class)->getUsage($request->user(), null, true);

        return back()->with('success', 'OpenAI telemetry refreshed.');
    })->name('telemetry.openai.refresh');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.unread');
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('notifications', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

});

require __DIR__.'/settings.php';
