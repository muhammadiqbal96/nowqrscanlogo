import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ShoppingBag, Phone, Heart, Calendar, PlayCircle, UtensilsCrossed,
    Zap, ArrowRight, ArrowLeft, Loader2, Sparkles, Check, Palette,
    Type, Image, FileImage, QrCode
} from 'lucide-react'
import { campaignApi, aiApi } from '@/lib/api'
import toast from 'react-hot-toast'

const CTA_OPTIONS = [
    { value: 'buy', label: 'Buy Now', icon: ShoppingBag, desc: 'E-commerce & product sales', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { value: 'give', label: 'Give Now', icon: Heart, desc: 'Donations & charity', color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    { value: 'pay', label: 'Pay Now', icon: Zap, desc: 'Payments & invoices', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    { value: 'call', label: 'Call Now', icon: Phone, desc: 'Click-to-call services', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    { value: 'book', label: 'Book Now', icon: Calendar, desc: 'Appointments & reservations', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { value: 'watch', label: 'Watch Now', icon: PlayCircle, desc: 'Video & media content', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    { value: 'order', label: 'Order Now', icon: UtensilsCrossed, desc: 'Food & delivery orders', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { value: 'custom', label: 'Custom', icon: Zap, desc: 'Define your own action', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
]

const FONT_OPTIONS = ['Inter', 'Poppins', 'Playfair Display', 'Roboto', 'Montserrat', 'Lato']
const COLOR_PRESETS = ['#c8401a', '#1a6bc8', '#1a8c4e', '#8b5cf6', '#d97706', '#dc2626', '#0891b2', '#1e293b']

type Step = 'cta' | 'details' | 'ai-generate' | 'editor'

export default function CampaignBuilderPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('cta')
    const [loading, setLoading] = useState(false)

    // Step 1: CTA type
    const [ctaType, setCtaType] = useState('')
    const [customCta, setCustomCta] = useState('')

    // Step 2: Business details
    const [businessName, setBusinessName] = useState('')
    const [businessDescription, setBusinessDescription] = useState('')
    const [targetAudience, setTargetAudience] = useState('')
    const [campaignName, setCampaignName] = useState('')

    // Step 3: AI-generated content
    const [aiContent, setAiContent] = useState<{
        headline: string
        sub_headline: string
        description: string
        cta_button_text: string
    } | null>(null)

    // Step 4: Editor customizations
    const [primaryColor, setPrimaryColor] = useState('#c8401a')
    const [fontFamily, setFontFamily] = useState('Inter')
    const [campaignId, setCampaignId] = useState<number | null>(null)
    const [showNextStep, setShowNextStep] = useState(false)

    // Editable content (initialized from AI)
    const [headline, setHeadline] = useState('')
    const [subHeadline, setSubHeadline] = useState('')
    const [description, setDescription] = useState('')
    const [ctaButtonText, setCtaButtonText] = useState('')

    const handleChooseCta = (value: string) => {
        setCtaType(value)
        setStep('details')
    }

    const handleSubmitDetails = async () => {
        if (!businessName.trim()) {
            toast.error('Business name is required')
            return
        }
        if (!businessDescription.trim()) {
            toast.error('Please describe your business')
            return
        }

        setLoading(true)
        setStep('ai-generate')

        try {
            // Create campaign first
            const name = campaignName || `${businessName} - ${ctaType.charAt(0).toUpperCase() + ctaType.slice(1)} Campaign`
            const campaignRes = await campaignApi.create({
                name,
                business_name: businessName,
                business_description: businessDescription,
                target_audience: targetAudience || undefined,
                cta_type: ctaType,
                custom_cta: ctaType === 'custom' ? customCta : undefined,
            })

            const newCampaignId = campaignRes.data.campaign.id
            setCampaignId(newCampaignId)

            // Generate AI content
            const aiRes = await aiApi.generateContent({
                campaign_id: newCampaignId,
                business_name: businessName,
                business_description: businessDescription,
                target_audience: targetAudience || undefined,
                cta_type: ctaType,
                custom_cta: ctaType === 'custom' ? customCta : undefined,
            })

            const content = aiRes.data.content
            setAiContent(content)
            setHeadline(content.headline)
            setSubHeadline(content.sub_headline)
            setDescription(content.description)
            setCtaButtonText(content.cta_button_text)
            setStep('editor')
            toast.success('AI content generated!')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to generate content')
            setStep('details')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveCampaign = async () => {
        if (!campaignId) return
        setLoading(true)
        try {
            await campaignApi.update(campaignId, {
                headline,
                sub_headline: subHeadline,
                description,
                cta_button_text: ctaButtonText,
                primary_color: primaryColor,
                font_family: fontFamily,
            })

            // Publish the campaign
            await campaignApi.publish(campaignId)
            toast.success('Campaign saved & published!')
            setShowNextStep(true)
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save campaign')
        } finally {
            setLoading(false)
        }
    }

    const stepNumber = step === 'cta' ? 1 : step === 'details' ? 2 : step === 'ai-generate' ? 3 : 4

    return (
        <div className="max-w-5xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < stepNumber ? 'bg-primary text-primary-foreground' :
                                    s === stepNumber ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                                        'bg-muted text-muted-foreground'
                                }`}>
                                {s < stepNumber ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 4 && <div className={`w-12 h-0.5 ${s < stepNumber ? 'bg-primary' : 'bg-border'}`} />}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {step === 'cta' && 'Step 1: Choose your call to action'}
                    {step === 'details' && 'Step 2: Tell us about your business'}
                    {step === 'ai-generate' && 'Step 3: AI is building your ad page...'}
                    {step === 'editor' && 'Step 4: Customize your ad page'}
                </p>
            </div>

            {/* Step 1: Choose CTA */}
            {step === 'cta' && (
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">What do you want people to do?</h1>
                    <p className="text-muted-foreground mb-8">Choose the action your audience will take when they scan or tap your ScanLogo.</p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {CTA_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleChooseCta(option.value)}
                                className={`p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg group ${ctaType === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${option.color}`}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <p className="font-semibold text-sm mb-1">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.desc}</p>
                            </button>
                        ))}
                    </div>

                    {ctaType === 'custom' && (
                        <div className="mt-6 max-w-md">
                            <label className="block text-sm font-medium mb-1.5">Custom action text</label>
                            <input
                                type="text"
                                placeholder="e.g., Subscribe Now, Learn More..."
                                value={customCta}
                                onChange={(e) => setCustomCta(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            />
                            <button
                                onClick={() => setStep('details')}
                                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm"
                            >
                                Continue <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Business Details */}
            {step === 'details' && (
                <div className="max-w-2xl">
                    <button onClick={() => setStep('cta')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="w-4 h-4" /> Back to CTA selection
                    </button>

                    <h1 className="text-2xl lg:text-3xl font-bold mb-2">Tell us about your business</h1>
                    <p className="text-muted-foreground mb-8">
                        Our AI will use this info to write your ad page headline, description, and call-to-action text automatically.
                    </p>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Campaign name <span className="text-muted-foreground">(optional)</span></label>
                            <input
                                type="text"
                                placeholder="e.g., Spring Sale 2026"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Business name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Jordan's Flower Shop"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">What does your business offer? *</label>
                            <textarea
                                rows={3}
                                placeholder="e.g., We deliver fresh floral arrangements for weddings, events, and everyday occasions in the Austin area."
                                value={businessDescription}
                                onChange={(e) => setBusinessDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Who is your target audience? <span className="text-muted-foreground">(optional)</span></label>
                            <input
                                type="text"
                                placeholder="e.g., Brides-to-be, event planners, gift buyers in Austin TX"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                            />
                        </div>

                        <button
                            onClick={handleSubmitDetails}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: AI Generating */}
            {step === 'ai-generate' && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                        <Sparkles className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">AI is creating your ad page...</h2>
                    <p className="text-muted-foreground text-sm max-w-md">
                        Our AI is writing your headline, description, and call-to-action text based on your business details.
                        This usually takes just a few seconds.
                    </p>
                    <Loader2 className="w-6 h-6 animate-spin text-primary mt-8" />
                </div>
            )}

            {/* Step 4: Editor / Preview */}
            {step === 'editor' && aiContent && (
                <div>
                    <button onClick={() => { setStep('details'); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
                        <ArrowLeft className="w-4 h-4" /> Back to details
                    </button>

                    <h1 className="text-2xl font-bold mb-2">Customize your ad page</h1>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Edit the AI-generated text, choose your colors and font. No contact info allowed — the ScanLogo will be the only clickable element.
                    </p>

                    <div className="grid lg:grid-cols-5 gap-8">
                        {/* Controls - left */}
                        <div className="lg:col-span-2 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                                    <Type className="w-4 h-4" /> Headline
                                </label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Sub-headline</label>
                                <input
                                    type="text"
                                    value={subHeadline}
                                    onChange={(e) => setSubHeadline(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Description</label>
                                <textarea
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">CTA Button Text</label>
                                <input
                                    type="text"
                                    value={ctaButtonText}
                                    onChange={(e) => setCtaButtonText(e.target.value)}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                    <Palette className="w-4 h-4" /> Primary Color
                                </label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {COLOR_PRESETS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => setPrimaryColor(color)}
                                            className={`w-8 h-8 rounded-lg transition-all ${primaryColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        className="w-8 h-8 rounded-lg border border-border cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Font</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FONT_OPTIONS.map((font) => (
                                        <button
                                            key={font}
                                            onClick={() => setFontFamily(font)}
                                            className={`px-3 py-2 text-xs rounded-lg border transition-all ${fontFamily === font ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'
                                                }`}
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveCampaign}
                                    disabled={loading || showNextStep}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & Publish <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </div>

                            {/* Next step choice */}
                            {showNextStep && campaignId && (
                                <div className="mt-6 p-5 bg-green-500/5 border border-green-500/20 rounded-2xl space-y-3">
                                    <p className="text-sm font-semibold text-green-600">Campaign published! What's next?</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => navigate(`/dashboard/scanlogos/new?campaign_id=${campaignId}`)}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 text-left transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <QrCode className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Build ScanLogo</p>
                                                <p className="text-xs text-muted-foreground">Create an animated QR code button for this campaign</p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dashboard/campaigns/${campaignId}/flyer`)}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 text-left transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                                <FileImage className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Create Flyer / Post</p>
                                                <p className="text-xs text-muted-foreground">Design a downloadable promotional flyer with drag & drop</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview - right */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-4">
                                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                    <Image className="w-3.5 h-3.5" /> Live Preview
                                </p>
                                <div
                                    className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
                                    style={{ fontFamily }}
                                >
                                    <div className="aspect-[9/16] max-h-[600px] flex flex-col items-center justify-center px-8 py-12 text-center relative"
                                        style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}
                                    >
                                        {/* Business name badge */}
                                        <div className="mb-6">
                                            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                                                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                                            >
                                                {businessName}
                                            </span>
                                        </div>

                                        {/* Headline */}
                                        <h2 className="text-3xl font-bold mb-3 leading-tight" style={{ color: primaryColor }}>
                                            {headline}
                                        </h2>

                                        {/* Sub-headline */}
                                        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                                            {subHeadline}
                                        </p>

                                        {/* Description */}
                                        <p className="text-sm text-muted-foreground/80 mb-8 max-w-sm leading-relaxed">
                                            {description}
                                        </p>

                                        {/* ScanLogo placeholder */}
                                        <div className="w-28 h-28 rounded-2xl border-2 border-dashed flex items-center justify-center mb-4"
                                            style={{ borderColor: primaryColor }}
                                        >
                                            <div className="text-center">
                                                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-1"
                                                    style={{ backgroundColor: `${primaryColor}20` }}
                                                >
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke={primaryColor} strokeWidth="2" fill="none" /><rect x="14" y="2" width="8" height="8" rx="1.5" stroke={primaryColor} strokeWidth="2" fill="none" /><rect x="2" y="14" width="8" height="8" rx="1.5" stroke={primaryColor} strokeWidth="2" fill="none" /><rect x="14" y="14" width="3" height="3" fill={primaryColor} rx="0.5" /><rect x="19" y="14" width="3" height="3" fill={primaryColor} rx="0.5" /><rect x="14" y="19" width="3" height="3" fill={primaryColor} rx="0.5" /><rect x="19" y="19" width="3" height="3" fill={primaryColor} rx="0.5" /></svg>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">ScanLogo</span>
                                            </div>
                                        </div>

                                        {/* CTA text */}
                                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                                            {ctaButtonText}
                                        </span>

                                        {/* No contact info notice */}
                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <span className="text-[9px] text-muted-foreground/50">
                                                No phone numbers, emails, or URLs — ScanLogo is the only action
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
