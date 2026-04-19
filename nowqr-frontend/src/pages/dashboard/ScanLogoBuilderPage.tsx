import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ArrowLeft, ArrowRight, Loader2, Shield, Circle, Settings, Eye,
    Diamond, Hexagon, Square, Upload, X, Disc3, Monitor
} from 'lucide-react'
import { scanLogoApi } from '@/lib/api'
import ScanLogoPreview from '@/components/ScanLogoPreview'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

const SHAPE_ICONS: Record<string, any> = {
    shield: Shield, circle: Circle, gear: Settings,
    eye: Eye, diamond: Diamond, hexagon: Hexagon, square: Square, drum: Disc3,
    tv: Monitor,
}

const SHAPE_LABELS: Record<string, string> = {
    shield: 'Shield',
    circle: 'Badge',
    gear: 'Gear',
    eye: 'Eye',
    diamond: 'Diamond',
    hexagon: 'Hex',
    square: 'Square',
    drum: 'Drum',
    tv: 'TV',
}

const ANIMATION_OPTIONS = [
    { value: 'spin', label: 'Ring Spin', desc: 'Revolving text around wrapper' },
    { value: 'orbit', label: 'Dual Orbit', desc: 'Outer text ring moves forward, inner ring moves backward' },
    { value: 'pulse', label: 'Bubble Pulse', desc: 'Soft bubbles and top text pulse' },
    { value: 'expand', label: 'Pop Callout', desc: 'Text bubble expands above wrapper' },
    { value: 'bounce', label: 'Bubble Bounce', desc: 'Bubble bursts around wrapper' },
    { value: 'glow', label: 'Neon Glow', desc: 'Glowing wrapper rim (QR stays still)' },
    { value: 'flash', label: 'Attention Burst', desc: 'Ribbon + callout flashing burst' },
    { value: 'none', label: 'No Motion', desc: 'Static wrapper and static QR' },
]

const QR_COLOR_PRESETS = ['#111111', '#1f2937', '#0f766e', '#1d4ed8', '#9f1239', '#7c2d12', '#166534', '#ffffff']
const WRAPPER_COLOR_PRESETS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0f172a', '#ffffff']

export default function ScanLogoBuilderPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const campaignId = searchParams.get('campaign_id')

    const [loading, setLoading] = useState(false)
    const [destinationUrl, setDestinationUrl] = useState('')
    const [shape, setShape] = useState('shield')
    const [animation, setAnimation] = useState('orbit')
    const [qrColor, setQrColor] = useState('#111111')
    const [wrapperColor, setWrapperColor] = useState('#0ea5e9')
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
                shape,
                animation,
                color: qrColor,
                wrapper_color: wrapperColor,
                cta_text: ctaText.trim() || 'TAP TO SCAN',
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
                Build a branded QR wrapper: choose shape, color, and wrapper motion while the QR itself stays still for reliable scanning.
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
                        <label className="block text-sm font-semibold mb-3">Wrapper Shape</label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {Object.entries(SHAPE_ICONS).map(([key, Icon]) => (
                                <button
                                    key={key}
                                    onClick={() => setShape(key)}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${shape === key ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-[10px] capitalize">{SHAPE_LABELS[key] || key}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Animation */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1">Wrapper Motion</label>
                        <p className="text-[11px] text-muted-foreground mb-3">Motion applies only to the wrapper. QR code and shape stay static.</p>
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

                    {/* Colors */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1">Color Controls</label>
                        <p className="text-[11px] text-muted-foreground mb-4">Set QR and shape color separately from wrapper background color.</p>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium mb-2">QR + Shape Color</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {QR_COLOR_PRESETS.map((c) => (
                                        <button
                                            key={`qr-${c}`}
                                            onClick={() => setQrColor(c)}
                                            className={`w-9 h-9 rounded-lg transition-all border ${qrColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'} ${c === '#ffffff' ? 'border-border' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={qrColor}
                                        onChange={(e) => setQrColor(e.target.value)}
                                        className="w-9 h-9 rounded-lg cursor-pointer border border-border"
                                        title="Pick QR and shape color"
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium mb-2">Wrapper Background Color</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {WRAPPER_COLOR_PRESETS.map((c) => (
                                        <button
                                            key={`wrapper-${c}`}
                                            onClick={() => setWrapperColor(c)}
                                            className={`w-9 h-9 rounded-lg transition-all border ${wrapperColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'} ${c === '#ffffff' ? 'border-border' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={wrapperColor}
                                        onChange={(e) => setWrapperColor(e.target.value)}
                                        className="w-9 h-9 rounded-lg cursor-pointer border border-border"
                                        title="Pick wrapper background color"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Text */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Wrapper Text</label>
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
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${safeScanBadge ? 'left-5.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{user?.is_admin ? 'Create ScanLogo (Admin free)' : 'Create ScanLogo (3 credits)'} <ArrowRight className="w-4 h-4" /></>}
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
                                color={qrColor}
                                wrapperColor={wrapperColor}
                                ctaText={ctaText}
                                safeScanBadge={safeScanBadge}
                                centerLogoUrl={logoPreviewUrl}
                                shortUrl="nqr.ai/xxxxxx"
                                size={180}
                            />

                            {/* Download preview */}
                            <div className="mt-6 w-full space-y-2 opacity-30">
                                <p className="text-[10px] text-center text-muted-foreground">Available after creation:</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['PNG', 'JPG', 'GIF'].map((fmt) => (
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
