<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     * Purchase a plan (simplified — in production, use Stripe/PayPal webhook).
     */
    public function purchasePlan(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => ['required', 'in:creator,agency'],
            'payment_id' => ['required', 'string'], // from Stripe/PayPal
        ]);

        $user = $request->user();
        $plan = $request->input('plan');
        $paymentId = $request->input('payment_id');

        $planDetails = self::getPricing()[$plan] ?? null;
        if (!$planDetails) {
            return response()->json(['message' => 'Invalid plan'], 422);
        }

        // In production, verify payment with Stripe/PayPal here
        // For now, trust the payment_id

        $user->update(['plan' => $plan]);

        $user->addCredits(
            $planDetails['credits'],
            'purchase',
            "Purchased {$planDetails['name']} plan",
            [
                'provider' => 'stripe', // or paypal
                'payment_id' => $paymentId,
                'amount' => $planDetails['price'],
                'currency' => 'USD',
            ]
        );

        return response()->json([
            'message' => "Successfully upgraded to {$planDetails['name']}",
            'plan' => $plan,
            'credits' => $user->fresh()->credits,
        ]);
    }

    /**
     * Buy additional credits (top-up).
     */
    public function topUp(Request $request): JsonResponse
    {
        $request->validate([
            'credits' => ['required', 'integer', 'min:50', 'max:10000'],
            'payment_id' => ['required', 'string'],
        ]);

        $user = $request->user();
        $credits = $request->input('credits');
        $paymentId = $request->input('payment_id');

        // Price: $10 per 100 credits
        $price = ($credits / 100) * 10;

        $user->addCredits(
            $credits,
            'purchase',
            "Credit top-up: {$credits} credits",
            [
                'provider' => 'stripe',
                'payment_id' => $paymentId,
                'amount' => $price,
                'currency' => 'USD',
            ]
        );

        return response()->json([
            'message' => "Added {$credits} credits to your account",
            'credits' => $user->fresh()->credits,
        ]);
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
}
