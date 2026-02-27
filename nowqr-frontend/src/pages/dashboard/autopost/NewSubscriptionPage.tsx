import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Zap } from 'lucide-react'
import { autoPostSubApi, platformApi } from '@/lib/api'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function NewSubscriptionPage() {
    const navigate = useNavigate()
    const [pricing, setPricing] = useState<any>(null)
    const [platforms, setPlatforms] = useState<any[]>([])
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({
        frequency: 'weekly',
        posts_per_cycle: 1,
        niche: '',
        tone: 'professional',
        keywords: '',
        custom_instructions: '',
    })

    useEffect(() => {
        Promise.all([
            autoPostSubApi.pricing(),
            platformApi.list(),
        ]).then(([pricingRes, platRes]) => {
            setPricing(pricingRes.data.pricing)
            setPlatforms(platRes.data.platforms)
        }).catch(() => {
            toast.error('Failed to load data')
        }).finally(() => setLoading(false))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await autoPostSubApi.create({
                frequency: form.frequency,
                posts_per_cycle: form.posts_per_cycle,
                niche: form.niche || undefined,
                tone: form.tone || undefined,
                keywords: form.keywords ? form.keywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
                custom_instructions: form.custom_instructions || undefined,
            })
            toast.success('Subscription created!')
            navigate('/dashboard/autopost/subscriptions')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create subscription')
        } finally {
            setSaving(false)
        }
    }

    const plan = pricing?.[form.frequency]
    const estimatedCredits = form.posts_per_cycle * (plan?.credits_per_post ?? 2)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link to="/dashboard/autopost/subscriptions" className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">New Auto-Post Subscription</h1>
                    <p className="text-muted-foreground text-sm">Set up automatic content posting</p>
                </div>
            </div>

            {platforms.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Tip:</strong> Connect a platform first to publish posts directly to your website.{' '}
                    <Link to="/dashboard/autopost/platforms" className="underline font-medium">Connect now →</Link>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
                {/* Frequency */}
                <div>
                    <label className="block text-sm font-medium mb-2">Posting Frequency</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['daily', 'weekly', 'monthly'].map((freq) => (
                            <button
                                key={freq}
                                type="button"
                                onClick={() => setForm(f => ({ ...f, frequency: freq }))}
                                className={`p-3 rounded-xl border text-center text-sm font-medium transition-all ${form.frequency === freq
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-muted'
                                    }`}
                            >
                                <span className="block capitalize font-semibold">{freq}</span>
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                    {pricing?.[freq]?.credits_per_post ?? 2} credits/post
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Posts per cycle */}
                <div>
                    <label className="block text-sm font-medium mb-1">Posts Per Cycle</label>
                    <input
                        type="number"
                        min={1}
                        max={10}
                        value={form.posts_per_cycle}
                        onChange={e => setForm(f => ({ ...f, posts_per_cycle: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                        Estimated cost: <span className="font-medium text-primary">{estimatedCredits} credits</span> per {form.frequency === 'daily' ? 'day' : form.frequency === 'weekly' ? 'week' : 'month'}
                    </p>
                </div>

                {/* Niche */}
                <div>
                    <label className="block text-sm font-medium mb-1">Niche / Topic Focus</label>
                    <input
                        type="text"
                        value={form.niche}
                        onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                        placeholder="e.g., Digital Marketing, Health & Fitness, Ecommerce"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                </div>

                {/* Tone */}
                <div>
                    <label className="block text-sm font-medium mb-1">Writing Tone</label>
                    <Select value={form.tone} onValueChange={v => setForm(f => ({ ...f, tone: v }))}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="authoritative">Authoritative</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                            <SelectItem value="inspirational">Inspirational</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Keywords */}
                <div>
                    <label className="block text-sm font-medium mb-1">SEO Keywords</label>
                    <input
                        type="text"
                        value={form.keywords}
                        onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                        placeholder="keyword1, keyword2, keyword3"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords for SEO optimization</p>
                </div>

                {/* Custom Instructions */}
                <div>
                    <label className="block text-sm font-medium mb-1">Custom Instructions (Optional)</label>
                    <textarea
                        value={form.custom_instructions}
                        onChange={e => setForm(f => ({ ...f, custom_instructions: e.target.value }))}
                        placeholder="Any specific instructions for content generation..."
                        rows={3}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none"
                    />
                </div>

                {/* Cost summary */}
                <div className="bg-muted rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cost per cycle</span>
                        <span className="text-lg font-bold text-primary flex items-center gap-1">
                            <Zap className="w-4 h-4" /> {estimatedCredits} credits
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {form.posts_per_cycle} post(s) × {plan?.credits_per_post ?? 2} credits each, billed {form.frequency}
                    </p>
                </div>

                <div className="flex justify-end gap-2">
                    <Link to="/dashboard/autopost/subscriptions" className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Subscription
                    </button>
                </div>
            </form>
        </div>
    )
}
