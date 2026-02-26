<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScanLogo;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ScanLogoController extends Controller
{
    /**
     * List all ScanLogos for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $scanLogos = $request->user()->scanLogos()
            ->with('campaign:id,name,cta_type')
            ->withCount('scanEvents')
            ->orderBy('updated_at', 'desc')
            ->paginate(12);

        return response()->json($scanLogos);
    }

    /**
     * Create a new ScanLogo.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'destination_url' => ['required', 'url', 'max:2048'],
            'shape' => ['sometimes', 'in:shield,circle,gear,eye,diamond,hexagon,square'],
            'animation' => ['sometimes', 'in:spin,pulse,expand,bounce,glow,none'],
            'color' => ['sometimes', 'string', 'max:20'],
            'cta_text' => ['sometimes', 'string', 'max:50'],
            'safe_scan_badge' => ['sometimes', 'boolean'],
        ]);

        // Check credits (3 credits to create a ScanLogo)
        $user = $request->user();
        $creditCost = 3;

        if (!$user->hasCredits($creditCost)) {
            return response()->json([
                'message' => "Insufficient credits. Creating a ScanLogo costs {$creditCost} credits. You have {$user->credits} credits.",
                'required_credits' => $creditCost,
                'current_credits' => $user->credits,
            ], 402);
        }

        // Verify campaign belongs to user if provided
        if (isset($validated['campaign_id'])) {
            $campaign = Campaign::find($validated['campaign_id']);
            if ($campaign->user_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $validated['user_id'] = $user->id;

        $scanLogo = ScanLogo::create($validated);

        // Deduct credits
        $user->deductCredits($creditCost, 'Created ScanLogo', 'scan_logo', $scanLogo->id);

        return response()->json([
            'message' => 'ScanLogo created successfully',
            'scan_logo' => $scanLogo,
            'credits_remaining' => $user->fresh()->credits,
        ], 201);
    }

    /**
     * Get a single ScanLogo.
     */
    public function show(Request $request, ScanLogo $scanLogo): JsonResponse
    {
        $this->authorize($request, $scanLogo);

        $scanLogo->load('campaign');
        $scanLogo->loadCount('scanEvents');

        return response()->json(['scan_logo' => $scanLogo]);
    }

    /**
     * Update a ScanLogo (e.g., change destination URL).
     */
    public function update(Request $request, ScanLogo $scanLogo): JsonResponse
    {
        $this->authorize($request, $scanLogo);

        $validated = $request->validate([
            'destination_url' => ['sometimes', 'url', 'max:2048'],
            'shape' => ['sometimes', 'in:shield,circle,gear,eye,diamond,hexagon,square'],
            'animation' => ['sometimes', 'in:spin,pulse,expand,bounce,glow,none'],
            'color' => ['sometimes', 'string', 'max:20'],
            'cta_text' => ['sometimes', 'string', 'max:50'],
            'safe_scan_badge' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // If updating destination URL on dynamic QR, charge 1 credit
        if (isset($validated['destination_url']) && $validated['destination_url'] !== $scanLogo->destination_url) {
            $user = $request->user();
            if ($scanLogo->is_dynamic) {
                $creditCost = 1;
                if (!$user->hasCredits($creditCost)) {
                    return response()->json([
                        'message' => "Insufficient credits. Updating destination costs {$creditCost} credit.",
                    ], 402);
                }
                $user->deductCredits($creditCost, 'Updated ScanLogo destination URL', 'scan_logo', $scanLogo->id);
            }
        }

        $scanLogo->update($validated);

        return response()->json([
            'message' => 'ScanLogo updated successfully',
            'scan_logo' => $scanLogo->fresh(),
        ]);
    }

    /**
     * Delete a ScanLogo.
     */
    public function destroy(Request $request, ScanLogo $scanLogo): JsonResponse
    {
        $this->authorize($request, $scanLogo);

        $scanLogo->delete();

        return response()->json([
            'message' => 'ScanLogo deleted successfully',
        ]);
    }

    /**
     * Upload a center logo for the ScanLogo.
     */
    public function uploadLogo(Request $request, ScanLogo $scanLogo): JsonResponse
    {
        $this->authorize($request, $scanLogo);

        $request->validate([
            'file' => ['required', 'image', 'max:2048'], // 2MB max
        ]);

        $path = $request->file('file')->store("scanlogos/{$scanLogo->id}", 'public');
        $scanLogo->update(['center_logo_path' => $path]);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'path' => $path,
            'url' => asset("storage/{$path}"),
        ]);
    }

    /**
     * Get available ScanLogo shapes and animations.
     */
    public function options(): JsonResponse
    {
        return response()->json([
            'shapes' => [
                ['value' => 'shield', 'label' => 'Shield', 'description' => 'A protective shield shape'],
                ['value' => 'circle', 'label' => 'Circle', 'description' => 'A clean circular shape'],
                ['value' => 'gear', 'label' => 'Gear', 'description' => 'A mechanical gear shape'],
                ['value' => 'eye', 'label' => 'Eye', 'description' => 'An eye-catching eye shape'],
                ['value' => 'diamond', 'label' => 'Diamond', 'description' => 'A premium diamond shape'],
                ['value' => 'hexagon', 'label' => 'Hexagon', 'description' => 'A modern hexagonal shape'],
                ['value' => 'square', 'label' => 'Square', 'description' => 'A classic square shape'],
            ],
            'animations' => [
                ['value' => 'spin', 'label' => 'Spin', 'description' => 'Rotates continuously'],
                ['value' => 'pulse', 'label' => 'Pulse', 'description' => 'Pulses in and out'],
                ['value' => 'expand', 'label' => 'Expand', 'description' => 'Grows then shrinks'],
                ['value' => 'bounce', 'label' => 'Bounce', 'description' => 'Bounces up and down'],
                ['value' => 'glow', 'label' => 'Glow', 'description' => 'Glows with a halo effect'],
                ['value' => 'none', 'label' => 'None', 'description' => 'No animation'],
            ],
        ]);
    }

    private function authorize(Request $request, ScanLogo $scanLogo): void
    {
        if ($scanLogo->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}
