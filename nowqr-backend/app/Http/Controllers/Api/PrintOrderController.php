<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintArtwork;
use App\Models\PrintOrder;
use App\Models\PrintProduct;
use App\Services\PayPalService;
use App\Services\PrintOrderFulfiller;
use App\Services\Printify\PrintifyException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrintOrderController extends Controller
{
    public function __construct(
        private readonly PayPalService $paypal,
        private readonly PrintOrderFulfiller $fulfiller,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->printOrders()
            ->with('items.product:id,name,key,mockup_url')
            ->orderByDesc('created_at')
            ->paginate(12);

        return response()->json($orders);
    }

    public function show(Request $request, PrintOrder $printOrder): JsonResponse
    {
        if ($printOrder->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $printOrder->load('items.product', 'items.artwork');

        return response()->json(['order' => $printOrder]);
    }

    /**
     * Create a pending order and hand back a PayPal approval URL.
     *
     * Nothing is charged and nothing is sent to Printify here.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:10'],
            'items.*.print_product_id' => ['required', 'exists:print_products,id'],
            'items.*.print_artwork_id' => ['required', 'exists:print_artworks,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'shipping.first_name' => ['required', 'string', 'max:100'],
            'shipping.last_name' => ['required', 'string', 'max:100'],
            'shipping.email' => ['required', 'email', 'max:255'],
            'shipping.phone' => ['nullable', 'string', 'max:40'],
            'shipping.address1' => ['required', 'string', 'max:255'],
            'shipping.address2' => ['nullable', 'string', 'max:255'],
            'shipping.city' => ['required', 'string', 'max:120'],
            'shipping.region' => ['nullable', 'string', 'max:120'],
            'shipping.country' => ['required', 'string', 'size:2'],
            'shipping.zip' => ['required', 'string', 'max:32'],
        ]);

        $user = $request->user();
        $shipping = $validated['shipping'];
        $country = strtoupper($shipping['country']);

        $allowed = config('services.printify.allowed_countries', []);
        if (!empty($allowed) && !in_array($country, $allowed, true)) {
            return response()->json([
                'message' => "We cannot ship to {$country} yet.",
                'allowed_countries' => $allowed,
            ], 422);
        }

        if (!$this->paypal->isConfigured()) {
            return response()->json(['message' => 'Checkout is not available right now.'], 503);
        }

        // Resolve everything up front so a bad line item fails before any order row exists.
        $resolved = [];
        $subtotal = 0;

        foreach ($validated['items'] as $line) {
            $product = PrintProduct::find($line['print_product_id']);
            if (!$product || !$product->is_active) {
                return response()->json(['message' => 'One of the selected products is unavailable.'], 422);
            }

            $artwork = PrintArtwork::find($line['print_artwork_id']);
            if (!$artwork || $artwork->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized artwork.'], 403);
            }

            $quantity = (int) $line['quantity'];
            if ($quantity < $product->min_quantity || $quantity > $product->max_quantity) {
                return response()->json([
                    'message' => "{$product->name} allows between {$product->min_quantity} and {$product->max_quantity} per order.",
                ], 422);
            }

            // Price is read from the catalog, never from the request.
            $unit = (int) $product->retail_price_cents;
            $total = $unit * $quantity;
            $subtotal += $total;

            $resolved[] = compact('product', 'artwork', 'quantity', 'unit', 'total');
        }

        $order = DB::transaction(function () use ($user, $shipping, $country, $resolved, $subtotal) {
            $order = PrintOrder::create([
                'user_id' => $user->id,
                'status' => PrintOrder::STATUS_PENDING_PAYMENT,
                'subtotal_cents' => $subtotal,
                'shipping_charged_cents' => 0, // free shipping, priced into the product
                'total_cents' => $subtotal,
                'currency' => 'USD',
                'payment_provider' => 'paypal',
                'ship_first_name' => $shipping['first_name'],
                'ship_last_name' => $shipping['last_name'],
                'ship_email' => $shipping['email'],
                'ship_phone' => $shipping['phone'] ?? null,
                'ship_address1' => $shipping['address1'],
                'ship_address2' => $shipping['address2'] ?? null,
                'ship_city' => $shipping['city'],
                'ship_region' => $shipping['region'] ?? null,
                'ship_country' => $country,
                'ship_zip' => $shipping['zip'],
            ]);

            foreach ($resolved as $line) {
                $order->items()->create([
                    'print_product_id' => $line['product']->id,
                    'print_artwork_id' => $line['artwork']->id,
                    'quantity' => $line['quantity'],
                    'unit_price_cents' => $line['unit'],
                    'total_price_cents' => $line['total'],
                    'product_name' => $line['product']->name,
                    'blueprint_id' => $line['product']->blueprint_id,
                    'print_provider_id' => $line['product']->print_provider_id,
                    'variant_id' => $line['product']->variant_id,
                ]);
            }

            return $order;
        });

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        try {
            $paypalOrder = $this->paypal->createPhysicalOrder(
                referenceId: $order->order_number,
                customId: "nowqr_print|{$user->id}|{$order->id}",
                amountUsd: round($order->total_cents / 100, 2),
                description: 'NowQR sticker order ' . $order->order_number,
                shippingAddress: [
                    'address_line_1' => $order->ship_address1,
                    'address_line_2' => $order->ship_address2 ?? '',
                    'admin_area_2' => $order->ship_city,
                    'admin_area_1' => $order->ship_region ?? '',
                    'postal_code' => $order->ship_zip,
                    'country_code' => $order->ship_country,
                ],
                shippingFullName: $order->ship_full_name,
                returnUrl: "{$frontendUrl}/dashboard/orders/{$order->id}?paypal_success=1",
                cancelUrl: "{$frontendUrl}/dashboard/orders/{$order->id}?cancelled=1",
            );
        } catch (\Throwable $e) {
            $order->update([
                'status' => PrintOrder::STATUS_PAYMENT_FAILED,
                'failure_reason' => $e->getMessage(),
            ]);

            Log::error('PayPal order creation failed for print order', [
                'order_number' => $order->order_number,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Failed to start checkout.'], 500);
        }

        $order->update(['payment_id' => $paypalOrder['id']]);

        return response()->json([
            'message' => 'Order created.',
            'order' => $order->load('items'),
            'checkout_url' => $paypalOrder['approve_url'],
            'payment_id' => $paypalOrder['id'],
        ], 201);
    }

    /**
     * Capture payment, then push the order to Printify.
     *
     * Idempotent: re-running on an already-paid order retries fulfilment rather
     * than charging again.
     */
    public function verify(Request $request, PrintOrder $printOrder): JsonResponse
    {
        if ($printOrder->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$printOrder->payment_id) {
            return response()->json(['message' => 'This order has no payment to verify.'], 422);
        }

        if ($printOrder->paid_at === null) {
            try {
                $capture = $this->paypal->captureOrder($printOrder->payment_id);
            } catch (\Throwable $e) {
                Log::error('PayPal capture failed for print order', [
                    'order_number' => $printOrder->order_number,
                    'error' => $e->getMessage(),
                ]);

                $printOrder->update([
                    'status' => PrintOrder::STATUS_PAYMENT_FAILED,
                    'failure_reason' => $e->getMessage(),
                ]);

                return response()->json(['message' => 'Payment verification failed.'], 500);
            }

            $details = $this->paypal->extractCapture($capture);
            $expected = round($printOrder->total_cents / 100, 2);

            // Guard against a tampered or mismatched capture.
            if ($details['amount'] + 0.001 < $expected) {
                $printOrder->update([
                    'status' => PrintOrder::STATUS_PAYMENT_FAILED,
                    'failure_reason' => "Captured {$details['amount']} but expected {$expected}",
                    'needs_attention' => true,
                ]);

                return response()->json(['message' => 'Payment amount mismatch.'], 422);
            }

            $printOrder->update([
                'status' => PrintOrder::STATUS_PAID,
                'paid_at' => now(),
                'payment_capture_id' => $details['capture_id'],
                'failure_reason' => null,
            ]);
        }

        // Money is in. From here a failure must never look like success.
        try {
            $printOrder = $this->fulfiller->fulfil($printOrder->fresh());
        } catch (PrintifyException $e) {
            return response()->json([
                'message' => 'Payment received, but we could not send your order to production yet. '
                    . 'Our team has been notified and will get it moving — you have not been charged twice.',
                'order' => $printOrder->fresh()->load('items'),
                'fulfilment_pending' => true,
            ], 202);
        }

        return response()->json([
            'message' => 'Order confirmed and sent to our print partner.',
            'order' => $printOrder->load('items'),
        ]);
    }
}
