import { useEffect, useState } from 'react'
import {
    Users, Send, CheckCircle, XCircle, Clock,
    Globe, Zap, Search, ChevronLeft, ChevronRight, Trash2,
    Ban, MoreHorizontal, Eye
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import { adminApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminAutoPostPage() {
    const [tab, setTab] = useState<'overview' | 'subscriptions' | 'posts'>('overview')
    const [stats, setStats] = useState<any>(null)
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [posts, setPosts] = useState<any[]>([])
    const [subPagination, setSubPagination] = useState<any>(null)
    const [postPagination, setPostPagination] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [subPage, setSubPage] = useState(1)
    const [postPage, setPostPage] = useState(1)
    const [subSearch, setSubSearch] = useState('')
    const [postSearch, setPostSearch] = useState('')
    const [postStatusFilter, setPostStatusFilter] = useState('')
    const [viewingPost, setViewingPost] = useState<any>(null)

    useEffect(() => { loadStats() }, [])
    useEffect(() => { if (tab === 'subscriptions') loadSubs() }, [tab, subPage, subSearch])
    useEffect(() => { if (tab === 'posts') loadPosts() }, [tab, postPage, postSearch, postStatusFilter])

    const loadStats = async () => {
        try {
            const res = await adminApi.autoPost.stats()
            setStats(res.data)
        } catch {
            toast.error('Failed to load stats')
        } finally {
            setLoading(false)
        }
    }

    const loadSubs = async () => {
        try {
            const res = await adminApi.autoPost.subscriptions(subPage, undefined, undefined, subSearch || undefined)
            setSubscriptions(res.data.data)
            setSubPagination(res.data)
        } catch {
            toast.error('Failed to load subscriptions')
        }
    }

    const loadPosts = async () => {
        try {
            const res = await adminApi.autoPost.posts(postPage, postStatusFilter || undefined, postSearch || undefined)
            setPosts(res.data.data)
            setPostPagination(res.data)
        } catch {
            toast.error('Failed to load posts')
        }
    }

    const handleCancelSub = async (id: number) => {
        if (!confirm('Cancel this subscription?')) return
        try {
            await adminApi.autoPost.cancelSubscription(id)
            toast.success('Subscription cancelled')
            loadSubs()
            loadStats()
        } catch {
            toast.error('Failed to cancel')
        }
    }

    const handleDeletePost = async (id: number) => {
        if (!confirm('Delete this post?')) return
        try {
            await adminApi.autoPost.deletePost(id)
            toast.success('Post deleted')
            loadPosts()
        } catch {
            toast.error('Failed to delete')
        }
    }

    const handleViewPost = async (id: number) => {
        try {
            const res = await adminApi.autoPost.getPost(id)
            setViewingPost(res.data.post || res.data)
        } catch {
            toast.error('Failed to load post')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Auto-Post Management</h1>
                <p className="text-muted-foreground text-sm mt-1">Monitor all auto-posting activity across users</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
                {(['overview', 'subscriptions', 'posts'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[
                            { icon: Users, label: 'Total Subscriptions', value: stats.total_subscriptions, color: 'text-blue-500 bg-blue-500/10' },
                            { icon: CheckCircle, label: 'Active Subscriptions', value: stats.active_subscriptions, color: 'text-green-500 bg-green-500/10' },
                            { icon: Send, label: 'Total Posts', value: stats.total_posts, color: 'text-indigo-500 bg-indigo-500/10' },
                            { icon: CheckCircle, label: 'Published Posts', value: stats.published_posts, color: 'text-emerald-500 bg-emerald-500/10' },
                            { icon: Clock, label: 'Scheduled Posts', value: stats.scheduled_posts, color: 'text-yellow-500 bg-yellow-500/10' },
                            { icon: XCircle, label: 'Failed Posts', value: stats.failed_posts, color: 'text-red-500 bg-red-500/10' },
                            { icon: Globe, label: 'Connected Platforms', value: stats.total_platforms, color: 'text-purple-500 bg-purple-500/10' },
                            { icon: Zap, label: 'Credits Earned', value: stats.total_credits_earned, color: 'text-orange-500 bg-orange-500/10' },
                        ].map(card => (
                            <div key={card.label} className="bg-card border border-border rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${card.color}`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-2xl font-bold">{card.value}</p>
                                        <p className="text-xs text-muted-foreground leading-tight">{card.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Frequency breakdown */}
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h3 className="font-semibold mb-4">Frequency Breakdown</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {Object.entries(stats.frequency_breakdown || {}).map(([freq, count]) => (
                                <div key={freq} className="text-center p-4 bg-muted rounded-xl">
                                    <p className="text-2xl font-bold">{count as number}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{freq}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Subscriptions Tab */}
            {tab === 'subscriptions' && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={subSearch}
                            onChange={e => { setSubSearch(e.target.value); setSubPage(1) }}
                            placeholder="Search by user email..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm"
                        />
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium">User</th>
                                        <th className="text-left px-4 py-3 font-medium">Frequency</th>
                                        <th className="text-left px-4 py-3 font-medium">Posts/Cycle</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Delivered</th>
                                        <th className="text-left px-4 py-3 font-medium">Revenue</th>
                                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {subscriptions.map(sub => (
                                        <tr key={sub.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <p className="font-medium">{sub.user?.first_name} {sub.user?.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{sub.user?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 capitalize text-xs">{sub.frequency}</td>
                                            <td className="px-4 py-3 text-xs">{sub.posts_per_cycle}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'active' ? 'bg-green-500/10 text-green-600' :
                                                    sub.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        'bg-red-500/10 text-red-600'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">{sub.total_posts_delivered}</td>
                                            <td className="px-4 py-3 text-xs">{sub.total_credits_spent} credits</td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Subscription</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {sub.status !== 'cancelled' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleCancelSub(sub.id)}
                                                                className="text-red-600 dark:text-red-400"
                                                            >
                                                                <Ban className="w-4 h-4" />
                                                                Cancel Subscription
                                                            </DropdownMenuItem>
                                                        )}
                                                        {sub.status === 'cancelled' && (
                                                            <DropdownMenuItem disabled className="text-muted-foreground">
                                                                <XCircle className="w-4 h-4" />
                                                                Already Cancelled
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {subPagination && subPagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setSubPage(p => Math.max(1, p - 1))} disabled={subPage === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm">{subPage} / {subPagination.last_page}</span>
                            <button onClick={() => setSubPage(p => Math.min(subPagination.last_page, p + 1))} disabled={subPage === subPagination.last_page} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Posts Tab */}
            {tab === 'posts' && (
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={postSearch}
                                onChange={e => { setPostSearch(e.target.value); setPostPage(1) }}
                                placeholder="Search posts..."
                                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm"
                            />
                        </div>
                        <Select value={postStatusFilter || 'all'} onValueChange={v => { setPostStatusFilter(v === 'all' ? '' : v); setPostPage(1) }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="text-left px-4 py-3 font-medium">Post</th>
                                        <th className="text-left px-4 py-3 font-medium">User</th>
                                        <th className="text-left px-4 py-3 font-medium">Platform</th>
                                        <th className="text-left px-4 py-3 font-medium">Status</th>
                                        <th className="text-left px-4 py-3 font-medium">Credits</th>
                                        <th className="text-left px-4 py-3 font-medium">Date</th>
                                        <th className="text-right px-4 py-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {posts.map(post => (
                                        <tr key={post.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-3">
                                                <p className="font-medium truncate max-w-[200px]">{post.title}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                {post.user?.first_name} {post.user?.last_name}
                                            </td>
                                            <td className="px-4 py-3 text-xs">{post.platform?.name || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.status === 'published' ? 'bg-green-500/10 text-green-600' :
                                                    post.status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-600' :
                                                        post.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                                            'bg-gray-500/10 text-gray-500'
                                                    }`}>{post.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs">{post.credits_charged || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {new Date(post.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Post Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleViewPost(post.id)}>
                                                            <Eye className="w-4 h-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-red-600 dark:text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete Post
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {postPagination && postPagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => setPostPage(p => Math.max(1, p - 1))} disabled={postPage === 1} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm">{postPage} / {postPagination.last_page}</span>
                            <button onClick={() => setPostPage(p => Math.min(postPagination.last_page, p + 1))} disabled={postPage === postPagination.last_page} className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Post Detail Modal */}
            {viewingPost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setViewingPost(null)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">{viewingPost.title}</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewingPost.status === 'published' ? 'bg-green-500/10 text-green-600' :
                                    viewingPost.status === 'scheduled' ? 'bg-yellow-500/10 text-yellow-600' :
                                        viewingPost.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                            'bg-gray-500/10 text-gray-500'
                                    }`}>{viewingPost.status}</span>
                                {viewingPost.category && (
                                    <span className="text-xs px-2 py-0.5 bg-muted rounded-full">{viewingPost.category}</span>
                                )}
                            </div>
                            {viewingPost.excerpt && (
                                <p className="text-muted-foreground">{viewingPost.excerpt}</p>
                            )}
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none border-t border-border pt-3 mt-3"
                                dangerouslySetInnerHTML={{ __html: viewingPost.content }}
                            />
                            {viewingPost.error_message && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs">
                                    <strong>Error:</strong> {viewingPost.error_message}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4 pt-4 border-t border-border">
                            <button
                                onClick={() => setViewingPost(null)}
                                className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
