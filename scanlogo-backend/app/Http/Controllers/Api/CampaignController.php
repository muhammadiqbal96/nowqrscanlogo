<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignFlyer;
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

        // Load flyers if table exists
        try {
            $campaign->load('flyers');
        } catch (\Exception $e) {
            // flyers table may not exist yet
        }

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

    /**
     * Serve a public campaign landing page (no auth required).
     */
    public function publicPage(string $slug): JsonResponse
    {
        $campaign = Campaign::where('slug', $slug)
            ->where('is_published', true)
            ->where('status', 'active')
            ->firstOrFail();

        // Load associated ScanLogos for this campaign
        $campaign->load(['scanLogos' => function ($q) {
            $q->where('is_active', true);
        }]);

        return response()->json([
            'campaign' => [
                'name' => $campaign->name,
                'business_name' => $campaign->business_name,
                'headline' => $campaign->headline,
                'sub_headline' => $campaign->sub_headline,
                'description' => $campaign->description,
                'cta_type' => $campaign->cta_type,
                'cta_button_text' => $campaign->cta_button_text,
                'primary_color' => $campaign->primary_color,
                'font_family' => $campaign->font_family,
                'logo_path' => $campaign->logo_path,
                'background_image_path' => $campaign->background_image_path,
                'page_design' => $campaign->page_design,
                'scan_logos' => $campaign->scanLogos->map(fn($sl) => [
                    'short_url' => $sl->short_url,
                    'short_code' => $sl->short_code,
                    'shape' => $sl->shape,
                    'animation' => $sl->animation,
                    'color' => $sl->color,
                    'wrapper_color' => $sl->wrapper_color,
                    'cta_text' => $sl->cta_text,
                    'safe_scan_badge' => $sl->safe_scan_badge,
                    'center_logo_path' => $sl->center_logo_path,
                    'destination_url' => $sl->destination_url,
                ]),
            ],
        ]);
    }

    /* ─── Campaign Flyers ────────────────────────────────────── */

    /**
     * List flyers for a campaign.
     */
    public function listFlyers(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        return response()->json([
            'flyers' => $campaign->flyers()->orderBy('created_at', 'desc')->get(),
        ]);
    }

    /**
     * Upload / save a flyer for a campaign.
     */
    public function storeFlyer(Request $request, Campaign $campaign): JsonResponse
    {
        $this->authorize($request, $campaign);

        $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'image', 'max:10240'], // 10MB
            'canvas_state' => ['nullable', 'json'],
        ]);

        $path = $request->file('image')->store("campaigns/{$campaign->id}/flyers", 'public');

        $flyer = $campaign->flyers()->create([
            'title' => $request->input('title', 'Untitled Flyer'),
            'image_path' => $path,
            'canvas_state' => $request->input('canvas_state') ? json_decode($request->input('canvas_state'), true) : null,
        ]);

        return response()->json([
            'message' => 'Flyer saved successfully',
            'flyer' => $flyer,
        ], 201);
    }

    /**
     * Delete a flyer.
     */
    public function destroyFlyer(Request $request, Campaign $campaign, CampaignFlyer $flyer): JsonResponse
    {
        $this->authorize($request, $campaign);

        if ($flyer->campaign_id !== $campaign->id) {
            abort(403, 'Flyer does not belong to this campaign');
        }

        // Delete file
        if ($flyer->image_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($flyer->image_path);
        }

        $flyer->delete();

        return response()->json(['message' => 'Flyer deleted successfully']);
    }
}
