import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    ArrowLeft, Megaphone, QrCode, FileImage,
    Loader2, Trash2, AlertTriangle, Calendar, Eye, Plus,
    Pencil, Globe, BarChart3, Download, X, ExternalLink,
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { campaignApi, scanLogoApi } from '@/lib/api'
import ScanLogoPreview from '@/components/ScanLogoPreview'
// @ts-ignore
import gifshot from 'gifshot'
import toast from 'react-hot-toast'

type AspectRatio = '1:1' | '9:16' | '4:5' | '16:9'

const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
    '1:1': { w: 1080, h: 1080 },
    '9:16': { w: 1080, h: 1920 },
    '4:5': { w: 1080, h: 1350 },
    '16:9': { w: 1920, h: 1080 },
}

const getCanvasSize = (aspectRatio?: string) => {
    if (aspectRatio && aspectRatio in CANVAS_SIZES) {
        return CANVAS_SIZES[aspectRatio as AspectRatio]
    }
    return CANVAS_SIZES['9:16']
}

const getCanvasRenderScale = (design: any) => {
    const { w, h } = getCanvasSize(design?.aspectRatio)
    const elements = Array.isArray(design?.elements) ? design.elements : []

    let maxRight = 0
    let maxBottom = 0
    for (const el of elements) {
        const x = Number(el?.x) || 0
        const y = Number(el?.y) || 0
        const width = Number(el?.width) || 0
        const height = Number(el?.height) || 0
        maxRight = Math.max(maxRight, x + width)
        maxBottom = Math.max(maxBottom, y + height)
    }

    const needsNormalize = maxRight > w * 1.02 || maxBottom > h * 1.02
    const scaleX = needsNormalize && maxRight > 0 ? w / maxRight : 1
    const scaleY = needsNormalize && maxBottom > 0 ? h / maxBottom : 1
    const fontScale = Math.min(scaleX, scaleY)

    return { w, h, scaleX, scaleY, fontScale }
}

const parseAnimationDurationMs = (durationValue: string): number => {
    const trimmed = (durationValue || '').trim()
    if (!trimmed || trimmed === '0s' || trimmed === '0ms') return 0

    if (trimmed.endsWith('ms')) {
        const value = Number(trimmed.slice(0, -2))
        return Number.isFinite(value) ? value : 0
    }

    if (trimmed.endsWith('s')) {
        const value = Number(trimmed.slice(0, -1))
        return Number.isFinite(value) ? value * 1000 : 0
    }

    return 0
}

const waitForNextPaint = () => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve())
    })
})

const copyCanvasContent = (sourceRoot: HTMLElement, cloneRoot: HTMLElement) => {
    const sourceCanvases = sourceRoot.querySelectorAll<HTMLCanvasElement>('canvas')
    const cloneCanvases = cloneRoot.querySelectorAll<HTMLCanvasElement>('canvas')

    cloneCanvases.forEach((targetCanvas, index) => {
        const sourceCanvas = sourceCanvases[index]
        if (!sourceCanvas) return

        try {
            targetCanvas.width = sourceCanvas.width
            targetCanvas.height = sourceCanvas.height
            const ctx = targetCanvas.getContext('2d')
            if (ctx) {
                ctx.drawImage(sourceCanvas, 0, 0)
            }
        } catch {
            // Ignore copy failures; the exporter will surface a user-visible error if rendering fails.
        }
    })
}

const setFlashOverlayState = (root: HTMLElement, visible: boolean) => {
    const overlays = root.querySelectorAll<HTMLElement>('.scanlogo-flash-overlay')
    overlays.forEach((overlay) => {
        overlay.style.animation = 'none'
        overlay.style.opacity = visible ? '1' : '0'
    })
}

const applyScanLogoAnimationFrame = (root: HTMLElement, progressMs: number) => {
    const animatedNodes = root.querySelectorAll<HTMLElement>('.scanlogo-animation-node')

    animatedNodes.forEach((node) => {
        const computed = window.getComputedStyle(node)
        const duration = (computed.animationDuration || '0s').split(',')[0]?.trim() || '0s'
        const durationMs = parseAnimationDurationMs(duration)

        if (!durationMs) return

        const progressOffset = progressMs % durationMs
        node.style.animationPlayState = 'paused'
        node.style.animationDelay = `-${progressOffset}ms`
    })
}

const triggerDataUrlDownload = async (dataUrl: string, fileName: string) => {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export default function CampaignDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const postRef = useRef<HTMLDivElement>(null)
    const [campaign, setCampaign] = useState<any>(null)
    const [scanLogos, setScanLogos] = useState<any[]>([])
    const [flyers, setFlyers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [downloadingFormat, setDownloadingFormat] = useState<'png' | 'gif' | null>(null)
    const [downloadingFlyerId, setDownloadingFlyerId] = useState<{ id: number, format: 'png' | 'gif' } | null>(null)
    const flyerExportRef = useRef<HTMLDivElement>(null)
    const [deleteModal, setDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [deleteFlyerModal, setDeleteFlyerModal] = useState<number | null>(null)
    const [deletingFlyer, setDeletingFlyer] = useState(false)
    const [enlargedLogo, setEnlargedLogo] = useState<any>(null)
    const clickTimeoutRef = useRef<any>(null)

    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
        }
    }, [])

    const handleQrClick = (e: React.MouseEvent, logo: any) => {
        e.stopPropagation()
        e.preventDefault()
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
            clickTimeoutRef.current = null
            const url = logo?.destination_url || logo?.short_url || campaign?.public_url || 'https://nowqr.com'
            window.open(url, '_blank')
        } else {
            clickTimeoutRef.current = setTimeout(() => {
                clickTimeoutRef.current = null
                setEnlargedLogo(logo)
            }, 250)
        }
    }

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

            // Merge campaign.scan_logos with logosRes.data.data to ensure we have all referenced logos
            const allLogos = [...(camp.scan_logos || [])];
            (logosRes.data.data || []).forEach((lg: any) => {
                if (!allLogos.find(x => x.id === lg.id)) {
                    allLogos.push(lg);
                }
            });
            setScanLogos(allLogos)

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

    const handleDownloadPostGif = async () => {
        if (!postRef.current || !campaign) return
        setDownloadingFormat('gif')
        try {
            const el = postRef.current
            const isCanvasPost = !!campaign.page_design?.elements?.length
            const nativeCanvas = isCanvasPost ? getCanvasRenderScale(campaign.page_design) : null
            const width = nativeCanvas?.w || el.offsetWidth
            const height = nativeCanvas?.h || el.offsetHeight
            const exportHost = document.createElement('div')
            exportHost.style.position = 'fixed'
            exportHost.style.left = '-10000px'
            exportHost.style.top = '-10000px'
            exportHost.style.pointerEvents = 'none'
            exportHost.style.opacity = '0'
            exportHost.style.zIndex = '-1'

            const exportNode = el.cloneNode(true) as HTMLDivElement
            exportNode.style.transform = 'none'
            exportNode.style.width = `${width}px`
            exportNode.style.height = `${height}px`
            exportNode.style.maxWidth = 'none'
            exportNode.style.maxHeight = 'none'

            copyCanvasContent(el, exportNode)

            exportHost.appendChild(exportNode)
            document.body.appendChild(exportHost)

            try {
                if ((document as any).fonts?.ready) {
                    await (document as any).fonts.ready
                }
                await waitForNextPaint()

                const hasFlashAnimation = !!exportNode.querySelector('.scanlogo-flash-overlay')
                const frameCount = hasFlashAnimation ? 9 : 8
                const animationDurationMs = hasFlashAnimation ? 4500 : 2200
                const gifIntervalSeconds = hasFlashAnimation ? 0.5 : 0.2
                const frames: string[] = []

                for (let i = 0; i < frameCount; i++) {
                    const progressMs = (i / (frameCount - 1)) * animationDurationMs

                    applyScanLogoAnimationFrame(exportNode, progressMs)

                    if (hasFlashAnimation) {
                        const progressRatio = animationDurationMs > 0
                            ? (progressMs % animationDurationMs) / animationDurationMs
                            : 0
                        const flashOn =
                            progressRatio < 0.12 ||
                            (progressRatio >= 0.32 && progressRatio < 0.44) ||
                            (progressRatio >= 0.62 && progressRatio < 0.72)
                        setFlashOverlayState(exportNode, flashOn)
                    }

                    await waitForNextPaint()

                    const dataUrl = await toPng(exportNode, {
                        width,
                        height,
                        style: {
                            margin: '0',
                            transform: 'none',
                            width: `${width}px`,
                            height: `${height}px`,
                        },
                        pixelRatio: 1,
                        cacheBust: false,
                    })

                    frames.push(dataUrl)
                }

                const gifDataUrl = await new Promise<string>((resolve, reject) => {
                    let settled = false
                    const timeoutId = window.setTimeout(() => {
                        if (settled) return
                        settled = true
                        reject(new Error('GIF encoding timed out'))
                    }, 22000)

                    gifshot.createGIF({
                        images: frames,
                        gifWidth: width,
                        gifHeight: height,
                        interval: gifIntervalSeconds,
                        sampleInterval: 15,
                        numWorkers: 2,
                    }, (obj: any) => {
                        if (settled) return
                        settled = true
                        window.clearTimeout(timeoutId)

                        if (obj.error || !obj.image) {
                            reject(new Error(obj.errorMsg || 'Failed to encode GIF'))
                            return
                        }

                        resolve(obj.image)
                    })
                })

                await triggerDataUrlDownload(gifDataUrl, `${campaign.name || 'post'}-main-post.gif`)
                toast.success('Post downloaded as GIF!')
            } finally {
                exportHost.remove()
            }
        } catch {
            toast.error('Failed to download post')
        } finally {
            setDownloadingFormat(null)
        }
    }

    const handleDownloadFlyerGif = async (flyer: any) => {
        if (!flyer.canvas_state) {
            toast.error('This flyer does not support GIF export');
            return;
        }
        setDownloadingFlyerId({ id: flyer.id, format: 'gif' })

        // Let React render the full scale hidden flyer
        setTimeout(async () => {
            try {
                const el = flyerExportRef.current
                if (!el) throw new Error('Ref not found')

                const width = el.offsetWidth
                const height = el.offsetHeight
                const frames: string[] = [];

                for (let i = 0; i < 10; i++) {
                    const dataUrl = await toPng(el, {
                        width, height,
                        style: { margin: '0', transform: 'none' },
                        pixelRatio: 1.5,
                        cacheBust: true,
                    })
                    frames.push(dataUrl);
                    await new Promise(r => setTimeout(r, 150));
                }

                gifshot.createGIF({
                    images: frames,
                    gifWidth: width * 1.5,
                    gifHeight: height * 1.5,
                    interval: 0.15,
                }, (obj: any) => {
                    if (!obj.error) {
                        const link = document.createElement('a')
                        link.download = `${flyer.title || 'flyer'}.gif`
                        link.href = obj.image
                        link.click()
                        toast.success('Flyer downloaded as GIF!')
                    } else {
                        toast.error('Failed to encode GIF')
                    }
                    setDownloadingFlyerId(null)
                });
            } catch (e) {
                toast.error('Failed to generate Flyer GIF')
                setDownloadingFlyerId(null)
            }
        }, 500)
    }

    const handleDownloadPost = async () => {
        if (!postRef.current || !campaign) return
        setDownloadingFormat('png')
        try {
            const el = postRef.current
            const isCanvasPost = !!campaign.page_design?.elements?.length
            const nativeCanvas = isCanvasPost ? getCanvasRenderScale(campaign.page_design) : null
            const width = nativeCanvas?.w || el.offsetWidth
            const height = nativeCanvas?.h || el.offsetHeight
            const exportHost = document.createElement('div')
            exportHost.style.position = 'fixed'
            exportHost.style.left = '-10000px'
            exportHost.style.top = '-10000px'
            exportHost.style.pointerEvents = 'none'
            exportHost.style.opacity = '0'
            exportHost.style.zIndex = '-1'

            const exportNode = el.cloneNode(true) as HTMLDivElement
            exportNode.style.transform = 'none'
            exportNode.style.width = `${width}px`
            exportNode.style.height = `${height}px`
            exportNode.style.maxWidth = 'none'
            exportNode.style.maxHeight = 'none'

            copyCanvasContent(el, exportNode)
            setFlashOverlayState(exportNode, false)

            exportHost.appendChild(exportNode)
            document.body.appendChild(exportHost)

            let dataUrl = ''
            try {
                if ((document as any).fonts?.ready) {
                    await (document as any).fonts.ready
                }
                await waitForNextPaint()

                dataUrl = await toPng(exportNode, {
                    width,
                    height,
                    style: {
                        margin: '0',
                        transform: 'none',
                        width: `${width}px`,
                        height: `${height}px`,
                    },
                    pixelRatio: 3,
                    cacheBust: true,
                })
            } finally {
                exportHost.remove()
            }

            await triggerDataUrlDownload(dataUrl, `${campaign.name || 'post'}-main-post.png`)
            toast.success('Post downloaded!')
        } catch {
            toast.error('Failed to download post')
        } finally {
            setDownloadingFormat(null)
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
        <div className="max-w-6xl mx-auto w-full min-w-0">
            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigate('/dashboard/campaigns')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to Campaigns
                </button>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15` }}>
                            <Megaphone className="w-7 h-7" style={{ color: primaryColor }} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold break-words">{campaign.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
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

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 className="text-lg font-bold">Main Post</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-card border border-border rounded-lg overflow-hidden disabled:opacity-40">
                            <button
                                onClick={handleDownloadPost}
                                disabled={downloadingFormat !== null || (!campaign.headline && !(campaign.page_design?.elements?.length > 0))}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 hover:bg-muted transition-colors border-r border-border"
                            >
                                {downloadingFormat === 'png' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                PNG
                            </button>
                            <button
                                onClick={handleDownloadPostGif}
                                disabled={downloadingFormat !== null || (!campaign.headline && !(campaign.page_design?.elements?.length > 0))}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 hover:bg-muted transition-colors"
                            >
                                {downloadingFormat === 'gif' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                GIF
                            </button>
                        </div>
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
                        const { w: cw, h: ch, scaleX: elementScaleX, scaleY: elementScaleY, fontScale } = getCanvasRenderScale(pd)
                        const previewWidth = cw > ch ? 760 : 480
                        const scale = previewWidth / cw
                        const displayH = ch * scale
                        return (
                            <div className="w-full overflow-x-auto pb-2">
                                <div className="mx-auto" style={{ width: previewWidth, minWidth: previewWidth }}>
                                    <div className="rounded-2xl overflow-hidden shadow-lg border border-border" style={{ width: previewWidth, height: displayH }}>
                                    <div ref={postRef} className="relative origin-top-left" style={{
                                        width: cw,
                                        height: ch,
                                        transform: `scale(${scale})`,
                                        background: pd.bgImage ? `url(${pd.bgImage}) center/cover` : (pd.bgColor || '#1a1a2e'),
                                    }}>
                                        {pd.elements.map((el: any) => {
                                            const left = (Number(el.x) || 0) * elementScaleX
                                            const top = (Number(el.y) || 0) * elementScaleY
                                            const width = (Number(el.width) || 0) * elementScaleX
                                            const height = (Number(el.height) || 0) * elementScaleY
                                            const scaledFontSize = el.fontSize ? Math.max(12, Math.round(Number(el.fontSize) * fontScale)) : el.fontSize
                                            return (
                                                <div key={el.id} className="absolute" style={{
                                                    left,
                                                    top,
                                                    width,
                                                    height,
                                                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                                                }}>
                                                    {el.type === 'text' && (
                                                        <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{
                                                            fontSize: scaledFontSize,
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
                                                        <img src={el.src} alt="" crossOrigin="anonymous" className="w-full h-full pointer-events-none"
                                                            style={{ objectFit: (el.objectFit || 'cover') as any, borderRadius: el.borderRadius || 0 }} />
                                                    )}
                                                    {el.type === 'qr' && (() => {
                                                        const logo = (pd.qrScanLogoMap && pd.qrScanLogoMap[el.id] !== undefined)
                                                            ? scanLogos.find(sl => sl.id == pd.qrScanLogoMap[el.id]) || scanLogos[0]
                                                            : scanLogos[0];
                                                        return (
                                                            <div 
                                                                className="w-full h-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
                                                                onClick={(e) => handleQrClick(e, logo)}
                                                            >
                                                                <ScanLogoPreview
                                                                    url={logo?.destination_url || logo?.short_url || campaign?.public_url || 'https://nowqr.com'}
                                                                    shortUrl={logo?.short_url}
                                                                    shape={logo?.shape || 'shield'}
                                                                    animation={logo?.animation || 'none'}
                                                                    color={logo?.color || primaryColor}
                                                                    wrapperColor={logo?.wrapper_color || logo?.color || primaryColor}
                                                                    ctaText={logo?.cta_text || campaign.cta_button_text || 'SCAN'}
                                                                    safeScanBadge={false}
                                                                    centerLogoUrl={logo?.center_logo_path ? `/storage/${logo.center_logo_path}` : null}
                                                                    size={Math.max(24, Math.min(width, height) - 20)}
                                                                    minimal
                                                                />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                </div>
                            </div>
                        )
                    })()
                ) : campaign.headline ? (
                    <div className="w-full overflow-x-auto pb-2">
                        <div className="mx-auto" style={{ width: 672, minWidth: 672 }}>
                            <div ref={postRef} className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg w-full" style={{ fontFamily }}>
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
                                    <div 
                                        className="mb-4 cursor-pointer hover:scale-105 transition-transform duration-200"
                                        onClick={(e) => handleQrClick(e, scanLogos[0])}
                                    >
                                        <ScanLogoPreview
                                            url={scanLogos[0].destination_url || scanLogos[0].short_url || campaign.public_url || 'https://nowqr.com'}
                                            shortUrl={scanLogos[0].short_url}
                                            shape={scanLogos[0].shape || 'shield'}
                                            animation={scanLogos[0].animation || 'none'}
                                            color={scanLogos[0].color || primaryColor}
                                            wrapperColor={scanLogos[0].wrapper_color || scanLogos[0].color || primaryColor}
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
                                            url={sl.destination_url || sl.short_url || campaign.public_url || 'https://nowqr.com'}
                                            shortUrl={sl.short_url}
                                            shape={sl.shape || 'shield'}
                                            animation="none"
                                            color={sl.color || primaryColor}
                                            wrapperColor={sl.wrapper_color || sl.color || primaryColor}
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
                    <Link to={`/dashboard/campaigns/${campaign.id}/templates?type=flyer`}
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
                                        const { w: fw, h: fh } = getCanvasSize(cs.aspectRatio)
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
                                                            {el.type === 'image' && (
                                                                <img src={el.src} alt="" className="w-full h-full object-cover" style={{ borderRadius: el.borderRadius || 0 }} />
                                                            )}
                                                            {el.type === 'qr' && (() => {
                                                                const logoId = cs.qrScanLogoMap?.[el.id]
                                                                const logo = logoId !== undefined 
                                                                    ? scanLogos.find((sl: any) => sl.id === logoId) || scanLogos[0]
                                                                    : scanLogos[0]
                                                                return (
                                                                    <div 
                                                                        className="w-full h-full flex items-center justify-center cursor-pointer pointer-events-auto select-none"
                                                                        onClick={(e) => handleQrClick(e, logo)}
                                                                        title="Single click to enlarge, double click to visit"
                                                                    >
                                                                        <ScanLogoPreview
                                                                            url={logo?.destination_url || logo?.short_url || campaign?.public_url || 'https://nowqr.com'}
                                                                            shortUrl={logo?.short_url}
                                                                            shape={logo?.shape || 'shield'}
                                                                            animation={logo?.animation || 'none'}
                                                                            color={logo?.color || campaign?.primary_color || '#c8401a'}
                                                                            wrapperColor={logo?.wrapper_color || logo?.color || campaign?.primary_color || '#c8401a'}
                                                                            ctaText={logo?.cta_text || campaign?.cta_button_text || 'SCAN'}
                                                                            safeScanBadge={false}
                                                                            centerLogoUrl={logo?.center_logo_path ? `/storage/${logo.center_logo_path}` : null}
                                                                            size={Math.min(el.width, el.height) - 10}
                                                                            minimal
                                                                        />
                                                                    </div>
                                                                )
                                                            })()}
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
                                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                                        <button onClick={() => setTimeout(() => handleDownloadFlyerGif(flyer), 10)}
                                            disabled={downloadingFlyerId?.id === flyer.id}
                                            className="px-2 py-1 text-[10px] font-medium rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-transparent hover:border-border">
                                            {(downloadingFlyerId?.id === flyer.id && downloadingFlyerId?.format === 'gif') ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'GIF'}
                                        </button>
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

            {/* ─── Hidden Offscreen Flyer Renderer for GIF Export ─── */}
            {downloadingFlyerId && (() => {
                const targetFlyer = flyers.find(f => f.id === downloadingFlyerId.id)
                if (!targetFlyer || !targetFlyer.canvas_state) return null;
                const cs = targetFlyer.canvas_state;
                const { w: fw, h: fh } = getCanvasSize(cs.aspectRatio)
                return (
                    <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', pointerEvents: 'none', zIndex: -1 }}>
                        <div ref={flyerExportRef} style={{
                            width: fw, height: fh,
                            background: cs.bgImage ? `url(${cs.bgImage}) center/cover` : (cs.bgColor || '#1a1a2e'),
                            position: 'relative', overflow: 'hidden'
                        }}>
                            {cs.elements.map((el: any) => (
                                <div key={el.id} className="absolute" style={{
                                    left: el.x, top: el.y, width: el.width, height: el.height,
                                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                                }}>
                                    {el.type === 'text' && (
                                        <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{
                                            fontSize: el.fontSize, fontFamily: el.fontFamily,
                                            fontWeight: el.fontWeight as any, fontStyle: el.fontStyle, color: el.textColor,
                                            textAlign: el.textAlign as any, lineHeight: 1.3, wordBreak: 'break-word',
                                        }}>{el.content}</div>
                                    )}
                                    {el.type === 'shape' && (
                                        <div className="w-full h-full" style={{
                                            backgroundColor: el.bgColor || '#c8401a', borderRadius: el.borderRadius || 0,
                                            opacity: el.opacity ?? 1, border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#fff'}` : undefined,
                                        }} />
                                    )}
                                    {el.type === 'image' && (
                                        <img src={el.src} alt="" crossOrigin="anonymous" className="w-full h-full pointer-events-none"
                                            style={{ objectFit: (el.objectFit || 'cover') as any, borderRadius: el.borderRadius || 0 }} />
                                    )}
                                    {el.type === 'qr' && (() => {
                                        const logo = (cs.qrScanLogoMap && cs.qrScanLogoMap[el.id] !== undefined)
                                            ? scanLogos.find((sl: any) => sl.id == cs.qrScanLogoMap[el.id]) || scanLogos[0]
                                            : scanLogos[0];
                                        return (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ScanLogoPreview
                                                    url={logo?.destination_url || logo?.short_url || campaign?.public_url || 'https://nowqr.com'}
                                                    shortUrl={logo?.short_url} shape={logo?.shape || 'shield'}
                                                    animation={logo?.animation || 'none'} color={logo?.color || primaryColor}
                                                    wrapperColor={logo?.wrapper_color || logo?.color || primaryColor}
                                                    ctaText={logo?.cta_text || campaign.cta_button_text || 'SCAN'} safeScanBadge={false}
                                                    centerLogoUrl={logo?.center_logo_path ? `/storage/${logo.center_logo_path}` : null}
                                                    size={Math.min(el.width, el.height) - 20} minimal
                                                />
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })()}

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

            {/* ─── Enlarged QR Code Modal ─── */}
            {enlargedLogo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEnlargedLogo(null)} />
                    <div className="relative bg-card border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button 
                            onClick={() => setEnlargedLogo(null)}
                            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h3 className="font-bold text-base mb-1 text-foreground text-center">
                            {enlargedLogo.name || `ScanLogo #${enlargedLogo.id}`}
                        </h3>
                        
                        <p className="text-xs text-muted-foreground mb-6 text-center max-w-[240px]">
                            Double click the QR code to navigate directly, or click the button below.
                        </p>

                        {/* Enlarged QR Code Container */}
                        <div 
                            className="bg-white p-5 rounded-[2rem] shadow-inner mb-6 border border-slate-100 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 select-none"
                            onDoubleClick={() => {
                                const url = enlargedLogo.destination_url || enlargedLogo.short_url || campaign?.public_url || 'https://nowqr.com';
                                window.open(url, '_blank');
                            }}
                            title="Double click to visit link"
                        >
                            <ScanLogoPreview
                                url={enlargedLogo.destination_url || enlargedLogo.short_url || campaign?.public_url || 'https://nowqr.com'}
                                shortUrl={enlargedLogo.short_url}
                                shape={enlargedLogo.shape || 'shield'}
                                animation={enlargedLogo.animation || 'none'}
                                color={enlargedLogo.color || primaryColor}
                                wrapperColor={enlargedLogo.wrapper_color || enlargedLogo.color || primaryColor}
                                ctaText={enlargedLogo.cta_text || campaign?.cta_button_text || 'SCAN'}
                                safeScanBadge={false}
                                centerLogoUrl={enlargedLogo.center_logo_path ? `/storage/${enlargedLogo.center_logo_path}` : null}
                                size={220}
                                minimal
                            />
                        </div>

                        {/* Visit link button */}
                        <a
                            href={enlargedLogo.destination_url || enlargedLogo.short_url || campaign?.public_url || 'https://nowqr.com'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-primary text-primary-foreground font-bold py-2.5 text-xs hover:opacity-90 shadow-lg shadow-primary/20 transition-all"
                        >
                            Visit Link
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        
                        <span className="text-[10px] text-muted-foreground mt-3 break-all max-w-full truncate px-4">
                            {enlargedLogo.destination_url || enlargedLogo.short_url || campaign?.public_url || 'https://nowqr.com'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
