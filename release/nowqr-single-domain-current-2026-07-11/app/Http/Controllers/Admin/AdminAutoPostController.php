<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AutoPost;
use App\Models\AutoPostSubscription;
use App\Models\ConnectedPlatform;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAutoPostController extends Controller
{
    /**
     * Overview stats for auto-post feature.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_subscriptions' => AutoPostSubscription::count(),
            'active_subscriptions' => AutoPostSubscription::active()->count(),
            'total_posts' => AutoPost::count(),
            'published_posts' => AutoPost::where('status', 'published')->count(),
            'scheduled_posts' => AutoPost::where('status', 'scheduled')->count(),
            'failed_posts' => AutoPost::where('status', 'failed')->count(),
            'total_platforms' => ConnectedPlatform::count(),
            'active_platforms' => ConnectedPlatform::active()->count(),
            'total_credits_earned' => AutoPost::sum('credits_charged'),
            'frequency_breakdown' => [
                'daily' => AutoPostSubscription::where('frequency', 'daily')->count(),
                'weekly' => AutoPostSubscription::where('frequency', 'weekly')->count(),
                'monthly' => AutoPostSubscription::where('frequency', 'monthly')->count(),
            ],
        ]);
    }

    /**
     * List all subscriptions (admin view).
     */
    public function subscriptions(Request $request): JsonResponse
    {
        $query = AutoPostSubscription::with('user:id,first_name,last_name,email')
            ->withCount('autoPosts');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($frequency = $request->query('frequency')) {
            $query->where('frequency', $frequency);
        }
        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $subs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($subs);
    }

    /**
     * List all auto-posts (admin view).
     */
    public function posts(Request $request): JsonResponse
    {
        $query = AutoPost::with([
            'user:id,first_name,last_name,email',
            'platform:id,name,type',
            'subscription:id,frequency',
        ]);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($q2) use ($search) {
                        $q2->where('email', 'like', "%{$search}%");
                    });
            });
        }

        $posts = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($posts);
    }

    /**
     * View a single auto-post.
     */
    public function showPost(AutoPost $autoPost): JsonResponse
    {
        $autoPost->load(['user:id,first_name,last_name,email', 'platform', 'subscription']);

        return response()->json(['post' => $autoPost]);
    }

    /**
     * Admin can delete any auto-post.
     */
    public function destroyPost(AutoPost $autoPost): JsonResponse
    {
        $autoPost->delete();

        return response()->json(['message' => 'Post deleted']);
    }

    /**
     * Admin can cancel any subscription.
     */
    public function cancelSubscription(AutoPostSubscription $subscription): JsonResponse
    {
        $subscription->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Subscription cancelled']);
    }
}
