<?php

namespace App\Services\Printify;

interface PrintifyClient
{
    /**
     * Upload artwork to Printify's media library.
     *
     * Printify accepts raw base64 contents, which is why NowQR never needs the
     * artwork to be publicly reachable.
     *
     * @param  string  $base64Contents  Raw base64 (no data: URI prefix).
     * @return array{id: string, file_name: string, preview_url: ?string, width: ?int, height: ?int}
     *
     * @throws PrintifyException
     */
    public function uploadImage(string $fileName, string $base64Contents): array;

    /**
     * Quote shipping for a set of line items to a destination.
     *
     * @param  array<int, array{print_provider_id: int, blueprint_id: int, variant_id: int, quantity: int}>  $lineItems
     * @param  array<string, string>  $address
     * @return array{standard: ?int, express: ?int, priority: ?int, economy: ?int} Costs in minor units.
     *
     * @throws PrintifyException
     */
    public function calculateShipping(array $lineItems, array $address): array;

    /**
     * Create an order. The order is a draft until sendToProduction is called,
     * so this call alone never charges anything.
     *
     * @return array{id: string, status: string}
     *
     * @throws PrintifyException
     */
    public function createOrder(array $payload): array;

    /**
     * Submit a draft order for printing. This is the call that spends money.
     *
     * @throws PrintifyException
     */
    public function sendToProduction(string $printifyOrderId): array;

    /**
     * @throws PrintifyException
     */
    public function getOrder(string $printifyOrderId): array;

    /**
     * @throws PrintifyException
     */
    public function cancelOrder(string $printifyOrderId): array;

    /**
     * True when this client talks to the real Printify API.
     */
    public function isLive(): bool;
}
