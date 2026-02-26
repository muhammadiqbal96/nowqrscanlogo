import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Loader2, Shield, Circle, Settings, Eye,
  Diamond, Hexagon, Square, Zap, QrCode
} from 'lucide-react'
import { scanLogoApi } from '@/lib/api'
import toast from 'react-hot-toast'

const SHAPE_ICONS: Record<string, any> = {
  shield: Shield,
  circle: Circle,
  gear: Settings,
  eye: Eye,
  diamond: Diamond,
  hexagon: Hexagon,
  square: Square,
}

const ANIMATION_OPTIONS = [
  { value: 'spin', label: 'Spin', desc: 'Continuous rotation' },
  { value: 'pulse', label: 'Pulse', desc: 'Gentle breathing' },
  { value: 'expand', label: 'Expand', desc: 'Scale up on focus' },
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
  const [animation, setAnimation] = useState('spin')
  const [color, setColor] = useState('#c8401a')
  const [ctaText, setCtaText] = useState('TAP TO SCAN')
  const [safeScanBadge, setSafeScanBadge] = useState(true)

  const handleCreate = async () => {
    if (!destinationUrl.trim()) {
      toast.error('Please enter a destination URL')
      return
    }
    // Validate URL
    try {
      new URL(destinationUrl)
    } catch {
      toast.error('Please enter a valid URL (include https://)')
      return
    }

    setLoading(true)
    try {
      const res = await scanLogoApi.create({
        campaign_id: campaignId ? Number(campaignId) : undefined,
        destination_url: destinationUrl,
        shape,
        animation,
        color,
        cta_text: ctaText,
        safe_scan_badge: safeScanBadge,
      })

      toast.success('ScanLogo created! 🎉')
      navigate(`/dashboard/scanlogos/${res.data.scan_logo.id}`)
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
        Choose an animated QR button style and enter where you want people to land when they scan or tap it.
      </p>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Destination URL */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="block text-sm font-semibold mb-1.5">Destination URL *</label>
            <p className="text-xs text-muted-foreground mb-3">Where should people land when they scan your ScanLogo?</p>
            <input
              type="url"
              placeholder="https://your-store.com/products"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              This is dynamic — you can change it anytime from your dashboard without reprinting.
            </p>
          </div>

          {/* Shape */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="block text-sm font-semibold mb-3">Button Shape</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {Object.entries(SHAPE_ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  onClick={() => setShape(key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    shape === key ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'
                  }`}
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
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    animation === opt.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50 hover:border-primary/30'
                  }`}
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
                  className={`w-9 h-9 rounded-lg transition-all border ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  } ${c === '#ffffff' ? 'border-border' : 'border-transparent'}`}
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
                className={`w-11 h-6 rounded-full transition-all ${safeScanBadge ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all ${safeScanBadge ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create ScanLogo <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <p className="text-xs text-muted-foreground mb-3">Live Preview</p>
            <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center">
              {/* Animated ScanLogo Preview */}
              <div
                className={`w-40 h-40 rounded-2xl flex items-center justify-center mb-4 ${
                  animation === 'spin' ? 'animate-spin' :
                  animation === 'pulse' ? 'animate-pulse' :
                  animation === 'bounce' ? 'animate-bounce' :
                  ''
                }`}
                style={{
                  backgroundColor: `${color}15`,
                  border: `3px solid ${color}`,
                  borderRadius: shape === 'circle' ? '50%' : shape === 'hexagon' ? '24px' : shape === 'diamond' ? '16px' : '16px',
                  animationDuration: animation === 'spin' ? '4s' : undefined,
                  transform: shape === 'diamond' ? 'rotate(45deg)' : undefined,
                }}
              >
                <div style={{ transform: shape === 'diamond' ? 'rotate(-45deg)' : undefined }}>
                  <QrCode className="w-16 h-16" style={{ color }} />
                </div>
              </div>

              {/* CTA Text */}
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
                {ctaText}
              </p>

              {/* Short URL preview */}
              <p className="text-[10px] text-muted-foreground">nqr.ai/abc123</p>

              {/* Safe Scan Badge */}
              {safeScanBadge && (
                <div className="mt-4 flex items-center gap-1.5 text-[10px] text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full">
                  <Shield className="w-3 h-3" />
                  Safe Scan Verified
                </div>
              )}

              {/* Download buttons (shown after creation) */}
              <div className="mt-6 w-full space-y-2 opacity-30">
                <p className="text-[10px] text-center text-muted-foreground">Available after creation:</p>
                <div className="grid grid-cols-3 gap-2">
                  {['PNG', 'GIF', 'WebP'].map((fmt) => (
                    <div key={fmt} className="text-center py-2 bg-muted rounded-lg text-[10px] font-medium text-muted-foreground">
                      {fmt}
                    </div>
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
