<?php

use App\Http\Controllers\RedirectController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

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

// Serve public uploads (logos, etc.) even when the `public/storage` symlink is
// missing — common on shared hosting (Hostinger) and after a zipped deploy where
// symlinks don't survive. When the symlink DOES exist the web server serves the
// file directly and never reaches this route, so it's harmless either way.
// `Storage::disk('public')->exists()` is scoped to the disk root, blocking traversal.
Route::get('/storage/{path}', function (string $path) {
    $disk = Storage::disk('public');

    abort_unless($disk->exists($path), 404);

    return response()->file($disk->path($path), [
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('path', '.*');

// SPA fallback (exclude API, redirect prefix, and storage uploads)
Route::get('/{any}', function () {
    $spaPath = public_path('index.html');

    if (File::exists($spaPath)) {
        return response()->file($spaPath);
    }

    abort(404);
})->where('any', '^(?!api(?:/|$)|r(?:/|$)|storage(?:/|$)).*');
