<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AutoPost;
use App\Models\AutoPostSubscription;
use App\Models\ConnectedPlatform;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutoPostController extends Controller
{
    /**
     * List user's auto-posts with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->autoPosts()->with(['platform:id,name,type', 'subscription:id,frequency']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($subId = $request->query('subscription_id')) {
            $query->where('subscription_id', $subId);
        }

        $posts = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($posts);
    }

    /**
     * Show a single auto-post.
     */
    public function show(Request $request, AutoPost $autoPost): JsonResponse
    {
        if ($autoPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $autoPost->load(['platform', 'subscription']);

        return response()->json(['post' => $autoPost]);
    }

    /**
     * Manually create an auto-post (draft or scheduled).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subscription_id' => ['required', 'exists:auto_post_subscriptions,id'],
            'platform_id' => ['nullable', 'exists:connected_platforms,id'],
            'title' => ['required', 'string', 'max:500'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:100'],
            'status' => ['nullable', 'in:draft,scheduled'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ]);

        // Verify ownership of subscription and platform
        $sub = AutoPostSubscription::where('id', $validated['subscription_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$sub) {
            return response()->json(['message' => 'Subscription not found'], 404);
        }

        if (isset($validated['platform_id'])) {
            $platform = ConnectedPlatform::where('id', $validated['platform_id'])
                ->where('user_id', $request->user()->id)
                ->first();
            if (!$platform) {
                return response()->json(['message' => 'Platform not found'], 404);
            }
        }

        $post = $request->user()->autoPosts()->create([
            ...$validated,
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'message' => 'Post created',
            'post' => $post,
        ], 201);
    }

    /**
     * Update a draft/scheduled post.
     */
    public function update(Request $request, AutoPost $autoPost): JsonResponse
    {
        if ($autoPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (in_array($autoPost->status, ['published'])) {
            return response()->json(['message' => 'Cannot edit a published post'], 422);
        }

        $validated = $request->validate([
            'platform_id' => ['nullable', 'exists:connected_platforms,id'],
            'title' => ['sometimes', 'string', 'max:500'],
            'excerpt' => ['nullable', 'string', 'max:1000'],
            'content' => ['sometimes', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:100'],
            'status' => ['sometimes', 'in:draft,scheduled'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ]);

        $autoPost->update($validated);

        return response()->json([
            'message' => 'Post updated',
            'post' => $autoPost->fresh(),
        ]);
    }

    /**
     * Delete a post (only drafts/scheduled).
     */
    public function destroy(Request $request, AutoPost $autoPost): JsonResponse
    {
        if ($autoPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($autoPost->status === 'published') {
            return response()->json(['message' => 'Cannot delete published posts'], 422);
        }

        $autoPost->delete();

        return response()->json(['message' => 'Post deleted']);
    }

    /**
     * Manually publish a post to its connected platform NOW.
     */
    public function publish(Request $request, AutoPost $autoPost): JsonResponse
    {
        if ($autoPost->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($autoPost->status === 'published') {
            return response()->json(['message' => 'Post already published'], 422);
        }

        $user = $request->user();
        $sub = $autoPost->subscription;
        $creditsNeeded = $sub->credits_per_post;

        // Check credits
        if (!$user->hasCredits($creditsNeeded)) {
            return response()->json([
                'message' => 'Insufficient credits. You need ' . $creditsNeeded . ' credits to publish.',
            ], 422);
        }

        // If no platform assigned, just mark as published (draft only)
        if (!$autoPost->platform_id) {
            $user->deductCredits($creditsNeeded, "Auto-post published: {$autoPost->title}", 'auto_post', $autoPost->id);

            $autoPost->update([
                'status' => 'published',
                'published_at' => now(),
                'credits_charged' => $creditsNeeded,
            ]);

            $sub->increment('total_posts_delivered');
            $sub->increment('total_credits_spent', $creditsNeeded);

            return response()->json([
                'message' => 'Post published (no external platform)',
                'post' => $autoPost->fresh(),
            ]);
        }

        // Publish to external platform
        $platform = $autoPost->platform;
        $result = $platform->publishPost($autoPost);

        if ($result['success']) {
            $user->deductCredits($creditsNeeded, "Auto-post published to {$platform->name}: {$autoPost->title}", 'auto_post', $autoPost->id);

            $autoPost->update([
                'status' => 'published',
                'published_at' => now(),
                'credits_charged' => $creditsNeeded,
                'external_post_id' => $result['external_post_id'] ?? null,
                'external_post_url' => $result['external_post_url'] ?? null,
            ]);

            $sub->increment('total_posts_delivered');
            $sub->increment('total_credits_spent', $creditsNeeded);

            return response()->json([
                'message' => 'Post published to ' . $platform->name,
                'post' => $autoPost->fresh(),
            ]);
        }

        $autoPost->update([
            'status' => 'failed',
            'error_message' => $result['error'] ?? 'Unknown error',
        ]);

        return response()->json([
            'message' => 'Failed to publish post',
            'error' => $result['error'] ?? 'Unknown error',
        ], 500);
    }

    /**
     * Dashboard stats for auto-posting.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalPosts = $user->autoPosts()->count();
        $published = $user->autoPosts()->where('status', 'published')->count();
        $scheduled = $user->autoPosts()->where('status', 'scheduled')->count();
        $failed = $user->autoPosts()->where('status', 'failed')->count();
        $activeSubscriptions = $user->autoPostSubscriptions()->active()->count();
        $totalCreditsSpent = $user->autoPosts()->sum('credits_charged');
        $platforms = $user->connectedPlatforms()->active()->count();

        $recentPosts = $user->autoPosts()
            ->with(['platform:id,name,type'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total_posts' => $totalPosts,
                'published' => $published,
                'scheduled' => $scheduled,
                'failed' => $failed,
                'active_subscriptions' => $activeSubscriptions,
                'total_credits_spent' => $totalCreditsSpent,
                'connected_platforms' => $platforms,
            ],
            'recent_posts' => $recentPosts,
        ]);
    }
}
