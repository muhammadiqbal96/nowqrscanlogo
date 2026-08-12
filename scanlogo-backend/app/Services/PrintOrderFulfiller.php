<?php

namespace App\Services;

use App\Models\PrintArtwork;
use App\Models\PrintOrder;
use App\Services\Printify\PrintifyClient;
use App\Services\Printify\PrintifyException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PrintOrderFulfiller
{
    public function __construct(private readonly PrintifyClient $printify)
    {
    }

    /**
     * Make sure the artwork exists in Printify's media library, uploading it
     * only the first time. Returns the Printify image id.
     */
    public function ensureArtworkUploaded(PrintArtwork $artwork): string
    {
        if ($artwork->printify_image_id) {
            return $artwork->printify_image_id;
        }

        if (!Storage::disk('public')->exists($artwork->file_path)) {
            throw new PrintifyException(
                "Artwork file is missing at {$artwork->file_path}",
                422
            );
        }

        $contents = Storage::disk('public')->get($artwork->file_path);

        $result = $this->printify->uploadImage(
            fileName: basename($artwork->file_path),
            base64Contents: base64_encode($contents),
        );

        $artwork->update([
            'printify_image_id' => $result['id'],
            'printify_preview_url' => $result['preview_url'],
            'uploaded_to_printify_at' => now(),
        ]);

        return $result['id'];
    }

    /**
     * Quote shipping for an order. Recorded for margin only — the customer is
     * never charged for shipping, so a quote failure must not block the sale.
     */
    public function quoteShipping(PrintOrder $order): ?int
    {
        if (!config('services.printify.quote_shipping', true)) {
            return null;
        }

        $lineItems = [];
        foreach ($order->items as $item) {
            if ($item->blueprint_id === null || $item->print_provider_id === null || $item->variant_id === null) {
                return null;
            }

            $lineItems[] = [
                'print_provider_id' => (int) $item->print_provider_id,
                'blueprint_id' => (int) $item->blueprint_id,
                'variant_id' => (int) $item->variant_id,
                'quantity' => (int) $item->quantity,
            ];
        }

        if ($lineItems === []) {
            return null;
        }

        try {
            $rates = $this->printify->calculateShipping($lineItems, $order->toPrintifyAddress());

            return $rates['standard'] ?? null;
        } catch (PrintifyException $e) {
            Log::warning('Printify shipping quote failed; continuing without it', [
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Push a paid order to Printify as a draft, then optionally submit it for
     * production.
     *
     * Safe to call more than once: an order that already has a printify_order_id
     * is never re-created.
     */
    public function fulfil(PrintOrder $order): PrintOrder
    {
        if ($order->status !== PrintOrder::STATUS_PAID) {
            throw new PrintifyException(
                "Order {$order->order_number} is not paid; refusing to fulfil.",
                422
            );
        }

        if ($order->printify_order_id) {
            return $this->maybeSendToProduction($order);
        }

        $order->loadMissing('items.artwork', 'items.product');

        try {
            $lineItems = [];
            $productionCost = 0;

            foreach ($order->items as $item) {
                $product = $item->product;

                if (!$product || !$product->isFulfillable()) {
                    throw new PrintifyException(
                        "Product '{$item->product_name}' is not mapped to a Printify blueprint yet.",
                        422
                    );
                }

                $imageId = $this->ensureArtworkUploaded($item->artwork);
                $productionCost += (int) $product->estimated_cost_cents * (int) $item->quantity;

                $lineItems[] = [
                    'print_provider_id' => (int) $item->print_provider_id,
                    'blueprint_id' => (int) $item->blueprint_id,
                    'variant_id' => (int) $item->variant_id,
                    'quantity' => (int) $item->quantity,
                    'print_areas' => [
                        'front' => [[
                            'id' => $imageId,
                            'x' => 0.5,
                            'y' => 0.5,
                            'scale' => 1,
                            'angle' => 0,
                        ]],
                    ],
                ];
            }

            $shippingCost = $this->quoteShipping($order);

            $result = $this->printify->createOrder([
                // Printify dedupes on external_id, so a retry cannot produce a
                // second physical order for the same purchase.
                'external_id' => $order->order_number,
                'label' => "NowQR {$order->order_number}",
                'line_items' => $lineItems,
                'shipping_method' => 1, // standard
                'send_shipping_notification' => true,
                'address_to' => $order->toPrintifyAddress(),
            ]);

            $order->update([
                'printify_order_id' => $result['id'],
                'printify_status' => $result['status'],
                'status' => PrintOrder::STATUS_SUBMITTED,
                'submitted_at' => now(),
                'printify_shipping_cost_cents' => $shippingCost,
                'printify_production_cost_cents' => $productionCost,
                'failure_reason' => null,
                'needs_attention' => false,
            ]);

            return $this->maybeSendToProduction($order);
        } catch (PrintifyException $e) {
            // The customer has already paid. Flag loudly rather than silently
            // swallowing — this order needs a human.
            $order->update([
                'status' => PrintOrder::STATUS_FULFILMENT_FAILED,
                'failure_reason' => $e->getMessage(),
                'needs_attention' => true,
            ]);

            Log::error('Printify fulfilment failed for a paid order', [
                'order_number' => $order->order_number,
                'user_id' => $order->user_id,
                'error' => $e->getMessage(),
                'retryable' => $e->isRetryable(),
            ]);

            throw $e;
        }
    }

    private function maybeSendToProduction(PrintOrder $order): PrintOrder
    {
        if (!config('services.printify.auto_send_to_production', false)) {
            return $order;
        }

        if ($order->sent_to_production_at) {
            return $order;
        }

        try {
            $result = $this->printify->sendToProduction($order->printify_order_id);

            $order->update([
                'status' => PrintOrder::STATUS_IN_PRODUCTION,
                'printify_status' => $result['status'] ?? 'in-production',
                'sent_to_production_at' => now(),
            ]);
        } catch (PrintifyException $e) {
            // The draft exists, so nothing is lost — an admin can submit it.
            $order->update([
                'failure_reason' => 'Draft created but send-to-production failed: ' . $e->getMessage(),
                'needs_attention' => true,
            ]);

            Log::error('Printify send_to_production failed', [
                'order_number' => $order->order_number,
                'printify_order_id' => $order->printify_order_id,
                'error' => $e->getMessage(),
            ]);
        }

        return $order;
    }

    /**
     * Refresh status and tracking from Printify.
     */
    public function syncStatus(PrintOrder $order): PrintOrder
    {
        if (!$order->printify_order_id) {
            return $order;
        }

        try {
            $remote = $this->printify->getOrder($order->printify_order_id);
        } catch (PrintifyException $e) {
            Log::warning('Printify status sync failed', [
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return $order;
        }

        $updates = ['printify_status' => $remote['status'] ?? $order->printify_status];

        $shipment = $remote['shipments'][0] ?? null;
        if ($shipment) {
            $updates['tracking_number'] = $shipment['number'] ?? null;
            $updates['tracking_url'] = $shipment['url'] ?? null;
            $updates['carrier'] = $shipment['carrier'] ?? null;
        }

        if ($mapped = $this->mapPrintifyStatus($remote['status'] ?? null)) {
            $updates['status'] = $mapped;
        }

        $order->update($updates);

        return $order;
    }

    private function mapPrintifyStatus(?string $printifyStatus): ?string
    {
        return match ($printifyStatus) {
            'in-production', 'pending' => PrintOrder::STATUS_IN_PRODUCTION,
            'fulfilled', 'shipped', 'partially-fulfilled' => PrintOrder::STATUS_SHIPPED,
            'delivered' => PrintOrder::STATUS_DELIVERED,
            'canceled', 'cancelled' => PrintOrder::STATUS_CANCELLED,
            default => null,
        };
    }
}
