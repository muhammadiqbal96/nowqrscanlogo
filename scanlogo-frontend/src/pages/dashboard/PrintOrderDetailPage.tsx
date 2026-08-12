import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Truck, ExternalLink } from 'lucide-react'
import { printApi } from '@/lib/api'
import { OrderStatusBadge } from '@/components/print/OrderStatusBadge'
import toast from 'react-hot-toast'

export default function PrintOrderDetailPage() {
    const { id } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [verifying, setVerifying] = useState(false)

    const orderId = Number(id)

    const load = useCallback(async () => {
        try {
            const { data } = await printApi.order(orderId)
            setOrder(data.order)
        } catch {
            toast.error('Could not load this order.')
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        load()
    }, [load])

    // Coming back from PayPal: capture the payment and push to the printer.
    useEffect(() => {
        const success = searchParams.get('paypal_success')
        const cancelled = searchParams.get('cancelled')

        if (cancelled) {
            toast.error('Payment cancelled.')
            setSearchParams({})
            return
        }

        if (!success || verifying) return

        setVerifying(true)
        setSearchParams({})

        printApi.verifyOrder(orderId)
            .then(({ data, status }) => {
                setOrder(data.order)
                if (status === 202) {
                    // Paid, but fulfilment is stuck. Never imply the sticker is coming.
                    toast(data.message, { icon: '⏳', duration: 8000 })
                } else {
                    toast.success('Order confirmed!')
                }
            })
            .catch(err => {
                toast.error(err?.response?.data?.message ?? 'Could not verify your payment.')
                load()
            })
            .finally(() => setVerifying(false))
    }, [searchParams, setSearchParams, orderId, verifying, load])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                <p className="text-sm text-muted-foreground">Order not found.</p>
            </div>
        )
    }

    const isPendingPayment = order.status === 'pending_payment'

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-4 h-4" /> All orders
            </Link>

            {verifying && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3 mb-4 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Confirming your payment…
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{order.order_number}</h1>
                    <p className="text-sm text-muted-foreground">
                        Placed {new Date(order.created_at).toLocaleString()}
                    </p>
                </div>
                <OrderStatusBadge status={order.status} />
            </div>

            {isPendingPayment && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-4 text-sm">
                    This order hasn't been paid yet. If you closed the PayPal window, start a new order from the sticker studio.
                </div>
            )}

            {order.tracking_number && (
                <div className="bg-green-50 border border-green-200 text-green-900 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 font-medium text-sm mb-1">
                        <Truck className="w-4 h-4" /> On its way
                    </div>
                    <div className="text-xs">
                        {order.carrier ? `${order.carrier} · ` : ''}{order.tracking_number}
                        {order.tracking_url && (
                            <a href={order.tracking_url} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 ml-2 underline">
                                Track <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 mb-4">
                <h2 className="font-semibold mb-3 text-sm">Items</h2>
                <div className="space-y-3">
                    {(order.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                {item.artwork?.url && (
                                    <img src={item.artwork.url} alt=""
                                        className="w-20 h-12 object-contain bg-muted rounded border border-border shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <div className="text-sm font-medium truncate">{item.product_name}</div>
                                    <div className="text-xs text-muted-foreground">Qty {item.quantity}</div>
                                </div>
                            </div>
                            <div className="text-sm font-medium shrink-0">
                                ${(item.total_price_cents / 100).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-border mt-4 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${(order.subtotal_cents / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1.5 border-t border-border">
                        <span>Total</span>
                        <span>${(order.total_cents / 100).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-3 text-sm">Shipping to</h2>
                <address className="text-sm text-muted-foreground not-italic leading-relaxed">
                    {order.ship_full_name}<br />
                    {order.ship_address1}{order.ship_address2 ? `, ${order.ship_address2}` : ''}<br />
                    {order.ship_city}{order.ship_region ? `, ${order.ship_region}` : ''} {order.ship_zip}<br />
                    {order.ship_country}
                </address>
            </div>
        </div>
    )
}
