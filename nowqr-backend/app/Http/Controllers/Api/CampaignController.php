<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    /**
     * List all campaigns for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = $request->user()->campaigns()
            ->withCount('scanEvents')
            ->orderBy('updated_at', 'desc')
            ->paginate(12);

        return response()->json($campaigns);
    }

    /**
     * Create a new campaign.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'business_name' => ['required', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:2000'],
            'target_audience' => ['nullable', 'string', 'max:500'],
            'cta_type' => ['required', 'in:buy,give,pay,call,book,watch,order,custom'],
            'custom_cta' => ['nullable', 'required_if:cta_type,custom', 'string', 'max:100'],
        ]);

        $campaign = $request->user()->campaigns()->create($validated);

        return response()->json([
            'message' => 'Campaign created successfully',
            'campaign' => $campaign,
        ], 201);
    }

    /**
     * Get a single campaign.
     */
    public function show(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        $campaign->load(['scanLogos', 'scanEvents']);
        $campaign->loadCount('scanEvents');

        return response()->json(['campaign' => $campaign]);
    }

    /**
     * Update a campaign.
     */
    public function update(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'business_name' => ['sometimes', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:2000'],
            'target_audience' => ['nullable', 'string', 'max:500'],
            'cta_type' => ['sometimes', 'in:buy,give,pay,call,book,watch,order,custom'],
            'custom_cta' => ['nullable', 'string', 'max:100'],
            'headline' => ['nullable', 'string', 'max:255'],
            'sub_headline' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'cta_button_text' => ['nullable', 'string', 'max:100'],
            'page_design' => ['nullable', 'array'],
            'primary_color' => ['nullable', 'string', 'max:20'],
            'font_family' => ['nullable', 'string', 'max:100'],
            'status' => ['sometimes', 'in:draft,active,paused,expired'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $campaign->update($validated);

        return response()->json([
            'message' => 'Campaign updated successfully',
            'campaign' => $campaign->fresh(),
        ]);
    }

    /**
     * Delete a campaign.
     */
    public function destroy(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        $campaign->delete();

        return response()->json([
            'message' => 'Campaign deleted successfully',
        ]);
    }

    /**
     * Publish a campaign (marks it as active and published).
     */
    public function publish(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        // Check if campaign has required content
        if (!$campaign->headline || !$campaign->description) {
            return response()->json([
                'message' => 'Campaign must have a headline and description before publishing.',
            ], 422);
        }

        $campaign->update([
            'is_published' => true,
            'status' => 'active',
        ]);

        return response()->json([
            'message' => 'Campaign published successfully',
            'campaign' => $campaign->fresh(),
            'public_url' => $campaign->public_url,
        ]);
    }

    /**
     * Upload campaign assets (logo, background image).
     */
    public function uploadAsset(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        $request->validate([
            'type' => ['required', 'in:logo,background'],
            'file' => ['required', 'image', 'max:5120'], // 5MB max
        ]);

        $type = $request->input('type');
        $path = $request->file('file')->store("campaigns/{$campaign->id}", 'public');

        $field = $type === 'logo' ? 'logo_path' : 'background_image_path';
        $campaign->update([$field => $path]);

        return response()->json([
            'message' => ucfirst($type) . ' uploaded successfully',
            'path' => $path,
            'url' => asset("storage/{$path}"),
        ]);
    }

    /**
     * Authorization check.
     */
    private function authorize(Request $request, Campaign $campaign): void
    {
        if ($campaign->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized');
        }
    }
}
