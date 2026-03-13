import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Megaphone, QrCode, FileImage,
    Loader2, Trash2, AlertTriangle, Calendar, Eye, Plus,
    Pencil, Globe, BarChart3, Download,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { campaignApi, scanLogoApi } from '@/lib/api'
import ScanLogoPreview from '@/components/ScanLogoPreview'
import toast from 'react-hot-toast'

export default function CampaignDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const postRef = useRef<HTMLDivElement>(null)
    const [campaign, setCampaign] = useState<any>(null)
    const [scanLogos, setScanLogos] = useState<any[]>([])
    const [flyers, setFlyers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteFlyerModal, setDeleteFlyerModal] = useState<number | null>(null)
    const [deletingFlyer, setDeletingFlyer] = useState(false)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            const [campRes, logosRes] = await Promise.all([
                campaignApi.get(Number(id)),
                scanLogoApi.list(),
            ])
            const camp = campRes.data.campaign
            setCampaign(camp)
            setScanLogos(camp.scan_logos || logosRes.data.data || [])
            setFlyers(camp.flyers || [])
        } catch {
            toast.error('Failed to load campaign')
            navigate('/dashboard/campaigns')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!campaign) return
        setDeleting(true)
        try {
            await campaignApi.delete(campaign.id)
            toast.success('Campaign deleted')
            navigate('/dashboard/campaigns')
        } catch {
            toast.error('Failed to delete campaign')
        } finally {
            setDeleting(false)
        }
    }

    const handleDeleteFlyer = async () => {
        if (!deleteFlyerModal || !campaign) return
        setDeletingFlyer(true)
        try {
            await campaignApi.deleteFlyer(campaign.id, deleteFlyerModal)
            setFlyers((prev) => prev.filter((f: any) => f.id !== deleteFlyerModal))
            toast.success('Flyer deleted')
            setDeleteFlyerModal(null)
        } catch {
            toast.error('Failed to delete flyer')
        } finally {
            setDeletingFlyer(false)
        }
    }

    const handleDownloadPost = async () => {
        if (!postRef.current || !campaign) return
        setDownloading(true)
        try {
            const el = postRef.current
            const rect = el.getBoundingClientRect()
            const dataUrl = await toPng(el, {
                width: rect.width,
                height: rect.height,
                style: {
                    margin: '0',
                    transform: 'none',
                },
                pixelRatio: 2,
            })
            const link = document.createElement('a')
            link.download = `${campaign.name || 'post'}-main-post.png`
            link.href = dataUrl
            link.click()
            toast.success('Post downloaded!')
        } catch {
            toast.error('Failed to download post')
        } finally {
            setDownloading(false)
        }
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-600 border-green-500/20'
            case 'draft': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
            case 'paused': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
            default: return 'bg-muted text-muted-foreground border-border'
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    if (!campaign) return null

    const primaryColor = campaign.primary_color || '#c8401a'
    const fontFamily = campaign.font_family || 'Inter'

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate('/dashboard/campaigns')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Campaigns
                </button>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Megaphone className="w-7 h-7" style={{ color: primaryColor }} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{campaign.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize border ${statusColor(campaign.status)}`}>
                                    {campaign.status}
                                </span>
                                <span className="text-sm text-muted-foreground capitalize">{campaign.cta_type} campaign</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(campaign.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {campaign.is_published && campaign.public_url && (
                            <a href={campaign.public_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border hover:bg-muted transition-colors">
                                <Globe className="w-3.5 h-3.5" /> View Live
                            </a>
                        )}
                        <Link to={`/dashboard/campaigns/${campaign.id}/templates?type=flyer`}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                            <Plus className="w-3.5 h-3.5" /> Create Flyer
                        </Link>
                        <button onClick={() => setDeleteModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Main Post Preview — Full Width ─── */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Main Post</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadPost}
                            disabled={downloading || !campaign.headline}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40"
                        >
                            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                            Download
                        </button>
                        <Link to={`/dashboard/campaigns/${campaign.id}/flyer`}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <Pencil className="w-3 h-3" /> Edit in Canvas
                        </Link>
                    </div>
                </div>

                {campaign.page_design?.elements?.length > 0 ? (
                    /* ─── Render actual canvas design from page_design ─── */
                    (() => {
                        const pd = campaign.page_design
                        const cw = 1080
                        const ch = pd.aspectRatio === '1:1' ? 1080 : pd.aspectRatio === '4:5' ? 1350 : 1920
                        const maxW = 480
                        const scale = maxW / cw
                        const displayH = ch * scale
                        return (
                            <div className="flex justify-center">
                                <div ref={postRef} className="rounded-2xl overflow-hidden shadow-lg border border-border" style={{ width: maxW, height: displayH }}>
                                    <div className="relative origin-top-left" style={{
                                        width: cw,
                                        height: ch,
                                        transform: `scale(${scale})`,
                                        background: pd.bgImage ? `url(${pd.bgImage}) center/cover` : (pd.bgColor || '#1a1a2e'),
                                    }}>
                                        {pd.elements.map((el: any) => (
                                            <div key={el.id} className="absolute" style={{
                                                left: el.x,
                                                top: el.y,
                                                width: el.width,
                                                height: el.height,
                                                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                                            }}>
                                                {el.type === 'text' && (
                                                    <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{
                                                        fontSize: el.fontSize,
                                                        fontFamily: el.fontFamily,
                                                        fontWeight: el.fontWeight as any,
                                                        fontStyle: el.fontStyle,
                                                        color: el.textColor,
                                                        textAlign: el.textAlign as any,
                                                        lineHeight: 1.3,
                                                        wordBreak: 'break-word',
                                                    }}>
                                                        {el.content}
                                                    </div>
                                                )}
                                                {el.type === 'shape' && (
                                                    <div className="w-full h-full" style={{
                                                        backgroundColor: el.bgColor || '#c8401a',
                                                        borderRadius: el.borderRadius || 0,
                                                        opacity: el.opacity ?? 1,
                                                        border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#fff'}` : undefined,
                                                    }} />
                                                )}
                                                {el.type === 'image' && (
                                                    <img src={el.src} alt="" className="w-full h-full pointer-events-none"
                                                        style={{ objectFit: (el.objectFit || 'cover') as any, borderRadius: el.borderRadius || 0 }} />
                                                )}
                                                {el.type === 'qr' && (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ScanLogoPreview
                                                            url={'https://nowqr.com'}
                                                            shortUrl={scanLogos[0]?.short_url}
                                                            shape={scanLogos[0]?.shape || 'shield'}
                                                            animation="none"
                                                            color={scanLogos[0]?.color || primaryColor}
                                                            ctaText={scanLogos[0]?.cta_text || campaign.cta_button_text || 'SCAN'}
                                                            safeScanBadge={false}
                                                            centerLogoUrl={scanLogos[0]?.center_logo_path ? `/storage/${scanLogos[0].center_logo_path}` : null}
                                                            size={Math.min(el.width, el.height) - 20}
                                                            minimal
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })()
                ) : campaign.headline ? (
                    <div className="flex justify-center">
                        <div ref={postRef} className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg w-full" style={{ fontFamily, maxWidth: 672 }}>
                            <div className="flex flex-col items-center justify-between px-10 py-10 text-center relative min-h-[500px]"
                                style={{ background: `linear-gradient(160deg, ${primaryColor}, ${primaryColor}cc 60%, #1e1b4b)` }}>

                                {/* Top decorative line */}
                                <div className="w-12 h-1 rounded-full mb-6" style={{ backgroundColor: '#ffffff50' }} />

                                {/* Business badge */}
                                <div className="mb-6">
                                    <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                                        {campaign.business_name}
                                    </span>
                                </div>

                                <h2 className="text-3xl font-bold mb-3 leading-tight max-w-lg" style={{ color: '#ffffff' }}>
                                    {campaign.headline}
                                </h2>

                                {campaign.sub_headline && (
                                    <p className="text-base mb-4 max-w-md" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {campaign.sub_headline}
                                    </p>
                                )}

                                {campaign.description && (
                                    <p className="text-sm mb-8 max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                        {campaign.description}
                                    </p>
                                )}

                                {/* ScanLogo — render actual first logo or placeholder */}
                                {scanLogos.length > 0 ? (
                                    <div className="mb-4">
                                        <ScanLogoPreview
                                            url={'https://nowqr.com'}
                                            shortUrl={scanLogos[0].short_url}
                                            shape={scanLogos[0].shape || 'shield'}
                                            animation="none"
                                            color={scanLogos[0].color || '#ffffff'}
                                            ctaText={scanLogos[0].cta_text || campaign.cta_button_text || 'SCAN'}
                                            safeScanBadge={false}
                                            centerLogoUrl={scanLogos[0].center_logo_path ? `/storage/${scanLogos[0].center_logo_path}` : null}
                                            size={120}
                                            minimal
                                        />
                                    </div>
                                ) : (
                                    <div className="w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4"
                                        style={{ borderColor: 'rgba(255,255,255,0.4)' }}>
                                        <div className="text-center">
                                            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-1"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                                <QrCode className="w-6 h-6" style={{ color: '#ffffff' }} />
                                            </div>
                                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>ScanLogo</span>
                                        </div>
                                    </div>
                                )}

                                {/* CTA button */}
                                <div className="px-8 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider"
                                    style={{ backgroundColor: '#ffffff', color: primaryColor }}>
                                    {campaign.cta_button_text}
                                </div>

                                {/* Bottom decorative line */}
                                <div className="w-12 h-1 rounded-full mt-6" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                            <FileImage className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium mb-1">No content yet</p>
                        <p className="text-xs text-muted-foreground mb-4">Create your first post using the canvas editor.</p>
                        <Link to={`/dashboard/campaigns/${campaign.id}/templates`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                            <Plus className="w-4 h-4" /> Create Post
                        </Link>
                    </div>
                )}
            </div>

            {/* ─── Info Grid: Details + ScanLogos + Actions ─── */}
            <div className="grid md:grid-cols-3 gap-6 mb-10">
                {/* Campaign Details */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-bold mb-4">Campaign Details</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Business</span>
                            <span className="font-medium">{campaign.business_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">CTA Type</span>
                            <span className="font-medium capitalize">{campaign.cta_type}</span>
                        </div>
                        {campaign.custom_cta && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Custom CTA</span>
                                <span className="font-medium">{campaign.custom_cta}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Font</span>
                            <span className="font-medium" style={{ fontFamily }}>{fontFamily}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Color</span>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-md border border-border" style={{ backgroundColor: primaryColor }} />
                                <span className="font-mono text-xs">{primaryColor}</span>
                            </div>
                        </div>
                        {campaign.target_audience && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Audience</span>
                                <span className="font-medium text-right max-w-[150px] truncate">{campaign.target_audience}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Scans</span>
                            <span className="font-bold">{campaign.scan_events_count || 0}</span>
                        </div>
                    </div>
                </div>

                {/* ScanLogos */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold">ScanLogos</h3>
                        <Link to={`/dashboard/scanlogos/new?campaign_id=${campaign.id}`}
                            className="text-xs text-primary hover:underline flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Create
                        </Link>
                    </div>
                    {scanLogos.length > 0 ? (
                        <div className="space-y-2.5">
                            {scanLogos.map((sl: any) => (
                                <Link key={sl.id} to={`/dashboard/scanlogos/${sl.id}`}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                                    <div className="w-10 h-10 shrink-0">
                                        <ScanLogoPreview
                                            url={'https://nowqr.com'}
                                            shortUrl={sl.short_url}
                                            shape={sl.shape || 'shield'}
                                            animation="none"
                                            color={sl.color || primaryColor}
                                            ctaText={sl.cta_text || 'SCAN'}
                                            safeScanBadge={false}
                                            centerLogoUrl={sl.center_logo_path ? `/storage/${sl.center_logo_path}` : null}
                                            size={40}
                                            minimal
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate">{sl.name || `ScanLogo #${sl.id}`}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize">{sl.shape}</p>
                                    </div>
                                    <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <QrCode className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No ScanLogos yet.</p>
                            <Link to={`/dashboard/scanlogos/new?campaign_id=${campaign.id}`}
                                className="text-xs text-primary hover:underline mt-1 inline-block">
                                Create one
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="text-sm font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <Link to={`/dashboard/campaigns/${campaign.id}/templates?type=flyer`}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors w-full">
                            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                <FileImage className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold">Create Flyer</p>
                                <p className="text-[10px] text-muted-foreground">Design a promo flyer</p>
                            </div>
                        </Link>
                        <Link to={`/dashboard/scanlogos/new?campaign_id=${campaign.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors w-full">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <QrCode className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold">Build ScanLogo</p>
                                <p className="text-[10px] text-muted-foreground">QR button for campaign</p>
                            </div>
                        </Link>
                        <Link to="/dashboard/analytics"
                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors w-full">
                            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                <BarChart3 className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold">View Analytics</p>
                                <p className="text-[10px] text-muted-foreground">Track scans & performance</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ─── Flyers Section ─── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold">Flyers</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Additional promotional materials for this campaign ({flyers.length})
                        </p>
                    </div>
                    <Link to={`/dashboard/campaigns/${campaign.id}/templates`}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="w-3.5 h-3.5" /> New Flyer
                    </Link>
                </div>

                {flyers.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {flyers.map((flyer: any) => (
                            <div key={flyer.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-lg transition-all">
                                {flyer.image_path ? (
                                    <div className="aspect-[3/4] bg-muted">
                                        <img
                                            src={`/storage/${flyer.image_path}`}
                                            alt={flyer.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : flyer.canvas_state?.elements?.length > 0 ? (
                                    /* Mini canvas preview from canvas_state */
                                    (() => {
                                        const cs = flyer.canvas_state
                                        const fw = 1080
                                        const fh = cs.aspectRatio === '1:1' ? 1080 : cs.aspectRatio === '4:5' ? 1350 : 1920
                                        return (
                                            <div className="aspect-[3/4] bg-muted overflow-hidden">
                                                <div className="relative origin-top-left" style={{
                                                    width: fw,
                                                    height: fh,
                                                    transform: `scale(${200 / fw})`,
                                                    background: cs.bgImage ? `url(${cs.bgImage}) center/cover` : (cs.bgColor || '#1a1a2e'),
                                                }}>
                                                    {cs.elements.map((el: any) => (
                                                        <div key={el.id} className="absolute" style={{
                                                            left: el.x, top: el.y,
                                                            width: el.width, height: el.height,
                                                            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                                                        }}>
                                                            {el.type === 'text' && (
                                                                <div className="w-full h-full overflow-hidden" style={{
                                                                    fontSize: el.fontSize, fontFamily: el.fontFamily,
                                                                    fontWeight: el.fontWeight as any, color: el.textColor,
                                                                    textAlign: el.textAlign as any, lineHeight: 1.3,
                                                                }}>{el.content}</div>
                                                            )}
                                                            {el.type === 'shape' && (
                                                                <div className="w-full h-full" style={{
                                                                    backgroundColor: el.bgColor || '#c8401a',
                                                                    borderRadius: el.borderRadius || 0,
                                                                    opacity: el.opacity ?? 1,
                                                                }} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })()
                                ) : (
                                    <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                                        <FileImage className="w-8 h-8 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="p-3 flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold truncate">{flyer.title}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(flyer.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {flyer.image_path && (
                                            <a href={`/storage/${flyer.image_path}`} download={flyer.title || 'flyer'}
                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={(e) => e.stopPropagation()}>
                                                <Download className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        <button onClick={() => setDeleteFlyerModal(flyer.id)}
                                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl p-10 text-center">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
                            <FileImage className="w-7 h-7 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium mb-1">No flyers yet</p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Create flyers with the drag & drop editor to promote this campaign.
                        </p>
                        <Link to={`/dashboard/campaigns/${campaign.id}/templates?type=flyer`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                            <Plus className="w-4 h-4" /> Create Flyer
                        </Link>
                    </div>
                )}
            </div>

            {/* ─── Delete Campaign Modal ─── */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal(false)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Delete Campaign</h3>
                                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete <span className="font-medium text-foreground">"{campaign.name}"</span>?
                            All ScanLogos, flyers, and scan data will be permanently removed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteModal(false)} disabled={deleting}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="px-4 py-2 text-sm font-medium rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Flyer Modal ─── */}
            {deleteFlyerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deletingFlyer && setDeleteFlyerModal(null)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Delete Flyer</h3>
                                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setDeleteFlyerModal(null)} disabled={deletingFlyer}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleDeleteFlyer} disabled={deletingFlyer}
                                className="px-4 py-2 text-sm font-medium rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                                {deletingFlyer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {deletingFlyer ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
