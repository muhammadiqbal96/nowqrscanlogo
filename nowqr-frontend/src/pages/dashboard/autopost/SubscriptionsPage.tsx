import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Plus, Trash2, Pause, Play, Clock, Zap,
    ChevronRight
} from 'lucide-react'
import { autoPostSubApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function SubscriptionsPage() {
    const navigate = useNavigate()
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [pricing, setPricing] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            const res = await autoPostSubApi.list()
            setSubscriptions(res.data.subscriptions)
            setPricing(res.data.pricing)
        } catch {
            toast.error('Failed to load subscriptions')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (sub: any) => {
        const newStatus = sub.status === 'active' ? 'paused' : 'active'
        try {
            await autoPostSubApi.update(sub.id, { status: newStatus })
            toast.success(`Subscription ${newStatus}`)
            loadData()
        } catch {
            toast.error('Failed to update status')
        }
    }

    const handleCancel = async (id: number) => {
        if (!confirm('Cancel this subscription? This cannot be undone.')) return
        try {
            await autoPostSubApi.cancel(id)
            toast.success('Subscription cancelled')
            loadData()
        } catch {
            toast.error('Failed to cancel')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Subscriptions</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your auto-posting schedules</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/dashboard/autopost" className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Back</Link>
                    <Link
                        to="/dashboard/autopost/subscriptions/new"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New
                    </Link>
                </div>
            </div>

            {subscriptions.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No subscriptions yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Set up automatic content posting to your websites
                    </p>
                    <Link
                        to="/dashboard/autopost/subscriptions/new"
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Create Subscription
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold capitalize">{sub.frequency} Posting</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'active' ? 'bg-green-500/10 text-green-600' :
                                            sub.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600' :
                                                'bg-red-500/10 text-red-600'
                                            }`}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {sub.posts_per_cycle} post(s) per {sub.frequency === 'daily' ? 'day' : sub.frequency === 'weekly' ? 'week' : 'month'}
                                        {sub.niche && ` · ${sub.niche}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    {sub.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleToggleStatus(sub)}
                                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                                            title={sub.status === 'active' ? 'Pause' : 'Resume'}
                                        >
                                            {sub.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                        </button>
                                    )}
                                    {sub.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleCancel(sub.id)}
                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                                            title="Cancel"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                                <div>
                                    <p className="text-xs text-muted-foreground">Credits/Post</p>
                                    <p className="text-sm font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> {sub.credits_per_post}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Posts Delivered</p>
                                    <p className="text-sm font-medium">{sub.total_posts_delivered}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Credits Spent</p>
                                    <p className="text-sm font-medium">{sub.total_credits_spent}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Next Post</p>
                                    <p className="text-sm font-medium">
                                        {sub.next_post_at ? new Date(sub.next_post_at).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>

                            {(sub.keywords?.length > 0 || sub.tone) && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {sub.tone && (
                                        <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full">
                                            Tone: {sub.tone}
                                        </span>
                                    )}
                                    {sub.keywords?.map((kw: string, i: number) => (
                                        <span key={i} className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pricing cards */}
            {pricing && (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Pricing</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {Object.entries(pricing).map(([key, plan]: [string, any]) => (
                            <div key={key} className="bg-card border border-border rounded-xl p-5 text-center">
                                <h3 className="font-semibold text-lg mb-1">{plan.label}</h3>
                                <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                                <p className="text-3xl font-bold text-primary mb-1">{plan.credits_per_post}</p>
                                <p className="text-xs text-muted-foreground mb-3">credits per post</p>
                                <p className="text-xs text-muted-foreground">{plan.monthly_estimate}</p>
                                <button
                                    onClick={() => navigate('/dashboard/autopost/subscriptions/new')}
                                    className="mt-4 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-1"
                                >
                                    Get Started <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
