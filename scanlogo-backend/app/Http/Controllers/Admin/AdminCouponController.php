<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminCouponController extends Controller
{
    /**
     * Display a listing of coupons.
     */
    public function index(Request $request): JsonResponse
    {
        $coupons = Coupon::orderByDesc('created_at')->paginate(20);
        return response()->json($coupons);
    }

    /**
     * Store a newly created coupon in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'unique:coupons,code', 'max:50'],
            'discount_percentage' => ['required', 'integer', 'min:1', 'max:100'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
        ]);

        $coupon = Coupon::create([
            'code' => strtoupper($request->input('code')),
            'discount_percentage' => $request->input('discount_percentage'),
            'expires_at' => $request->input('expires_at') ? Carbon::parse($request->input('expires_at'))->endOfDay() : null,
            'is_active' => $request->input('is_active'),
        ]);

        return response()->json($coupon, 201);
    }

    /**
     * Update the specified coupon in storage.
     */
    public function update(Request $request, Coupon $coupon): JsonResponse
    {
        $request->validate([
            'code' => ['sometimes', 'required', 'string', 'unique:coupons,code,' . $coupon->id, 'max:50'],
            'discount_percentage' => ['sometimes', 'required', 'integer', 'min:1', 'max:100'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $data = [];
        if ($request->has('code')) {
            $data['code'] = strtoupper($request->input('code'));
        }
        if ($request->has('discount_percentage')) {
            $data['discount_percentage'] = $request->input('discount_percentage');
        }
        if ($request->has('expires_at')) {
            $data['expires_at'] = $request->input('expires_at') ? Carbon::parse($request->input('expires_at'))->endOfDay() : null;
        }
        if ($request->has('is_active')) {
            $data['is_active'] = $request->input('is_active');
        }

        $coupon->update($data);

        return response()->json($coupon);
    }

    /**
     * Remove the specified coupon from storage.
     */
    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->delete();
        return response()->json(['message' => 'Coupon deleted successfully']);
    }
}
