<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PrintOrder;
use App\Models\PrintProduct;
use App\Services\PrintOrderFulfiller;
use App\Services\Printify\PrintifyClient;
use App\Services\Printify\PrintifyException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPrintController extends Controller
{
    public function __construct(
        private readonly PrintOrderFulfiller $fulfiller,
        private readonly PrintifyClient $printify,
    ) {
    }

    /**
     * Fulfilment health, including the number that matters most: paid orders
     * that never reached Printify.
     */
    public function stats(): JsonResponse
    {
        $revenue = PrintOrder::whereNotNull('paid_at')->sum('total_cents');
        $shippingCost = PrintOrder::whereNotNull('paid_at')->sum('printify_shipping_cost_cents');
        $productionCost = PrintOrder::whereNotNull('paid_at')->sum('printify_production_cost_cents');

        return response()->json([
            'printify_mode' => config('services.printify.mode'),
            'printify_live' => $this->printify->isLive(),
            'auto_send_to_production' => (bool) config('services.printify.auto_send_to_production'),
            'orders_total' => PrintOrder::count(),
            'orders_paid' => PrintOrder::whereNotNull('paid_at')->count(),
            'orders_needing_attention' => PrintOrder::where('needs_attention', true)->count(),
            'orders_awaiting_fulfilment' => PrintOrder::where('status', PrintOrder::STATUS_PAID)
                ->whereNull('printify_order_id')
                ->count(),
            'revenue_cents' => (int) $revenue,
            'shipping_cost_cents' => (int) $shippingCost,
            'production_cost_cents' => (int) $productionCost,
            // Free shipping is only safe while this stays positive.
            'gross_margin_cents' => (int) ($revenue - $shippingCost - $productionCost),
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $query = PrintOrder::with('user:id,first_name,last_name,email', 'items')
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('needs_attention')) {
            $query->where('needs_attention', true);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('ship_email', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate(20));
    }

    public function showOrder(PrintOrder $printOrder): JsonResponse
    {
        $printOrder->load('user:id,first_name,last_name,email', 'items.product', 'items.artwork');

        return response()->json(['order' => $printOrder]);
    }

    /**
     * Retry a paid order that failed to reach Printify.
     */
    public function retryOrder(PrintOrder $printOrder): JsonResponse
    {
        if ($printOrder->paid_at === null) {
            return response()->json(['message' => 'Order has not been paid.'], 422);
        }

        // fulfil() only accepts paid orders; a previous failure left it marked failed.
        if ($printOrder->status === PrintOrder::STATUS_FULFILMENT_FAILED) {
            $printOrder->update(['status' => PrintOrder::STATUS_PAID]);
        }

        try {
            $order = $this->fulfiller->fulfil($printOrder->fresh());
        } catch (PrintifyException $e) {
            return response()->json([
                'message' => 'Retry failed: ' . $e->getMessage(),
                'order' => $printOrder->fresh(),
            ], 422);
        }

        return response()->json([
            'message' => 'Order sent to Printify.',
            'order' => $order->load('items'),
        ]);
    }

    /**
     * Submit a draft to production by hand — the deliberate money moment when
     * auto_send_to_production is off.
     */
    public function sendToProduction(PrintOrder $printOrder): JsonResponse
    {
        if (!$printOrder->printify_order_id) {
            return response()->json(['message' => 'Order has not been submitted to Printify yet.'], 422);
        }

        if ($printOrder->sent_to_production_at) {
            return response()->json([
                'message' => 'Order is already in production.',
                'order' => $printOrder,
            ]);
        }

        try {
            $result = $this->printify->sendToProduction($printOrder->printify_order_id);
        } catch (PrintifyException $e) {
            return response()->json(['message' => 'Failed: ' . $e->getMessage()], 422);
        }

        $printOrder->update([
            'status' => PrintOrder::STATUS_IN_PRODUCTION,
            'printify_status' => $result['status'] ?? 'in-production',
            'sent_to_production_at' => now(),
            'needs_attention' => false,
            'failure_reason' => null,
        ]);

        return response()->json([
            'message' => 'Order sent to production.',
            'order' => $printOrder->fresh(),
        ]);
    }

    public function syncOrder(PrintOrder $printOrder): JsonResponse
    {
        $order = $this->fulfiller->syncStatus($printOrder);

        return response()->json(['message' => 'Status synced.', 'order' => $order]);
    }

    public function resolveOrder(PrintOrder $printOrder): JsonResponse
    {
        $printOrder->update(['needs_attention' => false]);

        return response()->json(['message' => 'Order cleared.', 'order' => $printOrder]);
    }

    // ─── Product catalog ────────────────────────────────────────────

    public function products(): JsonResponse
    {
        return response()->json([
            'products' => PrintProduct::orderBy('sort_order')->orderBy('id')->get(),
        ]);
    }

    public function updateProduct(Request $request, PrintProduct $printProduct): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'blueprint_id' => ['sometimes', 'nullable', 'integer'],
            'print_provider_id' => ['sometimes', 'nullable', 'integer'],
            'variant_id' => ['sometimes', 'nullable', 'integer'],
            'retail_price_cents' => ['sometimes', 'integer', 'min:0'],
            'estimated_cost_cents' => ['sometimes', 'integer', 'min:0'],
            'min_quantity' => ['sometimes', 'integer', 'min:1'],
            'max_quantity' => ['sometimes', 'integer', 'min:1'],
            'mockup_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $printProduct->update($validated);

        return response()->json([
            'message' => 'Product updated.',
            'product' => $printProduct->fresh(),
        ]);
    }
}
