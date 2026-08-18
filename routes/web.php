<?php

use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\GeneratorController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProductController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

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

        return inertia('dashboard', [
            'campaigns' => $campaigns,
            'upcoming_events' => $user->events()->where('date', '>=', now()->toDateString())->orderBy('date')->limit(5)->get()->map(fn ($event) => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date->format('M j, Y'),
                'category' => $event->type,
                'days' => now()->diffInDays($event->date, false).' days left',
            ])->values()->all(),
            'recent_designs' => $recentDesigns,
        ]);
    })->name('dashboard');
    Route::get('generator', [GeneratorController::class, 'index'])->name('generator.index');
    Route::post('generator', [GeneratorController::class, 'store'])->name('generator.store');
    Route::get('designs', [DesignController::class, 'index'])->name('designs.index');
    Route::post('designs', [DesignController::class, 'store'])->name('designs.store');
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
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

});

require __DIR__.'/settings.php';
