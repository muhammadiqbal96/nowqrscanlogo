<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Campaign;
use App\Models\CreditTransaction;
use App\Models\ScanEvent;
use App\Models\ScanLogo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_blocked', false)->count();
        $blockedUsers = User::where('is_blocked', true)->count();
        $totalCampaigns = Campaign::count();
        $totalScanLogos = ScanLogo::count();
        $totalScans = ScanEvent::count();
        $totalBlogs = Blog::count();
        $publishedBlogs = Blog::where('status', 'published')->count();

        // Revenue (total payment amounts from credit transactions)
        $totalRevenue = CreditTransaction::whereNotNull('payment_amount')
            ->where('type', 'purchase')
            ->sum('payment_amount');

        // Recent signups (last 30 days)
        $recentSignups = User::where('created_at', '>=', now()->subDays(30))->count();

        // Signups per day (last 14 days)
        $signupChart = User::select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('created_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Scans per day (last 14 days)
        $scanChart = ScanEvent::select(DB::raw('DATE(scanned_at) as date'), DB::raw('COUNT(*) as count'))
            ->where('scanned_at', '>=', now()->subDays(14))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Plan distribution
        $planDistribution = User::select('plan', DB::raw('COUNT(*) as count'))
            ->groupBy('plan')
            ->get();

        return response()->json([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'blocked_users' => $blockedUsers,
            'total_campaigns' => $totalCampaigns,
            'total_scanlogos' => $totalScanLogos,
            'total_scans' => $totalScans,
            'total_blogs' => $totalBlogs,
            'published_blogs' => $publishedBlogs,
            'total_revenue' => round($totalRevenue / 100, 2), // cents to dollars
            'recent_signups' => $recentSignups,
            'signup_chart' => $signupChart,
            'scan_chart' => $scanChart,
            'plan_distribution' => $planDistribution,
        ]);
    }
}
