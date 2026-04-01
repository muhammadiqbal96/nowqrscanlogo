import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Shield } from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
// @ts-ignore
import gifshot from 'gifshot'
import { getFlashTextLayout, getQrScaleForShape, getScanLogoVisuals, getShapeFrameScale } from '@/lib/scanLogoVisuals'
import './ScanLogoPreview.css'

export interface ScanLogoPreviewProps {
    url: string
    shape?: string
    animation?: string
    color?: string
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

const SHAPE_SVG_PATHS: Record<string, React.ReactNode> = {
    circle: <circle cx="12" cy="12" r="10" />,
    square: <rect width="18" height="18" x="3" y="3" rx="2" />,
    shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
    hexagon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />,
    diamond: <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />,
    gear: <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915Z" />,
    eye: <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0Z" />
}

const ScanLogoPreview = forwardRef<ScanLogoPreviewRef, ScanLogoPreviewProps>(function ScanLogoPreview({
    url,
    shape = 'shield',
    animation = 'spin',
    color = '#c8401a',
    ctaText = 'TAP TO SCAN',
    safeScanBadge = true,
    centerLogoUrl,
    shortUrl,
    size = 200,
    minimal = false,
}, ref) {
    const qrRef = useRef<any>(null)

    // Keep QR module size unchanged and grow the shape frame for extra spacing.
    const shapeSize = Math.round(size * getShapeFrameScale(shape))
    const qrSize = Math.floor(size * getQrScaleForShape(shape))
    const scanLogoVisuals = getScanLogoVisuals(color)
    const resolvedCtaText = ctaText.trim() || 'TAP TO SCAN'
    const flashTextLayout = getFlashTextLayout(shape, shapeSize, resolvedCtaText)

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
            freezeTransform?: string
            flashOpacity?: string
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
        const flashOverlay = containerEl.querySelector<HTMLDivElement>('.scanlogo-flash-overlay')
        const shapeEl = containerEl.querySelector<SVGElement>('.scanlogo-shape')

        const originalWrapperWidth = wrapperEl.style.width
        const originalWrapperHeight = wrapperEl.style.height
        const originalWrapperTransform = wrapperEl.style.transform
        const originalContainerAnimation = containerEl.style.animation
        const originalContainerTransform = containerEl.style.transform
        const originalShapeAnimation = shapeEl?.style.animation || ''
        const originalFlashAnimation = flashOverlay?.style.animation || ''
        const originalFlashOpacity = flashOverlay?.style.opacity || ''

        wrapperEl.style.width = `${width}px`
        wrapperEl.style.height = `${height}px`
        wrapperEl.style.transform = 'none'

        containerEl.style.animation = 'none'
        containerEl.style.transform = options?.freezeTransform ?? 'none'

        if (shapeEl) {
            shapeEl.style.animation = 'none'
        }

        if (flashOverlay) {
            flashOverlay.style.animation = 'none'
            if (typeof options?.flashOpacity !== 'undefined') {
                flashOverlay.style.opacity = options.flashOpacity
            }
        }

        try {
            const opts = {
                pixelRatio,
                cacheBust,
                width,
                height,
                style: {
                    background: '#ffffff',
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

            containerEl.style.animation = originalContainerAnimation
            containerEl.style.transform = originalContainerTransform

            if (shapeEl) {
                shapeEl.style.animation = originalShapeAnimation
            }

            if (flashOverlay) {
                flashOverlay.style.animation = originalFlashAnimation
                flashOverlay.style.opacity = originalFlashOpacity
            }
        }
    }

    useImperativeHandle(ref, () => ({
        downloadPNG: async () => {
            const { width, height } = getExportDimensions()
            const dataUrl = await cloneWrapperForExport('png', {
                width,
                height,
                flashOpacity: '0',
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
                flashOpacity: '0',
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

            const containerEl = containerRef.current
            const flashOverlay = containerEl.querySelector<HTMLDivElement>('.scanlogo-flash-overlay')
            const isFlashAnimation = animation === 'flash' && !!flashOverlay
            const { width, height } = getExportDimensions()

            const frames: string[] = []
            const numFrames = isFlashAnimation ? 15 : 10

            for (let i = 0; i < numFrames; i++) {
                const progress = i / (numFrames - 1)
                let transform = 'none'

                if (animation === 'spin') {
                    transform = `rotate(${progress * 360}deg)`
                } else if (animation === 'pulse') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.06
                    transform = `scale(${scale})`
                } else if (animation === 'bounce') {
                    const y = Math.sin(progress * Math.PI * 2) * -14
                    transform = `translateY(${y}px)`
                } else if (animation === 'expand') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.12
                    transform = `scale(${scale})`
                }

                let flashOpacity: string | undefined
                if (isFlashAnimation) {
                    const isFlashOn =
                        progress < 0.12 ||
                        (progress >= 0.32 && progress < 0.44) ||
                        (progress >= 0.62 && progress < 0.72)
                    flashOpacity = isFlashOn ? '1' : '0'
                }

                const dataUrl = await cloneWrapperForExport('png', {
                    pixelRatio: 1,
                    cacheBust: false,
                    width,
                    height,
                    freezeTransform: transform,
                    flashOpacity,
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
                        interval: isFlashAnimation ? 0.30 : 0.16,
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
            }}
        >
            {/* Animated container */}
            <div
                ref={containerRef}
                className={`scanlogo-container scanlogo-anim-${animation}`}
                style={{
                    width: shapeSize,
                    height: shapeSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    '--scanlogo-color': scanLogoVisuals.resolvedColor,
                    '--scanlogo-glow-color': scanLogoVisuals.glowColor,
                    '--scanlogo-flash-text-color': scanLogoVisuals.flashTextColor,
                    '--scanlogo-flash-font-size': `${flashTextLayout.fontSizePx}px`,
                    '--scanlogo-flash-max-width': `${flashTextLayout.maxWidthPercent}%`,
                    '--scanlogo-flash-letter-spacing': `${flashTextLayout.letterSpacingEm}em`,
                    '--scanlogo-label-text-light': scanLogoVisuals.labelTextColorLightBg,
                    '--scanlogo-label-text-dark': scanLogoVisuals.labelTextColorDarkBg,
                    position: 'relative',
                } as React.CSSProperties}
            >
                {/* SVG Background Shape */}
                <svg
                    className={`scanlogo-shape ${animation === 'glow' ? 'scanlogo-shape-glow' : ''}`}
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill={scanLogoVisuals.shapeFillColor}
                    stroke={scanLogoVisuals.shapeStrokeColor}
                    strokeWidth={3 * 24 / shapeSize}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
                >
                    {SHAPE_SVG_PATHS[shape] || SHAPE_SVG_PATHS['square']}
                </svg>

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QRCode
                        ref={qrRef}
                        value={qrValue}
                        size={qrSize}
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
                        logoWidth={qrSize * 0.16}
                        logoHeight={qrSize * 0.16}
                        logoOpacity={1}
                        removeQrCodeBehindLogo
                        logoPaddingStyle="circle"
                        logoPadding={1}
                        enableCORS
                    />
                </div>

                {/* Flash overlay: shows CTA text, flashes 3 times, then reveals QR */}
                {animation === 'flash' && (
                    <div className="scanlogo-flash-overlay">
                        <svg
                            className="scanlogo-flash-shape"
                            width="100%"
                            height="100%"
                            viewBox="0 0 24 24"
                            fill={scanLogoVisuals.resolvedColor}
                            stroke="none"
                        >
                            {SHAPE_SVG_PATHS[shape] || SHAPE_SVG_PATHS['square']}
                        </svg>
                        <span className="flash-cta-text">{resolvedCtaText}</span>
                    </div>
                )}
            </div>

            {/* CTA Text */}
            {!minimal && (
                <p
                    className="scanlogo-cta-text"
                    style={{
                        textShadow: scanLogoVisuals.labelTextShadow,
                        marginTop: 10,
                    }}
                >
                    {resolvedCtaText}
                </p>
            )}

            {/* Short URL is intentionally hidden so it doesn't show */}
            {/* Safe scan badge */}
            {!minimal && safeScanBadge && (
                <div className="scanlogo-safe-badge" style={{ marginTop: 5 }}>
                    <Shield className="w-3 h-3" style={{ marginRight: 4 }} />
                    Safe Scan Verified
                </div>
            )}
        </div>
    )
})

export default ScanLogoPreview
