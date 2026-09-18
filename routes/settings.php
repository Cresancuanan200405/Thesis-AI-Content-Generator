<?php

use App\Http\Controllers\Settings\EmailChangeController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Secure Multi-Step Email Change
    Route::post('settings/email/verify-identity', [EmailChangeController::class, 'verifyIdentity'])
        ->middleware('throttle:6,1')
        ->name('settings.email.verify-identity');
    Route::post('settings/email/request-change', [EmailChangeController::class, 'requestChange'])
        ->middleware('throttle:5,10')
        ->name('settings.email.request-change');
    Route::post('settings/email/confirm-change', [EmailChangeController::class, 'confirmChange'])
        ->middleware('throttle:10,1')
        ->name('settings.email.confirm-change');
    Route::post('settings/email/resend-code', [EmailChangeController::class, 'resendCode'])
        ->middleware('throttle:3,1')
        ->name('settings.email.resend-code');
    Route::delete('settings/email/cancel-change', [EmailChangeController::class, 'cancelChange'])
        ->name('settings.email.cancel-change');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
    Route::delete('settings/sessions', [SecurityController::class, 'destroyOtherSessions'])
        ->name('security.sessions.destroy');

    Route::redirect('settings/appearance', '/settings/profile')->name('appearance.edit');
    Route::redirect('settings/notifications', '/notifications')->name('notifications.settings');
});
