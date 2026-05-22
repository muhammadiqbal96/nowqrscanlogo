import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Send, Clock, CheckCircle, XCircle,
    Trash2, ChevronLeft, ChevronRight,
    ExternalLink, Loader2, Plus
} from 'lucide-react'
import { autoPostApi, autoPostSubApi, platformApi } from '@/lib/api'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function PostsPage() {
    const [posts, setPosts] = useState<any[]>([])
    const [pagination, setPagination] = useState<any>(null)
    const [subscriptions, setSubscriptions] = useState<any[]>([])
    const [platforms, setPlatforms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [statusFilter, setStatusFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [saving, setSaving] = useState(false)
    const [publishingId, setPublishingId] = useState<number | null>(null)

    const [form, setForm] = useState({
        subscription_id: '',
        platform_id: '',
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        status: 'draft',
    })

    useEffect(() => {
        Promise.all([
            autoPostSubApi.list(),
            platformApi.list(),
        ]).then(([subsRes, platRes]) => {
            setSubscriptions(subsRes.data.subscriptions)
            setPlatforms(platRes.data.platforms)
        }).catch(() => { })
    }, [])

    useEffect(() => { loadPosts() }, [page, statusFilter])

    const loadPosts = async () => {
        try {
            const res = await autoPostApi.list(page, statusFilter || undefined)
            setPosts(res.data.data)
            setPagination(res.data)
        } catch {
            toast.error('Failed to load posts')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.subscription_id) {
            toast.error('Select a subscription')
            return
        }
        setSaving(true)
        try {
            await autoPostApi.create({
                subscription_id: Number(form.subscription_id),
                platform_id: form.platform_id && form.platform_id !== 'none' ? Number(form.platform_id) : undefined,
                title: form.title,
                excerpt: form.excerpt || undefined,
                content: form.content,
                category: form.category || undefined,
                tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
                status: form.status,
            })
            toast.success('Post created!')
            setShowCreate(false)
            setForm({ subscription_id: '', platform_id: '', title: '', excerpt: '', content: '', category: '', tags: '', status: 'draft' })
            loadPosts()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create post')
        } finally {
            setSaving(false)
        }
    }

    const handlePublish = async (id: number) => {
        setPublishingId(id)
        try {
            const res = await autoPostApi.publish(id)
            toast.success(res.data.message || 'Published!')
            loadPosts()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to publish')
        } finally {
            setPublishingId(null)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this post?')) return
        try {
            await autoPostApi.delete(id)
            toast.success('Post deleted')
            loadPosts()
        } catch {
            toast.error('Failed to delete')
        }
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'scheduled': return <Clock className="w-4 h-4 text-yellow-500" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
            default: return <Send className="w-4 h-4 text-gray-400" />
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
                    <h1 className="text-2xl font-bold">Posts</h1>
                    <p className="text-muted-foreground text-sm mt-1">All your auto-generated and manual posts</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/dashboard/autopost" className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Back</Link>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Post
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showCreate && (
                <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold">Create Post</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Subscription *</label>
                            <Select value={form.subscription_id} onValueChange={v => setForm(f => ({ ...f, subscription_id: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {subscriptions.filter(s => s.status !== 'cancelled').map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.frequency} — {s.niche || 'No niche'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Platform (optional)</label>
                            <Select value={form.platform_id} onValueChange={v => setForm(f => ({ ...f, platform_id: v }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None (draft only)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None (draft only)</SelectItem>
                                    {platforms.filter(p => p.status === 'active').map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.type})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Title *</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Excerpt</label>
                            <input
                                type="text"
                                value={form.excerpt}
                                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Content *</label>
                            <textarea
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                rows={6}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={form.tags}
                                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Status</label>
                            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'draft', 'scheduled', 'published', 'failed'].map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatusFilter(s); setPage(1) }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Posts Table */}
            {posts.length === 0 ? (
                <div className="text-center py-16 bg-card border border-border rounded-xl">
                    <Send className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">No posts found</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left px-4 py-3 font-medium">Post</th>
                                    <th className="text-left px-4 py-3 font-medium">Platform</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 font-medium">Credits</th>
                                    <th className="text-left px-4 py-3 font-medium">Date</th>
                                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <p className="font-medium truncate max-w-[250px]">{post.title}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{post.subscription?.frequency}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs">{post.platform?.name || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-1">
                                                {statusIcon(post.status)}
                                                <span className="text-xs capitalize">{post.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{post.credits_charged || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {post.external_post_url && (
                                                    <a href={post.external_post_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted" title="View">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                {['draft', 'scheduled', 'failed'].includes(post.status) && (
                                                    <button
                                                        onClick={() => handlePublish(post.id)}
                                                        disabled={publishingId === post.id}
                                                        className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                                                        title="Publish now"
                                                    >
                                                        {publishingId === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                                {post.status !== 'published' && (
                                                    <button
                                                        onClick={() => handleDelete(post.id)}
                                                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm">{page} / {pagination.last_page}</span>
                    <button
                        onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                        disabled={page === pagination.last_page}
                        className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
