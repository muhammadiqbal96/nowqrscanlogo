import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Send, Globe, Clock, CheckCircle, AlertCircle,
    Plus, ArrowRight, Zap, TrendingUp, BarChart3
} from 'lucide-react'
import { autoPostApi, autoPostSubApi, platformApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AutoPostDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [platforms, setPlatforms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statsRes, subsRes, platRes] = await Promise.all([
                autoPostApi.stats(),
                autoPostSubApi.list(),
                platformApi.list(),
            ])
            setStats(statsRes.data.stats)
            setSubscriptions(subsRes.data.subscriptions)
            setPlatforms(platRes.data.platforms)
        } catch {
            toast.error('Failed to load auto-post data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const statCards = [
        { icon: Send, label: 'Total Posts', value: stats?.total_posts ?? 0, color: 'text-blue-500 bg-blue-500/10' },
        { icon: CheckCircle, label: 'Published', value: stats?.published ?? 0, color: 'text-green-500 bg-green-500/10' },
        { icon: Clock, label: 'Scheduled', value: stats?.scheduled ?? 0, color: 'text-yellow-500 bg-yellow-500/10' },
        { icon: AlertCircle, label: 'Failed', value: stats?.failed ?? 0, color: 'text-red-500 bg-red-500/10' },
        { icon: Zap, label: 'Active Subs', value: stats?.active_subscriptions ?? 0, color: 'text-purple-500 bg-purple-500/10' },
        { icon: Globe, label: 'Platforms', value: stats?.connected_platforms ?? 0, color: 'text-indigo-500 bg-indigo-500/10' },
        { icon: TrendingUp, label: 'Credits Spent', value: stats?.total_credits_spent ?? 0, color: 'text-orange-500 bg-orange-500/10' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Auto-Posting</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Automatically publish content to your connected websites
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/dashboard/autopost/platforms"
                        className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        Platforms
                    </Link>
                    <Link
                        to="/dashboard/autopost/subscriptions/new"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Subscription
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${card.color}`}>
                                <card.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{card.value}</p>
                                <p className="text-xs text-muted-foreground">{card.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Subscriptions */}
                <div className="bg-card border border-border rounded-xl">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold">Active Subscriptions</h2>
                        <Link to="/dashboard/autopost/subscriptions" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-4">
                        {subscriptions.filter(s => s.status === 'active').length === 0 ? (
                            <div className="text-center py-8">
                                <BarChart3 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No active subscriptions</p>
                                <Link
                                    to="/dashboard/autopost/subscriptions/new"
                                    className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> Create one
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {subscriptions.filter(s => s.status === 'active').slice(0, 3).map((sub) => (
                                    <Link
                                        key={sub.id}
                                        to="/dashboard/autopost/subscriptions"
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium capitalize">{sub.frequency} — {sub.posts_per_cycle} post(s)</p>
                                            <p className="text-xs text-muted-foreground">{sub.niche || 'No niche set'}</p>
                                        </div>
                                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full font-medium">Active</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Connected Platforms */}
                <div className="bg-card border border-border rounded-xl">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold">Connected Platforms</h2>
                        <Link to="/dashboard/autopost/platforms" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Manage <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="p-4">
                        {platforms.length === 0 ? (
                            <div className="text-center py-8">
                                <Globe className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm text-muted-foreground">No platforms connected</p>
                                <Link
                                    to="/dashboard/autopost/platforms"
                                    className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
                                >
                                    <Plus className="w-3 h-3" /> Connect one
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {platforms.slice(0, 4).map((p) => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${p.type === 'wordpress' ? 'bg-blue-500/10 text-blue-500' : p.type === 'shopify' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{p.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'active' ? 'bg-green-500/10 text-green-600' : p.status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Posts */}
            {stats?.recent_posts?.length > 0 && (
                <div className="bg-card border border-border rounded-xl">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-semibold">Recent Posts</h2>
                        <Link to="/dashboard/autopost/posts" className="text-xs text-primary hover:underline flex items-center gap-1">
                            View all <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-border">
                        {(stats.recent_posts as any[]).map((post: any) => (
                            <div key={post.id} className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{post.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {post.platform?.name || 'No platform'} · {new Date(post.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${post.status === 'published' ? 'bg-green-500/10 text-green-600' :
                                    post.status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-600' :
                                        post.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                            'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {post.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
