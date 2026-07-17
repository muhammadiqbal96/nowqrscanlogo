<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AutoPostSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutoPostSubscriptionController extends Controller
{
    /**
     * List user's auto-post subscriptions.
     */
    public function index(Request $request): JsonResponse
    {
        $subs = $request->user()->autoPostSubscriptions()
            ->withCount(['autoPosts', 'autoPosts as published_count' => function ($q) {
                $q->where('status', 'published');
            }, 'autoPosts as failed_count' => function ($q) {
                $q->where('status', 'failed');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'subscriptions' => $subs,
            'pricing' => AutoPostSubscription::getPricing(),
        ]);
    }

    /**
     * Create a new auto-post subscription.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'frequency' => ['required', 'in:daily,weekly,monthly'],
            'posts_per_cycle' => ['required', 'integer', 'min:1', 'max:10'],
            'niche' => ['nullable', 'string', 'max:255'],
            'tone' => ['nullable', 'string', 'max:100'],
            'keywords' => ['nullable', 'array', 'max:20'],
            'keywords.*' => ['string', 'max:100'],
            'custom_instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        $pricing = AutoPostSubscription::getPricing();
        $creditsPerPost = $pricing[$validated['frequency']]['credits_per_post'] ?? 2;

        $sub = $request->user()->autoPostSubscriptions()->create([
            ...$validated,
            'credits_per_post' => $creditsPerPost,
            'status' => 'active',
            'next_post_at' => (new AutoPostSubscription(['frequency' => $validated['frequency']]))->calculateNextPostAt(),
        ]);

        return response()->json([
            'message' => 'Auto-posting subscription created',
            'subscription' => $sub,
        ], 201);
    }

    /**
     * Show a single subscription.
     */
    public function show(Request $request, AutoPostSubscription $subscription): JsonResponse
    {
        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscription->loadCount(['autoPosts', 'autoPosts as published_count' => function ($q) {
            $q->where('status', 'published');
        }]);

        return response()->json(['subscription' => $subscription]);
    }

    /**
     * Update subscription settings.
     */
    public function update(Request $request, AutoPostSubscription $subscription): JsonResponse
    {
        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'frequency' => ['sometimes', 'in:daily,weekly,monthly'],
            'posts_per_cycle' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'niche' => ['nullable', 'string', 'max:255'],
            'tone' => ['nullable', 'string', 'max:100'],
            'keywords' => ['nullable', 'array', 'max:20'],
            'keywords.*' => ['string', 'max:100'],
            'custom_instructions' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', 'in:active,paused'],
        ]);

        // If frequency changed, recalculate next_post_at
        if (isset($validated['frequency']) && $validated['frequency'] !== $subscription->frequency) {
            $validated['next_post_at'] = (new AutoPostSubscription(['frequency' => $validated['frequency']]))->calculateNextPostAt();
        }

        if (isset($validated['frequency'])) {
            $pricing = AutoPostSubscription::getPricing();
            $validated['credits_per_post'] = $pricing[$validated['frequency']]['credits_per_post'] ?? 2;
        }

        $subscription->update($validated);

        return response()->json([
            'message' => 'Subscription updated',
            'subscription' => $subscription->fresh(),
        ]);
    }

    /**
     * Cancel (soft) a subscription.
     */
    public function destroy(Request $request, AutoPostSubscription $subscription): JsonResponse
    {
        if ($subscription->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $subscription->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Subscription cancelled']);
    }

    /**
     * Get pricing info.
     */
    public function pricing(): JsonResponse
    {
        return response()->json(['pricing' => AutoPostSubscription::getPricing()]);
    }
}
