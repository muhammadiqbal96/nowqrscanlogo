<?php

use App\Http\Controllers\Auth\WebResetPasswordController;
use App\Http\Controllers\RedirectController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

Route::get('/', function () {
    $spaPath = public_path('index.html');

    if (File::exists($spaPath)) {
        return response()->file($spaPath);
    }

    return view('welcome');
});

// Short URL redirect for QR scans (e.g., nqr.ai/abc123)
Route::get('/r/{shortCode}', [RedirectController::class, 'handleRedirect'])
    ->name('redirect.scan');

// Password reset fallback page (works even if frontend route is unavailable)
Route::get('/reset-password', [WebResetPasswordController::class, 'showForm'])
    ->name('password.reset.form');
Route::post('/reset-password', [WebResetPasswordController::class, 'reset'])
    ->name('password.reset.submit');

// SPA fallback (exclude API and redirect prefix)
Route::get('/{any}', function () {
    $spaPath = public_path('index.html');

    if (File::exists($spaPath)) {
        return response()->file($spaPath);
    }

    abort(404);
})->where('any', '^(?!api(?:/|$)|r(?:/|$)).*');
