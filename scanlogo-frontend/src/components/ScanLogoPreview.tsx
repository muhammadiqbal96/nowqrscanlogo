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
    safeScanBadge?: boolean
    centerLogoUrl?: string | null
    shortUrl?: string
    size?: number
    /** When true, hides CTA text, short URL and safe-scan badge (for flyer embed) */
    minimal?: boolean
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

    for (let repeatCount = 2; repeatCount <= 8; repeatCount++) {
        const chars = orbitUnit.length * repeatCount
        if (!chars) continue

        const rawFontSize = circumference / (chars * (avgGlyphAdvanceEm + trackingEm))
        const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, rawFontSize))
        const estimatedSpan = chars * clampedFontSize * (avgGlyphAdvanceEm + trackingEm)
        const diff = Math.abs(circumference - estimatedSpan)

        if (diff < bestDiff) {
            bestDiff = diff
            bestText = orbitUnit.repeat(repeatCount)
            bestFontSize = clampedFontSize
        }
    }

    // Guarantee enough characters to cover the full ring even on mobile/font fallback differences.
    const unitWidthAtBest = orbitUnit.length * bestFontSize * (avgGlyphAdvanceEm + trackingEm)
    const minRepeatCount = Math.max(8, Math.ceil(circumference / Math.max(unitWidthAtBest, 1)) + 2)
    bestText = orbitUnit.repeat(minRepeatCount)

    return {
        text: bestText,
        fontSizePx: Number(bestFontSize.toFixed(2)),
        circumference,
    }
}

const ScanLogoPreview = forwardRef<ScanLogoPreviewRef, ScanLogoPreviewProps>(function ScanLogoPreview({
    url,
    shape = 'shield',
    animation = 'spin',
    color = '#111111',
    wrapperColor,
    ctaText = 'TAP TO SCAN',
    safeScanBadge = true,
    centerLogoUrl,
    shortUrl,
    size = 200,
    minimal = false,
}, ref) {
    const qrRef = useRef<any>(null)
    const normalizedShape = (shape || 'shield').toLowerCase()
    const normalizedAnimation = normalizeAnimation(animation)
    const compactMode = size < 96

    // Scale down the base size so that the total outer width fits within `size`.
    // Total width is shapeSize + 2 * shellPadding.
    // In normal mode: shellPadding = Math.round(shapeSize * 0.12), so total width is shapeSize * 1.24.
    // In compact mode: shellPadding = 0, so total width is shapeSize.
    const scaleFactor = getShapeFrameScale(normalizedShape) * (compactMode ? 1.0 : 1.24)
    const adjustedSize = Math.max(20, Math.round(size / scaleFactor))

    // Keep QR module stable while wrapper visuals animate around it.
    const shapeSize = Math.round(adjustedSize * getShapeFrameScale(normalizedShape))
    const shellPadding = compactMode ? 0 : Math.max(10, Math.round(shapeSize * 0.12))
    const qrSize = Math.floor(adjustedSize * getQrScaleForShape(normalizedShape))
    const qrCardSize = Math.max(42, Math.round(shapeSize * (compactMode ? 0.64 : 0.56)))
    const qrRenderSize = Math.max(30, Math.min(qrSize, Math.round(qrCardSize * 0.84)))
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

    // Prefer the shortest available URL so the QR matrix stays less dense and easier to scan.
    const qrValue = [shortUrl, url]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .sort((a, b) => a.length - b.length)[0] || 'https://scanlogos.com'

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
                <div className="scanlogo-wrapper-shell scanlogo-animation-node" />

                {/* Static wrapper shape */}
                <svg
                    className="scanlogo-shape scanlogo-shape-outer"
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill={scanLogoVisuals.shapeFillStrongColor}
                    stroke={scanLogoVisuals.shapeStrokeColor}
                    strokeWidth={Math.max(0.9, (3 * 24) / shapeSize)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
                >
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
                    <g transform="translate(12 12) scale(0.82) translate(-12 -12)">
                        {SHAPE_SVG_PATHS[normalizedShape] || SHAPE_SVG_PATHS['square']}
                    </g>
                </svg>

                {!compactMode && (
                    <>
                        <svg className="scanlogo-orbit-ring scanlogo-orbit-ring-primary scanlogo-animation-node" viewBox="0 0 100 100" aria-hidden="true">
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

                        <svg className="scanlogo-orbit-ring scanlogo-orbit-ring-secondary scanlogo-animation-node" viewBox="0 0 100 100" aria-hidden="true">
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
                        bgColor={scanLogoVisuals.qrBgColor}
                        fgColor={scanLogoVisuals.qrFgColor}
                        qrStyle="squares"
                        ecLevel="Q"
                        quietZone={2}
                        eyeRadius={[
                            { outer: [8, 8, 0, 8], inner: [4, 4, 0, 4] },
                            { outer: [8, 8, 8, 0], inner: [4, 4, 4, 0] },
                            { outer: [8, 0, 8, 8], inner: [4, 0, 4, 4] },
                        ]}
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
