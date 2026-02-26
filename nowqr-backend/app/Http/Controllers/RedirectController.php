<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use App\Models\ScanLogo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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
        $ip = $request->ip();

        // Lookup geolocation from IP (non-blocking, fail-safe)
        $geo = $this->lookupGeoLocation($ip);

        ScanEvent::create([
            'scan_logo_id' => $scanLogo->id,
            'campaign_id' => $scanLogo->campaign_id,
            'user_id' => $scanLogo->user_id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'device_type' => $this->detectDeviceType($userAgent),
            'browser' => $this->detectBrowser($userAgent),
            'os' => $this->detectOS($userAgent),
            'referrer' => $request->header('Referer'),
            'scan_type' => $request->has('click') ? 'button_click' : 'qr_scan',
            'country' => $geo['country'] ?? null,
            'city' => $geo['city'] ?? null,
            'region' => $geo['region'] ?? null,
            'latitude' => $geo['latitude'] ?? null,
            'longitude' => $geo['longitude'] ?? null,
            'scanned_at' => now(),
        ]);
    }

    /**
     * Lookup geolocation data from IP address using ip-api.com (free, no key needed).
     * Returns null-safe array. Never throws — logs errors silently.
     */
    private function lookupGeoLocation(string $ip): array
    {
        // Skip private/local IPs (they won't resolve)
        if (in_array($ip, ['127.0.0.1', '::1']) || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.') || str_starts_with($ip, '172.')) {
            return [];
        }

        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}", [
                'fields' => 'status,country,regionName,city,lat,lon',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (($data['status'] ?? '') === 'success') {
                    return [
                        'country' => $data['country'] ?? null,
                        'region' => $data['regionName'] ?? null,
                        'city' => $data['city'] ?? null,
                        'latitude' => $data['lat'] ?? null,
                        'longitude' => $data['lon'] ?? null,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('GeoIP lookup failed: ' . $e->getMessage());
        }

        return [];
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
