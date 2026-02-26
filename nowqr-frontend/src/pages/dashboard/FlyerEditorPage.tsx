import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Download, Type, ImageIcon, QrCode, Square, Trash2,
    Loader2, Copy, Layers, ChevronUp, ChevronDown,
    LayoutTemplate, Bold, Italic, Sparkles,
    AlignLeft, AlignCenter, AlignRight, MousePointer, Lock, Unlock,
} from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
import { campaignApi, scanLogoApi, aiApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import ScanLogoPreview from '@/components/ScanLogoPreview'
import toast from 'react-hot-toast'

/* ─── Types ──────────────────────────────────────────────────── */
interface FlyerElement {
    id: string
    type: 'text' | 'image' | 'qr' | 'shape'
    x: number            // px from left
    y: number            // px from top
    width: number        // px
    height: number       // px
    rotation: number
    locked: boolean
    // text
    content?: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textColor?: string
    textAlign?: string
    // image
    src?: string
    objectFit?: string
    // shape
    bgColor?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    opacity?: number
    // qr — scanLogo reference
    scanLogoId?: number
}

type AspectRatio = '1:1' | '9:16' | '4:5' | '16:9'

const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number; label: string }> = {
    '1:1': { w: 1080, h: 1080, label: 'Square Post' },
    '9:16': { w: 1080, h: 1920, label: 'Story / Reel' },
    '4:5': { w: 1080, h: 1350, label: 'Portrait Post' },
    '16:9': { w: 1920, h: 1080, label: 'Landscape' },
}

const TEMPLATE_COUNT = 46

let nextId = 1
function uid() { return `el_${nextId++}_${Date.now()}` }

/* ─── Main Component ─────────────────────────────────────────── */
export default function FlyerEditorPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { refreshUser } = useAuth()
    const canvasRef = useRef<HTMLDivElement>(null)
    const canvasWrapRef = useRef<HTMLDivElement>(null)

    const [campaign, setCampaign] = useState<any>(null)
    const [scanLogos, setScanLogos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    // Canvas state
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
    const [bgColor, setBgColor] = useState('#0a0a0a')
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [bgTemplate, setBgTemplate] = useState<number | null>(null)
    const [elements, setElements] = useState<FlyerElement[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [showTemplates, setShowTemplates] = useState(false)
    const [canvasScale, setCanvasScale] = useState(0.35)

    // Drag state
    const [dragging, setDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [resizing, setResizing] = useState<string | null>(null)
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, ex: 0, ey: 0 })

    const canvasSize = CANVAS_SIZES[aspectRatio]
    const prevCanvasSizeRef = useRef(canvasSize)
    const selected = elements.find(e => e.id === selectedId) || null

    // Track which ScanLogo to use per QR element
    const [qrScanLogoMap, setQrScanLogoMap] = useState<Record<string, number>>({})
    const getQrScanLogo = (elId: string) => {
        const logoId = qrScanLogoMap[elId]
        if (logoId !== undefined) return scanLogos.find(sl => sl.id === logoId) || scanLogos[0]
        return scanLogos[0]
    }

    /* ─── Load campaign data ─────────────────────────────────── */
    useEffect(() => {
        (async () => {
            try {
                const [campRes, logosRes] = await Promise.all([
                    campaignApi.get(Number(id)),
                    scanLogoApi.list(),
                ])
                const camp = campRes.data.campaign
                setCampaign(camp)
                setScanLogos(logosRes.data.data || [])

                // Auto-populate canvas from campaign (keep bg dark)
                populateFromCampaign(camp)
            } catch {
                toast.error('Failed to load campaign')
                navigate('/dashboard/campaigns')
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    /* ─── Recalculate scale on resize ────────────────────────── */
    useEffect(() => {
        function recalc() {
            if (!canvasWrapRef.current) return
            const wrap = canvasWrapRef.current.getBoundingClientRect()
            const padX = 40, padY = 40
            const scaleX = (wrap.width - padX) / canvasSize.w
            const scaleY = (wrap.height - padY) / canvasSize.h
            setCanvasScale(Math.min(scaleX, scaleY, 0.75))
        }
        recalc()
        window.addEventListener('resize', recalc)
        return () => window.removeEventListener('resize', recalc)
    }, [canvasSize])

    /* ─── Rescale elements when aspect ratio changes ─────────── */
    useEffect(() => {
        const prev = prevCanvasSizeRef.current
        if (prev.w === canvasSize.w && prev.h === canvasSize.h) return
        const scaleX = canvasSize.w / prev.w
        const scaleY = canvasSize.h / prev.h
        setElements(els => els.map(el => ({
            ...el,
            x: Math.round(el.x * scaleX),
            y: Math.round(el.y * scaleY),
            width: Math.round(el.width * scaleX),
            height: Math.round(el.height * scaleY),
            fontSize: el.fontSize ? Math.round(el.fontSize * Math.min(scaleX, scaleY)) : el.fontSize,
        })))
        prevCanvasSizeRef.current = canvasSize
    }, [canvasSize])

    /* ─── Populate default elements from campaign ────────────── */
    const populateFromCampaign = (camp: any) => {
        const color = camp.primary_color || '#c8401a'
        const font = camp.font_family || 'Inter'
        const els: FlyerElement[] = []

        // Business name — lighter version of primary
        els.push({
            id: uid(), type: 'text', x: 80, y: 120, width: 920, height: 60,
            rotation: 0, locked: false,
            content: camp.business_name || 'Your Business',
            fontSize: 24, fontFamily: font, fontWeight: '600',
            textColor: '#dddddd', textAlign: 'center', fontStyle: 'normal',
        })
        // Headline — uses campaign primary color
        els.push({
            id: uid(), type: 'text', x: 60, y: 300, width: 960, height: 180,
            rotation: 0, locked: false,
            content: camp.headline || 'Your Headline Here',
            fontSize: 64, fontFamily: font, fontWeight: '800',
            textColor: color, textAlign: 'center', fontStyle: 'normal',
        })
        // Sub-headline — white
        if (camp.sub_headline) {
            els.push({
                id: uid(), type: 'text', x: 120, y: 510, width: 840, height: 80,
                rotation: 0, locked: false,
                content: camp.sub_headline,
                fontSize: 28, fontFamily: font, fontWeight: '400',
                textColor: '#ffffff', textAlign: 'center', fontStyle: 'normal',
            })
        }
        // Description — light gray
        if (camp.description) {
            els.push({
                id: uid(), type: 'text', x: 120, y: 620, width: 840, height: 160,
                rotation: 0, locked: false,
                content: camp.description,
                fontSize: 20, fontFamily: font, fontWeight: '400',
                textColor: '#bbbbbb', textAlign: 'center', fontStyle: 'normal',
            })
        }
        // CTA text — primary color
        if (camp.cta_button_text) {
            els.push({
                id: uid(), type: 'text', x: 280, y: 1500, width: 520, height: 50,
                rotation: 0, locked: false,
                content: camp.cta_button_text,
                fontSize: 18, fontFamily: font, fontWeight: '800',
                textColor: color, textAlign: 'center', fontStyle: 'normal',
            })
        }
        // QR placeholder
        els.push({
            id: uid(), type: 'qr', x: 380, y: 1180, width: 320, height: 320,
            rotation: 0, locked: false,
        })
        // Powered by
        els.push({
            id: uid(), type: 'text', x: 340, y: 1800, width: 400, height: 40,
            rotation: 0, locked: false,
            content: 'Powered by NowQR',
            fontSize: 14, fontFamily: font, fontWeight: '400',
            textColor: '#555555', textAlign: 'center', fontStyle: 'normal',
        })

        setElements(els)
    }

    /* ─── Element operations ─────────────────────────────────── */
    const addElement = (el: Partial<FlyerElement> & { type: FlyerElement['type'] }) => {
        const newEl: FlyerElement = {
            id: uid(),
            x: canvasSize.w / 2 - 150,
            y: canvasSize.h / 2 - 50,
            width: 300,
            height: 100,
            rotation: 0,
            locked: false,
            ...el,
        }
        setElements(prev => [...prev, newEl])
        setSelectedId(newEl.id)
    }

    const updateElement = (id: string, updates: Partial<FlyerElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
    }

    const deleteElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id))
        if (selectedId === id) setSelectedId(null)
    }

    const duplicateElement = (id: string) => {
        const el = elements.find(e => e.id === id)
        if (!el) return
        const newEl = { ...el, id: uid(), x: el.x + 20, y: el.y + 20 }
        setElements(prev => [...prev, newEl])
        setSelectedId(newEl.id)
    }

    const moveLayer = (id: string, direction: 'up' | 'down') => {
        setElements(prev => {
            const idx = prev.findIndex(e => e.id === id)
            if (idx < 0) return prev
            const next = [...prev]
            const target = direction === 'up' ? idx + 1 : idx - 1
            if (target < 0 || target >= next.length) return prev
            ;[next[idx], next[target]] = [next[target], next[idx]]
            return next
        })
    }

    /* ─── Drag handlers ──────────────────────────────────────── */
    const handlePointerDown = (e: React.PointerEvent, elId: string) => {
        e.stopPropagation()
        const el = elements.find(x => x.id === elId)
        if (!el || el.locked) return
        setSelectedId(elId)
        setDragging(true)
        const rect = (e.target as HTMLElement).closest('[data-element]')?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: (e.clientX - rect.left) / canvasScale,
                y: (e.clientY - rect.top) / canvasScale,
            })
        }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!canvasRef.current) return

        if (dragging && selectedId) {
            const rect = canvasRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left) / canvasScale - dragOffset.x
            const y = (e.clientY - rect.top) / canvasScale - dragOffset.y
            updateElement(selectedId, {
                x: Math.max(0, Math.min(canvasSize.w - 20, x)),
                y: Math.max(0, Math.min(canvasSize.h - 20, y)),
            })
        }

        if (resizing && selectedId) {
            const dx = (e.clientX - resizeStart.x) / canvasScale
            const dy = (e.clientY - resizeStart.y) / canvasScale
            updateElement(selectedId, {
                width: Math.max(40, resizeStart.w + dx),
                height: Math.max(40, resizeStart.h + dy),
            })
        }
    }, [dragging, resizing, selectedId, canvasScale, dragOffset, resizeStart, canvasSize])

    const handlePointerUp = useCallback(() => {
        setDragging(false)
        setResizing(null)
    }, [])

    const handleResizeStart = (e: React.PointerEvent, corner: string) => {
        e.stopPropagation()
        if (!selected || selected.locked) return
        setResizing(corner)
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            w: selected.width,
            h: selected.height,
            ex: selected.x,
            ey: selected.y,
        })
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    /* ─── Add tools ──────────────────────────────────────────── */
    const addText = () => {
        addElement({
            type: 'text',
            width: 400, height: 80,
            content: 'Double click to edit',
            fontSize: 32, fontFamily: campaign?.font_family || 'Inter',
            fontWeight: '600', fontStyle: 'normal',
            textColor: '#ffffff', textAlign: 'center',
        })
    }

    const addShape = () => {
        addElement({
            type: 'shape',
            width: 200, height: 200,
            bgColor: campaign?.primary_color || '#c8401a',
            borderRadius: 16, opacity: 0.3,
        })
    }

    const addQR = () => {
        addElement({
            type: 'qr',
            width: 240, height: 240,
            x: canvasSize.w / 2 - 120,
            y: canvasSize.h / 2 - 120,
        })
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
        const reader = new FileReader()
        reader.onload = () => {
            addElement({
                type: 'image',
                width: 400, height: 400,
                src: reader.result as string,
                objectFit: 'cover',
            })
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setBgImage(reader.result as string)
            setBgTemplate(null)
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const selectTemplate = (num: number) => {
        setBgTemplate(num)
        setBgImage(null)
        setShowTemplates(false)
    }

    /* ─── Regenerate AI content ──────────────────────────────── */
    const [regenerating, setRegenerating] = useState(false)
    const regenerateFromAI = async () => {
        if (!campaign) return
        setRegenerating(true)
        try {
            await aiApi.generateContent({
                campaign_id: campaign.id,
                business_name: campaign.business_name,
                business_description: campaign.business_description || '',
                target_audience: campaign.target_audience,
                cta_type: campaign.cta_type || 'buy',
                custom_cta: campaign.custom_cta,
            })
            // Re-fetch updated campaign
            const campRes = await campaignApi.get(campaign.id)
            const updatedCamp = campRes.data.campaign
            setCampaign(updatedCamp)
            // Re-populate elements with new AI content
            populateFromCampaign(updatedCamp)
            // Refresh user to update credit count in header
            await refreshUser()
            toast.success('AI content regenerated!')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to regenerate AI content')
        } finally {
            setRegenerating(false)
        }
    }

    /* ─── Export ──────────────────────────────────────────────── */
    const exportFlyer = async (format: 'png' | 'jpg') => {
        if (!canvasRef.current) return
        setExporting(true)
        setSelectedId(null)  // hide selection handles

        // Wait for re-render without selection borders
        await new Promise(r => setTimeout(r, 100))

        try {
            const exportFn = format === 'png' ? toPng : toJpeg
            const dataUrl = await exportFn(canvasRef.current, {
                width: canvasSize.w,
                height: canvasSize.h,
                style: {
                    transform: 'none',
                    width: `${canvasSize.w}px`,
                    height: `${canvasSize.h}px`,
                },
                pixelRatio: 1,
                quality: 0.95,
            })
            const link = document.createElement('a')
            link.download = `${campaign?.name || 'flyer'}-${canvasSize.label.replace(/\s/g, '-')}.${format}`
            link.href = dataUrl
            link.click()
            toast.success(`Flyer downloaded as ${format.toUpperCase()}!`)
        } catch (err) {
            console.error(err)
            toast.error('Export failed. Try again.')
        } finally {
            setExporting(false)
        }
    }

    /* ─── Inline text editing ────────────────────────────────── */
    const [editingTextId, setEditingTextId] = useState<string | null>(null)

    const handleDoubleClick = (e: React.MouseEvent, el: FlyerElement) => {
        e.stopPropagation()
        if (el.type === 'text') {
            setEditingTextId(el.id)
        }
    }

    /* ─── Keyboard shortcuts ─────────────────────────────────── */
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (editingTextId) return // don't intercept while typing
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) deleteElement(selectedId)
            }
            if (e.key === 'Escape') {
                setSelectedId(null)
                setEditingTextId(null)
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault()
                if (selectedId) duplicateElement(selectedId)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selectedId, editingTextId])

    /* ─── Render ─────────────────────────────────────────────── */
    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col">
            {/* Top toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/dashboard/campaigns`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <span className="text-sm font-medium truncate max-w-[200px]">{campaign?.name || 'Flyer'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Aspect ratio */}
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                        className="text-xs px-2 py-1.5 border border-border rounded-lg bg-card"
                    >
                        {Object.entries(CANVAS_SIZES).map(([key, val]) => (
                            <option key={key} value={key}>{val.label} ({key})</option>
                        ))}
                    </select>

                    {/* Export */}
                    <button
                        onClick={() => exportFlyer('png')}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        PNG
                    </button>
                    <button
                        onClick={() => exportFlyer('jpg')}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 disabled:opacity-50"
                    >
                        JPG
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── Left toolbar ──────────────────────────── */}
                <div className="w-64 border-r border-border bg-card overflow-y-auto shrink-0">
                    <div className="p-3 space-y-4">
                        {/* Tools */}
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Elements</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button onClick={addText} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs">
                                    <Type className="w-4 h-4" /> Text
                                </button>
                                <label className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs cursor-pointer">
                                    <ImageIcon className="w-4 h-4" /> Image
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                                <button onClick={addQR} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs">
                                    <QrCode className="w-4 h-4" /> QR Code
                                </button>
                                <button onClick={addShape} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs">
                                    <Square className="w-4 h-4" /> Shape
                                </button>
                            </div>
                        </div>

                        {/* AI Regenerate */}
                        <div>
                            <button
                                onClick={regenerateFromAI}
                                disabled={regenerating}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                            >
                                {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {regenerating ? 'Generating...' : 'Regenerate with AI'}
                            </button>
                            <p className="text-[10px] text-muted-foreground mt-1 text-center">Uses 5 credits</p>
                        </div>

                        {/* Background */}
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setBgImage(null); setBgTemplate(null) }}
                                        className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
                                    <span className="text-xs text-muted-foreground">Solid color</span>
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                                    <ImageIcon className="w-3.5 h-3.5" /> Upload background
                                    <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                                </label>
                                <button onClick={() => setShowTemplates(!showTemplates)} className="w-full flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 text-xs">
                                    <LayoutTemplate className="w-3.5 h-3.5" /> {showTemplates ? 'Hide' : 'Browse'} Templates ({TEMPLATE_COUNT})
                                </button>
                            </div>
                        </div>

                        {/* Template grid */}
                        {showTemplates && (
                            <div className="grid grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
                                {Array.from({ length: TEMPLATE_COUNT }, (_, i) => i + 1).map(num => (
                                    <button
                                        key={num}
                                        onClick={() => selectTemplate(num)}
                                        className={`rounded-lg overflow-hidden border-2 transition-all aspect-[3/4] ${bgTemplate === num ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <img src={`/templates/${String(num).padStart(2, '0')}.png`} alt={`Template ${num}`}
                                            className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Layers */}
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                <Layers className="w-3 h-3 inline mr-1" /> Layers ({elements.length})
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {[...elements].reverse().map(el => (
                                    <button
                                        key={el.id}
                                        onClick={() => setSelectedId(el.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left ${selectedId === el.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 text-muted-foreground'}`}
                                    >
                                        {el.type === 'text' ? <Type className="w-3 h-3 shrink-0" /> :
                                            el.type === 'image' ? <ImageIcon className="w-3 h-3 shrink-0" /> :
                                                el.type === 'qr' ? <QrCode className="w-3 h-3 shrink-0" /> :
                                                    <Square className="w-3 h-3 shrink-0" />}
                                        <span className="truncate">
                                            {el.type === 'text' ? (el.content?.slice(0, 20) || 'Text') :
                                                el.type === 'image' ? 'Image' :
                                                    el.type === 'qr' ? 'QR Code' : 'Shape'}
                                        </span>
                                        {el.locked && <Lock className="w-2.5 h-2.5 ml-auto shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Canvas area ───────────────────────────── */}
                <div
                    ref={canvasWrapRef}
                    className="flex-1 bg-muted/30 overflow-auto flex items-center justify-center p-6"
                    onClick={() => { setSelectedId(null); setEditingTextId(null) }}
                >
                    {/* Scaled wrapper — gives the flex parent the correct visual dimensions */}
                    <div style={{ width: canvasSize.w * canvasScale, height: canvasSize.h * canvasScale, flexShrink: 0 }}>
                        <div
                            ref={canvasRef}
                            className="relative overflow-hidden shadow-2xl"
                            style={{
                                width: canvasSize.w,
                                height: canvasSize.h,
                                transform: `scale(${canvasScale})`,
                                transformOrigin: 'top left',
                                background: bgTemplate
                                    ? `url(/templates/${String(bgTemplate).padStart(2, '0')}.png) center/cover`
                                    : bgImage
                                        ? `url(${bgImage}) center/cover`
                                        : bgColor,
                            }}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                        >
                        {/* Elements */}
                        {elements.map(el => (
                            <div
                                key={el.id}
                                data-element
                                className={`absolute group ${selectedId === el.id ? 'z-50' : ''}`}
                                style={{
                                    left: el.x,
                                    top: el.y,
                                    width: el.width,
                                    height: el.height,
                                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                                    cursor: el.locked ? 'default' : 'move',
                                    outline: selectedId === el.id ? '2px solid #3b82f6' : undefined,
                                    outlineOffset: 2,
                                }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                                onDoubleClick={(e) => handleDoubleClick(e, el)}
                            >
                                {/* Element content */}
                                {el.type === 'text' && (
                                    editingTextId === el.id ? (
                                        <textarea
                                            autoFocus
                                            value={el.content || ''}
                                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                            onBlur={() => setEditingTextId(null)}
                                            onClick={(e) => e.stopPropagation()}
                                            onPointerDown={(e) => e.stopPropagation()}
                                            className="w-full h-full bg-transparent border-none outline-none resize-none p-0"
                                            style={{
                                                fontSize: el.fontSize,
                                                fontFamily: el.fontFamily,
                                                fontWeight: el.fontWeight as any,
                                                fontStyle: el.fontStyle,
                                                color: el.textColor,
                                                textAlign: el.textAlign as any,
                                                lineHeight: 1.3,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full overflow-hidden"
                                            style={{
                                                fontSize: el.fontSize,
                                                fontFamily: el.fontFamily,
                                                fontWeight: el.fontWeight as any,
                                                fontStyle: el.fontStyle,
                                                color: el.textColor,
                                                textAlign: el.textAlign as any,
                                                lineHeight: 1.3,
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {el.content}
                                        </div>
                                    )
                                )}

                                {el.type === 'image' && (
                                    <img src={el.src} alt="" className="w-full h-full pointer-events-none"
                                        style={{ objectFit: (el.objectFit || 'cover') as any, borderRadius: el.borderRadius || 0 }} />
                                )}

                                {el.type === 'shape' && (
                                    <div className="w-full h-full" style={{
                                        backgroundColor: el.bgColor || '#c8401a',
                                        borderRadius: el.borderRadius || 0,
                                        opacity: el.opacity ?? 1,
                                        border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#fff'}` : undefined,
                                    }} />
                                )}

                                {el.type === 'qr' && (() => {
                                    const logo = getQrScanLogo(el.id)
                                    return (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ScanLogoPreview
                                            url={'https://nowqr.com'}
                                            shortUrl={logo?.short_url}
                                            shape={logo?.shape || 'shield'}
                                            animation="none"
                                            color={logo?.color || campaign?.primary_color || '#c8401a'}
                                            ctaText={logo?.cta_text || campaign?.cta_button_text || 'SCAN ME'}
                                            safeScanBadge={false}
                                            centerLogoUrl={logo?.center_logo_path ? `/storage/${logo.center_logo_path}` : null}
                                            size={Math.min(el.width, el.height) - 20}
                                            minimal
                                        />
                                    </div>
                                    )
                                })()}

                                {/* Resize handle */}
                                {selectedId === el.id && !el.locked && (
                                    <div
                                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-blue-500 border-2 border-white rounded-sm cursor-nwse-resize z-50"
                                        onPointerDown={(e) => handleResizeStart(e, 'br')}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    </div>{/* end scaled wrapper */}
                </div>

                {/* ─── Right properties panel ────────────────── */}
                <div className="w-64 border-l border-border bg-card overflow-y-auto shrink-0">
                    <div className="p-3">
                        {selected ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {selected.type === 'text' ? 'Text' : selected.type === 'image' ? 'Image' : selected.type === 'qr' ? 'QR Code' : 'Shape'}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateElement(selected.id, { locked: !selected.locked })}
                                            className="p-1 rounded hover:bg-muted" title={selected.locked ? 'Unlock' : 'Lock'}>
                                            {selected.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => duplicateElement(selected.id)} className="p-1 rounded hover:bg-muted" title="Duplicate">
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => moveLayer(selected.id, 'up')} className="p-1 rounded hover:bg-muted" title="Bring forward">
                                            <ChevronUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => moveLayer(selected.id, 'down')} className="p-1 rounded hover:bg-muted" title="Send back">
                                            <ChevronDown className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => deleteElement(selected.id)} className="p-1 rounded hover:bg-muted text-red-500" title="Delete">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Position & Size */}
                                <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Position & Size</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">X</label>
                                            <input type="number" value={Math.round(selected.x)} onChange={e => updateElement(selected.id, { x: +e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Y</label>
                                            <input type="number" value={Math.round(selected.y)} onChange={e => updateElement(selected.id, { y: +e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">W</label>
                                            <input type="number" value={Math.round(selected.width)} onChange={e => updateElement(selected.id, { width: +e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">H</label>
                                            <input type="number" value={Math.round(selected.height)} onChange={e => updateElement(selected.id, { height: +e.target.value })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                    </div>
                                </div>

                                {/* Text properties */}
                                {selected.type === 'text' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Typography</p>
                                            <select value={selected.fontFamily || 'Inter'} onChange={e => updateElement(selected.id, { fontFamily: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background mb-1.5">
                                                {['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Georgia', 'Arial'].map(f =>
                                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                                )}
                                            </select>
                                            <div className="flex items-center gap-1.5">
                                                <input type="number" min={8} max={200} value={selected.fontSize || 32}
                                                    onChange={e => updateElement(selected.id, { fontSize: +e.target.value })}
                                                    className="w-16 px-2 py-1 text-xs border border-border rounded bg-background" />
                                                <button onClick={() => updateElement(selected.id, { fontWeight: selected.fontWeight === '700' ? '400' : '700' })}
                                                    className={`p-1 rounded border ${selected.fontWeight === '700' || selected.fontWeight === '800' ? 'bg-primary/10 border-primary text-primary' : 'border-border'}`}>
                                                    <Bold className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => updateElement(selected.id, { fontStyle: selected.fontStyle === 'italic' ? 'normal' : 'italic' })}
                                                    className={`p-1 rounded border ${selected.fontStyle === 'italic' ? 'bg-primary/10 border-primary text-primary' : 'border-border'}`}>
                                                    <Italic className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Alignment</p>
                                            <div className="flex gap-1">
                                                {(['left', 'center', 'right'] as const).map(align => (
                                                    <button key={align}
                                                        onClick={() => updateElement(selected.id, { textAlign: align })}
                                                        className={`p-1.5 rounded border ${selected.textAlign === align ? 'bg-primary/10 border-primary text-primary' : 'border-border'}`}>
                                                        {align === 'left' ? <AlignLeft className="w-3.5 h-3.5" /> :
                                                            align === 'center' ? <AlignCenter className="w-3.5 h-3.5" /> :
                                                                <AlignRight className="w-3.5 h-3.5" />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Text Color</p>
                                            <input type="color" value={selected.textColor || '#ffffff'}
                                                onChange={e => updateElement(selected.id, { textColor: e.target.value })}
                                                className="w-8 h-8 rounded border border-border cursor-pointer" />
                                        </div>
                                    </>
                                )}

                                {/* Shape properties */}
                                {selected.type === 'shape' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Fill</p>
                                            <input type="color" value={selected.bgColor || '#c8401a'}
                                                onChange={e => updateElement(selected.id, { bgColor: e.target.value })}
                                                className="w-8 h-8 rounded border border-border cursor-pointer" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Corner Radius</p>
                                            <input type="range" min={0} max={200} value={selected.borderRadius || 0}
                                                onChange={e => updateElement(selected.id, { borderRadius: +e.target.value })}
                                                className="w-full" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Opacity</p>
                                            <input type="range" min={0} max={100} value={(selected.opacity ?? 1) * 100}
                                                onChange={e => updateElement(selected.id, { opacity: +e.target.value / 100 })}
                                                className="w-full" />
                                        </div>
                                    </>
                                )}

                                {/* Image properties */}
                                {selected.type === 'image' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Fit</p>
                                            <select value={selected.objectFit || 'cover'}
                                                onChange={e => updateElement(selected.id, { objectFit: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background">
                                                <option value="cover">Cover</option>
                                                <option value="contain">Contain</option>
                                                <option value="fill">Stretch</option>
                                            </select>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Corner Radius</p>
                                            <input type="range" min={0} max={200} value={selected.borderRadius || 0}
                                                onChange={e => updateElement(selected.id, { borderRadius: +e.target.value })}
                                                className="w-full" />
                                        </div>
                                    </>
                                )}

                                {/* QR properties */}
                                {selected.type === 'qr' && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">ScanLogo</p>
                                        {scanLogos.length > 0 ? (
                                            <>
                                                <select
                                                    value={qrScanLogoMap[selected.id] ?? scanLogos[0]?.id ?? ''}
                                                    onChange={e => setQrScanLogoMap(prev => ({ ...prev, [selected.id]: +e.target.value }))}
                                                    className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background"
                                                >
                                                    {scanLogos.map(sl => (
                                                        <option key={sl.id} value={sl.id}>
                                                            {sl.name || `ScanLogo #${sl.id}`} — {sl.shape}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Drag to reposition. Resize to adjust size.
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                No ScanLogos found. Create one first from the ScanLogos page.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <MousePointer className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="text-xs text-muted-foreground">Select an element to edit its properties</p>
                                <p className="text-[10px] text-muted-foreground/60 mt-1">Double-click text to edit inline</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
