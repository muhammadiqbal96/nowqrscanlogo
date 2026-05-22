import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, Loader2, Shield, X } from 'lucide-react'
import ScanLogoPreview from '@/components/ScanLogoPreview'
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
        wrapper_color?: string
        cta_text: string
        safe_scan_badge: boolean
        center_logo_path: string | null
        destination_url: string
    }[]
}

export default function CampaignPublicPage() {
    const { slug } = useParams()
    const [campaign, setCampaign] = useState<CampaignPage | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [isScanLogoExpanded, setIsScanLogoExpanded] = useState(false)

    useEffect(() => {
        setIsScanLogoExpanded(false)
        axios.get(`/api/pages/${slug}`)
            .then(res => setCampaign(res.data.campaign))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false))
    }, [slug])

    useEffect(() => {
        if (!isScanLogoExpanded) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsScanLogoExpanded(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isScanLogoExpanded])

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
    const scanLogoCta = scanLogo?.cta_text || campaign.cta_button_text || 'TAP TO SCAN'
    const scanLogoHref = scanLogo?.short_code ? `/r/${scanLogo.short_code}?click=1` : scanLogo?.short_url || '#'
    const expandedScanLogoSize = typeof window === 'undefined'
        ? 300
        : Math.min(320, Math.max(260, window.innerWidth - 72))

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

            {/* ScanLogo — tap once to enlarge, tap again to navigate */}
            {scanLogo && (
                <div className="flex flex-col items-center">
                    <button
                        type="button"
                        onClick={() => setIsScanLogoExpanded(true)}
                        className={`group block rounded-[2rem] border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                            transition-transform duration-300 ease-out
                            ${isScanLogoExpanded ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100 hover:scale-[1.04] active:scale-[0.97]'}`}
                        aria-haspopup="dialog"
                        aria-expanded={isScanLogoExpanded}
                        aria-label={`Tap to scan: ${scanLogoCta}`}
                    >
                        <ScanLogoPreview
                            url={scanLogo.destination_url || 'https://nowqr.ai'}
                            shortUrl={scanLogo.short_url}
                            shape={scanLogo.shape || 'shield'}
                            animation={scanLogo.animation || 'none'}
                            color={scanLogo.color || color}
                            wrapperColor={scanLogo.wrapper_color || scanLogo.color || color}
                            ctaText={scanLogo.cta_text || campaign.cta_button_text || 'TAP TO SCAN'}
                            safeScanBadge={false}
                            centerLogoUrl={scanLogo.center_logo_path ? `/storage/${scanLogo.center_logo_path}` : null}
                            size={240}
                            minimal
                        />
                    </button>

                    {/* CTA text */}
                    <p
                        className="text-sm font-extrabold uppercase tracking-[0.15em] mt-4"
                        style={{ color: '#f8fafc' }}
                    >
                        {scanLogoCta}
                    </p>

                    {/* Safe Scan Badge */}
                    {scanLogo.safe_scan_badge && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
                            <Shield className="w-3 h-3" /> Safe Scan Verified
                        </div>
                    )}

                    {isScanLogoExpanded && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-sm"
                            role="dialog"
                            aria-modal="true"
                            aria-label={scanLogoCta}
                        >
                            <button
                                type="button"
                                className="absolute inset-0 cursor-default"
                                onClick={() => setIsScanLogoExpanded(false)}
                                aria-label="Close expanded ScanLogo"
                            />
                            <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[2rem] border border-white/10 bg-black/80 px-5 py-6 shadow-2xl">
                                <button
                                    type="button"
                                    onClick={() => setIsScanLogoExpanded(false)}
                                    className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    aria-label="Close expanded ScanLogo"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <a
                                    href={scanLogoHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mx-auto block w-fit rounded-[2rem] p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    aria-label={scanLogoCta}
                                >
                                    <ScanLogoPreview
                                        url={scanLogo.destination_url || 'https://nowqr.ai'}
                                        shortUrl={scanLogo.short_url}
                                        shape={scanLogo.shape || 'shield'}
                                        animation={scanLogo.animation || 'none'}
                                        color={scanLogo.color || color}
                                        wrapperColor={scanLogo.wrapper_color || scanLogo.color || color}
                                        ctaText={scanLogoCta}
                                        safeScanBadge={false}
                                        centerLogoUrl={scanLogo.center_logo_path ? `/storage/${scanLogo.center_logo_path}` : null}
                                        size={expandedScanLogoSize}
                                        minimal
                                    />
                                </a>

                                <a
                                    href={scanLogoHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-black hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                >
                                    {scanLogoCta}
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
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
