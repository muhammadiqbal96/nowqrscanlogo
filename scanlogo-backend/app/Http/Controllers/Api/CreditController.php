<?php

namespace App\Http\Controllers\Api;

use App\Mail\PurchaseReceiptMail;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CreditController extends Controller
{
    /**
     * Get current credit balance and pricing info.
     */
    public function balance(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'credits' => $user->credits,
            'plan' => $user->plan,
            'pricing' => self::getPricing(),
            'costs' => self::getCreditCosts(),
        ]);
    }

    /**
     * Get transaction history.
     */
    public function transactions(Request $request): JsonResponse
    {
        $transactions = $request->user()->creditTransactions()
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Create a PayPal order for a plan purchase.
     */
    public function purchasePlan(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => ['required', 'in:creator,agency'],
        ]);

        $user = $request->user();
        $plan = $request->input('plan');

        $planDetails = self::getPricing()[$plan] ?? null;
        if (!$planDetails) {
            return response()->json(['message' => 'Invalid plan'], 422);
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        try {
            $order = $this->createPaypalOrder(
                userId: (int) $user->id,
                type: 'plan_purchase',
                credits: (int) $planDetails['credits'],
                plan: (string) $plan,
                amountUsd: (float) $planDetails['price'],
                description: "{$planDetails['name']} ({$planDetails['credits']} credits)",
                returnUrl: "{$frontendUrl}/dashboard/credits?paypal_success=1",
                cancelUrl: "{$frontendUrl}/dashboard/credits?cancelled=1",
            );
        } catch (\Throwable $e) {
            Log::error('PayPal order creation failed for plan purchase', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to start PayPal checkout'], 500);
        }

        return response()->json([
            'checkout_url' => $order['approve_url'],
            'session_id' => $order['id'],
            'provider' => 'paypal',
        ]);
    }

    /**
     * Create a PayPal order for a credit top-up.
     */
    public function topUp(Request $request): JsonResponse
    {
        $request->validate([
            'credits' => ['required', 'integer', 'min:50', 'max:10000'],
        ]);

        $user = $request->user();
        $credits = (int) $request->input('credits');

        // Price: $10 per 100 credits
        $amountUsd = round(($credits / 100) * 10, 2);
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        try {
            $order = $this->createPaypalOrder(
                userId: (int) $user->id,
                type: 'top_up',
                credits: $credits,
                plan: '-',
                amountUsd: $amountUsd,
                description: "ScanLogo Credit Top-Up ({$credits} credits)",
                returnUrl: "{$frontendUrl}/dashboard/credits?paypal_success=1",
                cancelUrl: "{$frontendUrl}/dashboard/credits?cancelled=1",
            );
        } catch (\Throwable $e) {
            Log::error('PayPal order creation failed for top-up', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to start PayPal checkout'], 500);
        }

        return response()->json([
            'checkout_url' => $order['approve_url'],
            'session_id' => $order['id'],
            'provider' => 'paypal',
        ]);
    }

    /**
     * Verify a completed PayPal order and fulfill credits.
     */
    public function verifySession(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => ['required', 'string'],
        ]);

        $user = $request->user();

        try {
            $orderId = $request->input('session_id');

            // Prevent double-fulfillment
            $existingTx = $user->creditTransactions()
                ->where('payment_id', $orderId)
                ->first();

            if ($existingTx) {
                return response()->json([
                    'message' => 'Credits already added for this payment',
                    'credits' => $user->credits,
                    'already_fulfilled' => true,
                ]);
            }

            $capture = $this->capturePaypalOrder($orderId);

            $customId = $capture['purchase_units'][0]['custom_id'] ?? null;
            if (!$customId) {
                return response()->json(['message' => 'Unable to validate payment metadata'], 422);
            }

            [$prefix, $orderUserId, $type, $creditsRaw, $planRaw] = array_pad(explode('|', $customId), 5, null);
            if (!in_array($prefix, ['scanlogo', 'now' . 'qr'], true) || (int) $orderUserId !== (int) $user->id) {
                return response()->json(['message' => 'Payment does not belong to this user'], 403);
            }

            $credits = (int) $creditsRaw;
            $plan = ($planRaw && $planRaw !== '-') ? $planRaw : null;
            if ($credits <= 0) {
                return response()->json(['message' => 'Invalid credit payload from payment provider'], 422);
            }

            $captureAmount = (float) (($capture['purchase_units'][0]['payments']['captures'][0]['amount']['value'] ?? 0));
            $captureCurrency = strtoupper((string) ($capture['purchase_units'][0]['payments']['captures'][0]['amount']['currency_code'] ?? 'USD'));
            $captureId = $capture['purchase_units'][0]['payments']['captures'][0]['id'] ?? $orderId;

            if ($type === 'plan_purchase' && $plan) {
                $user->update(['plan' => $plan]);
                $planDetails = self::getPricing()[$plan] ?? ['name' => ucfirst($plan)];
                $user->addCredits(
                    $credits,
                    'purchase',
                    "Purchased {$planDetails['name']} plan",
                    [
                        'provider' => 'paypal',
                        'payment_id' => $orderId,
                        'amount' => $captureAmount,
                        'currency' => $captureCurrency,
                    ]
                );

                $this->sendPurchaseReceipt(
                    $user,
                    "{$planDetails['name']} plan",
                    $credits,
                    $captureAmount,
                    $captureCurrency,
                    $captureId,
                );
            } else {
                $user->addCredits(
                    $credits,
                    'purchase',
                    "Credit top-up: {$credits} credits",
                    [
                        'provider' => 'paypal',
                        'payment_id' => $orderId,
                        'amount' => $captureAmount,
                        'currency' => $captureCurrency,
                    ]
                );

                $this->sendPurchaseReceipt(
                    $user,
                    'Credit top-up',
                    $credits,
                    $captureAmount,
                    $captureCurrency,
                    $captureId,
                );
            }

            return response()->json([
                'message' => "Successfully added {$credits} credits",
                'credits' => $user->fresh()->credits,
                'plan' => $user->fresh()->plan,
            ]);
        } catch (\Throwable $e) {
            Log::error('PayPal payment verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Payment verification failed'], 500);
        }
    }

    /**
     * Payment webhook endpoint placeholder.
     */
    public function paypalWebhook(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'ignored',
            'message' => 'Webhook is currently not required. PayPal flow uses order capture verification after redirect.',
        ]);
    }

    private function createPaypalOrder(
        int $userId,
        string $type,
        int $credits,
        string $plan,
        float $amountUsd,
        string $description,
        string $returnUrl,
        string $cancelUrl,
    ): array {
        $token = $this->getPaypalAccessToken();
        $baseUrl = $this->getPaypalBaseUrl();

        $customId = implode('|', ['scanlogo', $userId, $type, $credits, $plan ?: '-']);

        $response = $this->paypalHttp()->withToken($token)
            ->acceptJson()
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'description' => $description,
                    'custom_id' => $customId,
                    'amount' => [
                        'currency_code' => 'USD',
                        'value' => number_format($amountUsd, 2, '.', ''),
                    ],
                ]],
                'application_context' => [
                    'brand_name' => 'ScanLogo',
                    'user_action' => 'PAY_NOW',
                    'shipping_preference' => 'NO_SHIPPING',
                    'return_url' => $returnUrl,
                    'cancel_url' => $cancelUrl,
                ],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('PayPal create order failed: ' . $response->body());
        }

        $payload = $response->json();
        $approveUrl = collect($payload['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;
        if (!$approveUrl) {
            throw new \RuntimeException('PayPal order response missing approval URL');
        }

        return [
            'id' => $payload['id'],
            'approve_url' => $approveUrl,
        ];
    }

    private function capturePaypalOrder(string $orderId): array
    {
        $token = $this->getPaypalAccessToken();
        $baseUrl = $this->getPaypalBaseUrl();

        $captureResponse = $this->paypalHttp()->withToken($token)
            ->acceptJson()
            ->post("{$baseUrl}/v2/checkout/orders/{$orderId}/capture", []);

        if ($captureResponse->successful()) {
            return $captureResponse->json();
        }

        $errorJson = $captureResponse->json();
        $issue = $errorJson['details'][0]['issue'] ?? null;

        // If already captured, fetch order details and continue fulfillment idempotently.
        if ($captureResponse->status() === 422 && $issue === 'ORDER_ALREADY_CAPTURED') {
            $detailsResponse = $this->paypalHttp()->withToken($token)
                ->acceptJson()
                ->get("{$baseUrl}/v2/checkout/orders/{$orderId}");

            if ($detailsResponse->successful()) {
                return $detailsResponse->json();
            }
        }

        throw new \RuntimeException('PayPal capture failed: ' . $captureResponse->body());
    }

    private function getPaypalAccessToken(): string
    {
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');

        if (!$clientId || !$clientSecret) {
            throw new \RuntimeException('PayPal credentials are not configured');
        }

        $baseUrl = $this->getPaypalBaseUrl();

        $response = $this->paypalHttp()->asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post("{$baseUrl}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('PayPal token request failed: ' . $response->body());
        }

        $accessToken = $response->json('access_token');
        if (!$accessToken) {
            throw new \RuntimeException('PayPal token response missing access_token');
        }

        return $accessToken;
    }

    private function getPaypalBaseUrl(): string
    {
        return config('services.paypal.mode', 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private function paypalHttp(): PendingRequest
    {
        $request = Http::timeout((int) config('services.paypal.timeout', 20));

        if (!config('services.paypal.verify_ssl', true)) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }

    /**
     * Get pricing plans.
     */
    public static function getPricing(): array
    {
        return [
            'free' => [
                'name' => 'Free',
                'price' => 0,
                'credits' => 0,
                'features' => [
                    '1 basic QR code',
                    'Watermarked exports',
                    'Limited templates',
                ],
            ],
            'creator' => [
                'name' => 'Creator Pack',
                'price' => 47,
                'credits' => 200,
                'features' => [
                    '200 credits',
                    'All animated ScanLogos',
                    'Dynamic QR codes',
                    'Full Canva-style editor',
                    'AI content generation',
                    'Analytics dashboard',
                ],
            ],
            'agency' => [
                'name' => 'Agency Bundle',
                'price' => 97,
                'credits' => 600,
                'features' => [
                    '600 credits',
                    'Everything in Creator',
                    'Multi-campaign management',
                    'Priority support',
                    'Advanced analytics',
                    'Bulk exports',
                ],
            ],
        ];
    }

    /**
     * Get credit costs for each action.
     */
    public static function getCreditCosts(): array
    {
        return [
            'ai_content' => ['cost' => 5, 'label' => 'Generate AI ad copy'],
            'create_scanlogo' => ['cost' => 3, 'label' => 'Create a ScanLogo'],
            'update_destination' => ['cost' => 1, 'label' => 'Update dynamic QR destination'],
            'export_social' => ['cost' => 2, 'label' => 'Export social media sizes'],
        ];
    }

    private function sendPurchaseReceipt(
        $user,
        string $receiptTitle,
        int $credits,
        float $amount,
        string $currency,
        ?string $paymentId,
    ): void {
        try {
            Mail::to($user->email)->send(new PurchaseReceiptMail(
                user: $user,
                receiptTitle: $receiptTitle,
                credits: $credits,
                amount: $amount,
                currency: $currency,
                paymentId: $paymentId,
            ));
        } catch (\Throwable $e) {
            Log::error('Failed to send purchase receipt email', [
                'user_id' => $user->id,
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
