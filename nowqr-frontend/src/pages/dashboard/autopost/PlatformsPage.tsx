import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Globe, Plus, Trash2, RefreshCw, CheckCircle, XCircle,
    Loader2, ExternalLink
} from 'lucide-react'
import { platformApi } from '@/lib/api'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function PlatformsPage() {
    const [platforms, setPlatforms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [testingId, setTestingId] = useState<number | null>(null)
    const [form, setForm] = useState({
        name: '',
        type: 'wordpress',
        site_url: '',
        api_key: '',
        api_secret: '',
        username: '',
    })

    useEffect(() => { loadPlatforms() }, [])

    const loadPlatforms = async () => {
        try {
            const res = await platformApi.list()
            setPlatforms(res.data.platforms)
        } catch {
            toast.error('Failed to load platforms')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await platformApi.create(form)
            toast.success('Platform connected!')
            setShowForm(false)
            setForm({ name: '', type: 'wordpress', site_url: '', api_key: '', api_secret: '', username: '' })
            loadPlatforms()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to connect platform')
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async (id: number) => {
        setTestingId(id)
        try {
            const res = await platformApi.testConnection(id)
            if (res.data.success) {
                toast.success('Connection successful!')
            } else {
                toast.error(res.data.message || 'Connection failed')
            }
            loadPlatforms()
        } catch {
            toast.error('Connection test failed')
        } finally {
            setTestingId(null)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this platform connection?')) return
        try {
            await platformApi.delete(id)
            toast.success('Platform removed')
            loadPlatforms()
        } catch {
            toast.error('Failed to remove platform')
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
                    <h1 className="text-2xl font-bold">Connected Platforms</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Connect your WordPress, Shopify, or custom websites
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        to="/dashboard/autopost"
                        className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Back
                    </Link>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Platform
                    </button>
                </div>
            </div>

            {/* Add form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold">Connect New Platform</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="My WordPress Blog"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Platform Type</label>
                            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wordpress">WordPress</SelectItem>
                                    <SelectItem value="shopify">Shopify</SelectItem>
                                    <SelectItem value="custom">Custom / Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Site URL</label>
                            <input
                                type="url"
                                value={form.site_url}
                                onChange={e => setForm(f => ({ ...f, site_url: e.target.value }))}
                                placeholder="https://myblog.com"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                required
                            />
                        </div>
                        {form.type === 'wordpress' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                    placeholder="admin"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {form.type === 'wordpress' ? 'Application Password' : form.type === 'shopify' ? 'Access Token' : 'API Key'}
                            </label>
                            <input
                                type="password"
                                value={form.api_key}
                                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Connect
                        </button>
                    </div>
                </form>
            )}

            {/* Platform List */}
            {platforms.length === 0 && !showForm ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                    <Globe className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-1">No platforms connected</h3>
                    <p className="text-sm text-muted-foreground mb-4">Connect your WordPress or Shopify site to start auto-posting</p>
                    <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Platform
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {platforms.map((p) => (
                        <div key={p.id} className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-lg ${p.type === 'wordpress' ? 'bg-blue-500/10 text-blue-500' : p.type === 'shopify' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                        <Globe className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{p.name}</h3>
                                        <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === 'active' ? 'bg-green-500/10 text-green-600' :
                                    p.status === 'error' ? 'bg-red-500/10 text-red-600' :
                                        'bg-gray-500/10 text-gray-500'
                                    }`}>
                                    {p.status === 'active' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                                    {p.status === 'error' && <XCircle className="w-3 h-3 inline mr-1" />}
                                    {p.status}
                                </span>
                            </div>

                            <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mb-3">
                                {p.site_url} <ExternalLink className="w-3 h-3" />
                            </a>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                <span>{p.auto_posts_count ?? 0} posts</span>
                                {p.last_synced_at && <span>Last synced: {new Date(p.last_synced_at).toLocaleDateString()}</span>}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTest(p.id)}
                                    disabled={testingId === p.id}
                                    className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    {testingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                    Test
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="px-3 py-2 border border-red-200 dark:border-red-900 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Help section */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-5">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">How to connect your site</h3>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <p><strong>WordPress:</strong> Go to Users → Profile → Application Passwords. Create a new password and use it as the API key along with your username.</p>
                    <p><strong>Shopify:</strong> Go to Settings → Apps → Develop apps. Create an app with Blog write access and use the Access Token.</p>
                    <p><strong>Custom:</strong> Provide your website URL. We'll post content that you can fetch via our API.</p>
                </div>
            </div>
        </div>
    )
}
