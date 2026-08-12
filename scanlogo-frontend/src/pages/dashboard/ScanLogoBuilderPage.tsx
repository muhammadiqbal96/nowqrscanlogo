import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Upload, X } from 'lucide-react'
import { scanLogoApi } from '@/lib/api'
import ScanLogoPreview from '@/components/ScanLogoPreview'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

// One branded family — the only thing that changes between actions is the text + color.
type Frame = 'arch' | 'circle' | 'ticket' | 'diamond' | 'pin' | 'vertical' | 'wide' | 'phone' | 'triangle' | 'brackets'

type ActionPreset = {
    value: string
    label: string
    headline: string
    subtitle: string
    wrapperColor: string
    frame: Frame
    placeholder: string
}

const ACTION_PRESETS: ActionPreset[] = [
    { value: 'scan_win', label: 'Scan & Win', headline: 'SCAN & WIN', subtitle: 'Win big today', wrapperColor: '#2563eb', frame: 'arch', placeholder: 'https://your-site.com/win' },
    { value: 'take_a_bite', label: 'Take a Bite', headline: 'TAKE A BITE', subtitle: 'View the menu', wrapperColor: '#ea580c', frame: 'circle', placeholder: 'https://your-menu.com' },
    { value: 'taste_magic', label: 'Taste Magic', headline: 'TASTE MAGIC', subtitle: 'Order now', wrapperColor: '#db2777', frame: 'arch', placeholder: 'https://your-store.com' },
    { value: 'unlock_more', label: 'Unlock More', headline: 'UNLOCK MORE', subtitle: 'Get access', wrapperColor: '#7c3aed', frame: 'ticket', placeholder: 'https://your-site.com/unlock' },
    { value: 'jump_in', label: 'Jump In', headline: 'JUMP IN', subtitle: 'Join the fun', wrapperColor: '#06b6d4', frame: 'circle', placeholder: 'https://your-site.com/join' },
    { value: 'grab_the_deal', label: 'Grab the Deal', headline: 'GRAB THE DEAL', subtitle: 'Up to 35% off', wrapperColor: '#ef4444', frame: 'ticket', placeholder: 'https://your-store.com/deals' },
    { value: 'fuel_up', label: 'Fuel Up', headline: 'FUEL UP', subtitle: 'Start training', wrapperColor: '#16a34a', frame: 'arch', placeholder: 'https://your-gym.com' },
    { value: 'dive_in', label: 'Dive In', headline: 'DIVE IN', subtitle: 'Explore now', wrapperColor: '#0ea5e9', frame: 'circle', placeholder: 'https://your-site.com' },
    { value: 'tap_to_discover', label: 'Tap to Discover', headline: 'TAP TO DISCOVER', subtitle: 'See more', wrapperColor: '#4f46e5', frame: 'ticket', placeholder: 'https://your-site.com/discover' },
    { value: 'claim_your_spot', label: 'Claim Your Spot', headline: 'CLAIM YOUR SPOT', subtitle: 'Reserve now', wrapperColor: '#db2777', frame: 'arch', placeholder: 'https://your-site.com/reserve' },
    { value: 'start_exploring', label: 'Start Exploring', headline: 'START EXPLORING', subtitle: 'Begin here', wrapperColor: '#059669', frame: 'circle', placeholder: 'https://your-site.com/explore' },
    { value: 'catch_the_vibe', label: 'Catch the Vibe', headline: 'CATCH THE VIBE', subtitle: 'Tune in', wrapperColor: '#d97706', frame: 'ticket', placeholder: 'https://your-site.com' },
    { value: 'find_your_fit', label: 'Find Your Fit', headline: 'FIND YOUR FIT', subtitle: 'Shop the look', wrapperColor: '#4f46e5', frame: 'arch', placeholder: 'https://your-store.com' },
    { value: 'get_inspired', label: 'Get Inspired', headline: 'GET INSPIRED', subtitle: 'See the gallery', wrapperColor: '#ec4899', frame: 'circle', placeholder: 'https://your-site.com/gallery' },
    { value: 'make_it_yours', label: 'Make It Yours', headline: 'MAKE IT YOURS', subtitle: 'Customize now', wrapperColor: '#1e293b', frame: 'ticket', placeholder: 'https://your-site.com/customize' },
    { value: 'open_the_door', label: 'Open the Door', headline: 'OPEN THE DOOR', subtitle: 'Step inside', wrapperColor: '#15803d', frame: 'arch', placeholder: 'https://your-site.com' },
    { value: 'reveal_more', label: 'Reveal More', headline: 'REVEAL MORE', subtitle: 'Tap to reveal', wrapperColor: '#dc2626', frame: 'circle', placeholder: 'https://your-site.com' },
    { value: 'spark_your_journey', label: 'Spark Your Journey', headline: 'SPARK YOUR JOURNEY', subtitle: 'Get started', wrapperColor: '#8b5cf6', frame: 'ticket', placeholder: 'https://your-site.com/start' },
    { value: 'price', label: 'Price / Offer', headline: '$34', subtitle: 'MENSUAL', wrapperColor: '#0284c7', frame: 'arch', placeholder: 'https://your-site.com/subscribe' },
    { value: 'custom', label: 'Custom', headline: 'SCAN ME', subtitle: '', wrapperColor: '#0ea5e9', frame: 'arch', placeholder: 'https://your-site.com/action' },
]

const FRAME_OPTIONS: { value: Frame; label: string; desc: string }[] = [
    { value: 'arch', label: 'Arch Badge', desc: 'Headline on top, QR below ($34 style)' },
    { value: 'circle', label: 'Circle + Ribbon', desc: 'Round badge with a ribbon banner' },
    { value: 'ticket', label: 'Ticket + Button', desc: 'QR card with a connected action button' },
    { value: 'diamond', label: 'Diamond', desc: 'Diamond badge with a tag below' },
    { value: 'pin', label: 'Location Pin', desc: 'Map-pin teardrop with QR disc' },
    { value: 'vertical', label: 'Vertical Card', desc: 'Header + QR + footer card' },
    { value: 'wide', label: 'Wide Banner', desc: 'Text left, QR on the right' },
    { value: 'phone', label: 'Phone Mockup', desc: 'QR on a phone screen' },
    { value: 'triangle', label: 'Play Triangle', desc: 'Play-button badge with QR' },
    { value: 'brackets', label: 'Bracket Frame', desc: 'Camera-style corner brackets' },
]

const QR_COLOR_PRESETS = ['#111111', '#1f2937', '#0f766e', '#1d4ed8', '#9f1239', '#7c2d12', '#166534', '#ffffff']
const WRAPPER_COLOR_PRESETS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#db2777', '#0f172a']

export default function ScanLogoBuilderPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const campaignId = searchParams.get('campaign_id')

    const [loading, setLoading] = useState(false)
    const [selectedAction, setSelectedAction] = useState('scan_win')
    const [destinationUrl, setDestinationUrl] = useState('')
    const [frame, setFrame] = useState<Frame>('arch')
    const [qrColor, setQrColor] = useState('#111111')
    const [wrapperColor, setWrapperColor] = useState('#2563eb')
    const [headline, setHeadline] = useState('SCAN & WIN')
    const [subtitle, setSubtitle] = useState('Win big today')
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

    const selectedActionPreset = ACTION_PRESETS.find((preset) => preset.value === selectedAction) || ACTION_PRESETS[ACTION_PRESETS.length - 1]

    const handleActionPreset = (preset: ActionPreset) => {
        setSelectedAction(preset.value)
        setHeadline(preset.headline)
        setSubtitle(preset.subtitle)
        setWrapperColor(preset.wrapperColor)
        setFrame(preset.frame)
    }

    const handleCreate = async () => {
        if (!destinationUrl.trim()) { toast.error('Enter a destination URL'); return }
        try { new URL(destinationUrl) } catch { toast.error('Include https:// in URL'); return }

        setLoading(true)
        try {
            const res = await scanLogoApi.create({
                campaign_id: campaignId ? Number(campaignId) : undefined,
                destination_url: destinationUrl,
                shape: 'square',
                animation: 'none',
                color: qrColor,
                wrapper_color: wrapperColor,
                cta_text: headline.trim() || 'SCAN ME',
                subtitle: subtitle.trim(),
                safe_scan_badge: safeScanBadge,
                banner: frame,
            })

            const newId = res.data.scan_logo.id

            // Upload logo if provided
            if (logoFile) {
                await scanLogoApi.uploadLogo(newId, logoFile).catch(() => { /* non-critical */ })
            }

            toast.success('Action ScanLogo created!')
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

            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Build your Action ScanLogo</h1>
            <p className="text-muted-foreground mb-8 text-sm">
                One branded look, three frames. Pick an action, set the headline + a short line for where it goes, choose your colors — the QR sits inside the wrapper with a transparent background, ready to drop anywhere.
            </p>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Controls */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Action Preset */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Action ScanLogo</label>
                        <p className="text-xs text-muted-foreground mb-3">Pick an action — it sets the headline, sub-line and color. You can fine-tune everything below.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {ACTION_PRESETS.map((preset) => {
                                const active = selectedAction === preset.value
                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        onClick={() => handleActionPreset(preset)}
                                        className={`text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: preset.wrapperColor }} />
                                            <span className="text-xs font-semibold">{preset.label}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Frame Selector */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Frame Style</label>
                        <p className="text-xs text-muted-foreground mb-3">All three share the same brand look — only the silhouette changes.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {FRAME_OPTIONS.map((opt) => {
                                const active = frame === opt.value
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFrame(opt.value)}
                                        className={`text-left p-3 rounded-xl border-2 transition-all ${active ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'}`}
                                    >
                                        <span className="text-xs font-semibold block mb-0.5">{opt.label}</span>
                                        <p className="text-[10px] text-muted-foreground leading-snug">{opt.desc}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Destination URL */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Destination URL *</label>
                        <p className="text-xs text-muted-foreground mb-3">Where should this action send people?</p>
                        <input
                            type="url"
                            placeholder={selectedActionPreset.placeholder}
                            value={destinationUrl}
                            onChange={(e) => setDestinationUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        />
                        <p className="text-[11px] text-muted-foreground mt-2">The QR and tap target use this tracked destination after creation.</p>
                    </div>

                    {/* Headline + Subtitle */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1.5">Text Box</label>
                        <p className="text-xs text-muted-foreground mb-3">The headline can be an action word (SCAN &amp; WIN) or a price ($34). The sub-line describes where it goes (MENSUAL, View the menu…).</p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium mb-1.5">Headline</p>
                                <input
                                    type="text"
                                    placeholder="SCAN & WIN  or  $34"
                                    value={headline}
                                    maxLength={50}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>
                            <div>
                                <p className="text-xs font-medium mb-1.5">Sub-line (optional)</p>
                                <input
                                    type="text"
                                    placeholder="Win big today  or  MENSUAL"
                                    value={subtitle}
                                    maxLength={60}
                                    onChange={(e) => setSubtitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>
                        </div>
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

                    {/* Colors */}
                    <div className="bg-card border border-border rounded-2xl p-5">
                        <label className="block text-sm font-semibold mb-1">Color Controls</label>
                        <p className="text-[11px] text-muted-foreground mb-4">Set the QR color separately from the wrapper brand color.</p>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium mb-2">QR Color</p>
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
                                        title="Pick QR color"
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-medium mb-2">Wrapper Brand Color</p>
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
                                        title="Pick wrapper brand color"
                                    />
                                </div>
                            </div>
                        </div>
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
                        <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center min-h-[360px]">
                             <ScanLogoPreview
                                url={destinationUrl || 'https://nowqr.com'}
                                color={qrColor}
                                wrapperColor={wrapperColor}
                                ctaText={headline}
                                subtitle={subtitle}
                                safeScanBadge={safeScanBadge}
                                centerLogoUrl={logoPreviewUrl}
                                shortUrl="nqr.ai/xxxxxx"
                                size={180}
                                bannerTemplate={frame}
                                fitToSize
                            />
                        </div>

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
    )
}
