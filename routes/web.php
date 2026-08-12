<?php

use App\Http\Controllers\BrandKitController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DesignController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/test-resend', function () {
    Mail::raw('This is a test email from MarketPilot using Resend.', function ($message) {
        $message->to('cresancuanan182@gmail.com')
            ->subject('MarketPilot Resend Test')
            ->from('onboarding@resend.dev', 'MarketPilot');
    });

    return response()->json([
        'status' => 'queued',
        'recipient' => 'cresancuanan182@gmail.com',
    ]);
})->name('test.resend');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('onboarding/business', [OnboardingController::class, 'saveBusiness'])->name('onboarding.business');
    Route::post('onboarding/brand', [OnboardingController::class, 'saveBrand'])->name('onboarding.brand');
    Route::post('onboarding/preferences', [OnboardingController::class, 'savePreferences'])->name('onboarding.preferences');
    Route::post('onboarding/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
});

Route::middleware(['auth', 'verified', 'onboarding.complete'])->group(function () {
    Route::get('dashboard', function (\Illuminate\Http\Request $request) {
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
                'image_url' => $design->generated_image_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($design->generated_image_path) : null,
                'url' => route('designs.show', $design),
            ])->values()->all();

        return inertia('dashboard', [
            'campaigns' => $campaigns,
            'upcoming_events' => $user->events()->where('date', '>=', now()->toDateString())->orderBy('date')->limit(5)->get()->map(fn ($event) => [
                'id' => $event->id,
                'name' => $event->name,
                'date' => $event->date?->format('M j, Y'),
                'category' => $event->type,
                'days' => $event->date ? now()->diffInDays($event->date, false).' days left' : null,
            ])->values()->all(),
            'recent_designs' => $recentDesigns,
        ]);
    })->name('dashboard');
    Route::get('generator', [\App\Http\Controllers\GeneratorController::class, 'index'])->name('generator.index');
    Route::post('generator', [\App\Http\Controllers\GeneratorController::class, 'store'])->name('generator.store');
    Route::get('designs', [DesignController::class, 'index'])->name('designs.index');
    Route::get('designs/{design}', [DesignController::class, 'show'])->name('designs.show');
    Route::get('designs/{design}/download', [DesignController::class, 'download'])->name('designs.download');
    Route::post('designs/{design}/regenerate', [DesignController::class, 'regenerate'])->name('designs.regenerate');
    Route::delete('designs/{design}', [DesignController::class, 'destroy'])->name('designs.destroy');
    Route::get('calendar', [EventController::class, 'index'])->name('calendar.index');
    Route::post('events', [EventController::class, 'store'])->name('events.store');
    Route::get('events/{event}', [EventController::class, 'show'])->name('events.show');
    Route::put('events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('events/{event}', [EventController::class, 'destroy'])->name('events.destroy');

    Route::get('campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
    Route::post('campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
    Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->name('campaigns.show');
    Route::put('campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
    Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->name('campaigns.destroy');

    Route::get('products', [\App\Http\Controllers\ProductController::class, 'index'])->name('products.index');
    Route::get('products/create', [\App\Http\Controllers\ProductController::class, 'create'])->name('products.create');
    Route::post('products', [\App\Http\Controllers\ProductController::class, 'store'])->name('products.store');
    Route::get('products/{product}', [\App\Http\Controllers\ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product}/edit', [\App\Http\Controllers\ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product}', [\App\Http\Controllers\ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('brand-kit', [BrandKitController::class, 'edit'])->name('brand-kit.edit');
    Route::put('brand-kit', [BrandKitController::class, 'update'])->name('brand-kit.update');
});

require __DIR__.'/settings.php';
