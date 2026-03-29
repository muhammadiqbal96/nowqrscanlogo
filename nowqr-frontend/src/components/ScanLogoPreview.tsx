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

const SHAPE_CLIP: Record<string, string> = {
    circle: '50%',
    shield: '20px',
    gear: '16px',
    eye: '40% 10%',
    diamond: '16px',
    hexagon: '24px',
    square: '8px',
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
    size = 160,
    minimal = false,
}, ref) {
    const qrRef = useRef<any>(null)
    const isDiamond = shape === 'diamond'
    const borderRadius = SHAPE_CLIP[shape] || '16px'
    const qrSize = Math.floor(size * 0.75)
    // Removed shortUrl from QR value so we only encode 'url' to avoid triggering the shortcode visit if not applicable
    const qrValue = url || shortUrl || 'https://nowqr.com'

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
    const cloneWrapperForExport = async (format: 'png'|'jpeg') => {
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
                // Add base rotation for diamond shape
                const baseTransform = isDiamond ? 'rotate(45deg)' : '';

                if (animation === 'spin') {
                    transform = `${baseTransform} rotate(${progress * 360}deg)`;
                } else if (animation === 'pulse') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.06;
                    transform = `${baseTransform} scale(${scale})`;
                } else if (animation === 'bounce') {
                    const y = Math.sin(progress * Math.PI * 2) * -14;
                    transform = `${baseTransform} translateY(${y}px)`;
                } else if (animation === 'expand') {
                    const scale = 1 + Math.sin(progress * Math.PI) * 0.12;
                    transform = `${baseTransform} scale(${scale})`;
                }

                containerRef.current.style.transform = transform;

                const dataUrl = await cloneWrapperForExport('png')
                if(dataUrl) frames.push(dataUrl);
            }

            // Restore original animation
            containerRef.current.style.animation = originalAnimation;
            containerRef.current.style.transform = isDiamond ? 'rotate(45deg)' : '';

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
                    borderRadius,
                    border: `3px solid ${color}`,
                    backgroundColor: `${color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    transform: isDiamond ? 'rotate(45deg)' : undefined,
                    '--scanlogo-color': color,
                    '--scanlogo-glow-color': `${color}66`,
                    position: 'relative',
                    overflow: 'hidden',
                } as React.CSSProperties}
            >
                <div style={{ transform: isDiamond ? 'rotate(-45deg)' : undefined }}>
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
