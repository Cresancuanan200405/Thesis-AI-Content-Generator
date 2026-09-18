<?php

use App\Http\Controllers\Settings\EmailChangeController;
use App\Http\Controllers\Settings\GoogleAccountController;
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
    Route::get('settings/email/verify/google', [EmailChangeController::class, 'redirectToGoogle'])
        ->middleware('throttle:10,1')
        ->name('settings.email.verify.google');
    Route::get('settings/email/verify/google/callback', [EmailChangeController::class, 'handleGoogleCallback'])
        ->name('settings.email.verify.google.callback');
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

    // Secure Change Google Account
    Route::get('settings/google/verify-current', [GoogleAccountController::class, 'verifyCurrentAccount'])
        ->middleware('throttle:10,1')
        ->name('settings.google.verify-current');
    Route::get('settings/google/verify-current/callback', [GoogleAccountController::class, 'handleVerifyCurrentCallback'])
        ->name('settings.google.verify-current.callback');
    Route::post('settings/google/verify-password', [GoogleAccountController::class, 'verifyPassword'])
        ->middleware('throttle:6,1')
        ->name('settings.google.verify-password');
    Route::get('settings/google/change', [GoogleAccountController::class, 'redirectToNewGoogle'])
        ->middleware('throttle:10,1')
        ->name('settings.google.change');
    Route::get('settings/google/change/callback', [GoogleAccountController::class, 'handleNewGoogleCallback'])
        ->name('settings.google.change.callback');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');
    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
    Route::delete('settings/sessions', [SecurityController::class, 'destroyOtherSessions'])
        ->name('security.sessions.destroy');

    Route::redirect('settings/appearance', '/settings/profile')->name('appearance.edit');
    Route::redirect('settings/notifications', '/notifications')->name('notifications.settings');
});
