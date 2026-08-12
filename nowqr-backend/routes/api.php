<?php

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\EmailVerificationController;
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
use App\Http\Controllers\Api\PrintArtworkController;
use App\Http\Controllers\Api\PrintOrderController;
use App\Http\Controllers\Api\PrintProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ScanLogoController;
use App\Http\Controllers\Api\StickerTemplateController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminBlogController;
use App\Http\Controllers\Admin\AdminAutoPostController;
use App\Http\Controllers\Admin\AdminCouponController;
use App\Http\Controllers\Admin\AdminPrintController;
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
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1');
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('signed')
        ->name('verification.verify');

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

// Public print-on-demand catalog (bumper stickers and friends)
Route::get('/print/products', [PrintProductController::class, 'index']);

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
    Route::post('/credits/validate-coupon', [CreditController::class, 'validateCoupon']);

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

    // Print-on-demand (physical stickers via Printify)
    Route::post('/print/templates/generate', [StickerTemplateController::class, 'generate']);
    Route::post('/print/artwork', [PrintArtworkController::class, 'store']);
    Route::get('/print/orders', [PrintOrderController::class, 'index']);
    Route::post('/print/orders', [PrintOrderController::class, 'store']);
    Route::get('/print/orders/{printOrder}', [PrintOrderController::class, 'show']);
    Route::post('/print/orders/{printOrder}/verify', [PrintOrderController::class, 'verify']);

    // ─── Admin Routes ───────────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/stats', [AdminDashboardController::class, 'stats']);

        // Print-on-demand management
        Route::get('/print/stats', [AdminPrintController::class, 'stats']);
        Route::get('/print/orders', [AdminPrintController::class, 'orders']);
        Route::get('/print/orders/{printOrder}', [AdminPrintController::class, 'showOrder']);
        Route::post('/print/orders/{printOrder}/retry', [AdminPrintController::class, 'retryOrder']);
        Route::post('/print/orders/{printOrder}/send-to-production', [AdminPrintController::class, 'sendToProduction']);
        Route::post('/print/orders/{printOrder}/sync', [AdminPrintController::class, 'syncOrder']);
        Route::post('/print/orders/{printOrder}/resolve', [AdminPrintController::class, 'resolveOrder']);
        Route::get('/print/products', [AdminPrintController::class, 'products']);
        Route::put('/print/products/{printProduct}', [AdminPrintController::class, 'updateProduct']);

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

        // Coupon management
        Route::apiResource('coupons', AdminCouponController::class);

        // Auto-Post management
        Route::get('/autopost/stats', [AdminAutoPostController::class, 'stats']);
        Route::get('/autopost/subscriptions', [AdminAutoPostController::class, 'subscriptions']);
        Route::post('/autopost/subscriptions/{subscription}/cancel', [AdminAutoPostController::class, 'cancelSubscription']);
        Route::get('/autopost/posts', [AdminAutoPostController::class, 'posts']);
        Route::get('/autopost/posts/{autoPost}', [AdminAutoPostController::class, 'showPost']);
        Route::delete('/autopost/posts/{autoPost}', [AdminAutoPostController::class, 'destroyPost']);
    });
});

// PayPal webhook / payment webhook (no auth)
Route::post('/paypal/webhook', [CreditController::class, 'paypalWebhook']);
