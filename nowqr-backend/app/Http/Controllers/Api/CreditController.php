<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Stripe\Webhook;

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
     * Create a Stripe Checkout session for a plan purchase.
     */
    public function purchasePlan(Request $request): JsonResponse
    {
        $request->validate([
            'plan' => ['required', 'in:creator,agency'],
        ]);

        $user = $request->user();
        $plan = $request->input('plan');

        $planDetails = self::getPricing()[$plan] ?? null;
        if (!$planDetails) {
            return response()->json(['message' => 'Invalid plan'], 422);
        }

        Stripe::setApiKey(config('services.stripe.secret'));

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => $planDetails['name'],
                        'description' => "{$planDetails['credits']} credits for NowQR",
                    ],
                    'unit_amount' => $planDetails['price'] * 100, // cents
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => "{$frontendUrl}/dashboard/credits?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url' => "{$frontendUrl}/dashboard/credits?cancelled=1",
            'client_reference_id' => (string) $user->id,
            'metadata' => [
                'user_id' => $user->id,
                'plan' => $plan,
                'credits' => $planDetails['credits'],
                'type' => 'plan_purchase',
            ],
        ]);

        return response()->json([
            'checkout_url' => $session->url,
            'session_id' => $session->id,
        ]);
    }

    /**
     * Create a Stripe Checkout session for a credit top-up.
     */
    public function topUp(Request $request): JsonResponse
    {
        $request->validate([
            'credits' => ['required', 'integer', 'min:50', 'max:10000'],
        ]);

        $user = $request->user();
        $credits = (int) $request->input('credits');

        // Price: $10 per 100 credits
        $priceInCents = (int) (($credits / 100) * 10 * 100);

        Stripe::setApiKey(config('services.stripe.secret'));

        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => "NowQR Credit Top-Up",
                        'description' => "{$credits} credits",
                    ],
                    'unit_amount' => $priceInCents,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => "{$frontendUrl}/dashboard/credits?session_id={CHECKOUT_SESSION_ID}",
            'cancel_url' => "{$frontendUrl}/dashboard/credits?cancelled=1",
            'client_reference_id' => (string) $user->id,
            'metadata' => [
                'user_id' => $user->id,
                'credits' => $credits,
                'type' => 'top_up',
            ],
        ]);

        return response()->json([
            'checkout_url' => $session->url,
            'session_id' => $session->id,
        ]);
    }

    /**
     * Verify a completed Stripe Checkout session and fulfill credits.
     */
    public function verifySession(Request $request): JsonResponse
    {
        $request->validate([
            'session_id' => ['required', 'string'],
        ]);

        $user = $request->user();

        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            $session = StripeSession::retrieve($request->input('session_id'));

            if ($session->payment_status !== 'paid') {
                return response()->json(['message' => 'Payment not completed'], 400);
            }

            // Prevent double-fulfillment
            $existingTx = $user->creditTransactions()
                ->where('metadata->stripe_session_id', $session->id)
                ->first();

            if ($existingTx) {
                return response()->json([
                    'message' => 'Credits already added for this payment',
                    'credits' => $user->credits,
                    'already_fulfilled' => true,
                ]);
            }

            $meta = $session->metadata->toArray();
            $type = $meta['type'] ?? 'plan_purchase';
            $credits = (int) ($meta['credits'] ?? 0);
            $plan = $meta['plan'] ?? null;

            if ($type === 'plan_purchase' && $plan) {
                $user->update(['plan' => $plan]);
                $planDetails = self::getPricing()[$plan] ?? ['name' => ucfirst($plan)];
                $user->addCredits(
                    $credits,
                    'purchase',
                    "Purchased {$planDetails['name']} plan",
                    [
                        'provider' => 'stripe',
                        'stripe_session_id' => $session->id,
                        'amount' => $session->amount_total / 100,
                        'currency' => 'USD',
                    ]
                );
            } else {
                $user->addCredits(
                    $credits,
                    'purchase',
                    "Credit top-up: {$credits} credits",
                    [
                        'provider' => 'stripe',
                        'stripe_session_id' => $session->id,
                        'amount' => $session->amount_total / 100,
                        'currency' => 'USD',
                    ]
                );
            }

            return response()->json([
                'message' => "Successfully added {$credits} credits",
                'credits' => $user->fresh()->credits,
                'plan' => $user->fresh()->plan,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe session verification failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Payment verification failed'], 500);
        }
    }

    /**
     * Handle Stripe webhook events (backup fulfillment).
     */
    public function stripeWebhook(Request $request): JsonResponse
    {
        $webhookSecret = config('services.stripe.webhook_secret');
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\Exception $e) {
            Log::error('Stripe webhook signature failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;

            if ($session->payment_status === 'paid') {
                $userId = $session->metadata->user_id ?? null;
                $credits = (int) ($session->metadata->credits ?? 0);
                $type = $session->metadata->type ?? 'plan_purchase';
                $plan = $session->metadata->plan ?? null;

                if (!$userId || !$credits) {
                    return response()->json(['status' => 'skipped']);
                }

                $user = \App\Models\User::find($userId);
                if (!$user) {
                    return response()->json(['error' => 'User not found'], 404);
                }

                // Prevent double-fulfillment
                $existing = $user->creditTransactions()
                    ->where('metadata->stripe_session_id', $session->id)
                    ->first();

                if ($existing) {
                    return response()->json(['status' => 'already_fulfilled']);
                }

                if ($type === 'plan_purchase' && $plan) {
                    $user->update(['plan' => $plan]);
                }

                $user->addCredits(
                    $credits,
                    'purchase',
                    $type === 'plan_purchase' ? "Plan purchase via Stripe" : "Credit top-up via Stripe",
                    [
                        'provider' => 'stripe',
                        'stripe_session_id' => $session->id,
                        'amount' => $session->amount_total / 100,
                        'currency' => 'USD',
                    ]
                );
            }
        }

        return response()->json(['status' => 'ok']);
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
