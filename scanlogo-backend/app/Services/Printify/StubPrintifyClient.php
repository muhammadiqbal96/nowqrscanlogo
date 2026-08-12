<?php

namespace App\Services\Printify;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Offline stand-in for Printify.
 *
 * Returns deterministic, realistically-shaped responses so the whole order flow
 * can be exercised before a Printify account exists. Shipping deliberately
 * varies by destination — a stub that always returns the same cost would hide
 * the margin problem this integration exists to manage.
 */
class StubPrintifyClient implements PrintifyClient
{
    /** Shipping in cents for the first item, by region. */
    private const SHIPPING_FIRST_ITEM = [
        'US' => 399,
        'CA' => 599,
        'GB' => 599,
        'AU' => 899,
        'DEFAULT' => 1099,
    ];

    /** Each additional item in the same parcel. */
    private const SHIPPING_ADDITIONAL_ITEM = 75;

    public function isLive(): bool
    {
        return false;
    }

    public function uploadImage(string $fileName, string $base64Contents): array
    {
        if ($base64Contents === '') {
            throw new PrintifyException('Unable to upload image: empty contents', 422);
        }

        $id = 'stub-img-' . substr(md5($fileName . strlen($base64Contents)), 0, 16);

        Log::info('StubPrintifyClient::uploadImage', [
            'file_name' => $fileName,
            'bytes' => (int) (strlen($base64Contents) * 0.75),
            'image_id' => $id,
        ]);

        return [
            'id' => $id,
            'file_name' => $fileName,
            'preview_url' => "https://stub.printify.local/preview/{$id}.png",
            'width' => null,
            'height' => null,
        ];
    }

    public function calculateShipping(array $lineItems, array $address): array
    {
        $country = strtoupper($address['country'] ?? 'US');
        $quantity = array_sum(array_map(
            static fn (array $item): int => (int) ($item['quantity'] ?? 1),
            $lineItems
        )) ?: 1;

        $first = self::SHIPPING_FIRST_ITEM[$country] ?? self::SHIPPING_FIRST_ITEM['DEFAULT'];
        $standard = $first + (max(0, $quantity - 1) * self::SHIPPING_ADDITIONAL_ITEM);

        return [
            'standard' => $standard,
            'express' => $standard + 800,
            'priority' => $standard + 1200,
            'economy' => max(199, $standard - 100),
        ];
    }

    public function createOrder(array $payload): array
    {
        if (empty($payload['line_items'])) {
            throw new PrintifyException('Unable to create order: no line items', 422);
        }
        if (empty($payload['address_to'])) {
            throw new PrintifyException('Unable to create order: no shipping address', 422);
        }

        $id = 'stub-order-' . Str::lower(Str::random(12));

        Log::info('StubPrintifyClient::createOrder', [
            'external_id' => $payload['external_id'] ?? null,
            'printify_order_id' => $id,
            'line_items' => count($payload['line_items']),
        ]);

        return ['id' => $id, 'status' => 'draft'];
    }

    public function sendToProduction(string $printifyOrderId): array
    {
        Log::info('StubPrintifyClient::sendToProduction', [
            'printify_order_id' => $printifyOrderId,
        ]);

        return ['id' => $printifyOrderId, 'status' => 'in-production'];
    }

    public function getOrder(string $printifyOrderId): array
    {
        return [
            'id' => $printifyOrderId,
            'status' => 'in-production',
            'shipments' => [],
        ];
    }

    public function cancelOrder(string $printifyOrderId): array
    {
        Log::info('StubPrintifyClient::cancelOrder', [
            'printify_order_id' => $printifyOrderId,
        ]);

        return ['id' => $printifyOrderId, 'status' => 'canceled'];
    }
}
