import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ExternalLink, QrCode, Shield, Loader2, Copy,
  Edit3, Save, Download, BarChart3
} from 'lucide-react'
import { scanLogoApi, analyticsApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ScanLogoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scanLogo, setScanLogo] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [destinationUrl, setDestinationUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [logoRes, analyticsRes] = await Promise.all([
        scanLogoApi.get(Number(id)),
        analyticsApi.scanLogo(Number(id)).catch(() => ({ data: null })),
      ])
      setScanLogo(logoRes.data.scan_logo || logoRes.data)
      setDestinationUrl(logoRes.data.scan_logo?.destination_url || logoRes.data.destination_url || '')
      if (analyticsRes.data) setAnalytics(analyticsRes.data)
    } catch {
      toast.error('Failed to load ScanLogo')
      navigate('/dashboard/scanlogos')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUrl = async () => {
    setSaving(true)
    try {
      await scanLogoApi.update(Number(id), { destination_url: destinationUrl })
      await loadData()
      setEditing(false)
      toast.success('Destination URL updated (1 credit)')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const copyShortUrl = () => {
    navigator.clipboard.writeText(scanLogo?.short_url || '')
    toast.success('Short URL copied!')
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (!scanLogo) return null

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/dashboard/scanlogos')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to ScanLogos
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-4">{scanLogo.cta_text || 'ScanLogo'}</h1>

            <div className="space-y-4">
              {/* Destination URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium">Destination URL</label>
                  <button onClick={() => setEditing(!editing)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Edit3 className="w-3 h-3" /> {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={handleSaveUrl} disabled={saving} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <a href={scanLogo.destination_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 truncate">
                    {scanLogo.destination_url} <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Dynamic — change anytime, QR stays the same (1 credit)</p>
              </div>

              {/* Short URL */}
              <div>
                <label className="text-sm font-medium block mb-1.5">Short URL</label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-3 py-2 rounded-lg flex-1">{scanLogo.short_url}</code>
                  <button onClick={copyShortUrl} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Properties */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Shape</p>
                  <p className="text-sm font-medium capitalize">{scanLogo.shape}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Animation</p>
                  <p className="text-sm font-medium capitalize">{scanLogo.animation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className={`text-sm font-medium ${scanLogo.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {scanLogo.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dynamic</p>
                  <p className="text-sm font-medium">{scanLogo.is_dynamic ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Analytics */}
          {analytics && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" /> Scan Analytics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold">{analytics.total_scans ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold">{analytics.scans_today ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-xl">
                  <p className="text-2xl font-bold">{analytics.unique_locations ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Locations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview + Downloads */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center">
            <p className="text-xs text-muted-foreground mb-4">Preview</p>
            <div
              className={`w-32 h-32 flex items-center justify-center mb-3 ${
                scanLogo.animation === 'spin' ? 'animate-spin' :
                scanLogo.animation === 'pulse' ? 'animate-pulse' :
                scanLogo.animation === 'bounce' ? 'animate-bounce' : ''
              }`}
              style={{
                backgroundColor: `${scanLogo.color}15`,
                border: `3px solid ${scanLogo.color}`,
                borderRadius: scanLogo.shape === 'circle' ? '50%' : '16px',
                animationDuration: scanLogo.animation === 'spin' ? '4s' : undefined,
              }}
            >
              <QrCode className="w-14 h-14" style={{ color: scanLogo.color }} />
            </div>

            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: scanLogo.color }}>
              {scanLogo.cta_text}
            </p>
            <p className="text-[10px] text-muted-foreground mb-3">{scanLogo.short_url}</p>

            {scanLogo.safe_scan_badge && (
              <div className="flex items-center gap-1.5 text-[10px] text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full mb-4">
                <Shield className="w-3 h-3" /> Safe Scan Verified
              </div>
            )}

            {/* Download buttons */}
            <div className="w-full space-y-2 mt-2">
              <p className="text-xs text-muted-foreground text-center">Download</p>
              <div className="grid grid-cols-3 gap-2">
                {['PNG', 'GIF', 'WebP'].map((fmt) => (
                  <button key={fmt} className="flex items-center justify-center gap-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors">
                    <Download className="w-3 h-3" /> {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
