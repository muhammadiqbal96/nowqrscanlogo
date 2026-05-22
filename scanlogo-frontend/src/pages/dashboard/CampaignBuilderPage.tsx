import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ShoppingBag, Phone, Heart, Calendar, PlayCircle, UtensilsCrossed,
    Zap, ArrowRight, ArrowLeft, Loader2, Sparkles, Check, Search
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

type Step = 'cta' | 'details' | 'ai-generate'

function extractErrorMessage(error: any): string {
    // Handle Laravel validation errors (errors object with field keys)
    if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
        const errors = error.response.data.errors
        const fieldErrors: string[] = []
        
        // Field-friendly names
        const fieldNames: Record<string, string> = {
            'business_name': 'Business name',
            'business_description': 'Business description',
            'target_audience': 'Target audience',
            'campaign_name': 'Campaign name',
        }
        
        for (const [field, messages] of Object.entries(errors)) {
            if (Array.isArray(messages) && messages.length > 0) {
                const fieldLabel = fieldNames[field] || field
                fieldErrors.push(`${fieldLabel}: ${messages[0]}`)
            }
        }
        
        if (fieldErrors.length > 0) {
            return fieldErrors.join('\n')
        }
    }
    
    // Handle Laravel error message field
    if (error?.response?.data?.message) {
        return error.response.data.message
    }
    
    // Handle error details field (sometimes used by Laravel)
    if (error?.response?.data?.error) {
        return error.response.data.error
    }
    
    // Fall back to generic error
    return 'Failed to generate content. Please check your input and try again.'
}

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

    // Default styling saved to campaign
    const [primaryColor] = useState('#c8401a')
    const [fontFamily] = useState('Inter')

    const handleChooseCta = (value: string) => {
        setCtaType(value)
        if (value !== 'custom') {
            setStep('details')
        }
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

        try {
            // Create campaign first
            const name = campaignName || `${businessName} - ${ctaType.charAt(0).toUpperCase() + ctaType.slice(1)} Campaign`
            const campaignRes = await campaignApi.create({
                name,
                business_name: businessName,
                business_description: businessDescription,
                ...(targetAudience.trim() ? { target_audience: targetAudience } : {}),
                cta_type: ctaType,
                custom_cta: ctaType === 'custom' ? customCta : undefined,
            })

            const newCampaignId = campaignRes.data.campaign.id

            // Generate AI content
            const aiRes = await aiApi.generateContent({
                campaign_id: newCampaignId,
                business_name: businessName,
                business_description: businessDescription,
                ...(targetAudience.trim() ? { target_audience: targetAudience } : {}),
                cta_type: ctaType,
                custom_cta: ctaType === 'custom' ? customCta : undefined,
            })

            const content = aiRes.data.content

            // Save AI content to campaign
            await campaignApi.update(newCampaignId, {
                headline: content.headline,
                sub_headline: content.sub_headline,
                description: content.description,
                cta_button_text: content.cta_button_text,
                primary_color: primaryColor,
                font_family: fontFamily,
            })

            // Only change step AFTER all API calls succeed
            setStep('ai-generate')
            toast.success('AI content generated! Choose a template.')
            // Navigate to the standalone template selection page
            navigate(`/dashboard/campaigns/${newCampaignId}/templates`)
        } catch (err: any) {
            const errorMessage = extractErrorMessage(err)
            toast.error(errorMessage)
            // Step stays on 'details' - no need to explicitly set it
        } finally {
            setLoading(false)
        }
    }

    const stepNumber = step === 'cta' ? 1 : step === 'details' ? 2 : 3

    return (
        <div className="max-w-5xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s < stepNumber ? 'bg-primary text-primary-foreground' :
                                s === stepNumber ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                {s < stepNumber ? <Check className="w-4 h-4" /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-0.5 ${s < stepNumber ? 'bg-primary' : 'bg-border'}`} />}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">
                    {step === 'cta' && 'Step 1: Choose your call to action'}
                    {step === 'details' && 'Step 2: Tell us about your business'}
                    {step === 'ai-generate' && 'Step 3: AI is generating your content...'}
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
                            <label className="block text-sm font-medium mb-1.5">AI search for descriptions *</label>
                            <p className="text-xs text-muted-foreground mb-2">Enter the product, service, offer, or audience you want the page copy to promote.</p>
                            <div className="relative">
                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    rows={3}
                                    placeholder="e.g., Fresh floral arrangements for weddings, events, and everyday occasions in Austin."
                                    value={businessDescription}
                                    onChange={(e) => setBusinessDescription(e.target.value)}
                                    className="w-full px-4 py-3 pl-10 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
                                />
                            </div>
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
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
        </div>
    )
}
