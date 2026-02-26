import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Megaphone, QrCode, BarChart3, TrendingUp, Eye, MousePointerClick,
    Plus, ArrowUpRight, Loader2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { analyticsApi, campaignApi } from '@/lib/api'

interface DashboardData {
    total_campaigns: number
    total_scanlogos: number
    total_scans: number
    scans_today: number
    daily_scans: { date: string; count: number }[]
    top_campaigns: { id: number; name: string; scans: number }[]
}

export default function DashboardHomePage() {
    const { user } = useAuth()
    const [data, setData] = useState<DashboardData | null>(null)
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [analyticsRes, campaignsRes] = await Promise.all([
                    analyticsApi.dashboard().catch(() => ({ data: null })),
                    campaignApi.list().catch(() => ({ data: { data: [] } })),
                ])
                if (analyticsRes.data) {
                    const raw = analyticsRes.data
                    const overview = raw.overview || raw
                    const dailyScansRaw = raw.daily_scans || {}
                    const dailyScans = Object.entries(dailyScansRaw).map(([date, count]) => ({ date, count: count as number }))
                    const topCampaigns = (raw.top_campaigns || []).map((c: any) => ({
                        id: c.id,
                        name: c.name,
                        scans: c.scan_events_count ?? c.scans ?? 0,
                    }))
                    setData({
                        total_campaigns: overview.total_campaigns ?? 0,
                        total_scanlogos: overview.total_scan_logos ?? overview.total_scanlogos ?? 0,
                        total_scans: overview.total_scans ?? 0,
                        scans_today: overview.last_7_days_scans ?? 0,
                        daily_scans: dailyScans,
                        top_campaigns: topCampaigns,
                    })
                }
                setCampaigns(campaignsRes.data?.data?.slice(0, 5) || [])
            } catch {
                // Fail silently - new users will have empty data
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const statCards = [
        { icon: Megaphone, label: 'Campaigns', value: data?.total_campaigns ?? 0, color: 'text-blue-500 bg-blue-500/10' },
        { icon: QrCode, label: 'ScanLogos', value: data?.total_scanlogos ?? 0, color: 'text-purple-500 bg-purple-500/10' },
        { icon: Eye, label: 'Total Scans', value: data?.total_scans ?? 0, color: 'text-green-500 bg-green-500/10' },
        { icon: TrendingUp, label: 'Today', value: data?.scans_today ?? 0, color: 'text-orange-500 bg-orange-500/10' },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                        Welcome back, {user?.first_name}!
                    </h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your campaigns.</p>
                </div>
                <Link
                    to="/dashboard/campaigns/new"
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/25"
                >
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions for new users */}
            {(data?.total_campaigns ?? 0) === 0 && (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Megaphone className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Create your first campaign</h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                        Choose a call to action, enter your business details, and our AI will generate a beautiful ad page
                        with an animated ScanLogo button — in minutes.
                    </p>
                    <Link
                        to="/dashboard/campaigns/new"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Start Building
                    </Link>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Campaigns */}
                <div className="bg-card border border-border rounded-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <h3 className="font-semibold">Recent Campaigns</h3>
                        <Link to="/dashboard/campaigns" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                            View all <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {campaigns.length === 0 ? (
                            <div className="p-5 text-center text-sm text-muted-foreground">No campaigns yet</div>
                        ) : (
                            campaigns.map((campaign: any) => (
                                <Link key={campaign.id} to={`/dashboard/campaigns/${campaign.id}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium">{campaign.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{campaign.cta_type} · {campaign.status}</p>
                                    </div>
                                    <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Performing */}
                <div className="bg-card border border-border rounded-2xl">
                    <div className="flex items-center justify-between p-5 border-b border-border">
                        <h3 className="font-semibold">Top Performing</h3>
                        <Link to="/dashboard/analytics" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                            Analytics <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {(!data?.top_campaigns || data.top_campaigns.length === 0) ? (
                            <div className="p-5 text-center text-sm text-muted-foreground">No scan data yet</div>
                        ) : (
                            data.top_campaigns.map((c) => (
                                <div key={c.id} className="flex items-center justify-between p-4">
                                    <p className="text-sm font-medium">{c.name}</p>
                                    <div className="flex items-center gap-1 text-sm font-bold text-primary">
                                        <BarChart3 className="w-3.5 h-3.5" />
                                        {c.scans}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
