<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConnectedPlatform;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectedPlatformController extends Controller
{
    /**
     * List user's connected platforms.
     */
    public function index(Request $request): JsonResponse
    {
        $platforms = $request->user()->connectedPlatforms()
            ->withCount('autoPosts')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['platforms' => $platforms]);
    }

    /**
     * Create a new platform connection.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:wordpress,shopify,custom'],
            'site_url' => ['required', 'url', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:1000'],
            'api_secret' => ['nullable', 'string', 'max:1000'],
            'username' => ['nullable', 'string', 'max:255'],
        ]);

        $platform = $request->user()->connectedPlatforms()->create($validated);

        return response()->json([
            'message' => 'Platform connected successfully',
            'platform' => $platform,
        ], 201);
    }

    /**
     * Show a single platform.
     */
    public function show(Request $request, ConnectedPlatform $platform): JsonResponse
    {
        if ($platform->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $platform->loadCount('autoPosts');

        return response()->json(['platform' => $platform]);
    }

    /**
     * Update a platform.
     */
    public function update(Request $request, ConnectedPlatform $platform): JsonResponse
    {
        if ($platform->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:wordpress,shopify,custom'],
            'site_url' => ['sometimes', 'url', 'max:500'],
            'api_key' => ['nullable', 'string', 'max:1000'],
            'api_secret' => ['nullable', 'string', 'max:1000'],
            'username' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $platform->update($validated);

        return response()->json([
            'message' => 'Platform updated',
            'platform' => $platform->fresh(),
        ]);
    }

    /**
     * Delete a platform.
     */
    public function destroy(Request $request, ConnectedPlatform $platform): JsonResponse
    {
        if ($platform->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $platform->delete();

        return response()->json(['message' => 'Platform disconnected']);
    }

    /**
     * Test connection to a platform.
     */
    public function testConnection(Request $request, ConnectedPlatform $platform): JsonResponse
    {
        if ($platform->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $success = $platform->testConnection();

        if ($success) {
            $platform->update([
                'status' => 'active',
                'last_synced_at' => now(),
            ]);
        } else {
            $platform->update(['status' => 'error']);
        }

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Connection successful' : 'Connection failed — check your credentials',
            'platform' => $platform->fresh(),
        ]);
    }
}
