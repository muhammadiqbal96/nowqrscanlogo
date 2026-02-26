import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, ArrowRight, Loader2, Shield, Circle, Settings, Eye,
    Diamond, Hexagon, Square, Upload, X
} from 'lucide-react'
import { scanLogoApi } from '@/lib/api'
import ScanLogoPreview from '@/components/ScanLogoPreview'
import toast from 'react-hot-toast'

const SHAPE_ICONS: Record<string, any> = {
    shield: Shield, circle: Circle, gear: Settings,
    eye: Eye, diamond: Diamond, hexagon: Hexagon, square: Square,
}

const ANIMATION_OPTIONS = [
    { value: 'spin', label: 'Spin', desc: 'Continuous rotation' },
    { value: 'pulse', label: 'Pulse', desc: 'Gentle breathing' },
    { value: 'expand', label: 'Expand', desc: 'Scale up effect' },
    { value: 'bounce', label: 'Bounce', desc: 'Playful bounce' },
    { value: 'glow', label: 'Glow', desc: 'Ambient glow' },
    { value: 'none', label: 'None', desc: 'Static display' },
]

const COLOR_PRESETS = ['#c8401a', '#1a6bc8', '#1a8c4e', '#8b5cf6', '#d97706', '#dc2626', '#0891b2', '#1e293b', '#ffffff']

export default function ScanLogoBuilderPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const campaignId = searchParams.get('campaign_id')

    const [loading, setLoading] = useState(false)
    const [destinationUrl, setDestinationUrl] = useState('')
    const [shape, setShape] = useState('shield')
    const [animation, setAnimation] = useState('pulse')
    const [color, setColor] = useState('#c8401a')
    const [ctaText, setCtaText] = useState('TAP TO SCAN')
    const [safeScanBadge, setSafeScanBadge] = useState(true)

    // Logo upload
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Logo must be under 2 MB')
            return
        }
        setLogoFile(file)
        setLogoPreviewUrl(URL.createObjectURL(file))
    }

    const removeLogo = () => {
        setLogoFile(null)
        setLogoPreviewUrl(null)
    }

    const handleCreate = async () => {
        if (!destinationUrl.trim()) { toast.error('Enter a destination URL'); return }
        try { new URL(destinationUrl) } catch { toast.error('Include https:// in URL'); return }

        setLoading(true)
        try {
            const res = await scanLogoApi.create({
                campaign_id: campaignId ? Number(campaignId) : undefined,
                destination_url: destinationUrl,
                shape, animation, color,
                cta_text: ctaText,
                safe_scan_badge: safeScanBadge,
            })

            const newId = res.data.scan_logo.id

            // Upload logo if provided
            if (logoFile) {
                await scanLogoApi.uploadLogo(newId, logoFile).catch(() => { /* non-critical */ })
            }

            toast.success('ScanLogo created!')
            navigate(`/dashboard/scanlogos/${newId}`)
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create ScanLogo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Build your ScanLogo</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                Choose an animated QR style and enter where people land when they scan or tap it.
            </p>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Controls */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Destination URL */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Destination URL *</label>
                        <p className="text-xs text-muted-foreground mb-3">Where should people land?</p>
                        <input
                            type="url"
                            placeholder="https://your-store.com/products"
                            value={destinationUrl}
                            onChange={(e) => setDestinationUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                        <p className="text-[11px] text-muted-foreground mt-2">Dynamic — change anytime without reprinting.</p>
                    </div>

                    {/* Business Logo */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Center Logo (optional)</label>
                        <p className="text-xs text-muted-foreground mb-3">Your business logo appears in the center of the QR code.</p>
                        {logoPreviewUrl ? (
                            <div className="flex items-center gap-3">
                                <img src={logoPreviewUrl} alt="Logo" className="w-14 h-14 rounded-lg object-cover border border-border" />
                                <div>
                                    <p className="text-sm font-medium">{logoFile?.name}</p>
                                    <button onClick={removeLogo} className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-1">
                                        <X className="w-3 h-3" /> Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/30 transition-all">
                                <Upload className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload logo (PNG, JPG — max 2MB)</span>
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            </label>
                        )}
                    </div>

                    {/* Shape */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-3">Button Shape</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {Object.entries(SHAPE_ICONS).map(([key, Icon]) => (
                                <button
                                    key={key}
                                    onClick={() => setShape(key)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${shape === key ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] capitalize">{key}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Animation */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-3">Animation Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ANIMATION_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setAnimation(opt.value)}
                                    className={`text-left p-3 rounded-xl border-2 transition-all ${animation === opt.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'}`}
                                >
                                    <p className="text-sm font-medium">{opt.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-3">Button Color</label>
                        <div className="flex items-center gap-2 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-9 h-9 rounded-lg transition-all border ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'} ${c === '#ffffff' ? 'border-border' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-border" />
                        </div>
                    </div>

                    {/* CTA Text */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Button Text</label>
                        <input
                            type="text"
                            placeholder="TAP TO SCAN"
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                    </div>

                    {/* Safe Scan Badge */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold">Safe Scan Badge</p>
                                <p className="text-xs text-muted-foreground">Show a trust shield beneath the QR code</p>
                            </div>
                            <button
                                onClick={() => setSafeScanBadge(!safeScanBadge)}
                                className={`w-11 h-6 rounded-full transition-all relative ${safeScanBadge ? 'bg-primary' : 'bg-muted'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${safeScanBadge ? 'left-[22px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create ScanLogo (3 credits) <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </div>

                {/* Live Preview */}
                <div className="lg:col-span-2">
                    <div className="sticky top-4">
                        <p className="text-xs text-muted-foreground mb-3">Live Preview</p>
                        <div className="bg-card border border-border rounded-2xl p-8">
                            <ScanLogoPreview
                                url={destinationUrl || 'https://nowqr.com'}
                                shape={shape}
                                animation={animation}
                                color={color}
                                ctaText={ctaText}
                                safeScanBadge={safeScanBadge}
                                centerLogoUrl={logoPreviewUrl}
                                shortUrl="nqr.ai/xxxxxx"
                                size={160}
                            />

                            {/* Download preview */}
                            <div className="mt-6 w-full space-y-2 opacity-30">
                                <p className="text-[10px] text-center text-muted-foreground">Available after creation:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PNG', 'GIF', 'WebP'].map((fmt) => (
                                        <div key={fmt} className="text-center py-2 bg-muted rounded-lg text-[10px] font-medium text-muted-foreground">{fmt}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
