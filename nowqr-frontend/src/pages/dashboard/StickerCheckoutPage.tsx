import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, Truck, ArrowLeft, ShieldCheck } from 'lucide-react'
import { printApi, type PrintProduct, type ShippingAddress } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

interface CheckoutState {
    artworkId?: number
    productId?: number
    artworkUrl?: string
}

const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'IE', name: 'Ireland' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'IN', name: 'India' },
]

export default function StickerCheckoutPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const { artworkId, productId, artworkUrl } = (location.state as CheckoutState | null) ?? {}

    const [product, setProduct] = useState<PrintProduct | null>(null)
    const [allowedCountries, setAllowedCountries] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [quantity, setQuantity] = useState(1)

    const [address, setAddress] = useState<ShippingAddress>({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        region: '',
        country: 'US',
        zip: '',
    })

    useEffect(() => {
        if (!artworkId || !productId) {
            toast.error('Design your sticker first.')
            navigate('/dashboard/stickers')
            return
        }

        printApi.products()
            .then(({ data }) => {
                const found = (data.products ?? []).find((p: PrintProduct) => p.id === productId)
                if (!found) {
                    toast.error('That product is no longer available.')
                    navigate('/dashboard/stickers')
                    return
                }
                setProduct(found)
                setQuantity(found.min_quantity)
                setAllowedCountries(data.allowed_countries ?? [])
            })
            .catch(() => toast.error('Could not load the product.'))
            .finally(() => setLoading(false))
    }, [artworkId, productId, navigate])

    const countries = allowedCountries.length
        ? COUNTRIES.filter(c => allowedCountries.includes(c.code))
        : COUNTRIES

    const unitPrice = product?.retail_price ?? 0
    const total = (unitPrice * quantity).toFixed(2)

    const setField = (key: keyof ShippingAddress, value: string) =>
        setAddress(prev => ({ ...prev, [key]: value }))

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!product || !artworkId) return

        setSubmitting(true)
        try {
            const { data } = await printApi.createOrder({
                items: [{
                    print_product_id: product.id,
                    print_artwork_id: artworkId,
                    quantity,
                }],
                shipping: address,
            })

            // Hand off to PayPal; we come back to the order detail page.
            window.location.href = data.checkout_url
        } catch (err: any) {
            const message = err?.response?.data?.message ?? 'Could not start checkout.'
            toast.error(message)
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <Link to="/dashboard/stickers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" /> Back to sticker studio
            </Link>

            <h1 className="text-2xl font-bold mb-1">Checkout</h1>
            <p className="text-sm text-muted-foreground mb-6">
                Printed on weather-resistant outdoor vinyl and shipped to your door.
            </p>

            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={submit} className="lg:col-span-2 space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="font-semibold mb-4">Shipping address</h2>

                        <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="First name" value={address.first_name} onChange={v => setField('first_name', v)} required />
                            <Field label="Last name" value={address.last_name} onChange={v => setField('last_name', v)} required />
                            <Field label="Email" type="email" value={address.email} onChange={v => setField('email', v)} required />
                            <Field label="Phone (optional)" value={address.phone ?? ''} onChange={v => setField('phone', v)} />
                        </div>

                        <div className="mt-3 space-y-3">
                            <Field label="Address" value={address.address1} onChange={v => setField('address1', v)} required />
                            <Field label="Apartment, suite (optional)" value={address.address2 ?? ''} onChange={v => setField('address2', v)} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 mt-3">
                            <Field label="City" value={address.city} onChange={v => setField('city', v)} required />
                            <Field label="State / Region" value={address.region ?? ''} onChange={v => setField('region', v)} />
                            <Field label="ZIP / Postal code" value={address.zip} onChange={v => setField('zip', v)} required />

                            <label className="block">
                                <span className="text-xs font-medium text-muted-foreground">Country</span>
                                <Select value={address.country} onValueChange={v => setField('country', v)}>
                                    <SelectTrigger className="mt-1 w-full text-sm">
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map(c => (
                                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                        {submitting ? 'Starting checkout…' : `Pay $${total} with PayPal`}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                        You'll be redirected to PayPal to complete payment securely.
                    </p>
                </form>

                <aside className="bg-card border border-border rounded-xl p-5 h-fit">
                    <h2 className="font-semibold mb-4">Order summary</h2>

                    {artworkUrl && (
                        <img src={artworkUrl} alt="Your sticker" className="w-full rounded-lg border border-border mb-4" />
                    )}

                    <div className="text-sm">
                        <div className="font-medium">{product?.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                            {product?.size_label} · {product?.print_dpi} DPI outdoor vinyl
                        </div>
                    </div>

                    <label className="block mt-4">
                        <span className="text-xs font-medium text-muted-foreground">Quantity</span>
                        <input
                            type="number"
                            min={product?.min_quantity ?? 1}
                            max={product?.max_quantity ?? 100}
                            value={quantity}
                            onChange={e => {
                                const next = Number(e.target.value)
                                const min = product?.min_quantity ?? 1
                                const max = product?.max_quantity ?? 100
                                setQuantity(Math.max(min, Math.min(max, Number.isNaN(next) ? min : next)))
                            }}
                            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        />
                    </label>

                    <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
                        <Row label={`${product?.name} x ${quantity}`} value={`$${(unitPrice * quantity).toFixed(2)}`} />
                        <Row label="Shipping" value="Free" muted />
                        <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                            <span>Total</span>
                            <span>${total}</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Free worldwide shipping is included in the price.</span>
                    </div>
                </aside>
            </div>
        </div>
    )
}

function Field({ label, value, onChange, type = 'text', required = false }: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: string
    required?: boolean
}) {
    return (
        <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            />
        </label>
    )
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={muted ? 'text-green-600 font-medium' : ''}>{value}</span>
        </div>
    )
}
