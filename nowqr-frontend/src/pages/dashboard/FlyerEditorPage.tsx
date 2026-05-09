import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
    ArrowLeft, Download, Type, ImageIcon, QrCode, Square, Trash2,
    Loader2, Copy, Layers, ChevronUp, ChevronDown,
    Bold, Italic, Sparkles,
    AlignLeft, AlignCenter, AlignRight, MousePointer, Lock, Unlock,
    Menu, MoreVertical, X,
} from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
import { campaignApi, scanLogoApi, aiApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import ScanLogoPreview from '@/components/ScanLogoPreview'
// @ts-ignore
import gifshot from 'gifshot'
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

let nextId = 1
function uid() { return `el_${nextId++}_${Date.now()}` }

function toArray<T = any>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[]
    if (value && typeof value === 'object' && Array.isArray((value as any).data)) {
        return (value as any).data as T[]
    }
    return []
}

function formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
}

function extractApiErrorMessage(error: any, fallback: string): string {
    if (error?.response?.status === 413) {
        return 'Upload is too large for server limits. Please try a lighter flyer design.'
    }

    const message = error?.response?.data?.message
    if (typeof message === 'string' && message.trim()) return message

    const errors = error?.response?.data?.errors
    if (errors && typeof errors === 'object') {
        for (const value of Object.values(errors as Record<string, unknown>)) {
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                return value[0]
            }
            if (typeof value === 'string' && value.trim()) {
                return value
            }
        }
    }

    if (typeof error?.message === 'string' && error.message.trim()) {
        return error.message
    }

    return fallback
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function FlyerEditorPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const isFlyerMode = searchParams.get('type') === 'flyer'
    const templateSessionToken = (location.state as { templateSessionToken?: string } | null)?.templateSessionToken
    const { user, refreshUser } = useAuth()
    const canvasRef = useRef<HTMLDivElement>(null)
    const canvasWrapRef = useRef<HTMLDivElement>(null)

    const [campaign, setCampaign] = useState<any>(null)
    const [scanLogos, setScanLogos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exportingFormat, setExportingFormat] = useState<'png' | 'jpg' | 'gif' | null>(null)
    const exporting = exportingFormat !== null

    // Canvas state
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
    const [bgColor, setBgColor] = useState('#ffffff')
    const [bgImage, setBgImage] = useState<string | null>(null)
    const [bgTemplate, setBgTemplate] = useState<number | null>(null)
    const [elements, setElements] = useState<FlyerElement[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [canvasScale, setCanvasScale] = useState(0.35)
    const [isCompactLayout, setIsCompactLayout] = useState(false)
    const [leftPanelOpen, setLeftPanelOpen] = useState(false)
    const [rightPanelOpen, setRightPanelOpen] = useState(false)

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
        let isActive = true

            ; (async () => {
                try {
                    const [campRes, logosRes] = await Promise.all([
                        campaignApi.get(Number(id)),
                        scanLogoApi.list(),
                    ])
                    if (!isActive) return

                    const camp = campRes.data.campaign
                    setCampaign(camp)

                    // Merge campaign.scan_logos with scan logos list while handling both paginated and plain-array API payloads.
                    const campaignLogos = toArray<any>(camp.scan_logos)
                    const listedLogos = toArray<any>(logosRes.data?.data ?? logosRes.data)
                    const allLogos = [...campaignLogos]
                    listedLogos.forEach((lg: any) => {
                        if (!lg?.id) return
                        if (!allLogos.find(x => x?.id === lg.id)) {
                            allLogos.push(lg)
                        }
                    })
                    setScanLogos(allLogos)

                    // Restore saved canvas state, or populate fresh from campaign data
                    // In flyer mode, prefer sessionStorage canvas from template selection
                    const sessionKey = `flyer_canvas_${camp.id}`
                    const sessionCanvas = isFlyerMode ? sessionStorage.getItem(sessionKey) : null
                    const shouldUseSessionCanvas = Boolean(isFlyerMode && templateSessionToken && sessionCanvas)

                    if (shouldUseSessionCanvas && sessionCanvas) {
                        try {
                            const parsed = JSON.parse(sessionCanvas)
                            const parsedToken = typeof parsed?._templateSessionToken === 'string'
                                ? parsed._templateSessionToken
                                : null

                            if (parsedToken && parsedToken !== templateSessionToken) {
                                populateFromCampaign(camp)
                            } else if (parsed.elements?.length) {
                                setElements(parsed.elements)
                                if (parsed.bgColor) setBgColor(parsed.bgColor)
                                if (parsed.bgImage) setBgImage(parsed.bgImage)
                                if (parsed.bgTemplate !== undefined) setBgTemplate(parsed.bgTemplate)
                                if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio as AspectRatio)
                                if (parsed.qrScanLogoMap) setQrScanLogoMap(parsed.qrScanLogoMap)
                            } else {
                                populateFromCampaign(camp)
                            }
                        } catch {
                            populateFromCampaign(camp)
                        }
                    } else {
                        const design = camp.page_design
                        if (!isFlyerMode && design && design.elements && design.elements.length > 0) {
                            setElements(design.elements)
                            if (design.bgColor) setBgColor(design.bgColor)
                            if (design.bgImage) setBgImage(design.bgImage)
                            if (design.bgTemplate !== undefined) setBgTemplate(design.bgTemplate)
                            if (design.aspectRatio) setAspectRatio(design.aspectRatio as AspectRatio)
                            if (design.qrScanLogoMap) setQrScanLogoMap(design.qrScanLogoMap)
                        } else {
                            populateFromCampaign(camp)
                        }
                    }
                } catch {
                    if (!isActive) return
                    toast.error('Failed to load campaign')
                    navigate('/dashboard/campaigns')
                } finally {
                    if (isActive) setLoading(false)
                }
            })()

        return () => {
            isActive = false
        }
    }, [id, isFlyerMode, navigate, templateSessionToken])

    /* ─── Recalculate scale on resize ────────────────────────── */
    useEffect(() => {
        function recalc() {
            if (!canvasWrapRef.current) return
            const wrap = canvasWrapRef.current.getBoundingClientRect()
            const padX = 40, padY = 40
            const scaleX = (wrap.width - padX) / canvasSize.w
            const scaleY = (wrap.height - padY) / canvasSize.h
            const nextScale = Math.min(scaleX, scaleY, 0.75)
            // Keep the post readable on smaller screens; allow scroll instead of shrinking too far.
            setCanvasScale(Math.max(nextScale, 0.35))
        }
        recalc()
        window.addEventListener('resize', recalc)
        return () => window.removeEventListener('resize', recalc)
    }, [canvasSize])

    /* ─── Compact/mobile layout handling ────────────────────── */
    useEffect(() => {
        const handleResize = () => {
            const compact = window.innerWidth < 1280
            setIsCompactLayout(compact)

            if (!compact) {
                setLeftPanelOpen(false)
                setRightPanelOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    /* ─── Remap elements when aspect ratio changes ───────────── */
    useEffect(() => {
        const prev = prevCanvasSizeRef.current
        if (prev.w === canvasSize.w && prev.h === canvasSize.h) return

        // Scale each axis independently so content fills the new ratio
        const scaleX = canvasSize.w / prev.w
        const scaleY = canvasSize.h / prev.h
        const fontScale = (scaleX + scaleY) / 2

        setElements(els => els.map(el => ({
            ...el,
            x: Math.round(el.x * scaleX),
            y: Math.round(el.y * scaleY),
            width: Math.round(el.width * scaleX),
            height: Math.round(el.height * scaleY),
            fontSize: el.fontSize ? Math.max(12, Math.round(el.fontSize * fontScale)) : el.fontSize,
        })))
        prevCanvasSizeRef.current = canvasSize
    }, [canvasSize])

    /* ─── Populate default elements from campaign ────────────── */
    const populateFromCampaign = (camp: any) => {
        const color = '#111111'
        const font = camp.font_family || 'Inter'

        // Default to high-contrast light canvas so text stays readable out of the box.
        setBgColor('linear-gradient(160deg, #ffffff 0%, #f3f4f6 100%)')

        const els: FlyerElement[] = []

        // Top accent bar
        els.push({
            id: uid(), type: 'shape', x: 0, y: 0, width: 1080, height: 8,
            rotation: 0, locked: true, bgColor: color, borderRadius: 0, opacity: 1,
        })

        // Decorative circle (top-right)
        els.push({
            id: uid(), type: 'shape', x: 680, y: 80, width: 340, height: 340,
            rotation: 0, locked: true, bgColor: color, borderRadius: 170, opacity: 0.06,
        })
        els.push({
            id: uid(), type: 'shape', x: 720, y: 120, width: 260, height: 260,
            rotation: 0, locked: true, bgColor: color, borderRadius: 130, opacity: 0.04,
        })

        // Business name
        els.push({
            id: uid(), type: 'text', x: 80, y: 160, width: 500, height: 50,
            rotation: 0, locked: false,
            content: camp.business_name || 'Your Business',
            fontSize: 24, fontFamily: font, fontWeight: '700',
            textColor: color, textAlign: 'left', fontStyle: 'normal',
        })

        // Headline
        els.push({
            id: uid(), type: 'text', x: 80, y: 320, width: 920, height: 220,
            rotation: 0, locked: false,
            content: camp.headline || 'Your Headline Here',
            fontSize: 76, fontFamily: font, fontWeight: '800',
            textColor: '#111111', textAlign: 'left', fontStyle: 'normal',
        })

        // Divider line
        els.push({
            id: uid(), type: 'shape', x: 80, y: 570, width: 80, height: 4,
            rotation: 0, locked: true, bgColor: color, borderRadius: 2, opacity: 1,
        })

        // Sub-headline
        if (camp.sub_headline) {
            els.push({
                id: uid(), type: 'text', x: 80, y: 610, width: 800, height: 80,
                rotation: 0, locked: false,
                content: camp.sub_headline,
                fontSize: 30, fontFamily: font, fontWeight: '500',
                textColor: '#111111', textAlign: 'left', fontStyle: 'normal',
            })
        }

        // Description
        if (camp.description) {
            els.push({
                id: uid(), type: 'text', x: 80, y: 730, width: 800, height: 180,
                rotation: 0, locked: false,
                content: camp.description,
                fontSize: 24, fontFamily: font, fontWeight: '400',
                textColor: '#374151', textAlign: 'left', fontStyle: 'normal',
            })
        }

        // QR placeholder
        els.push({
            id: uid(), type: 'qr', x: 80, y: 1100, width: 300, height: 300,
            rotation: 0, locked: false,
        })

        // CTA button background + text
        if (camp.cta_button_text) {
            els.push({
                id: uid(), type: 'shape', x: 80, y: 1500, width: 340, height: 70,
                rotation: 0, locked: false, bgColor: color, borderRadius: 12, opacity: 1,
            })
            els.push({
                id: uid(), type: 'text', x: 80, y: 1500, width: 340, height: 70,
                rotation: 0, locked: false,
                content: camp.cta_button_text,
                fontSize: 24, fontFamily: font, fontWeight: '700',
                textColor: '#ffffff', textAlign: 'center', fontStyle: 'normal',
            })
        }

        // Bottom accent bar
        els.push({
            id: uid(), type: 'shape', x: 0, y: 1912, width: 1080, height: 8,
            rotation: 0, locked: true, bgColor: color, borderRadius: 0, opacity: 1,
        })

        // Powered by
        els.push({
            id: uid(), type: 'text', x: 340, y: 1840, width: 400, height: 40,
            rotation: 0, locked: false,
            content: 'Powered by NowQR',
            fontSize: 16, fontFamily: font, fontWeight: '400',
            textColor: 'rgba(17,17,17,0.7)', textAlign: 'center', fontStyle: 'normal',
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

    const updateNumericElement = (
        id: string,
        key: keyof Pick<FlyerElement, 'x' | 'y' | 'width' | 'height' | 'fontSize' | 'borderRadius' | 'opacity'>,
        rawValue: string,
        options?: { min?: number }
    ) => {
        if (rawValue.trim() === '') return

        const nextValue = Number(rawValue)
        if (!Number.isFinite(nextValue)) return

        const clampedValue = typeof options?.min === 'number' ? Math.max(options.min, nextValue) : nextValue
        updateElement(id, { [key]: clampedValue } as Partial<FlyerElement>)
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
    const handlePointerDown = (e: React.PointerEvent, elId: string, forceDrag = false) => {
        e.stopPropagation()
        const el = elements.find(x => x.id === elId)
        if (!el || el.locked) return
        setSelectedId(elId)

        const isTouchLike = e.pointerType === 'touch' || e.pointerType === 'pen'
        if (isCompactLayout && isTouchLike && !forceDrag) {
            // On compact touch layouts, allow swipe-to-scroll by default.
            // Dragging is initiated intentionally from the dedicated drag handle.
            return
        }

        setDragging(true)
        const rect = (e.target as HTMLElement).closest('[data-element]')?.getBoundingClientRect()
        if (rect) {
            setDragOffset({
                x: (e.clientX - rect.left) / canvasScale,
                y: (e.clientY - rect.top) / canvasScale,
            })
        }

        ; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
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
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    /* ─── Add tools ──────────────────────────────────────────── */
    const addText = () => {
        addElement({
            type: 'text',
            width: 400, height: 80,
            content: 'Double click to edit',
            fontSize: 32, fontFamily: campaign?.font_family || 'Inter',
            fontWeight: '600', fontStyle: 'normal',
            textColor: '#111111', textAlign: 'center',
        })
    }

    const addShape = () => {
        addElement({
            type: 'shape',
            width: 200, height: 200,
            bgColor: '#111111',
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
    const [saving, setSaving] = useState(false)

    const exportFlyer = async (format: 'png' | 'jpg' | 'gif') => {
        if (!canvasRef.current) return
        setExportingFormat(format)
        setSelectedId(null)  // hide selection handles

        // Wait for re-render without selection borders
        await new Promise(r => setTimeout(r, 100))

        try {
            if (format === 'gif') {
                const frames: string[] = []
                for (let i = 0; i < 10; i++) {
                    const dataUrl = await toPng(canvasRef.current, {
                        width: canvasSize.w,
                        height: canvasSize.h,
                        style: { transform: 'none', width: `${canvasSize.w}px`, height: `${canvasSize.h}px` },
                        pixelRatio: 1,
                        cacheBust: true,
                    })
                    frames.push(dataUrl)
                    await new Promise(r => setTimeout(r, 150))
                }

                const gifDataUrl = await new Promise<string>((resolve, reject) => {
                    gifshot.createGIF({
                        images: frames,
                        gifWidth: canvasSize.w,
                        gifHeight: canvasSize.h,
                        interval: 0.15,
                    }, (obj: any) => {
                        if (!obj.error) {
                            resolve(obj.image)
                        } else {
                            reject(new Error(obj.errorMsg || 'Failed to encode GIF'))
                        }
                    })
                })

                const link = document.createElement('a')
                link.download = `${campaign?.name || 'flyer'}-${canvasSize.label.replace(/\s/g, '-')}.gif`
                link.href = gifDataUrl
                link.click()
                toast.success('Flyer downloaded as GIF!')
                return
            }

            const exportFn = format === 'png' ? toPng : toJpeg
            const dataUrl = await exportFn(canvasRef.current, {
                width: canvasSize.w,
                height: canvasSize.h,
                style: {
                    transform: 'none',
                    width: `${canvasSize.w}px`,
                    height: `${canvasSize.h}px`,
                },
                pixelRatio: 2,
                quality: 0.95,
                cacheBust: true,
            })
            const link = document.createElement('a')
            link.download = `${campaign?.name || 'flyer'}-${canvasSize.label.replace(/\s/g, '-')}.${format}`
            link.href = dataUrl
            link.click()
            toast.success(`Flyer downloaded as ${format.toUpperCase()}!`)

            // Save canvas state to campaign for restoring later (only in post mode)
            if (campaign && !isFlyerMode) {
                campaignApi.update(campaign.id, {
                    page_design: { elements, bgColor, bgImage, bgTemplate, aspectRatio, qrScanLogoMap },
                }).catch(() => { /* silent */ })
            }
        } catch (err) {
            console.error(err)
            toast.error('Export failed. Try again.')
        } finally {
            setExportingFormat(null)
        }
    }

    /* ─── Save Flyer to Campaign ─────────────────────────────── */
    const saveToCampaign = async () => {
        if (!canvasRef.current || !campaign) return
        setSaving(true)
        setSelectedId(null)
        await new Promise(r => setTimeout(r, 100))

        try {
            if (isFlyerMode) {
                // Keep upload under common PHP limits (2 MB default) by progressively reducing JPEG quality.
                const maxUploadBytes = Math.floor(1.9 * 1024 * 1024)
                const variants = [
                    { pixelRatio: 1.15, quality: 0.9 },
                    { pixelRatio: 1, quality: 0.85 },
                    { pixelRatio: 1, quality: 0.78 },
                    { pixelRatio: 1, quality: 0.7 },
                ]

                let uploadFile: File | null = null
                let smallestFile: File | null = null

                for (const variant of variants) {
                    const dataUrl = await toJpeg(canvasRef.current, {
                        width: canvasSize.w,
                        height: canvasSize.h,
                        style: { transform: 'none', width: `${canvasSize.w}px`, height: `${canvasSize.h}px` },
                        pixelRatio: variant.pixelRatio,
                        quality: variant.quality,
                        cacheBust: true,
                    })
                    const res = await fetch(dataUrl)
                    const blob = await res.blob()
                    const candidate = new File([blob], `flyer-${Date.now()}.jpg`, { type: 'image/jpeg' })

                    if (!smallestFile || candidate.size < smallestFile.size) {
                        smallestFile = candidate
                    }

                    if (candidate.size <= maxUploadBytes) {
                        uploadFile = candidate
                        break
                    }
                }

                if (!uploadFile) {
                    uploadFile = smallestFile
                }

                if (!uploadFile) {
                    throw new Error('Unable to generate flyer image for upload')
                }

                if (uploadFile.size > maxUploadBytes) {
                    toast.error(`Flyer image is too large to upload (${formatBytes(uploadFile.size)}).`)
                    return
                }

                await campaignApi.storeFlyer(campaign.id, {
                    title: `${campaign.name} — ${canvasSize.label}`,
                    image: uploadFile,
                    canvas_state: JSON.stringify({ elements, bgColor, bgImage, bgTemplate, aspectRatio }),
                })
                toast.success('Flyer saved to campaign!')
            } else {
                // Post mode — save canvas state to campaign's page_design
                await campaignApi.update(campaign.id, {
                    page_design: { elements, bgColor, bgImage, bgTemplate, aspectRatio, qrScanLogoMap },
                })
                toast.success('Design saved!')
            }
        } catch (err: any) {
            console.error(err)
            toast.error(extractApiErrorMessage(err, 'Failed to save'))
        } finally {
            setSaving(false)
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
            const target = e.target as HTMLElement | null
            const isEditableTarget = !!target?.closest('input, textarea, select, [contenteditable="true"]')

            if (editingTextId) return // don't intercept while typing
            if (isEditableTarget) return
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) deleteElement(selectedId)
            }
            if (e.key === 'Escape') {
                setSelectedId(null)
                setEditingTextId(null)
                setLeftPanelOpen(false)
                setRightPanelOpen(false)
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
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    const toolbarActionButtons = (
        <>
            {/* Aspect ratio */}
            <Select value={aspectRatio} onValueChange={v => setAspectRatio(v as AspectRatio)}>
                <SelectTrigger className="text-xs h-8 w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(CANVAS_SIZES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label} ({key})</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Save to Campaign */}
            <button
                onClick={saveToCampaign}
                disabled={saving || exporting}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 ${isCompactLayout ? 'min-w-24 justify-center' : ''}`}
            >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                {isFlyerMode ? 'Save Flyer' : 'Save'}
            </button>

            {/* Export */}
            <button
                onClick={() => exportFlyer('png')}
                disabled={exporting || saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50 ${isCompactLayout ? 'min-w-20 justify-center' : ''}`}
            >
                {exportingFormat === 'png' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PNG
            </button>
            <button
                onClick={() => exportFlyer('jpg')}
                disabled={exporting || saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 disabled:opacity-50 ${isCompactLayout ? 'min-w-20 justify-center' : ''}`}
            >
                {exportingFormat === 'jpg' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                JPG
            </button>
            <button
                onClick={() => exportFlyer('gif')}
                disabled={exporting || saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 disabled:opacity-50 ${isCompactLayout ? 'min-w-20 justify-center' : ''}`}
            >
                {exportingFormat === 'gif' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                GIF
            </button>
        </>
    )

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col relative">
            {/* Top toolbar */}
            {isCompactLayout ? (
                <div className="px-3 py-2 border-b border-border bg-card shrink-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                                onClick={() => {
                                    setLeftPanelOpen((prev) => !prev)
                                    setRightPanelOpen(false)
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                                title="Open tools"
                                aria-label="Open tools panel"
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                            <button onClick={() => navigate(`/dashboard/campaigns/${id}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0">
                                <ArrowLeft className="w-4 h-4" /> Back
                            </button>
                            <span className="text-sm font-medium truncate min-w-0 flex-1">{campaign?.name || 'Flyer'}</span>
                        </div>

                        <button
                            onClick={() => {
                                setRightPanelOpen((prev) => !prev)
                                setLeftPanelOpen(false)
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                            title="Open properties"
                            aria-label="Open properties panel"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="w-full overflow-x-auto pb-1">
                        <div className="flex items-center gap-2 w-max min-w-full pr-1">
                            {toolbarActionButtons}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(`/dashboard/campaigns/${id}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <span className="text-sm font-medium truncate max-w-50">{campaign?.name || 'Flyer'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {toolbarActionButtons}
                    </div>
                </div>
            )}

            <div className="relative flex flex-1 overflow-hidden">
                {isCompactLayout && (leftPanelOpen || rightPanelOpen) && (
                    <button
                        className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[1px]"
                        aria-label="Close side panels"
                        onClick={() => {
                            setLeftPanelOpen(false)
                            setRightPanelOpen(false)
                        }}
                    />
                )}

                {/* ─── Left toolbar ──────────────────────────── */}
                <div
                    className={`w-64 border-r border-border bg-card overflow-y-auto shrink-0 ${isCompactLayout
                        ? `absolute inset-y-0 left-0 z-30 shadow-xl transition-transform duration-300 ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full'}`
                        : 'relative'
                        }`}
                >
                    <div className="p-3 space-y-4">
                        {isCompactLayout && (
                            <div className="flex items-center justify-between pb-2 border-b border-border">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor Tools</p>
                                <button
                                    onClick={() => setLeftPanelOpen(false)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted/60"
                                    aria-label="Close tools panel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

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
                        {!isFlyerMode && (
                            <div>
                                <button
                                    onClick={regenerateFromAI}
                                    disabled={regenerating}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                                >
                                    {regenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {regenerating ? 'Generating...' : 'Regenerate with AI'}
                                </button>
                                <p className="text-[10px] text-muted-foreground mt-1 text-center">{user?.is_admin ? 'Admin: no credits charged' : 'Uses 5 credits'}</p>
                            </div>
                        )}

                        {/* Background */}
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Background</p>
                            <div className="space-y-2">
                                {/* Current bg preview + color picker */}
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded border border-border shrink-0 overflow-hidden">
                                        <div className="w-full h-full" style={{ background: bgImage ? `url(${bgImage}) center/cover` : bgColor }} />
                                    </div>
                                    <input type="color" value={bgColor.startsWith('#') ? bgColor : '#ffffff'} onChange={e => { setBgColor(e.target.value); setBgImage(null); setBgTemplate(null) }}
                                        className="w-8 h-8 rounded border border-border cursor-pointer shrink-0" />
                                    <span className="text-xs text-muted-foreground">Solid color</span>
                                </div>
                                <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 cursor-pointer text-xs">
                                    <ImageIcon className="w-3.5 h-3.5" /> Upload background
                                    <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

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
                    className={`flex-1 bg-muted/30 overflow-auto p-6 ${isCompactLayout ? 'flex items-start justify-start' : 'flex items-center justify-center'}`}
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        overscrollBehaviorX: 'contain',
                        overscrollBehaviorY: 'contain',
                        touchAction: isCompactLayout ? 'pan-x pan-y' : 'auto',
                    }}
                    onClick={() => {
                        setSelectedId(null)
                        setEditingTextId(null)
                        if (isCompactLayout) {
                            setLeftPanelOpen(false)
                            setRightPanelOpen(false)
                        }
                    }}
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
                                background: bgImage
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
                                                className="w-full h-full overflow-hidden flex items-center justify-center"
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
                                                    url={logo?.destination_url || logo?.short_url || campaign?.public_url || 'https://nowqr.com'}
                                                    shortUrl={logo?.short_url}
                                                    shape={logo?.shape || 'shield'}
                                                    animation={logo?.animation || 'none'}
                                                    color={logo?.color || campaign?.primary_color || '#c8401a'}
                                                    wrapperColor={logo?.wrapper_color || logo?.color || campaign?.primary_color || '#c8401a'}
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

                                    {/* Mobile drag handle: keeps swipe-to-scroll usable on compact layouts */}
                                    {selectedId === el.id && !el.locked && isCompactLayout && (
                                        <button
                                            type="button"
                                            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-border bg-background/95 shadow-md flex items-center justify-center touch-none z-50"
                                            onPointerDown={(e) => handlePointerDown(e, el.id, true)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label="Drag element"
                                            title="Drag element"
                                        >
                                            <MousePointer className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>{/* end scaled wrapper */}
                </div>

                {/* ─── Right properties panel ────────────────── */}
                <div
                    className={`w-64 border-l border-border bg-card overflow-y-auto shrink-0 ${isCompactLayout
                        ? `absolute inset-y-0 right-0 z-30 shadow-xl transition-transform duration-300 ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full'}`
                        : 'relative'
                        }`}
                >
                    <div className="p-3">
                        {isCompactLayout && (
                            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Properties</p>
                                <button
                                    onClick={() => setRightPanelOpen(false)}
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted/60"
                                    aria-label="Close properties panel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

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
                                            <input type="number" value={Math.round(selected.x)} onChange={e => updateNumericElement(selected.id, 'x', e.currentTarget.value)}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">Y</label>
                                            <input type="number" value={Math.round(selected.y)} onChange={e => updateNumericElement(selected.id, 'y', e.currentTarget.value)}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">W</label>
                                            <input type="number" min={1} value={Math.round(selected.width)} onChange={e => updateNumericElement(selected.id, 'width', e.currentTarget.value, { min: 1 })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground">H</label>
                                            <input type="number" min={1} value={Math.round(selected.height)} onChange={e => updateNumericElement(selected.id, 'height', e.currentTarget.value, { min: 1 })}
                                                className="w-full px-2 py-1 text-xs border border-border rounded bg-background" />
                                        </div>
                                    </div>
                                </div>

                                {/* Text properties */}
                                {selected.type === 'text' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Typography</p>
                                            <Select value={selected.fontFamily || 'Inter'} onValueChange={v => updateElement(selected.id, { fontFamily: v })}>
                                                <SelectTrigger className="text-xs h-8 mb-1.5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato', 'Georgia', 'Arial'].map(f =>
                                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <div className="flex items-center gap-1.5">
                                                <input type="number" min={12} max={200} value={selected.fontSize || 32}
                                                    onChange={e => updateNumericElement(selected.id, 'fontSize', e.currentTarget.value, { min: 12 })}
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
                                            <input type="color" value={selected.textColor || '#111111'}
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
                                            <input type="color" value={selected.bgColor || '#111111'}
                                                onChange={e => updateElement(selected.id, { bgColor: e.target.value })}
                                                className="w-8 h-8 rounded border border-border cursor-pointer" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Corner Radius</p>
                                            <input type="range" min={0} max={200} value={selected.borderRadius || 0}
                                                onChange={e => updateNumericElement(selected.id, 'borderRadius', e.currentTarget.value, { min: 0 })}
                                                className="w-full" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Opacity</p>
                                            <input type="range" min={0} max={100} value={(selected.opacity ?? 1) * 100}
                                                onChange={e => updateNumericElement(selected.id, 'opacity', String(Number(e.currentTarget.value) / 100), { min: 0 })}
                                                className="w-full" />
                                        </div>
                                    </>
                                )}

                                {/* Image properties */}
                                {selected.type === 'image' && (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Fit</p>
                                            <Select value={selected.objectFit || 'cover'} onValueChange={v => updateElement(selected.id, { objectFit: v })}>
                                                <SelectTrigger className="text-xs h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cover">Cover</SelectItem>
                                                    <SelectItem value="contain">Contain</SelectItem>
                                                    <SelectItem value="fill">Stretch</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Corner Radius</p>
                                            <input type="range" min={0} max={200} value={selected.borderRadius || 0}
                                                onChange={e => updateNumericElement(selected.id, 'borderRadius', e.currentTarget.value, { min: 0 })}
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
                                                <Select value={String(qrScanLogoMap[selected.id] ?? scanLogos[0]?.id ?? '')} onValueChange={v => setQrScanLogoMap(prev => ({ ...prev, [selected.id]: +v }))}>
                                                    <SelectTrigger className="text-xs h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {scanLogos.map(sl => (
                                                            <SelectItem key={sl.id} value={String(sl.id)}>
                                                                {sl.name || `ScanLogo #${sl.id}`} — {sl.shape}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
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
