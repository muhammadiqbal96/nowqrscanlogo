<?php

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Api\AiContentController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\CampaignController;
use App\Http\Controllers\Api\ConnectedPlatformController;
use App\Http\Controllers\Api\AutoPostSubscriptionController;
use App\Http\Controllers\Api\AutoPostController;
use App\Http\Controllers\Api\CreditController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ScanLogoController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminBlogController;
use App\Http\Controllers\Admin\AdminAutoPostController;
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

// Public campaign page (hosted landing page)
Route::get('/pages/{slug}', [CampaignController::class, 'publicPage']);

// Public blog routes
Route::get('/blogs', [BlogController::class, 'index']);
Route::get('/blogs/latest', [BlogController::class, 'latest']);
Route::get('/blogs/{slug}', [BlogController::class, 'show']);

// ─── Protected Routes (require auth token) ──────────────────────────
Route::middleware(['auth:sanctum', 'check.blocked'])->group(function () {

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
    Route::get('/campaigns/{campaign}/flyers', [CampaignController::class, 'listFlyers']);
    Route::post('/campaigns/{campaign}/flyers', [CampaignController::class, 'storeFlyer']);
    Route::delete('/campaigns/{campaign}/flyers/{flyer}', [CampaignController::class, 'destroyFlyer']);

    // ScanLogos
    Route::apiResource('scanlogos', ScanLogoController::class)->parameters(['scanlogos' => 'scanLogo']);
    Route::post('/scanlogos/{scanLogo}/upload-logo', [ScanLogoController::class, 'uploadLogo']);

    // AI Content
    Route::post('/ai/generate', [AiContentController::class, 'generateAdCopy']);

    // Templates
    Route::post('/templates/generate', [\App\Http\Controllers\Api\TemplateController::class, 'generateTemplates']);
    Route::get('/templates/categories', [\App\Http\Controllers\Api\TemplateController::class, 'categories']);

    // Analytics
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/analytics/campaigns/{campaignId}', [AnalyticsController::class, 'campaign']);
    Route::get('/analytics/scanlogos/{scanLogoId}', [AnalyticsController::class, 'scanLogo']);

    // Credits
    Route::get('/credits/balance', [CreditController::class, 'balance']);
    Route::get('/credits/transactions', [CreditController::class, 'transactions']);
    Route::post('/credits/purchase-plan', [CreditController::class, 'purchasePlan']);
    Route::post('/credits/top-up', [CreditController::class, 'topUp']);
    Route::post('/credits/verify-session', [CreditController::class, 'verifySession']);

    // ─── Connected Platforms ────────────────────────────────────
    Route::apiResource('platforms', ConnectedPlatformController::class)->parameters(['platforms' => 'platform']);
    Route::post('/platforms/{platform}/test', [ConnectedPlatformController::class, 'testConnection']);

    // ─── Auto-Post Subscriptions ────────────────────────────────
    Route::get('/autopost/pricing', [AutoPostSubscriptionController::class, 'pricing']);
    Route::apiResource('autopost/subscriptions', AutoPostSubscriptionController::class)
        ->parameters(['subscriptions' => 'subscription']);

    // ─── Auto-Posts ─────────────────────────────────────────────
    Route::get('/autopost/stats', [AutoPostController::class, 'stats']);
    Route::apiResource('autopost/posts', AutoPostController::class)->parameters(['posts' => 'autoPost']);
    Route::post('/autopost/posts/{autoPost}/publish', [AutoPostController::class, 'publish']);

    // ─── Admin Routes ───────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/stats', [AdminDashboardController::class, 'stats']);

        // User management
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::post('/users/{user}/block', [AdminUserController::class, 'block']);
        Route::post('/users/{user}/unblock', [AdminUserController::class, 'unblock']);
        Route::post('/users/{user}/give-credits', [AdminUserController::class, 'giveCredits']);
        Route::post('/users/{user}/change-plan', [AdminUserController::class, 'changePlan']);
        Route::post('/users/{user}/toggle-admin', [AdminUserController::class, 'toggleAdmin']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);

        // Blog management
        Route::apiResource('blogs', AdminBlogController::class);
        Route::post('/blogs/{blog}/cover', [AdminBlogController::class, 'uploadCover']);
        Route::post('/blogs/upload-image', [AdminBlogController::class, 'uploadContentImage']);

        // Auto-Post management
        Route::get('/autopost/stats', [AdminAutoPostController::class, 'stats']);
        Route::get('/autopost/subscriptions', [AdminAutoPostController::class, 'subscriptions']);
        Route::post('/autopost/subscriptions/{subscription}/cancel', [AdminAutoPostController::class, 'cancelSubscription']);
        Route::get('/autopost/posts', [AdminAutoPostController::class, 'posts']);
        Route::get('/autopost/posts/{autoPost}', [AdminAutoPostController::class, 'showPost']);
        Route::delete('/autopost/posts/{autoPost}', [AdminAutoPostController::class, 'destroyPost']);
    });
});

// Stripe webhook (no auth)
Route::post('/stripe/webhook', [CreditController::class, 'stripeWebhook']);
