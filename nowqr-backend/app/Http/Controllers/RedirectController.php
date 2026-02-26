<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use App\Models\ScanLogo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RedirectController extends Controller
{
    /**
     * Handle short URL redirect and track the scan event.
     * This is the public-facing endpoint for QR code scans.
     */
    public function handleRedirect(Request $request, string $shortCode): RedirectResponse
    {
        $scanLogo = ScanLogo::where('short_code', $shortCode)
            ->where('is_active', true)
            ->firstOrFail();

        // Track the scan event
        $this->trackScan($request, $scanLogo);

        return redirect($scanLogo->destination_url);
    }

    /**
     * Track a scan/click event with device & location info.
     */
    private function trackScan(Request $request, ScanLogo $scanLogo): void
    {
        $userAgent = $request->header('User-Agent', '');

        ScanEvent::create([
            'scan_logo_id' => $scanLogo->id,
            'campaign_id' => $scanLogo->campaign_id,
            'user_id' => $scanLogo->user_id,
            'ip_address' => $request->ip(),
            'user_agent' => $userAgent,
            'device_type' => $this->detectDeviceType($userAgent),
            'browser' => $this->detectBrowser($userAgent),
            'os' => $this->detectOS($userAgent),
            'referrer' => $request->header('Referer'),
            'scan_type' => $request->has('click') ? 'button_click' : 'qr_scan',
            'scanned_at' => now(),
        ]);
    }

    private function detectDeviceType(string $ua): string
    {
        if (preg_match('/Mobile|Android.*Mobile|iPhone|iPod/i', $ua)) return 'mobile';
        if (preg_match('/iPad|Android(?!.*Mobile)|Tablet/i', $ua)) return 'tablet';
        return 'desktop';
    }

    private function detectBrowser(string $ua): string
    {
        if (str_contains($ua, 'Firefox')) return 'Firefox';
        if (str_contains($ua, 'Edg')) return 'Edge';
        if (str_contains($ua, 'Chrome')) return 'Chrome';
        if (str_contains($ua, 'Safari')) return 'Safari';
        if (str_contains($ua, 'Opera') || str_contains($ua, 'OPR')) return 'Opera';
        return 'Other';
    }

    private function detectOS(string $ua): string
    {
        if (str_contains($ua, 'Windows')) return 'Windows';
        if (str_contains($ua, 'Mac OS')) return 'macOS';
        if (str_contains($ua, 'Android')) return 'Android';
        if (str_contains($ua, 'iOS') || str_contains($ua, 'iPhone')) return 'iOS';
        if (str_contains($ua, 'Linux')) return 'Linux';
        return 'Other';
    }
}
