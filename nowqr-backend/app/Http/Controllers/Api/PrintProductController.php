<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintProduct;
use Illuminate\Http\JsonResponse;

class PrintProductController extends Controller
{
    /**
     * Public catalog of printable products.
     */
    public function index(): JsonResponse
    {
        $products = PrintProduct::active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'products' => $products,
            'shipping' => [
                // Shipping is priced into retail, so the storefront always shows free.
                'free' => true,
                'note' => 'Free worldwide shipping included in the price.',
            ],
            'allowed_countries' => config('services.printify.allowed_countries', []),
        ]);
    }
}
