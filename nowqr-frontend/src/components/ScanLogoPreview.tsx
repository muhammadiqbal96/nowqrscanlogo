import { useRef, forwardRef, useImperativeHandle, useState, useEffect, useId } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Shield } from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
// @ts-ignore
import gifshot from 'gifshot'
import { getQrScaleForShape, getScanLogoVisuals, getShapeFrameScale } from '@/lib/scanLogoVisuals'
import './ScanLogoPreview.css'

export interface ScanLogoPreviewProps {
    url: string
    shape?: string
    animation?: string
    color?: string
    wrapperColor?: string
    ctaText?: string
    /** Secondary "where the action goes" line shown under the headline (Action ScanLogo frames) */
    subtitle?: string
    safeScanBadge?: boolean
    centerLogoUrl?: string | null
    shortUrl?: string
    size?: number
    /** When true, hides CTA text, short URL and safe-scan badge (for flyer embed) */
    minimal?: boolean
    bannerTemplate?: string
}

export interface ScanLogoPreviewRef {
    downloadPNG: () => Promise<void>
    downloadJPG: () => Promise<void>
    downloadGIF: () => Promise<void>
}

type SupportedAnimation = 'spin' | 'pulse' | 'expand' | 'bounce' | 'glow' | 'flash' | 'orbit' | 'none'

const SUPPORTED_ANIMATIONS: SupportedAnimation[] = ['spin', 'pulse', 'expand', 'bounce', 'glow', 'flash', 'orbit', 'none']

const SHAPE_SVG_PATHS: Record<string, React.ReactNode> = {
    circle: <circle cx="12" cy="12" r="10" />,
    square: <rect width="18" height="18" x="3" y="3" rx="2" />,
    drum: (
        <g>
            <circle cx="12" cy="12" r="9.2" />
            <circle cx="12" cy="12" r="7.1" fill="none" />
            <circle cx="12" cy="2.9" r="0.7" />
            <circle cx="16.8" cy="4.2" r="0.7" />
            <circle cx="20.1" cy="7.1" r="0.7" />
            <circle cx="21.1" cy="12" r="0.7" />
            <circle cx="20.1" cy="16.9" r="0.7" />
            <circle cx="16.8" cy="19.8" r="0.7" />
            <circle cx="12" cy="21.1" r="0.7" />
            <circle cx="7.2" cy="19.8" r="0.7" />
            <circle cx="3.9" cy="16.9" r="0.7" />
            <circle cx="2.9" cy="12" r="0.7" />
            <circle cx="3.9" cy="7.1" r="0.7" />
            <circle cx="7.2" cy="4.2" r="0.7" />
        </g>
    ),
    tv: (
        <g>
            <rect x="4.2" y="5" width="15.6" height="13.8" rx="3.8" />
            <path d="M3.2 8.8c-1.3.9-2 2-2 3.2s.7 2.3 2 3.2" fill="none" />
            <path d="M20.8 8.8c1.3.9 2 2 2 3.2s-.7 2.3-2 3.2" fill="none" />
            <path d="M9.4 3.5 12 5.1l2.6-1.6" fill="none" />
        </g>
    ),
    shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
    hexagon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
    diamond: <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />,
    gear: <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915Z" />,
    eye: <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
}

function normalizeAnimation(animation?: string): SupportedAnimation {
    const normalized = (animation || '').toLowerCase() as SupportedAnimation
    return SUPPORTED_ANIMATIONS.includes(normalized) ? normalized : 'none'
}

function parseAnimationDurationMs(durationValue: string): number {
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

function getOrbitTextLayout(
    ctaText: string,
    orbitRadius = 44,
    minFontSize = 7,
    maxFontSize = 9
): { text: string; fontSizePx: number; circumference: number } {
    const orbitUnit = `${ctaText} • `
    const circumference = 2 * Math.PI * orbitRadius

    // Tuned coefficients for bold uppercase text with tracking in SVG textPath.
    const avgGlyphAdvanceEm = 0.56
    const trackingEm = 0.11

    let bestText = orbitUnit.repeat(4)
    let bestFontSize = 8
    let bestDiff = Number.POSITIVE_INFINITY
    let bestRepeatCount = 4

    for (let repeatCount = 1; repeatCount <= 12; repeatCount++) {
        const chars = orbitUnit.length * repeatCount
        if (!chars) continue

        const rawFontSize = circumference / (chars * (avgGlyphAdvanceEm + trackingEm))
        const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, rawFontSize))
        const estimatedSpan = chars * clampedFontSize * (avgGlyphAdvanceEm + trackingEm)
        const diff = Math.abs(circumference - estimatedSpan)

        if (diff < bestDiff) {
            bestDiff = diff
            bestRepeatCount = repeatCount
            bestFontSize = clampedFontSize
        }
    }

    // Use the calculated best repeat count to fit the circle perfectly without overlapping layers.
    bestText = orbitUnit.repeat(bestRepeatCount)

    return {
        text: bestText,
        fontSizePx: Number(bestFontSize.toFixed(2)),
        circumference,
    }
}

const getWrapperShellRadius = (shape: string): string => {
    const s = shape.toLowerCase()
    if (s === 'circle' || s === 'drum') return '999px'
    if (s === 'square' || s === 'tv') return '22px'
    if (s === 'hexagon') return '28px'
    if (s === 'shield' || s === 'diamond' || s === 'gear' || s === 'eye') return '32px'
    return '999px'
}



const isLightColor = (hex?: string) => {
    if (!hex) return false
    const color = hex.replace('#', '')
    if (color.length === 3) {
        const r = parseInt(color[0] + color[0], 16)
        const g = parseInt(color[1] + color[1], 16)
        const b = parseInt(color[2] + color[2], 16)
        return (r * 299 + g * 587 + b * 114) / 1000 > 180
    }
    if (color.length === 6) {
        const r = parseInt(color.slice(0, 2), 16)
        const g = parseInt(color.slice(2, 4), 16)
        const b = parseInt(color.slice(4, 6), 16)
        return (r * 299 + g * 587 + b * 114) / 1000 > 180
    }
    return false
}

const ScanLogoPreview = forwardRef<ScanLogoPreviewRef, ScanLogoPreviewProps>(function ScanLogoPreview({
    url,
    shape = 'shield',
    animation = 'spin',
    color = '#111111',
    wrapperColor,
    ctaText = 'TAP TO SCAN',
    subtitle,
    safeScanBadge = true,
    centerLogoUrl,
    shortUrl,
    size = 200,
    minimal = false,
    bannerTemplate = 'arch',
}, ref) {
    const qrRef = useRef<any>(null)
    const normalizedShape = (shape || 'shield').toLowerCase()
    const normalizedAnimation = normalizeAnimation(animation)
    const compactMode = size < 96

    // Scale down the base size so that the total outer width fits within `size`.
    // Total width is shapeSize + 2 * shellPadding.
    // In normal mode: shellPadding = 10, so total width is shapeSize * 1.12.
    // In compact mode: shellPadding = 0, so total width is shapeSize.
    const scaleFactor = getShapeFrameScale(normalizedShape) * (compactMode ? 1.0 : 1.12)
    const adjustedSize = Math.max(20, Math.round(size / scaleFactor))

    // Keep QR module stable while wrapper visuals animate around it.
    const shapeSize = Math.round(adjustedSize * getShapeFrameScale(normalizedShape))
    const shellPadding = compactMode ? 0 : 10
    const qrSize = Math.floor(adjustedSize * getQrScaleForShape(normalizedShape))

    const getQrCardMultiplier = (shapeName: string) => {
        const s = shapeName.toLowerCase()
        if (s === 'square') return 0.76
        if (s === 'circle') return 0.64
        if (s === 'hexagon') return 0.66
        if (s === 'shield') return 0.64
        if (s === 'diamond') return 0.58
        if (s === 'gear') return 0.66
        if (s === 'eye') return 0.64
        if (s === 'drum') return 0.66
        if (s === 'tv') return 0.68
        return 0.66
    }

    const getEyeRadiusForShape = (shapeName: string): any => {
        const s = shapeName.toLowerCase()
        if (s === 'circle' || s === 'gear') {
            return [
                { outer: [12, 12, 12, 12], inner: [6, 6, 6, 6] },
                { outer: [12, 12, 12, 12], inner: [6, 6, 6, 6] },
                { outer: [12, 12, 12, 12], inner: [6, 6, 6, 6] },
            ]
        }
        if (s === 'square' || s === 'tv') {
            return [
                { outer: [4, 4, 4, 4], inner: [2, 2, 2, 2] },
                { outer: [4, 4, 4, 4], inner: [2, 2, 2, 2] },
                { outer: [4, 4, 4, 4], inner: [2, 2, 2, 2] },
            ]
        }
        // Shield, Diamond, Hexagon, Drum, Eye: rounded outer shield corner finders
        return [
            { outer: [12, 12, 0, 12], inner: [6, 6, 0, 6] },
            { outer: [12, 12, 12, 0], inner: [6, 6, 6, 0] },
            { outer: [12, 0, 12, 12], inner: [6, 0, 6, 6] },
        ]
    }

    const qrCardSize = Math.max(42, Math.round(shapeSize * (compactMode ? 0.82 : getQrCardMultiplier(normalizedShape))))
    const qrRenderSize = Math.max(30, Math.min(qrSize, Math.round(qrCardSize * 0.94)))
    const scanLogoVisuals = getScanLogoVisuals(color, wrapperColor)
    const resolvedCtaText = ctaText.trim() || 'TAP TO SCAN'
    const ctaOrbitText = resolvedCtaText.toUpperCase()
    const orbitPrimaryLayout = getOrbitTextLayout(ctaOrbitText, 41, 5, 5)
    const orbitSecondaryLayout = getOrbitTextLayout(ctaOrbitText, 35, 4.2, 4.2)
    const orbitPrimaryText = orbitPrimaryLayout.text
    const orbitSecondaryText = orbitSecondaryLayout.text
    const bubbleText = resolvedCtaText.length > 20 ? `${resolvedCtaText.slice(0, 20)}...` : resolvedCtaText
    const orbitPathSeed = useId().replace(/[^a-zA-Z0-9_-]/g, '')
    const orbitPathPrimaryId = `scanlogo-orbit-primary-${orbitPathSeed}`
    const orbitPathSecondaryId = `scanlogo-orbit-secondary-${orbitPathSeed}`
    const shapeGradientId = `scanlogo-shape-gradient-${orbitPathSeed}`

    // Prefer the shortest available URL so the QR matrix stays less dense and easier to scan.
    const qrValue = [shortUrl, url]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .sort((a, b) => a.length - b.length)[0] || 'https://nowqr.ai'

    const containerRef = useRef<HTMLDivElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Base64 Logo handling to prevent Canvas Taint (CORS) when downloading
    const [base64Logo, setBase64Logo] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!centerLogoUrl) {
            setBase64Logo(undefined)
            return
        }

        let isMounted = true
        fetch(centerLogoUrl)
            .then(res => res.blob())
            .then(blob => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    if (isMounted) {
                        setBase64Logo(reader.result as string)
                    }
                }
                reader.readAsDataURL(blob)
            })
            .catch(err => {
                console.error("Failed to load center logo as base64", err)
                if (isMounted) setBase64Logo(centerLogoUrl) // fallback
            })

        return () => { isMounted = false }
    }, [centerLogoUrl])

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const getExportDimensions = () => {
        if (!wrapperRef.current) {
            return { width: 1, height: 1 }
        }

        const rect = wrapperRef.current.getBoundingClientRect()
        return {
            width: Math.max(1, Math.ceil(rect.width)),
            height: Math.max(1, Math.ceil(rect.height)),
        }
    }

    const triggerDataUrlDownload = async (dataUrl: string, filename: string) => {
        const isDataUrl = dataUrl.startsWith('data:')
        let objectUrl: string | null = null
        const link = document.createElement('a')
        link.download = filename
        link.rel = 'noopener'

        try {
            // Using object URLs is more reliable than large data URLs for GIF downloads.
            if (isDataUrl) {
                const response = await fetch(dataUrl)
                const blob = await response.blob()
                objectUrl = URL.createObjectURL(blob)
                link.href = objectUrl
            } else {
                link.href = dataUrl
            }

            document.body.appendChild(link)
            link.click()

            // Let the browser process the click before caller clears loading state.
            await delay(0)
        } finally {
            link.remove()
            if (objectUrl) {
                const revokeUrl = objectUrl
                window.setTimeout(() => URL.revokeObjectURL(revokeUrl), 5000)
            }
        }
    }

    // Reusable function to force the layout for export (white background)
    const cloneWrapperForExport = async (
        format: 'png' | 'jpeg',
        options?: {
            pixelRatio?: number
            cacheBust?: boolean
            width?: number
            height?: number
            animationProgressMs?: number
        }
    ) => {
        if (!wrapperRef.current || !containerRef.current) return

        const pixelRatio = options?.pixelRatio ?? 4
        const cacheBust = options?.cacheBust ?? true
        const exportSize = getExportDimensions()
        const width = options?.width ?? exportSize.width
        const height = options?.height ?? exportSize.height

        const wrapperEl = wrapperRef.current
        const containerEl = containerRef.current
        const animatedNodes = Array.from(containerEl.querySelectorAll<HTMLElement>('.scanlogo-animation-node'))

        const originalWrapperWidth = wrapperEl.style.width
        const originalWrapperHeight = wrapperEl.style.height
        const originalWrapperTransform = wrapperEl.style.transform
        const originalContainerTransform = containerEl.style.transform
        const originalAnimatedStyles = animatedNodes.map((node) => ({
            node,
            animation: node.style.animation,
            animationDelay: node.style.animationDelay,
            animationPlayState: node.style.animationPlayState,
        }))

        wrapperEl.style.width = `${width}px`
        wrapperEl.style.height = `${height}px`
        wrapperEl.style.transform = 'none'

        containerEl.style.transform = 'none'

        if (typeof options?.animationProgressMs === 'number') {
            animatedNodes.forEach((node) => {
                const computed = window.getComputedStyle(node)
                const durationToken = (computed.animationDuration || '0s').split(',')[0]?.trim() || '0s'
                const durationMs = parseAnimationDurationMs(durationToken)

                if (!durationMs) return

                const progressOffset = options.animationProgressMs! % durationMs
                node.style.animationPlayState = 'paused'
                node.style.animationDelay = `-${progressOffset}ms`
            })
        } else {
            animatedNodes.forEach((node) => {
                node.style.animation = 'none'
            })
        }

        try {
            const opts = {
                pixelRatio,
                cacheBust,
                width,
                height,
                style: {
                    background: format === 'png' ? 'transparent' : '#ffffff',
                    margin: '0',
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: 'none',
                    boxSizing: 'border-box',
                }
            }
            const dataUrl = format === 'png'
                ? await toPng(wrapperEl, opts)
                : await toJpeg(wrapperEl, { ...opts, quality: 0.95 })

            return dataUrl
        } finally {
            wrapperEl.style.width = originalWrapperWidth
            wrapperEl.style.height = originalWrapperHeight
            wrapperEl.style.transform = originalWrapperTransform

            containerEl.style.transform = originalContainerTransform

            originalAnimatedStyles.forEach(({ node, animation, animationDelay, animationPlayState }) => {
                node.style.animation = animation
                node.style.animationDelay = animationDelay
                node.style.animationPlayState = animationPlayState
            })
        }
    }

    useImperativeHandle(ref, () => ({
        downloadPNG: async () => {
            const { width, height } = getExportDimensions()
            const dataUrl = await cloneWrapperForExport('png', {
                width,
                height,
            })
            if (!dataUrl) {
                throw new Error('Failed to render PNG')
            }

            await triggerDataUrlDownload(dataUrl, 'scanlogo.png')
        },
        downloadJPG: async () => {
            const { width, height } = getExportDimensions()
            const dataUrl = await cloneWrapperForExport('jpeg', {
                width,
                height,
            })
            if (!dataUrl) {
                throw new Error('Failed to render JPG')
            }

            await triggerDataUrlDownload(dataUrl, 'scanlogo.jpg')
        },
        downloadGIF: async () => {
            if (!wrapperRef.current || !containerRef.current) {
                throw new Error('Preview is not ready yet')
            }

            const { width, height } = getExportDimensions()
            const animationCycleMsByMode: Record<SupportedAnimation, number> = {
                spin: 7000,
                pulse: 2600,
                expand: 2400,
                bounce: 2200,
                glow: 2600,
                flash: 2100,
                orbit: 5200,
                none: 1000,
            }

            const frames: string[] = []
            const numFrames = normalizedAnimation === 'none' ? 2 : 12
            const cycleMs = animationCycleMsByMode[normalizedAnimation]

            for (let i = 0; i < numFrames; i++) {
                const progress = i / (numFrames - 1)
                const progressMs = progress * cycleMs

                const dataUrl = await cloneWrapperForExport('png', {
                    pixelRatio: 1,
                    cacheBust: false,
                    width,
                    height,
                    animationProgressMs: normalizedAnimation === 'none' ? undefined : progressMs,
                })

                if (dataUrl) {
                    frames.push(dataUrl)
                }
            }

            if (!frames.length) {
                throw new Error('Failed to capture GIF frames')
            }

            const encodeGif = (images: string[], timeoutMs: number) =>
                new Promise<string>((resolve, reject) => {
                    const gifIntervalSeconds = normalizedAnimation === 'none'
                        ? 0.35
                        : Math.min(0.45, Math.max(0.14, cycleMs / numFrames / 1000))

                    let settled = false
                    const timeoutId = window.setTimeout(() => {
                        if (settled) return
                        settled = true
                        reject(new Error('GIF encoding timed out'))
                    }, timeoutMs)

                    gifshot.createGIF({
                        images,
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

            let gifDataUrl: string
            try {
                gifDataUrl = await encodeGif(frames, 24000)
            } catch {
                // Retry once with fewer frames to avoid getting stuck on heavy encodes.
                const stride = Math.max(1, Math.ceil(frames.length / 6))
                const reducedFrames = frames.filter((_, index) => index % stride === 0).slice(0, 6)
                gifDataUrl = await encodeGif(reducedFrames, 12000)
            }

            await triggerDataUrlDownload(gifDataUrl, 'scanlogo.gif')
        },
    }))

    // ── Action ScanLogo: one branded family, three frames (arch / circle / ticket) ──
    // The header text box holds a flexible headline — a price like "$34" or an action
    // word like "SCAN & WIN" — plus an optional sub-line that describes where the action
    // goes (e.g. "MENSUAL", "Win big today"). Everything renders on a transparent
    // background so the branded graphic itself is the clickable QR, with no surrounding
    // sheet. Flyer / campaign embeds (minimal) keep the plain QR untouched.
    const FRAME_VALUES = ['arch', 'circle', 'ticket', 'diamond', 'pin', 'vertical', 'wide', 'phone', 'triangle', 'brackets']
    const normalizedFrame = (bannerTemplate || '').toLowerCase()
    const actionFrame = FRAME_VALUES.includes(normalizedFrame)
        ? normalizedFrame
        : (bannerTemplate && bannerTemplate !== 'none' ? 'arch' : '')

    if (!minimal && actionFrame) {
        const brandColor = (wrapperColor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(wrapperColor.trim()))
            ? wrapperColor.trim()
            : '#0ea5e9'
        const brandIsLight = isLightColor(brandColor)
        const onBrand = brandIsLight ? '#0f172a' : '#ffffff'
        const onBrandSoft = brandIsLight ? 'rgba(15,23,42,0.62)' : 'rgba(255,255,255,0.82)'
        const dividerColor = brandIsLight ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.72)'
        const brandFill = `linear-gradient(165deg, rgba(255,255,255,0.26), rgba(255,255,255,0) 46%), ${brandColor}`
        const headlineText = (resolvedCtaText || 'SCAN ME').trim()
        const subtitleText = (subtitle || '').trim()

        const headlineFontPx = (text: string, width: number) => {
            const len = Math.max(1, text.replace(/\s+/g, ' ').trim().length)
            const raw = (width * 1.7) / len
            return Math.max(13, Math.min(width * 0.34, raw))
        }

        const renderHeadline = (text: string, colorVal: string, basePx: number, maxLines = 2) => {
            const t = text.trim()
            const currency = t.match(/^([$€£₹¥])(\S.*)$/)
            const baseStyle: React.CSSProperties = {
                color: colorVal,
                fontWeight: 900,
                lineHeight: 0.96,
                letterSpacing: t.length > 6 ? '0.01em' : '-0.01em',
                textTransform: 'uppercase',
                textAlign: 'center',
                wordBreak: 'break-word',
                fontFamily: '"Arial Black", "Archivo Black", Helvetica, Arial, sans-serif',
                textShadow: brandIsLight ? 'none' : '0 1px 2px rgba(15,23,42,0.28)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical',
            }
            if (currency) {
                return (
                    <span style={{ ...baseStyle, fontSize: basePx }}>
                        <span style={{ fontSize: basePx * 0.5, verticalAlign: 'top', marginRight: 1, fontWeight: 800 }}>{currency[1]}</span>
                        {currency[2]}
                    </span>
                )
            }
            return <span style={{ ...baseStyle, fontSize: basePx }}>{t}</span>
        }

        const renderSubtitle = (colorVal: string, lineColor: string, fontPx: number) => {
            if (!subtitleText) return null
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(fontPx * 0.55), width: '100%' }}>
                    <div style={{ width: '44%', height: 2, borderRadius: 999, background: lineColor }} />
                    <span style={{
                        color: colorVal,
                        fontSize: fontPx,
                        fontWeight: 800,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                        lineHeight: 1.15,
                        fontFamily: 'Helvetica, Arial, sans-serif',
                    }}>{subtitleText}</span>
                </div>
            )
        }

        const renderPlainQr = (panel: number, round = false) => {
            // For a round disc the square QR must stay inside the inscribed square (≤ diameter/√2)
            // so its corners never spill onto the colored badge.
            const inner = Math.round(panel * (round ? 0.66 : 0.84))
            return (
                <div style={{
                    width: panel,
                    height: panel,
                    background: '#ffffff',
                    borderRadius: round ? '50%' : Math.round(panel * 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(15,23,42,0.20)',
                    boxSizing: 'border-box',
                }}>
                    <QRCode
                        ref={qrRef}
                        value={qrValue}
                        size={inner}
                        bgColor="#ffffff"
                        fgColor={scanLogoVisuals.qrFgColor}
                        qrStyle="squares"
                        ecLevel="Q"
                        quietZone={0}
                        eyeRadius={[
                            { outer: [8, 8, 8, 8], inner: [4, 4, 4, 4] },
                            { outer: [8, 8, 8, 8], inner: [4, 4, 4, 4] },
                            { outer: [8, 8, 8, 8], inner: [4, 4, 4, 4] },
                        ]}
                        logoImage={base64Logo}
                        logoWidth={inner * 0.24}
                        logoHeight={inner * 0.24}
                        logoOpacity={1}
                        removeQrCodeBehindLogo
                        logoPaddingStyle="circle"
                        logoPadding={3}
                        enableCORS
                    />
                </div>
            )
        }

        // Connected brand tag (pill with an upward pointer) — used under diamond / pin / triangle / phone frames.
        const renderTag = (tagFont?: number) => (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `9px solid ${brandColor}`, marginBottom: -1 }} />
                <div style={{
                    background: brandFill,
                    borderRadius: 12,
                    padding: subtitleText ? '7px 18px 8px' : '8px 18px',
                    boxShadow: `0 10px 20px ${brandColor}4d`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    boxSizing: 'border-box',
                }}>
                    {renderHeadline(headlineText, onBrand, tagFont ?? Math.max(13, Math.min(19, 210 / Math.max(4, headlineText.length))), 1)}
                    {subtitleText && (
                        <span style={{ color: onBrandSoft, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>{subtitleText}</span>
                    )}
                </div>
            </div>
        )

        const frameWrapperStyle: React.CSSProperties = {
            width: 'fit-content',
            margin: '0 auto',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
        }

        // FRAME 1 — Arch badge (price / headline on top, QR panel below). Closest to the $34 reference.
        if (actionFrame === 'arch') {
            const W = 232
            const pad = 16
            const panel = W - pad * 2
            const hsize = headlineFontPx(headlineText, W - pad * 2)
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-arch" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: W,
                            borderRadius: `${W / 2}px ${W / 2}px 26px 26px`,
                            background: brandFill,
                            boxShadow: `0 16px 34px ${brandColor}40, inset 0 1px 0 rgba(255,255,255,0.35)`,
                            padding: `${Math.round(W * 0.16)}px ${pad}px ${pad}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 12,
                            boxSizing: 'border-box',
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                                {renderHeadline(headlineText, onBrand, hsize)}
                                {renderSubtitle(onBrand, dividerColor, Math.max(9, Math.round(W * 0.05)))}
                            </div>
                            {renderPlainQr(panel)}
                        </div>
                    </div>
                </div>
            )
        }

        // FRAME 2 — Circle badge with a ribbon banner holding the headline. Like SHOP THIS BOOK.
        if (actionFrame === 'circle') {
            const D = 244
            const panel = Math.round(D * 0.74)
            const ribbonFont = Math.max(12, Math.min(20, (D * 0.92) / Math.max(4, headlineText.length)))
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-circle" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: D }}>
                        {/* Ribbon banner */}
                        <div style={{
                            position: 'relative',
                            zIndex: 2,
                            marginBottom: -16,
                            maxWidth: D * 1.02,
                            padding: '8px 18px',
                            borderRadius: 999,
                            background: brandIsLight ? '#0f172a' : brandColor,
                            border: `2px solid ${brandIsLight ? 'rgba(15,23,42,0.15)' : 'rgba(255,255,255,0.55)'}`,
                            boxShadow: `0 8px 18px ${brandColor}55`,
                            boxSizing: 'border-box',
                        }}>
                            {renderHeadline(headlineText, brandIsLight ? '#ffffff' : onBrand, ribbonFont, 1)}
                        </div>
                        {/* Circular badge */}
                        <div style={{
                            position: 'relative',
                            width: D,
                            height: D,
                            borderRadius: '50%',
                            background: brandFill,
                            boxShadow: `0 16px 34px ${brandColor}40, inset 0 1px 0 rgba(255,255,255,0.35)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                        }}>
                            <div style={{ marginTop: subtitleText ? -Math.round(D * 0.06) : 0 }}>
                                {renderPlainQr(panel, true)}
                            </div>
                            {subtitleText && (
                                <span style={{
                                    position: 'absolute',
                                    bottom: Math.round(D * 0.085),
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    color: onBrand,
                                    fontSize: Math.max(9, Math.round(D * 0.05)),
                                    fontWeight: 800,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    whiteSpace: 'nowrap',
                                    textShadow: brandIsLight ? 'none' : '0 1px 2px rgba(15,23,42,0.3)',
                                }}>{subtitleText}</span>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        // FRAME — Diamond badge. White diamond, QR upright inside, connected tag below.
        if (actionFrame === 'diamond') {
            const S = 188
            const box = Math.round(S * 1.42)
            const qrPanel = Math.round(S * 0.62)
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-diamond" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: box, height: box, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: S,
                                height: S,
                                transform: 'rotate(45deg)',
                                borderRadius: 22,
                                background: '#ffffff',
                                border: `4px solid ${brandColor}`,
                                boxShadow: `0 16px 30px ${brandColor}33`,
                            }} />
                            <div style={{ position: 'absolute' }}>{renderPlainQr(qrPanel)}</div>
                        </div>
                        <div style={{ marginTop: -Math.round(box * 0.05) }}>{renderTag()}</div>
                    </div>
                </div>
            )
        }

        // FRAME — Location pin. Teardrop badge with QR in a white disc, tag below.
        // The teardrop is a rotated square, so it lives inside a √2-sized box that fully
        // contains the rotated corners (otherwise PNG/JPG export would clip the tip).
        if (actionFrame === 'pin') {
            const P = 200
            const pinBox = Math.round(P * 1.42)
            const disc = Math.round(P * 0.72)
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-pin" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: pinBox, height: pinBox, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: P,
                                height: P,
                                borderRadius: '50% 50% 50% 0',
                                background: brandFill,
                                boxShadow: `0 16px 32px ${brandColor}40`,
                                transform: 'rotate(-45deg)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{ transform: 'rotate(45deg)' }}>{renderPlainQr(disc, true)}</div>
                            </div>
                        </div>
                        <div style={{ marginTop: -Math.round(pinBox * 0.06) }}>{renderTag()}</div>
                    </div>
                </div>
            )
        }

        // FRAME — Vertical card. Brand header (headline) + QR + brand footer (sub-line).
        if (actionFrame === 'vertical') {
            const W = 198
            const panel = W - 28
            const headFont = Math.max(13, Math.min(20, (W * 1.4) / Math.max(4, headlineText.length)))
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-vertical" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: W,
                            background: '#ffffff',
                            borderRadius: 20,
                            overflow: 'hidden',
                            border: `3px solid ${brandColor}`,
                            boxShadow: `0 16px 30px ${brandColor}33`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}>
                            <div style={{ width: '100%', background: brandFill, padding: '10px 12px', boxSizing: 'border-box', textAlign: 'center' }}>
                                {renderHeadline(headlineText, onBrand, headFont, 1)}
                            </div>
                            <div style={{ padding: 14 }}>{renderPlainQr(panel)}</div>
                            {subtitleText && (
                                <div style={{ width: '100%', background: brandFill, padding: '8px 12px', boxSizing: 'border-box', textAlign: 'center' }}>
                                    <span style={{ color: onBrand, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{subtitleText}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        // FRAME — Wide banner. Text block on the left, QR panel on the right.
        if (actionFrame === 'wide') {
            const H = 150
            const qrPanel = H - 28
            const headFont = Math.max(16, Math.min(28, 300 / Math.max(4, headlineText.length)))
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-wide" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            background: brandFill,
                            borderRadius: 20,
                            padding: 14,
                            boxShadow: `0 16px 30px ${brandColor}40`,
                            boxSizing: 'border-box',
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, maxWidth: 150 }}>
                                {renderHeadline(headlineText, onBrand, headFont, 3)}
                                {subtitleText && (
                                    <span style={{ color: onBrandSoft, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>{subtitleText}</span>
                                )}
                            </div>
                            {renderPlainQr(qrPanel)}
                        </div>
                    </div>
                </div>
            )
        }

        // FRAME — Phone mockup. QR on the screen, headline below inside the device.
        if (actionFrame === 'phone') {
            const W = 190
            const Hh = 300
            const panel = W - 58
            const headFont = Math.max(13, Math.min(20, (W * 1.4) / Math.max(4, headlineText.length)))
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-phone" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: W,
                            height: Hh,
                            borderRadius: 30,
                            border: `7px solid ${brandColor}`,
                            background: '#0b1020',
                            boxShadow: `0 18px 40px ${brandColor}33`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '22px 14px 16px',
                            boxSizing: 'border-box',
                            position: 'relative',
                        }}>
                            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 46, height: 5, borderRadius: 999, background: '#374151' }} />
                            {renderPlainQr(panel)}
                            <div style={{ textAlign: 'center' }}>
                                {renderHeadline(headlineText, '#ffffff', headFont, 1)}
                                {subtitleText && (
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4, display: 'block' }}>{subtitleText}</span>
                                )}
                            </div>
                            <div style={{ width: 54, height: 4, borderRadius: 999, background: '#ffffff', opacity: 0.85 }} />
                        </div>
                    </div>
                </div>
            )
        }

        // FRAME — Play / triangle badge. Big white play triangle with the QR centred inside
        // its body (vertical left edge, apex points right), tag below. The triangle is sized
        // so a square QR fits fully between the converging top/bottom edges.
        if (actionFrame === 'triangle') {
            const Tw = 268
            const Th = 244
            const qrPanel = 96
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-triangle" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: Tw, height: Th }}>
                            <svg width={Tw} height={Th} viewBox="0 0 268 244" style={{ position: 'absolute', top: 0, left: 0 }}>
                                <path d="M24 18 L248 122 L24 226 Z" fill="#ffffff" stroke={brandColor} strokeWidth="7" strokeLinejoin="round" />
                            </svg>
                            <div style={{ position: 'absolute', left: 40, top: '50%', transform: 'translateY(-50%)' }}>
                                {renderPlainQr(qrPanel)}
                            </div>
                        </div>
                        <div style={{ marginTop: 6 }}>{renderTag()}</div>
                    </div>
                </div>
            )
        }

        // FRAME — Bracket frame. Camera-style corner brackets around the QR with a tag below.
        if (actionFrame === 'brackets') {
            const panel = 196
            const b = 4
            const len = 34
            const corner = (pos: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', width: len, height: len, ...pos })
            return (
                <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-brackets" style={frameWrapperStyle}>
                    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'relative', padding: 14 }}>
                            <div style={corner({ top: 0, left: 0, borderTop: `${b}px solid ${brandColor}`, borderLeft: `${b}px solid ${brandColor}`, borderTopLeftRadius: 12 })} />
                            <div style={corner({ top: 0, right: 0, borderTop: `${b}px solid ${brandColor}`, borderRight: `${b}px solid ${brandColor}`, borderTopRightRadius: 12 })} />
                            <div style={corner({ bottom: 0, left: 0, borderBottom: `${b}px solid ${brandColor}`, borderLeft: `${b}px solid ${brandColor}`, borderBottomLeftRadius: 12 })} />
                            <div style={corner({ bottom: 0, right: 0, borderBottom: `${b}px solid ${brandColor}`, borderRight: `${b}px solid ${brandColor}`, borderBottomRightRadius: 12 })} />
                            {renderPlainQr(panel)}
                        </div>
                        <div style={{ marginTop: 10 }}>{renderTag()}</div>
                    </div>
                </div>
            )
        }

        // FRAME 3 — Ticket card with a connected button/tail carrying the headline. Like the SCAN-TO cards.
        const W = 212
        const panel = W - 28
        const hsize = Math.min(headlineFontPx(headlineText, W * 0.84), 26)
        return (
            <div ref={wrapperRef} className="scanlogo-preview-wrapper actionlogo-frame actionlogo-ticket" style={frameWrapperStyle}>
                <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                        width: W,
                        background: '#ffffff',
                        borderRadius: 22,
                        border: `3px solid ${brandColor}`,
                        boxShadow: `0 16px 30px ${brandColor}33`,
                        padding: 14,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                        position: 'relative',
                        zIndex: 1,
                    }}>
                        {renderPlainQr(panel)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                            width: 0,
                            height: 0,
                            borderLeft: '9px solid transparent',
                            borderRight: '9px solid transparent',
                            borderBottom: `10px solid ${brandColor}`,
                            marginTop: -1,
                        }} />
                        <div style={{
                            background: brandFill,
                            borderRadius: 14,
                            padding: subtitleText ? '8px 22px 9px' : '10px 22px',
                            boxShadow: `0 10px 22px ${brandColor}4d`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            maxWidth: W + 24,
                            boxSizing: 'border-box',
                        }}>
                            {renderHeadline(headlineText, onBrand, hsize, 1)}
                            {subtitleText && (
                                <span style={{
                                    color: onBrandSoft,
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    textAlign: 'center',
                                }}>{subtitleText}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={wrapperRef}
            className="scanlogo-preview-wrapper"
            style={{
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 'fit-content',
                margin: '0 auto',
                paddingTop: shellPadding,
                paddingRight: shellPadding,
                paddingLeft: shellPadding,
                paddingBottom: compactMode ? 0 : Math.max(18, Math.round(shapeSize * 0.18)),
            }}
        >
            {/* Animated container */}
            <div
                ref={containerRef}
                className={`scanlogo-container scanlogo-mode-${normalizedAnimation} scanlogo-anim-${normalizedAnimation} ${compactMode ? 'scanlogo-compact' : ''}`}
                style={{
                    width: shapeSize,
                    height: shapeSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    '--scanlogo-color': scanLogoVisuals.resolvedColor,
                    '--scanlogo-wrapper-color': scanLogoVisuals.resolvedWrapperColor,
                    '--scanlogo-wrapper-gradient-start': scanLogoVisuals.wrapperGradientStart,
                    '--scanlogo-wrapper-gradient-end': scanLogoVisuals.wrapperGradientEnd,
                    '--scanlogo-wrapper-accent': scanLogoVisuals.wrapperAccentColor,
                    '--scanlogo-wrapper-inner-ring': scanLogoVisuals.wrapperInnerRingColor,
                    '--scanlogo-top-text': scanLogoVisuals.wrapperTopTextColor,
                    '--scanlogo-bubble-color': scanLogoVisuals.bubbleColor,
                    '--scanlogo-glow-color': scanLogoVisuals.glowColor,
                    '--scanlogo-ribbon-font-size': `${Math.max(9, Math.round(shapeSize * 0.078))}px`,
                    '--scanlogo-orbit-font-size-primary': `${compactMode ? 5 : orbitPrimaryLayout.fontSizePx}px`,
                    '--scanlogo-orbit-font-size-secondary': `${compactMode ? 4.2 : orbitSecondaryLayout.fontSizePx}px`,
                    '--scanlogo-bubble-font-size': `${Math.max(8, Math.round(shapeSize * 0.058))}px`,
                    '--scanlogo-label-text-light': scanLogoVisuals.labelTextColorLightBg,
                    '--scanlogo-label-text-dark': scanLogoVisuals.labelTextColorDarkBg,
                    '--scanlogo-orbit-stroke': scanLogoVisuals.orbitStrokeColor,
                    position: 'relative',
                } as React.CSSProperties}
            >
                <div
                    className="scanlogo-wrapper-shell scanlogo-animation-node"
                    style={{
                        borderRadius: getWrapperShellRadius(normalizedShape),
                        background: 'transparent',
                        border: 'none',
                    }}
                />

                {/* Static wrapper shape */}
                <svg
                    className="scanlogo-shape scanlogo-shape-outer"
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill={`url(#${shapeGradientId})`}
                    stroke={scanLogoVisuals.shapeStrokeColor}
                    strokeWidth={Math.max(0.9, (3 * 24) / shapeSize)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 0,
                        filter: 'drop-shadow(0 4px 10px rgba(15, 23, 42, 0.22))'
                    }}
                >
                    <defs>
                        <linearGradient id={shapeGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={scanLogoVisuals.wrapperGradientStart} />
                            <stop offset="100%" stopColor={scanLogoVisuals.wrapperGradientEnd} />
                        </linearGradient>
                    </defs>
                    {SHAPE_SVG_PATHS[normalizedShape] || SHAPE_SVG_PATHS['square']}
                </svg>

                <svg
                    className="scanlogo-shape scanlogo-shape-inner"
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                    stroke={scanLogoVisuals.wrapperInnerRingColor}
                    strokeWidth={Math.max(0.6, (1.8 * 24) / shapeSize)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                >
                    <g transform={`translate(12 12) scale(${normalizedShape === 'square' ? 0.84 : 0.88}) translate(-12 -12)`}>
                        {SHAPE_SVG_PATHS[normalizedShape] || SHAPE_SVG_PATHS['square']}
                    </g>
                </svg>

                {!compactMode && (
                    <>
                        <svg className="scanlogo-orbit-ring scanlogo-orbit-ring-primary scanlogo-animation-node" viewBox="0 0 100 100" aria-hidden="true" style={{ overflow: 'visible' }}>
                            <defs>
                                <path id={orbitPathPrimaryId} d="M 50,50 m -41,0 a 41,41 0 1,1 82,0 a 41,41 0 1,1 -82,0" />
                            </defs>
                            <circle className="scanlogo-orbit-guide" cx="50" cy="50" r="42" />
                            <text className="scanlogo-orbit-ring-text">
                                <textPath
                                    href={`#${orbitPathPrimaryId}`}
                                    startOffset="0%"
                                    lengthAdjust="spacingAndGlyphs"
                                    textLength={orbitPrimaryLayout.circumference}
                                >
                                    {orbitPrimaryText}
                                </textPath>
                            </text>
                        </svg>

                        <svg className="scanlogo-orbit-ring scanlogo-orbit-ring-secondary scanlogo-animation-node" viewBox="0 0 100 100" aria-hidden="true" style={{ overflow: 'visible' }}>
                            <defs>
                                <path id={orbitPathSecondaryId} d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" />
                            </defs>
                            <circle className="scanlogo-orbit-guide scanlogo-orbit-guide-secondary" cx="50" cy="50" r="36" />
                            <text className="scanlogo-orbit-ring-text scanlogo-orbit-ring-text-secondary">
                                <textPath
                                    href={`#${orbitPathSecondaryId}`}
                                    startOffset="0%"
                                    lengthAdjust="spacingAndGlyphs"
                                    textLength={orbitSecondaryLayout.circumference}
                                >
                                    {orbitSecondaryText}
                                </textPath>
                            </text>
                        </svg>

                        <div className="scanlogo-bubble-layer" aria-hidden="true">
                            <span className="scanlogo-bubble bubble-1 scanlogo-animation-node" />
                            <span className="scanlogo-bubble bubble-2 scanlogo-animation-node" />
                            <span className="scanlogo-bubble bubble-3 scanlogo-animation-node" />
                            <span className="scanlogo-bubble bubble-4 scanlogo-animation-node" />
                            <span className="scanlogo-bubble bubble-5 scanlogo-animation-node" />
                        </div>

                        <div className="scanlogo-bubble-cta scanlogo-animation-node">{bubbleText}</div>
                    </>
                )}

                <div
                    className="scanlogo-qr-core"
                    style={{
                        width: qrCardSize,
                        height: qrCardSize,
                    }}
                >
                    <QRCode
                        ref={qrRef}
                        value={qrValue}
                        size={qrRenderSize}
                        bgColor="transparent"
                        fgColor={scanLogoVisuals.qrFgColor}
                        qrStyle="squares"
                        ecLevel="Q"
                        quietZone={2}
                        eyeRadius={getEyeRadiusForShape(normalizedShape)}
                        logoImage={base64Logo}
                        logoWidth={qrRenderSize * 0.16}
                        logoHeight={qrRenderSize * 0.16}
                        logoOpacity={1}
                        removeQrCodeBehindLogo
                        logoPaddingStyle="circle"
                        logoPadding={1}
                        enableCORS
                    />
                </div>
            </div>

            {/* CTA Text */}
            {!minimal && (
                <p
                    className="scanlogo-cta-text"
                    style={{
                        textShadow: scanLogoVisuals.labelTextShadow,
                        marginTop: compactMode ? 8 : Math.max(16, Math.round(shapeSize * 0.08)),
                    }}
                >
                    {resolvedCtaText}
                </p>
            )}

            {/* Short URL is intentionally hidden so it doesn't show */}
            {/* Safe scan badge */}
            {!minimal && safeScanBadge && (
                <div className="scanlogo-safe-badge" style={{ marginTop: compactMode ? 4 : 9 }}>
                    <Shield className="w-3 h-3" style={{ marginRight: 4 }} />
                    Safe Scan Verified
                </div>
            )}
        </div>
    )
})

export default ScanLogoPreview
