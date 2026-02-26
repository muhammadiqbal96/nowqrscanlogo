import { useEffect, useState } from 'react'
import {
  BarChart3, Eye, Smartphone, Monitor, Tablet, Globe, Clock,
  TrendingUp, Users, Loader2, MapPin
} from 'lucide-react'
import { analyticsApi } from '@/lib/api'

interface DashboardAnalytics {
  total_campaigns: number
  total_scanlogos: number
  total_scans: number
  scans_today: number
  daily_scans: { date: string; count: number }[]
  top_campaigns: { id: number; name: string; scans: number }[]
  device_breakdown: { device_type: string; count: number }[]
  scan_type_breakdown: { scan_type: string; count: number }[]
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsApi.dashboard()
        setData(res.data)
      } catch {
        // Empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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

  const maxDailyScans = Math.max(...(data.daily_scans?.map(d => d.count) || [1]))

  const deviceIcons: Record<string, any> = {
    mobile: Smartphone,
    desktop: Monitor,
    tablet: Tablet,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time tracking of your ScanLogo performance.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: 'Total Scans', value: data.total_scans, color: 'text-blue-500 bg-blue-500/10' },
          { icon: TrendingUp, label: 'Today', value: data.scans_today, color: 'text-green-500 bg-green-500/10' },
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

      {/* Daily Scans Chart */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold mb-4">Scans — Last 30 Days</h3>
        <div className="flex items-end gap-1 h-40">
          {data.daily_scans?.slice(-30).map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div className="relative w-full">
                <div
                  className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all cursor-pointer min-h-[2px]"
                  style={{ height: `${(day.count / maxDailyScans) * 140}px` }}
                  title={`${day.date}: ${day.count} scans`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{data.daily_scans?.[0]?.date}</span>
          <span>{data.daily_scans?.[data.daily_scans.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4" /> Devices
          </h3>
          <div className="space-y-3">
            {data.device_breakdown?.map((device) => {
              const Icon = deviceIcons[device.device_type] || Monitor
              const pct = Math.round((device.count / data.total_scans) * 100)
              return (
                <div key={device.device_type} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize">{device.device_type}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Scan Type */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Scan Type
          </h3>
          <div className="space-y-3">
            {data.scan_type_breakdown?.map((type) => {
              const pct = Math.round((type.count / data.total_scans) * 100)
              return (
                <div key={type.scan_type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{type.scan_type.replace('_', ' ')}</span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Top Campaigns
          </h3>
          <div className="space-y-2">
            {data.top_campaigns?.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm truncate max-w-[120px]">{c.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{c.scans}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
