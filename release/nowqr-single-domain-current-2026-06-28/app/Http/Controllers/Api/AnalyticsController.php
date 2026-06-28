<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScanEvent;
use App\Models\ScanLogo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get dashboard overview analytics for the authenticated user.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();

        $totalScans = $user->scanEvents()->count();
        $totalCampaigns = $user->campaigns()->count();
        $activeCampaigns = $user->campaigns()->where('status', 'active')->count();
        $totalScanLogos = $user->scanLogos()->count();

        // Scans in last 30 days
        $last30DaysScans = $user->scanEvents()
            ->where('scanned_at', '>=', now()->subDays(30))
            ->count();

        // Scans in last 7 days
        $last7DaysScans = $user->scanEvents()
            ->where('scanned_at', '>=', now()->subDays(7))
            ->count();

        // Daily scans for the last 30 days (for chart)
        $dailyScans = $user->scanEvents()
            ->where('scanned_at', '>=', now()->subDays(30))
            ->selectRaw("DATE(scanned_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');

        // Top campaigns by scans
        $topCampaigns = $user->campaigns()
            ->withCount('scanEvents')
            ->orderByDesc('scan_events_count')
            ->limit(5)
            ->get(['id', 'name', 'cta_type', 'status']);

        // Device breakdown
        $deviceBreakdown = $user->scanEvents()
            ->selectRaw("device_type, COUNT(*) as count")
            ->groupBy('device_type')
            ->get()
            ->pluck('count', 'device_type');

        // Scan type breakdown (QR scan vs button click)
        $scanTypeBreakdown = $user->scanEvents()
            ->selectRaw("scan_type, COUNT(*) as count")
            ->groupBy('scan_type')
            ->get()
            ->pluck('count', 'scan_type');

        return response()->json([
            'overview' => [
                'total_scans' => $totalScans,
                'last_30_days_scans' => $last30DaysScans,
                'last_7_days_scans' => $last7DaysScans,
                'total_campaigns' => $totalCampaigns,
                'active_campaigns' => $activeCampaigns,
                'total_scan_logos' => $totalScanLogos,
                'credits' => $user->credits,
                'plan' => $user->plan,
            ],
            'daily_scans' => $dailyScans,
            'top_campaigns' => $topCampaigns,
            'device_breakdown' => $deviceBreakdown,
            'scan_type_breakdown' => $scanTypeBreakdown,
        ]);
    }

    /**
     * Get analytics for a specific campaign.
     */
    public function campaign(Request $request, int $campaignId): JsonResponse
    {
        $campaign = $request->user()->campaigns()->findOrFail($campaignId);

        $totalScans = $campaign->scanEvents()->count();

        // Daily scans
        $dailyScans = $campaign->scanEvents()
            ->where('scanned_at', '>=', now()->subDays(30))
            ->selectRaw("DATE(scanned_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');

        // Device breakdown
        $deviceBreakdown = $campaign->scanEvents()
            ->selectRaw("device_type, COUNT(*) as count")
            ->groupBy('device_type')
            ->get()
            ->pluck('count', 'device_type');

        // Location breakdown
        $locationBreakdown = $campaign->scanEvents()
            ->selectRaw("country, COUNT(*) as count")
            ->whereNotNull('country')
            ->groupBy('country')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        // Hourly distribution
        $hourlyDistribution = $campaign->scanEvents()
            ->selectRaw("strftime('%H', scanned_at) as hour, COUNT(*) as count")
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->pluck('count', 'hour');

        // Recent scans
        $recentScans = $campaign->scanEvents()
            ->orderByDesc('scanned_at')
            ->limit(20)
            ->get(['device_type', 'browser', 'os', 'country', 'city', 'scan_type', 'scanned_at']);

        return response()->json([
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'status' => $campaign->status,
            ],
            'total_scans' => $totalScans,
            'daily_scans' => $dailyScans,
            'device_breakdown' => $deviceBreakdown,
            'location_breakdown' => $locationBreakdown,
            'hourly_distribution' => $hourlyDistribution,
            'recent_scans' => $recentScans,
        ]);
    }

    /**
     * Get analytics for a specific ScanLogo.
     */
    public function scanLogo(Request $request, int $scanLogoId): JsonResponse
    {
        $scanLogo = $request->user()->scanLogos()->findOrFail($scanLogoId);

        $totalScans = $scanLogo->scanEvents()->count();

        $dailyScans = $scanLogo->scanEvents()
            ->where('scanned_at', '>=', now()->subDays(30))
            ->selectRaw("DATE(scanned_at) as date, COUNT(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->pluck('count', 'date');

        $deviceBreakdown = $scanLogo->scanEvents()
            ->selectRaw("device_type, COUNT(*) as count")
            ->groupBy('device_type')
            ->get()
            ->pluck('count', 'device_type');

        return response()->json([
            'scan_logo' => [
                'id' => $scanLogo->id,
                'short_url' => $scanLogo->short_url,
                'destination_url' => $scanLogo->destination_url,
            ],
            'total_scans' => $totalScans,
            'daily_scans' => $dailyScans,
            'device_breakdown' => $deviceBreakdown,
        ]);
    }
}
