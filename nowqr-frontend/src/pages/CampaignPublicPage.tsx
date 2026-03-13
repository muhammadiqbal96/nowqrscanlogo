import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Shield } from 'lucide-react'
import { QRCode } from 'react-qrcode-logo'
import '@/components/ScanLogoPreview.css'
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

const SHAPE_RADIUS: Record<string, string> = {
    circle: '50%', shield: '20px', gear: '16px',
    eye: '40% 10%', diamond: '16px', hexagon: '24px', square: '8px',
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
                                width: 180,
                                height: 180,
                                borderRadius: SHAPE_RADIUS[scanLogo.shape] || '16px',
                                border: `3px solid ${scanLogo.color}`,
                                backgroundColor: `${scanLogo.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                '--scanlogo-color': scanLogo.color,
                                '--scanlogo-glow-color': `${scanLogo.color}66`,
                            } as React.CSSProperties}
                        >
                            <QRCode
                                value={scanLogo.destination_url}
                                size={130}
                                bgColor="transparent"
                                fgColor={scanLogo.color}
                                qrStyle="dots"
                                eyeRadius={[
                                    { outer: [8, 8, 0, 8], inner: [4, 4, 0, 4] },
                                    { outer: [8, 8, 8, 0], inner: [4, 4, 4, 0] },
                                    { outer: [8, 0, 8, 8], inner: [4, 0, 4, 4] },
                                ]}
                                logoImage={scanLogo.center_logo_path ? `/storage/${scanLogo.center_logo_path}` : undefined}
                                logoWidth={36}
                                logoHeight={36}
                                removeQrCodeBehindLogo
                                logoPaddingStyle="circle"
                                logoPadding={3}
                            />

                            {/* Flash overlay: CTA text flashes 3 times then reveals QR */}
                            {scanLogo.animation === 'flash' && (
                                <div className="scanlogo-flash-overlay flash-lg">
                                    <span className="flash-cta-text">{scanLogo.cta_text || campaign.cta_button_text || 'TAP TO SCAN'}</span>
                                </div>
                            )}
                        </div>
                    </a>

                    {/* CTA text */}
                    <p
                        className="text-xs font-extrabold uppercase tracking-[0.15em] mt-4"
                        style={{ color: scanLogo.color }}
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
