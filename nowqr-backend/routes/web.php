<?php

use App\Http\Controllers\RedirectController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Short URL redirect for QR scans (e.g., nqr.ai/abc123)
Route::get('/r/{shortCode}', [RedirectController::class, 'handleRedirect'])
    ->name('redirect.scan');
