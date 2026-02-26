<?php

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Api\AiContentController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\CreditController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ScanLogoController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Public Auth Routes ─────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisterController::class, 'register']);
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
    Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);

    // Google OAuth
    Route::get('/google', [GoogleAuthController::class, 'redirect']);
    Route::get('/google/callback', [GoogleAuthController::class, 'callback']);
});

// ─── Public Routes ──────────────────────────────────────────────────
Route::get('/scanlogo-options', [ScanLogoController::class, 'options']);
Route::get('/pricing', function () {
    return response()->json([
        'plans' => CreditController::getPricing(),
        'credit_costs' => CreditController::getCreditCosts(),
    ]);
});

// ─── Protected Routes (require auth token) ──────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [LoginController::class, 'logout']);
    Route::get('/auth/me', [LoginController::class, 'me']);

    // Profile
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::delete('/profile', [ProfileController::class, 'destroy']);

    // Campaigns
    Route::apiResource('campaigns', CampaignController::class);
    Route::post('/campaigns/{campaign}/publish', [CampaignController::class, 'publish']);
    Route::post('/campaigns/{campaign}/upload', [CampaignController::class, 'uploadAsset']);

    // ScanLogos
    Route::apiResource('scanlogos', ScanLogoController::class);
    Route::post('/scanlogos/{scanLogo}/upload-logo', [ScanLogoController::class, 'uploadLogo']);

    // AI Content
    Route::post('/ai/generate', [AiContentController::class, 'generateAdCopy']);

    // Analytics
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/analytics/campaigns/{campaignId}', [AnalyticsController::class, 'campaign']);
    Route::get('/analytics/scanlogos/{scanLogoId}', [AnalyticsController::class, 'scanLogo']);

    // Credits
    Route::get('/credits/balance', [CreditController::class, 'balance']);
    Route::get('/credits/transactions', [CreditController::class, 'transactions']);
    Route::post('/credits/purchase-plan', [CreditController::class, 'purchasePlan']);
    Route::post('/credits/top-up', [CreditController::class, 'topUp']);
});
