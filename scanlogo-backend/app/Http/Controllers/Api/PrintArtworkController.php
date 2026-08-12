<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintArtwork;
use App\Models\PrintProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PrintArtworkController extends Controller
{
    /**
     * Artwork below this share of the product's required pixel size is rejected
     * outright — upscaling a small render to print size produces visible mush
     * and a QR that may not scan.
     */
    private const MIN_RESOLUTION_RATIO = 0.95;

    private const MAX_BYTES = 24 * 1024 * 1024;

    /**
     * Accept a print-resolution PNG rendered in the browser.
     *
     * The design only ever exists client-side, so this is the one point where
     * the artwork enters the system.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'print_product_id' => ['required', 'exists:print_products,id'],
            'image' => ['required', 'string'],
            'scan_logo_id' => ['nullable', 'exists:scan_logos,id'],
            'campaign_flyer_id' => ['nullable', 'exists:campaign_flyers,id'],
            'design_snapshot' => ['nullable', 'array'],
        ]);

        $user = $request->user();
        $product = PrintProduct::findOrFail($validated['print_product_id']);

        if (!$product->is_active) {
            return response()->json(['message' => 'This product is not available.'], 422);
        }

        // Guard against binding someone else's ScanLogo/flyer to your artwork.
        if (!empty($validated['scan_logo_id'])
            && !$user->scanLogos()->whereKey($validated['scan_logo_id'])->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!empty($validated['campaign_flyer_id'])) {
            $ownsFlyer = \App\Models\CampaignFlyer::whereKey($validated['campaign_flyer_id'])
                ->whereHas('campaign', fn ($q) => $q->where('user_id', $user->id))
                ->exists();

            if (!$ownsFlyer) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $binary = $this->decodeImage($validated['image']);
        if ($binary === null) {
            return response()->json(['message' => 'Artwork must be a valid base64-encoded PNG.'], 422);
        }

        if (strlen($binary) > self::MAX_BYTES) {
            return response()->json([
                'message' => 'Artwork is too large. Try a simpler design.',
            ], 422);
        }

        $info = @getimagesizefromstring($binary);
        if ($info === false) {
            return response()->json(['message' => 'Artwork could not be read as an image.'], 422);
        }

        [$width, $height] = $info;
        if (($info['mime'] ?? null) !== 'image/png') {
            return response()->json([
                'message' => 'Artwork must be a PNG so transparency and cut lines are preserved.',
            ], 422);
        }

        $minWidth = (int) floor($product->print_width_px * self::MIN_RESOLUTION_RATIO);
        $minHeight = (int) floor($product->print_height_px * self::MIN_RESOLUTION_RATIO);

        if ($width < $minWidth || $height < $minHeight) {
            return response()->json([
                'message' => "Artwork is {$width}x{$height}px but {$product->name} needs at least "
                    . "{$product->print_width_px}x{$product->print_height_px}px at {$product->print_dpi} DPI. "
                    . 'Re-export the design at print size.',
                'required' => [
                    'width' => $product->print_width_px,
                    'height' => $product->print_height_px,
                    'dpi' => $product->print_dpi,
                ],
                'received' => ['width' => $width, 'height' => $height],
            ], 422);
        }

        $checksum = hash('sha256', $binary);

        // Same design ordered twice should not re-upload to Printify.
        $existing = PrintArtwork::where('user_id', $user->id)
            ->where('checksum', $checksum)
            ->where('width_px', $width)
            ->where('height_px', $height)
            ->first();

        if ($existing && Storage::disk('public')->exists($existing->file_path)) {
            return response()->json([
                'message' => 'Artwork ready.',
                'artwork' => $existing,
                'reused' => true,
            ]);
        }

        $path = 'print-artwork/' . $user->id . '/' . Str::uuid()->toString() . '.png';
        Storage::disk('public')->put($path, $binary);

        $artwork = PrintArtwork::create([
            'user_id' => $user->id,
            'scan_logo_id' => $validated['scan_logo_id'] ?? null,
            'campaign_flyer_id' => $validated['campaign_flyer_id'] ?? null,
            'file_path' => $path,
            'width_px' => $width,
            'height_px' => $height,
            'byte_size' => strlen($binary),
            'checksum' => $checksum,
            'design_snapshot' => $validated['design_snapshot'] ?? null,
        ]);

        return response()->json([
            'message' => 'Artwork ready.',
            'artwork' => $artwork,
            'reused' => false,
        ], 201);
    }

    /**
     * Accepts either a data: URI or bare base64.
     */
    private function decodeImage(string $input): ?string
    {
        if (str_starts_with($input, 'data:')) {
            $comma = strpos($input, ',');
            if ($comma === false) {
                return null;
            }
            $input = substr($input, $comma + 1);
        }

        $binary = base64_decode(trim($input), true);

        return $binary === false || $binary === '' ? null : $binary;
    }
}
