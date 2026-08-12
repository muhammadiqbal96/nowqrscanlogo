<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * PayPal orders for physical goods.
 *
 * Kept separate from CreditController's inline PayPal calls on purpose: that
 * flow is live and sells credits with shipping_preference NO_SHIPPING, while
 * physical orders must carry an address. Merging them is worth doing later, but
 * not at the cost of destabilising payments that already work.
 */
class PayPalService
{
    /**
     * Create an order that requires a shipping address.
     *
     * @param  array<string, string>  $shippingAddress
     * @return array{id: string, approve_url: string}
     */
    public function createPhysicalOrder(
        string $referenceId,
        string $customId,
        float $amountUsd,
        string $description,
        array $shippingAddress,
        string $shippingFullName,
        string $returnUrl,
        string $cancelUrl,
    ): array {
        $token = $this->getAccessToken();
        $baseUrl = $this->getBaseUrl();

        $response = $this->http()->withToken($token)
            ->acceptJson()
            ->post("{$baseUrl}/v2/checkout/orders", [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'reference_id' => $referenceId,
                    'description' => mb_substr($description, 0, 127),
                    'custom_id' => $customId,
                    'amount' => [
                        'currency_code' => 'USD',
                        'value' => number_format($amountUsd, 2, '.', ''),
                    ],
                    'shipping' => [
                        'name' => ['full_name' => $shippingFullName],
                        'address' => $shippingAddress,
                    ],
                ]],
                'application_context' => [
                    'brand_name' => 'NowQR',
                    'user_action' => 'PAY_NOW',
                    // The buyer already gave us an address we validated against
                    // the Printify allowlist, so PayPal must not let them swap
                    // it for one we cannot ship to.
                    'shipping_preference' => 'SET_PROVIDED_ADDRESS',
                    'return_url' => $returnUrl,
                    'cancel_url' => $cancelUrl,
                ],
            ]);

        if (!$response->successful()) {
            throw new RuntimeException('PayPal create order failed: ' . $response->body());
        }

        $payload = $response->json();
        $approveUrl = collect($payload['links'] ?? [])->firstWhere('rel', 'approve')['href'] ?? null;

        if (!$approveUrl) {
            throw new RuntimeException('PayPal order response missing approval URL');
        }

        return [
            'id' => (string) $payload['id'],
            'approve_url' => $approveUrl,
        ];
    }

    /**
     * Capture an approved order. Treats an already-captured order as success so
     * a retried verification is idempotent.
     */
    public function captureOrder(string $orderId): array
    {
        $token = $this->getAccessToken();
        $baseUrl = $this->getBaseUrl();

        $response = $this->http()->withToken($token)
            ->acceptJson()
            ->post("{$baseUrl}/v2/checkout/orders/{$orderId}/capture", []);

        if ($response->successful()) {
            return $response->json();
        }

        $errorJson = $response->json();
        $issue = $errorJson['details'][0]['issue'] ?? null;

        if ($response->status() === 422 && $issue === 'ORDER_ALREADY_CAPTURED') {
            $details = $this->http()->withToken($token)
                ->acceptJson()
                ->get("{$baseUrl}/v2/checkout/orders/{$orderId}");

            if ($details->successful()) {
                return $details->json();
            }
        }

        throw new RuntimeException('PayPal capture failed: ' . $response->body());
    }

    public function refundCapture(string $captureId, ?float $amountUsd = null): array
    {
        $token = $this->getAccessToken();
        $baseUrl = $this->getBaseUrl();

        $payload = $amountUsd === null ? [] : [
            'amount' => [
                'currency_code' => 'USD',
                'value' => number_format($amountUsd, 2, '.', ''),
            ],
        ];

        $response = $this->http()->withToken($token)
            ->acceptJson()
            ->post("{$baseUrl}/v2/payments/captures/{$captureId}/refund", $payload);

        if (!$response->successful()) {
            throw new RuntimeException('PayPal refund failed: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Pull the captured amount/currency/id out of a capture response.
     *
     * @return array{amount: float, currency: string, capture_id: ?string, status: ?string}
     */
    public function extractCapture(array $capture): array
    {
        $unit = $capture['purchase_units'][0] ?? [];
        $payment = $unit['payments']['captures'][0] ?? [];

        return [
            'amount' => (float) ($payment['amount']['value'] ?? 0),
            'currency' => strtoupper((string) ($payment['amount']['currency_code'] ?? 'USD')),
            'capture_id' => $payment['id'] ?? null,
            'status' => $payment['status'] ?? ($capture['status'] ?? null),
        ];
    }

    public function isConfigured(): bool
    {
        return (bool) config('services.paypal.client_id')
            && (bool) config('services.paypal.client_secret');
    }

    private function getAccessToken(): string
    {
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');

        if (!$clientId || !$clientSecret) {
            throw new RuntimeException('PayPal credentials are not configured');
        }

        $response = $this->http()->asForm()
            ->withBasicAuth($clientId, $clientSecret)
            ->post("{$this->getBaseUrl()}/v1/oauth2/token", [
                'grant_type' => 'client_credentials',
            ]);

        if (!$response->successful()) {
            throw new RuntimeException('PayPal token request failed: ' . $response->body());
        }

        $accessToken = $response->json('access_token');
        if (!$accessToken) {
            throw new RuntimeException('PayPal token response missing access_token');
        }

        return $accessToken;
    }

    private function getBaseUrl(): string
    {
        return config('services.paypal.mode', 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private function http(): PendingRequest
    {
        $request = Http::timeout((int) config('services.paypal.timeout', 20));

        if (!config('services.paypal.verify_ssl', true)) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }
}
