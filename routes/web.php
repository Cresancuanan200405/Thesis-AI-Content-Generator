<?php

use App\Http\Controllers\Auth\SocialAuthController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GeneratorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserProfileController;
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
    Route::post('onboarding/logo', [OnboardingController::class, 'saveLogo'])->name('onboarding.logo');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
});

Route::middleware(['auth', 'verified', 'onboarding.complete'])->group(function () {
    Route::get('profile', [UserProfileController::class, 'show'])->name('profile.show');

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
        $upcomingEventsCount = $user->events()->where('date', '>=', now()->toDateString())->count();

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
                'month' => $monthLabel,
                'designs' => $designsCount,
                'campaigns' => $campaignsCount,
            ];
        })->values()->all();

        return inertia('dashboard', [
            'campaigns' => $campaigns,
            'upcoming_events' => $user->events()->where('date', '>=', now()->toDateString())->orderBy('date')->limit(5)->get()->map(fn ($event) => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date ? $event->date->format('M j, Y') : null,
                'category' => $event->type,
                'days' => $event->date ? now()->diffInDays($event->date, false).' days left' : null,
            ])->values()->all(),
            'recent_designs' => $recentDesigns,
            'stats' => [
                'total_designs' => $totalDesigns,
                'active_campaigns' => $activeCampaigns,
                'total_products' => $totalProducts,
                'upcoming_events' => $upcomingEventsCount,
            ],
            'monthly_activity' => $monthlyActivity,
            'business' => [
                'name' => $user->business?->name,
                'industry' => $user->business?->industry,
            ],
        ]);
    })->name('dashboard');
    Route::get('generator', [GeneratorController::class, 'index'])->name('generator.index');
    Route::post('generator', [GeneratorController::class, 'store'])->name('generator.store');
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
    Route::post('campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');
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

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])->name('notifications.unread');
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::delete('notifications', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

});

require __DIR__.'/settings.php';
