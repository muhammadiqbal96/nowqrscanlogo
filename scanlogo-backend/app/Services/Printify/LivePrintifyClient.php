<?php

namespace App\Services\Printify;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LivePrintifyClient implements PrintifyClient
{
    public function __construct(
        private readonly string $apiToken,
        private readonly string $shopId,
        private readonly string $baseUrl,
        private readonly int $timeout = 30,
    ) {
    }

    public function isLive(): bool
    {
        return true;
    }

    public function uploadImage(string $fileName, string $base64Contents): array
    {
        $response = $this->http()->post("{$this->baseUrl}/uploads/images.json", [
            'file_name' => $fileName,
            'contents' => $base64Contents,
        ]);

        $body = $this->unwrap($response, 'upload image');

        return [
            'id' => (string) ($body['id'] ?? ''),
            'file_name' => (string) ($body['file_name'] ?? $fileName),
            'preview_url' => $body['preview_url'] ?? null,
            'width' => isset($body['width']) ? (int) $body['width'] : null,
            'height' => isset($body['height']) ? (int) $body['height'] : null,
        ];
    }

    public function calculateShipping(array $lineItems, array $address): array
    {
        $response = $this->http()->post(
            "{$this->baseUrl}/shops/{$this->shopId}/orders/shipping.json",
            [
                'line_items' => $lineItems,
                'address_to' => $address,
            ]
        );

        $body = $this->unwrap($response, 'calculate shipping');

        return [
            'standard' => isset($body['standard']) ? (int) $body['standard'] : null,
            'express' => isset($body['express']) ? (int) $body['express'] : null,
            'priority' => isset($body['priority']) ? (int) $body['priority'] : null,
            'economy' => isset($body['economy']) ? (int) $body['economy'] : null,
        ];
    }

    public function createOrder(array $payload): array
    {
        $response = $this->http()->post(
            "{$this->baseUrl}/shops/{$this->shopId}/orders.json",
            $payload
        );

        $body = $this->unwrap($response, 'create order');

        return [
            'id' => (string) ($body['id'] ?? ''),
            'status' => (string) ($body['status'] ?? 'pending'),
        ];
    }

    public function sendToProduction(string $printifyOrderId): array
    {
        $response = $this->http()->post(
            "{$this->baseUrl}/shops/{$this->shopId}/orders/{$printifyOrderId}/send_to_production.json"
        );

        return $this->unwrap($response, 'send order to production');
    }

    public function getOrder(string $printifyOrderId): array
    {
        $response = $this->http()->get(
            "{$this->baseUrl}/shops/{$this->shopId}/orders/{$printifyOrderId}.json"
        );

        return $this->unwrap($response, 'fetch order');
    }

    public function cancelOrder(string $printifyOrderId): array
    {
        $response = $this->http()->post(
            "{$this->baseUrl}/shops/{$this->shopId}/orders/{$printifyOrderId}/cancel.json"
        );

        return $this->unwrap($response, 'cancel order');
    }

    private function http(): PendingRequest
    {
        return Http::timeout($this->timeout)
            ->withToken($this->apiToken)
            ->acceptJson()
            ->asJson();
    }

    /**
     * @throws PrintifyException
     */
    private function unwrap(Response $response, string $action): array
    {
        if ($response->successful()) {
            return $response->json() ?? [];
        }

        $body = $response->json();

        Log::error("Printify failed to {$action}", [
            'status' => $response->status(),
            'body' => $body,
        ]);

        $message = $body['message']
            ?? $body['error']
            ?? "Printify request failed with status {$response->status()}";

        throw new PrintifyException(
            "Unable to {$action}: {$message}",
            $response->status(),
            is_array($body) ? $body : null,
        );
    }
}
