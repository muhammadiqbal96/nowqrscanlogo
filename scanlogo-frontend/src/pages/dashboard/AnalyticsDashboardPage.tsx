import { useEffect, useState } from 'react'
import {
    BarChart3, Eye, Smartphone, Monitor, Tablet,
    TrendingUp, Users, Loader2, MapPin, Globe
} from 'lucide-react'
import { analyticsApi } from '@/lib/api'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'

interface DashboardAnalytics {
    total_campaigns: number
    total_scanlogos: number
    total_scans: number
    scans_7d: number
    scans_30d: number
    daily_scans: { date: string; count: number }[]
    top_campaigns: { id: number; name: string; scans: number }[]
    device_breakdown: { name: string; value: number }[]
    scan_type_breakdown: { name: string; value: number }[]
}

const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsDashboardPage() {
    const [data, setData] = useState<DashboardAnalytics | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await analyticsApi.dashboard()
                const raw = res.data
                const overview = raw.overview || raw
                const dailyScansRaw = raw.daily_scans || {}
                const dailyScans = Object.entries(dailyScansRaw).map(([date, count]) => ({
                    date, count: count as number,
                }))
                const topCampaigns = (raw.top_campaigns || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    scans: c.scan_events_count ?? c.scans ?? 0,
                }))
                const deviceBreakdown = Object.entries(raw.device_breakdown || {}).map(
                    ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number })
                )
                const scanTypeBreakdown = Object.entries(raw.scan_type_breakdown || {}).map(
                    ([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: value as number })
                )

                setData({
                    total_campaigns: overview.total_campaigns ?? 0,
                    total_scanlogos: overview.total_scan_logos ?? overview.total_scanlogos ?? 0,
                    total_scans: overview.total_scans ?? 0,
                    scans_7d: overview.last_7_days_scans ?? 0,
                    scans_30d: overview.last_30_days_scans ?? 0,
                    daily_scans: dailyScans,
                    top_campaigns: topCampaigns,
                    device_breakdown: deviceBreakdown,
                    scan_type_breakdown: scanTypeBreakdown,
                })
            } catch {
                // Empty state
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!data || data.total_scans === 0) {
        return (
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-2">Analytics</h1>
                <p className="text-muted-foreground text-sm mb-8">Track how people interact with your ScanLogos.</p>
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <BarChart3 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold mb-2">No scan data yet</h2>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Once people start scanning your ScanLogos, you'll see detailed analytics here — scans, devices, locations, and more.
                    </p>
                </div>
            </div>
        )
    }

    const deviceIcons: Record<string, any> = {
        Mobile: Smartphone,
        Desktop: Monitor,
        Tablet: Tablet,
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground text-sm mt-1">Real-time tracking of your ScanLogo performance.</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { icon: Eye, label: 'Total Scans', value: data.total_scans, color: 'text-blue-500 bg-blue-500/10' },
                    { icon: TrendingUp, label: 'Last 7 Days', value: data.scans_7d, color: 'text-green-500 bg-green-500/10' },
                    { icon: Globe, label: 'Last 30 Days', value: data.scans_30d, color: 'text-cyan-500 bg-cyan-500/10' },
                    { icon: BarChart3, label: 'Campaigns', value: data.total_campaigns, color: 'text-purple-500 bg-purple-500/10' },
                    { icon: Users, label: 'ScanLogos', value: data.total_scanlogos, color: 'text-orange-500 bg-orange-500/10' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Daily Scans Area Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold mb-1">Scans — Last 30 Days</h3>
                <p className="text-xs text-muted-foreground mb-4">Daily scan activity over the past month</p>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.daily_scans} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <defs>
                                <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#888' }}
                                tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1a1a2e',
                                    border: '1px solid #ffffff15',
                                    borderRadius: '12px',
                                    fontSize: 12,
                                    color: '#fff',
                                }}
                                labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'long', day: 'numeric' })}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="Scans"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="url(#scanGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Device Breakdown Pie Chart */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Devices
                    </h3>
                    {data.device_breakdown.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.device_breakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {data.device_breakdown.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: 12, color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No device data yet</p>
                    )}
                    <div className="space-y-2 mt-4">
                        {data.device_breakdown.map((device, i) => {
                            const Icon = deviceIcons[device.name] || Monitor
                            const pct = data.total_scans > 0 ? Math.round((device.value / data.total_scans) * 100) : 0
                            return (
                                <div key={device.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm flex-1">{device.name}</span>
                                    <span className="text-sm font-medium">{device.value} ({pct}%)</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Scan Type Pie Chart */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Scan Type
                    </h3>
                    {data.scan_type_breakdown.length > 0 ? (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.scan_type_breakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {data.scan_type_breakdown.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: 12, color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No scan type data yet</p>
                    )}
                    <div className="space-y-2 mt-4">
                        {data.scan_type_breakdown.map((type, i) => (
                            <div key={type.name} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(i + 3) % COLORS.length] }} />
                                <span className="text-sm flex-1">{type.name}</span>
                                <span className="text-sm font-medium">{type.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Campaigns Bar Chart */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Top Campaigns
                    </h3>
                    {data.top_campaigns.length > 0 ? (
                        <>
                            <div className="h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.top_campaigns} layout="vertical" margin={{ left: 0, right: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: '#888' }}
                                            width={100}
                                        />
                                        <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: 12, color: '#fff' }} />
                                        <Bar dataKey="scans" name="Scans" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4">
                                {data.top_campaigns.map((c, i) => (
                                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                                            <span className="text-sm truncate max-w-[120px]">{c.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-primary">{c.scans}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No campaign data yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}
