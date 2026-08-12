import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Sparkles, Truck, Package, AlertTriangle } from 'lucide-react'
import { printApi, scanLogoApi, campaignApi, type PrintProduct } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

// Radix Select forbids empty-string item values, so the "no selection" choices
// use a sentinel that maps back to an empty state.
const SCANLOGO_LATER = '__later__'

interface StickerTemplate {
    id: string
    name: string
    headline: string
    subtitle: string
    layout: string
    canvas_state: {
        elements: any[]
        bgColor: string
        aspectRatio: string
    }
    warnings: string[]
}

function toArray<T = any>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[]
    if (value && typeof value === 'object' && Array.isArray((value as any).data)) {
        return (value as any).data as T[]
    }
    return []
}

export default function StickerStudioPage() {
    const navigate = useNavigate()

    const [products, setProducts] = useState<PrintProduct[]>([])
    const [scanLogos, setScanLogos] = useState<any[]>([])
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)

    const [productKey, setProductKey] = useState('')
    const [campaignId, setCampaignId] = useState<number | ''>('')
    const [scanLogoId, setScanLogoId] = useState<number | ''>('')
    const [businessName, setBusinessName] = useState('')
    const [description, setDescription] = useState('')
    const [tone, setTone] = useState('bold and friendly')
    const [templates, setTemplates] = useState<StickerTemplate[]>([])
    const [aiGenerated, setAiGenerated] = useState(false)

    useEffect(() => {
        Promise.all([printApi.products(), scanLogoApi.list(), campaignApi.list()])
            .then(([productsRes, logosRes, campaignsRes]) => {
                const list: PrintProduct[] = productsRes.data.products ?? []
                setProducts(list)
                if (list.length) setProductKey(list[0].key)

                const logos = toArray<any>(logosRes.data)
                setScanLogos(logos)
                if (logos.length) setScanLogoId(logos[0].id)

                const camps = toArray<any>(campaignsRes.data)
                setCampaigns(camps)
                if (camps.length) setCampaignId(camps[0].id)
            })
            .catch(() => toast.error('Could not load the sticker catalog.'))
            .finally(() => setLoading(false))
    }, [])

    const selectedProduct = products.find(p => p.key === productKey)

    const generate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!productKey || !businessName.trim()) return

        setGenerating(true)
        setTemplates([])
        try {
            const { data } = await printApi.generateTemplates({
                product_key: productKey,
                business_name: businessName.trim(),
                business_description: description.trim() || undefined,
                tone,
                scan_logo_id: scanLogoId === '' ? undefined : Number(scanLogoId),
                count: 4,
            })
            setTemplates(data.templates ?? [])
            setAiGenerated(!!data.ai_generated)
            if (!data.ai_generated) {
                toast('Using built-in designs — AI is not configured.', { icon: 'ℹ️' })
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Could not generate designs.')
        } finally {
            setGenerating(false)
        }
    }

    const useTemplate = (template: StickerTemplate) => {
        if (campaignId === '') {
            toast.error('Pick a campaign first — the editor saves your sticker against it.')
            return
        }

        // Hand the generated canvas straight to the existing editor rather than
        // making the user build a sticker from scratch.
        navigate(`/dashboard/campaigns/${campaignId}/flyer?type=flyer`, {
            state: { stickerTemplate: template.canvas_state },
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Sticker Studio</h1>
                    <p className="text-sm text-muted-foreground">
                        Describe your business and let AI lay out a print-ready bumper sticker around your ScanLogo.
                    </p>
                </div>
                <Link to="/dashboard/orders"
                    className="flex items-center gap-1.5 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 shrink-0">
                    <Package className="w-4 h-4" /> My orders
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={generate} className="bg-card border border-border rounded-xl p-5 h-fit space-y-3">
                    <h2 className="font-semibold">Design brief</h2>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Sticker size</span>
                        <Select value={productKey || undefined} onValueChange={setProductKey}>
                            <SelectTrigger className="mt-1 w-full text-sm">
                                <SelectValue placeholder="Select a size" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(p => (
                                    <SelectItem key={p.key} value={p.key}>
                                        {p.name} — ${p.retail_price.toFixed(2)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Campaign</span>
                        <Select
                            value={campaignId === '' ? undefined : String(campaignId)}
                            onValueChange={v => setCampaignId(Number(v))}
                        >
                            <SelectTrigger className="mt-1 w-full text-sm">
                                <SelectValue placeholder="No campaigns yet" />
                            </SelectTrigger>
                            <SelectContent>
                                {campaigns.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">ScanLogo</span>
                        <Select
                            value={scanLogoId === '' ? SCANLOGO_LATER : String(scanLogoId)}
                            onValueChange={v => setScanLogoId(v === SCANLOGO_LATER ? '' : Number(v))}
                        >
                            <SelectTrigger className="mt-1 w-full text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={SCANLOGO_LATER}>Choose later in the editor</SelectItem>
                                {scanLogos.map(l => (
                                    <SelectItem key={l.id} value={String(l.id)}>{l.cta_text || l.short_code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Business name</span>
                        <input value={businessName} onChange={e => setBusinessName(e.target.value)} required
                            placeholder="Bob's Coffee Co"
                            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" />
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">What do you do?</span>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                            placeholder="Small-batch roastery in Austin. We want people to scan and order online."
                            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm resize-none" />
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-muted-foreground">Tone</span>
                        <Select value={tone} onValueChange={setTone}>
                            <SelectTrigger className="mt-1 w-full text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {['bold and friendly', 'minimal and clean', 'loud and playful', 'premium and elegant'].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <button type="submit" disabled={generating || !businessName.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {generating ? 'Designing…' : 'Generate designs'}
                    </button>

                    {selectedProduct && (
                        <p className="text-xs text-muted-foreground pt-1">
                            {selectedProduct.size_label} · {selectedProduct.print_width_px}×{selectedProduct.print_height_px}px
                            at {selectedProduct.print_dpi} DPI · free worldwide shipping.
                        </p>
                    )}
                </form>

                <div className="lg:col-span-2">
                    {templates.length === 0 && !generating && (
                        <div className="border border-dashed border-border rounded-xl p-12 text-center">
                            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Fill in the brief and generate — you'll get ready-made layouts, not a blank canvas.
                            </p>
                        </div>
                    )}

                    {generating && (
                        <div className="border border-border rounded-xl p-12 text-center">
                            <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">Laying out your stickers…</p>
                        </div>
                    )}

                    {templates.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold">Pick a design</h2>
                                <span className="text-xs text-muted-foreground">
                                    {aiGenerated ? 'AI generated' : 'Built-in designs'}
                                </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {templates.map(t => (
                                    <TemplateCard
                                        key={t.id}
                                        template={t}
                                        product={selectedProduct}
                                        onUse={() => useTemplate(t)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function TemplateCard({ template, product, onUse }: {
    template: StickerTemplate
    product?: PrintProduct
    onUse: () => void
}) {
    const w = product?.print_width_px ?? 3450
    const h = product?.print_height_px ?? 900

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* True-proportion preview — the viewBox does the scaling. */}
            <div className="w-full overflow-hidden bg-muted" style={{ aspectRatio: `${w} / ${h}` }}>
                <StickerPreview elements={template.canvas_state.elements} bgColor={template.canvas_state.bgColor} w={w} h={h} />
            </div>

            <div className="p-3">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                    {template.headline}{template.subtitle ? ` · ${template.subtitle}` : ''}
                </div>

                {template.warnings.length > 0 && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{template.warnings[0]}</span>
                    </div>
                )}

                <button onClick={onUse}
                    className="w-full flex items-center justify-center gap-1.5 mt-3 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                    <Truck className="w-3.5 h-3.5" /> Customize & order
                </button>
            </div>
        </div>
    )
}

/**
 * Renders the composed elements at true print size inside a scaled container,
 * so what you see is the proportions of the actual sticker.
 */
function StickerPreview({ elements, bgColor, w, h }: {
    elements: any[]
    bgColor: string
    w: number
    h: number
}) {
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <rect x={0} y={0} width={w} height={h} fill={bgColor} />
                {elements.map((el: any) => {
                    if (el.type === 'shape') {
                        return (
                            <rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height}
                                rx={el.borderRadius ?? 0} fill={el.bgColor} opacity={el.opacity ?? 1} />
                        )
                    }
                    if (el.type === 'qr') {
                        return (
                            <g key={el.id}>
                                <rect x={el.x} y={el.y} width={el.width} height={el.height} fill="#111111" opacity={0.08} />
                                <text x={el.x + el.width / 2} y={el.y + el.height / 2} fill="#111111"
                                    fontSize={el.width * 0.14} textAnchor="middle" dominantBaseline="middle">
                                    QR
                                </text>
                            </g>
                        )
                    }
                    if (el.type === 'text') {
                        const anchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start'
                        const tx = el.textAlign === 'center' ? el.x + el.width / 2
                            : el.textAlign === 'right' ? el.x + el.width
                                : el.x
                        return (
                            <text key={el.id} x={tx} y={el.y + el.height / 2} fill={el.textColor}
                                fontSize={el.fontSize} fontWeight={el.fontWeight} fontFamily={el.fontFamily}
                                textAnchor={anchor} dominantBaseline="middle">
                                {el.content}
                            </text>
                        )
                    }
                    return null
                })}
        </svg>
    )
}
