import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, ExternalLink, Loader2, Copy,
    Edit3, Save, Download, BarChart3, Upload
} from 'lucide-react'
import { scanLogoApi, analyticsApi } from '@/lib/api'
import ScanLogoPreview, { type ScanLogoPreviewRef } from '@/components/ScanLogoPreview'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

type Frame = 'arch' | 'circle' | 'ticket' | 'diamond' | 'pin' | 'vertical' | 'wide' | 'phone' | 'triangle' | 'brackets'

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

const FRAME_VALUES: Frame[] = ['arch', 'circle', 'ticket', 'diamond', 'pin', 'vertical', 'wide', 'phone', 'triangle', 'brackets']
const resolveFrame = (banner?: string): Frame =>
    (FRAME_VALUES.includes((banner || '').toLowerCase() as Frame) ? ((banner || '').toLowerCase() as Frame) : 'arch')

const WRAPPER_COLOR_PRESETS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#db2777', '#0f172a']

export default function ScanLogoDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const qrPreviewRef = useRef<ScanLogoPreviewRef>(null)
    const [scanLogo, setScanLogo] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [destinationUrl, setDestinationUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'jpg' | 'gif' | null>(null)

    // Logo upload for center
    const [uploadingLogo, setUploadingLogo] = useState(false)

    // Design (live-bound to the preview, persisted with Save)
    const [frame, setFrame] = useState<Frame>('arch')
    const [headline, setHeadline] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [wrapperColor, setWrapperColor] = useState('#2563eb')
    const [savingDesign, setSavingDesign] = useState(false)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const [logoRes, analyticsRes] = await Promise.all([
                scanLogoApi.get(Number(id)),
                analyticsApi.scanLogo(Number(id)).catch(() => ({ data: null })),
            ])
            const logo = logoRes.data.scan_logo || logoRes.data
            setScanLogo(logo)
            setDestinationUrl(logo.destination_url || '')
            setFrame(resolveFrame(logo.banner))
            setHeadline(logo.cta_text || 'SCAN ME')
            setSubtitle(logo.subtitle || '')
            setWrapperColor(logo.wrapper_color || logo.color || '#2563eb')
            if (analyticsRes.data) setAnalytics(analyticsRes.data)
        } catch {
            toast.error('Failed to load ScanLogo')
            navigate('/dashboard/scanlogos')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveDesign = async () => {
        setSavingDesign(true)
        try {
            await scanLogoApi.update(Number(id), {
                banner: frame,
                cta_text: headline.trim() || 'SCAN ME',
                subtitle: subtitle.trim(),
                wrapper_color: wrapperColor,
            })
            toast.success('Design saved!')
            await loadData()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save design')
        } finally {
            setSavingDesign(false)
        }
    }

    const handleSaveUrl = async () => {
        setSaving(true)
        try {
            await scanLogoApi.update(Number(id), { destination_url: destinationUrl })
            await loadData()
            setEditing(false)
            toast.success(user?.is_admin ? 'Destination URL updated (Admin free)' : 'Destination URL updated (1 credit)')
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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2 MB'); return }
        setUploadingLogo(true)
        try {
            await scanLogoApi.uploadLogo(Number(id), file)
            toast.success('Logo updated!')
            await loadData()
        } catch {
            toast.error('Failed to upload logo')
        } finally {
            setUploadingLogo(false)
        }
    }

    const handleDownload = async (format: 'png' | 'jpg' | 'gif') => {
        if (!qrPreviewRef.current || downloadingFormat) return

        setDownloadingFormat(format)

        try {
            if (format === 'png') {
                await qrPreviewRef.current.downloadPNG()
                return
            }

            if (format === 'jpg') {
                await qrPreviewRef.current.downloadJPG()
                return
            }

            await qrPreviewRef.current.downloadGIF()
        } catch {
            toast.error(`Failed to download ${format.toUpperCase()}`)
        } finally {
            setDownloadingFormat(null)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!scanLogo) return null

    const designDirty = frame !== resolveFrame(scanLogo.banner)
        || headline.trim() !== (scanLogo.cta_text || 'SCAN ME').trim()
        || subtitle.trim() !== (scanLogo.subtitle || '').trim()
        || wrapperColor !== (scanLogo.wrapper_color || scanLogo.color || '#2563eb')

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
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {user?.is_admin
                                        ? 'Dynamic — change anytime, QR stays the same (Admin free)'
                                        : 'Dynamic — change anytime, QR stays the same (1 credit)'}
                                </p>
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
                                    <p className="text-xs text-muted-foreground">Frame</p>
                                    <p className="text-sm font-medium capitalize">{resolveFrame(scanLogo.banner)}</p>
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

                    {/* Design / Action ScanLogo */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <label className="block text-sm font-semibold mb-1.5">Action ScanLogo Design</label>
                        <p className="text-xs text-muted-foreground mb-4">Change the frame, text box and brand color. The preview updates live — hit Save to keep it.</p>

                        {/* Frame */}
                        <p className="text-xs font-medium mb-2">Frame Style</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
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

                        {/* Headline + Subtitle */}
                        <div className="grid sm:grid-cols-2 gap-3 mb-4">
                            <div>
                                <p className="text-xs font-medium mb-1.5">Headline</p>
                                <input
                                    type="text"
                                    placeholder="SCAN & WIN  or  $34"
                                    value={headline}
                                    maxLength={50}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Wrapper color */}
                        <p className="text-xs font-medium mb-2">Wrapper Brand Color</p>
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                            {WRAPPER_COLOR_PRESETS.map((c) => (
                                <button
                                    key={`wrapper-${c}`}
                                    onClick={() => setWrapperColor(c)}
                                    className={`w-8 h-8 rounded-lg transition-all border ${wrapperColor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'} border-transparent`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                            <input
                                type="color"
                                value={wrapperColor}
                                onChange={(e) => setWrapperColor(e.target.value)}
                                className="w-8 h-8 rounded-lg cursor-pointer border border-border"
                                title="Pick wrapper brand color"
                            />
                        </div>

                        <button
                            onClick={handleSaveDesign}
                            disabled={savingDesign || !designDirty}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm disabled:opacity-50"
                        >
                            {savingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {designDirty ? 'Save design' : 'Saved'}
                        </button>
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
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <p className="text-xs text-muted-foreground mb-4 text-center">Preview</p>
                        <div className="flex items-center justify-center min-h-[320px]">
                            <ScanLogoPreview
                                ref={qrPreviewRef}
                                url={scanLogo.destination_url}
                                color={scanLogo.color}
                                wrapperColor={wrapperColor}
                                ctaText={headline}
                                subtitle={subtitle}
                                safeScanBadge={scanLogo.safe_scan_badge}
                                centerLogoUrl={scanLogo.center_logo_path ? `/storage/${scanLogo.center_logo_path}` : null}
                                shortUrl={scanLogo.short_url}
                                size={180}
                                bannerTemplate={frame}
                            />
                        </div>

                        {/* Change logo */}
                        <div className="mt-5 text-center">
                            <label className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer">
                                {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                {scanLogo.center_logo_path ? 'Change center logo' : 'Add center logo'}
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                        </div>

                        {/* Download buttons */}
                        <div className="w-full space-y-2 mt-5">
                            <p className="text-xs text-muted-foreground text-center">Download</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleDownload('png')}
                                    disabled={downloadingFormat !== null}
                                    className="flex items-center justify-center gap-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {downloadingFormat === 'png' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PNG
                                </button>
                                <button
                                    onClick={() => handleDownload('jpg')}
                                    disabled={downloadingFormat !== null}
                                    className="flex items-center justify-center gap-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {downloadingFormat === 'jpg' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} JPG
                                </button>
                                <button
                                    onClick={() => handleDownload('gif')}
                                    disabled={downloadingFormat !== null}
                                    className="flex items-center justify-center gap-1 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {downloadingFormat === 'gif' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} GIF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
