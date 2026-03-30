import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Shield } from 'lucide-react'
import { toPng, toJpeg } from 'html-to-image'
// @ts-ignore
import gifshot from 'gifshot'
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
    downloadPNG: () => void
    downloadJPG: () => void
    downloadGIF: () => void
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

    // Choose QR size depending on shape to ensure it fits well within the boundaries without touching them
    const isComfortableShape = shape === 'square' || shape === 'circle' || shape === 'hexagon'
    const qrSize = Math.floor(size * (isComfortableShape ? 0.55 : 0.45))

    // Removed shortUrl from QR value so we only encode 'url' to avoid triggering the shortcode visit if not applicable
    const qrValue = url || shortUrl || 'https://nowqr.ai'

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

    // Reusable function to force the layout for export (white background)
    const cloneWrapperForExport = async (format: 'png' | 'jpeg') => {
        if (!wrapperRef.current) return

        const originalAnimation = containerRef.current?.style.animation || ''
        if (containerRef.current) {
            containerRef.current.style.animation = 'none'
        }

        try {
            const opts = {
                pixelRatio: 4,
                cacheBust: true,
                style: {
                    background: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px'
                }
            }
            const dataUrl = format === 'png'
                ? await toPng(wrapperRef.current, opts)
                : await toJpeg(wrapperRef.current, { ...opts, quality: 0.95 });

            return dataUrl;
        } finally {
            if (containerRef.current) {
                containerRef.current.style.animation = originalAnimation
            }
        }
    }

    useImperativeHandle(ref, () => ({
        downloadPNG: async () => {
            const dataUrl = await cloneWrapperForExport('png')
            if (dataUrl) {
                const link = document.createElement('a')
                link.download = 'scanlogo.png'
                link.href = dataUrl
                link.click()
            }
        },
        downloadJPG: async () => {
            const dataUrl = await cloneWrapperForExport('jpeg')
            if (dataUrl) {
                const link = document.createElement('a')
                link.download = 'scanlogo.jpg'
                link.href = dataUrl
                link.click()
            }
        },
        downloadGIF: async () => {
            if (!wrapperRef.current || !containerRef.current) return;
            const originalAnimation = containerRef.current.style.animation;

            // disable css animation briefly so we can render frames manually
            containerRef.current.style.animation = 'none';

            const frames: string[] = [];
            const numFrames = 15;

            // Generate frames by applying inline transforms
            for (let i = 0; i < numFrames; i++) {
                const progress = i / numFrames;

                let transform = containerRef.current.style.transform;

                if (animation === 'spin') {
                    transform = `rotate(${progress * 360}deg)`;
                } else if (animation === 'pulse') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.06;
                    transform = `scale(${scale})`;
                } else if (animation === 'bounce') {
                    const y = Math.sin(progress * Math.PI * 2) * -14;
                    transform = `translateY(${y}px)`;
                } else if (animation === 'expand') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.12;
                    transform = `scale(${scale})`;
                }

                containerRef.current.style.transform = transform;

                const dataUrl = await cloneWrapperForExport('png')
                if (dataUrl) frames.push(dataUrl);
            }

            // Restore original animation
            containerRef.current.style.animation = originalAnimation;
            containerRef.current.style.transform = '';

            gifshot.createGIF({
                images: frames,
                gifWidth: wrapperRef.current.offsetWidth * 2,
                gifHeight: wrapperRef.current.offsetHeight * 2,
                interval: 0.1, // 100ms per frame
            }, (obj: any) => {
                if (!obj.error) {
                    const link = document.createElement('a');
                    link.download = 'scanlogo.gif';
                    link.href = obj.image;
                    link.click();
                }
            });
        },
    }))

    return (
        <div ref={wrapperRef} className="scanlogo-preview-wrapper" style={{ textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Animated container */}
            <div
                ref={containerRef}
                className={`scanlogo-container scanlogo-anim-${animation}`}
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    '--scanlogo-color': color,
                    '--scanlogo-glow-color': `${color}66`,
                    position: 'relative',
                } as React.CSSProperties}
            >
                {/* SVG Background Shape */}
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 24 24"
                    fill={`${color}10`}
                    stroke={color}
                    strokeWidth={3 * 24 / size}
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
                        bgColor="transparent"
                        fgColor={color}
                        qrStyle="dots"
                        ecLevel="H"
                        eyeRadius={[
                            { outer: [8, 8, 0, 8], inner: [4, 4, 0, 4] },
                            { outer: [8, 8, 8, 0], inner: [4, 4, 4, 0] },
                            { outer: [8, 0, 8, 8], inner: [4, 0, 4, 4] },
                        ]}
                        logoImage={base64Logo}
                        logoWidth={qrSize * 0.2}
                        logoHeight={qrSize * 0.2}
                        logoOpacity={1}
                        removeQrCodeBehindLogo
                        logoPaddingStyle="circle"
                        logoPadding={2}
                    />
                </div>

                {/* Flash overlay: shows CTA text, flashes 3 times, then reveals QR */}
                {animation === 'flash' && (
                    <div className={`scanlogo-flash-overlay ${size <= 60 ? 'flash-sm' : size <= 120 ? 'flash-md' : 'flash-lg'}`}>
                        <span className="flash-cta-text">{ctaText}</span>
                    </div>
                )}
            </div>

            {/* CTA Text */}
            {!minimal && (
                <p
                    className="scanlogo-cta-text"
                    style={{ color, marginTop: 10 }}
                >
                    {ctaText}
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
