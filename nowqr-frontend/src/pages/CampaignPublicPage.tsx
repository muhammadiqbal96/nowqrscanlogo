import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Shield } from 'lucide-react'
import { QRCode } from 'react-qrcode-logo'
import '@/components/ScanLogoPreview.css'
import { getFlashTextLayout, getQrScaleForShape, getScanLogoVisuals } from '@/lib/scanLogoVisuals'
import axios from 'axios'

interface CampaignPage {
    name: string
    business_name: string
    headline: string
    sub_headline: string
    description: string
    cta_type: string
    cta_button_text: string
    primary_color: string
    font_family: string
    logo_path: string | null
    background_image_path: string | null
    page_design: Record<string, any> | null
    scan_logos: {
        short_url: string
        short_code: string
        shape: string
        animation: string
        color: string
        cta_text: string
        safe_scan_badge: boolean
        center_logo_path: string | null
        destination_url: string
    }[]
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

export default function CampaignPublicPage() {
    const { slug } = useParams()
    const [campaign, setCampaign] = useState<CampaignPage | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        axios.get(`/api/pages/${slug}`)
            .then(res => setCampaign(res.data.campaign))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false))
    }, [slug])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
        )
    }

    if (notFound || !campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
                    <p className="text-white/60">This campaign page doesn't exist or has been unpublished.</p>
                </div>
            </div>
        )
    }

    const color = campaign.primary_color || '#c8401a'
    const font = campaign.font_family || 'Inter, system-ui, sans-serif'
    const scanLogo = campaign.scan_logos?.[0]
    const size = 200;
    const qrSize = Math.floor(size * getQrScaleForShape(scanLogo?.shape));
    const scanLogoVisuals = scanLogo ? getScanLogoVisuals(scanLogo.color) : null
    const flashTextLayout = scanLogo
        ? getFlashTextLayout(scanLogo.shape, size, scanLogo.cta_text || campaign.cta_button_text || 'TAP TO SCAN')
        : null
    const bgImage = campaign.background_image_path ? `/storage/${campaign.background_image_path}` : null
    const logoUrl = campaign.logo_path ? `/storage/${campaign.logo_path}` : null

    // IMPORTANT: No phone, email, or direct URLs shown — only ScanLogo is the clickable element
    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{
                fontFamily: font,
                background: bgImage
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url(${bgImage}) center/cover`
                    : `linear-gradient(135deg, ${color}22 0%, #0a0a0a 50%, ${color}11 100%)`,
                color: '#ffffff',
            }}
        >
            {/* Business logo */}
            {logoUrl && (
                <img
                    src={logoUrl}
                    alt={campaign.business_name}
                    className="w-16 h-16 rounded-2xl object-cover mb-6 border border-white/10"
                />
            )}

            {/* Business name */}
            <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
                {campaign.business_name}
            </p>

            {/* Headline */}
            <h1
                className="text-3xl sm:text-5xl font-extrabold text-center leading-tight mb-3 max-w-2xl"
                style={{ color }}
            >
                {campaign.headline}
            </h1>

            {/* Sub-headline */}
            {campaign.sub_headline && (
                <p className="text-lg sm:text-xl text-white/70 text-center max-w-xl mb-6">
                    {campaign.sub_headline}
                </p>
            )}

            {/* Description */}
            {campaign.description && (
                <p className="text-sm text-white/50 text-center max-w-md mb-10 leading-relaxed">
                    {campaign.description}
                </p>
            )}

            {/* ScanLogo — the ONLY interactive element */}
            {scanLogo && (
                <div className="flex flex-col items-center">
                    <a
                        href={`/r/${scanLogo.short_code}?click=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                    >
                        <div
                            className={`scanlogo-container scanlogo-anim-${scanLogo.animation}`}
                            style={{
                                width: size,
                                height: size,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                '--scanlogo-color': scanLogoVisuals?.resolvedColor || scanLogo.color,
                                '--scanlogo-glow-color': scanLogoVisuals?.glowColor || `${scanLogo.color}66`,
                                '--scanlogo-flash-text-color': scanLogoVisuals?.flashTextColor || '#ffffff',
                                '--scanlogo-flash-font-size': `${flashTextLayout?.fontSizePx || 14}px`,
                                '--scanlogo-flash-max-width': `${flashTextLayout?.maxWidthPercent || 68}%`,
                                '--scanlogo-flash-letter-spacing': `${flashTextLayout?.letterSpacingEm || 0.08}em`,
                            } as React.CSSProperties}
                        >
                            {/* SVG Outline Rendered behind the QR */}
                            <svg
                                viewBox="0 0 24 24"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                fill={scanLogoVisuals?.shapeFillStrongColor || `${scanLogo.color}15`}
                                stroke={scanLogoVisuals?.shapeStrokeColor || scanLogo.color}
                                strokeWidth={3 * 24 / size}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {SHAPE_SVG_PATHS[scanLogo.shape] || SHAPE_SVG_PATHS['square']}
                            </svg>

                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <QRCode
                                    value={scanLogo.destination_url || 'https://nowqr.ai'}
                                    size={qrSize}
                                    bgColor={scanLogoVisuals?.qrBgColor || 'transparent'}
                                    fgColor={scanLogoVisuals?.qrFgColor || scanLogo.color}
                                    qrStyle="dots"
                                    ecLevel="H"
                                    eyeRadius={[
                                        { outer: [8, 8, 0, 8], inner: [4, 4, 0, 4] },
                                        { outer: [8, 8, 8, 0], inner: [4, 4, 4, 0] },
                                        { outer: [8, 0, 8, 8], inner: [4, 0, 4, 4] },
                                    ]}
                                    logoImage={scanLogo.center_logo_path ? `/storage/${scanLogo.center_logo_path}` : undefined}
                                    logoWidth={Math.floor(qrSize * 0.25)}
                                    logoHeight={Math.floor(qrSize * 0.25)}
                                    removeQrCodeBehindLogo
                                    logoPaddingStyle="circle"
                                    logoPadding={2}
                                />
                            </div>

                            {/* Flash overlay: CTA text flashes 3 times then reveals QR */}
                            {scanLogo.animation === 'flash' && (
                                <div className="scanlogo-flash-overlay">
                                    <svg
                                        className="scanlogo-flash-shape"
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 24 24"
                                        fill={scanLogoVisuals?.resolvedColor || scanLogo.color}
                                        stroke="none"
                                    >
                                        {SHAPE_SVG_PATHS[scanLogo.shape] || SHAPE_SVG_PATHS['square']}
                                    </svg>
                                    <span className="flash-cta-text">{scanLogo.cta_text || campaign.cta_button_text || 'TAP TO SCAN'}</span>
                                </div>
                            )}
                        </div>
                    </a>

                    {/* CTA text */}
                    <p
                        className="text-xs font-extrabold uppercase tracking-[0.15em] mt-4"
                        style={{
                            color: scanLogoVisuals?.labelTextColor || scanLogo.color,
                            textShadow: scanLogoVisuals?.labelTextShadow || 'none',
                        }}
                    >
                        {scanLogo.cta_text || campaign.cta_button_text || 'TAP TO SCAN'}
                    </p>

                    {/* Safe Scan Badge */}
                    {scanLogo.safe_scan_badge && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
                            <Shield className="w-3 h-3" /> Safe Scan Verified
                        </div>
                    )}
                </div>
            )}

            {/* Footer */}
            <p className="mt-16 text-[10px] text-white/20">
                Powered by NowQR
            </p>
        </div>
    )
}
