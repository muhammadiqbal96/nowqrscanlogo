import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Users, FileText, QrCode, BarChart3, DollarSign, Megaphone, TrendingUp, UserPlus } from 'lucide-react'

interface Stats {
    total_users: number
    active_users: number
    blocked_users: number
    total_campaigns: number
    total_scanlogos: number
    total_scans: number
    total_blogs: number
    published_blogs: number
    total_revenue: number
    recent_signups: number
    signup_chart: { date: string; count: number }[]
    scan_chart: { date: string; count: number }[]
    plan_distribution: { plan: string; count: number }[]
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const res = await adminApi.stats()
            setStats(res.data)
        } catch (err) {
            console.error('Failed to load stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!stats) {
        return <div className="text-center text-muted-foreground py-12">Failed to load stats.</div>
    }

    const statCards = [
        { icon: Users, label: 'Total Users', value: stats.total_users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: UserPlus, label: 'New (30d)', value: stats.recent_signups, color: 'text-green-500', bg: 'bg-green-500/10' },
        { icon: Users, label: 'Blocked', value: stats.blocked_users, color: 'text-red-500', bg: 'bg-red-500/10' },
        { icon: Megaphone, label: 'Campaigns', value: stats.total_campaigns, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { icon: QrCode, label: 'ScanLogos', value: stats.total_scanlogos, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { icon: BarChart3, label: 'Total Scans', value: stats.total_scans, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { icon: FileText, label: 'Blog Posts', value: `${stats.published_blogs}/${stats.total_blogs}`, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { icon: DollarSign, label: 'Revenue', value: `$${stats.total_revenue}`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ]

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Platform overview and statistics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-lg ${card.bg}`}>
                                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Plan Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Plan Distribution
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {stats.plan_distribution.map((plan) => (
                        <div key={plan.plan} className="text-center p-4 bg-muted rounded-xl">
                            <p className="text-2xl font-bold">{plan.count}</p>
                            <p className="text-sm text-muted-foreground capitalize mt-1">{plan.plan}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Signups Chart */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Signups (last 14 days)</h2>
                    <div className="space-y-2">
                        {stats.signup_chart.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No signups yet.</p>
                        ) : (
                            stats.signup_chart.map((day) => {
                                const max = Math.max(...stats.signup_chart.map(d => d.count), 1)
                                return (
                                    <div key={day.date} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-20">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(day.count / max) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium w-8 text-right">{day.count}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Scans Chart */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Scans (last 14 days)</h2>
                    <div className="space-y-2">
                        {stats.scan_chart.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No scans yet.</p>
                        ) : (
                            stats.scan_chart.map((day) => {
                                const max = Math.max(...stats.scan_chart.map(d => d.count), 1)
                                return (
                                    <div key={day.date} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-20">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                                            <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${(day.count / max) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium w-8 text-right">{day.count}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
