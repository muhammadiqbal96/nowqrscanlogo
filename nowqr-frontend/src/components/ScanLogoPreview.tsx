import { useRef, forwardRef, useImperativeHandle } from 'react'
import { QRCode } from 'react-qrcode-logo'
import { Shield } from 'lucide-react'
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
    const downloadQrRef = useRef<any>(null)
    const isDiamond = shape === 'diamond'
    const borderRadius = SHAPE_CLIP[shape] || '16px'
    const qrSize = Math.floor(size * 0.75)
    const qrValue = shortUrl || url || 'https://nowqr.com'

    useImperativeHandle(ref, () => ({
        downloadPNG: () => {
            if (downloadQrRef.current) {
                downloadQrRef.current.download('png', 'scanlogo')
            }
        },
        downloadJPG: () => {
            if (downloadQrRef.current) {
                downloadQrRef.current.download('jpg', 'scanlogo')
            }
        },
    }))

    return (
        <div className="scanlogo-preview-wrapper" style={{ textAlign: 'center', position: 'relative' }}>
            {/* Animated container */}
            <div
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
                        logoImage={centerLogoUrl || undefined}
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

            {/* Short URL */}
            {!minimal && shortUrl && (
                <p className="scanlogo-short-url">
                    {shortUrl}
                </p>
            )}

            {/* Safe scan badge */}
            {!minimal && safeScanBadge && (
                <div className="scanlogo-safe-badge">
                    <Shield className="w-3 h-3" />
                    Safe Scan Verified
                </div>
            )}

            {/* Hidden high-res QR for downloads (1024px, white bg, scannable) */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <QRCode
                    ref={downloadQrRef}
                    value={qrValue}
                    size={1024}
                    bgColor="#FFFFFF"
                    fgColor={color}
                    qrStyle="dots"
                    ecLevel="H"
                    quietZone={40}
                    eyeRadius={[
                        { outer: [8, 8, 0, 8], inner: [4, 4, 0, 4] },
                        { outer: [8, 8, 8, 0], inner: [4, 4, 4, 0] },
                        { outer: [8, 0, 8, 8], inner: [4, 0, 4, 4] },
                    ]}
                    logoImage={centerLogoUrl || undefined}
                    logoWidth={1024 * 0.18}
                    logoHeight={1024 * 0.18}
                    logoOpacity={1}
                    removeQrCodeBehindLogo
                    logoPaddingStyle="circle"
                    logoPadding={8}
                />
            </div>
        </div>
    )
})

export default ScanLogoPreview
