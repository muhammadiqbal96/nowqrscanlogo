import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Package, Sparkles } from 'lucide-react'
import { printApi } from '@/lib/api'
import { OrderStatusBadge } from '@/components/print/OrderStatusBadge'
import toast from 'react-hot-toast'

function toArray<T = any>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[]
    if (value && typeof value === 'object' && Array.isArray((value as any).data)) {
        return (value as any).data as T[]
    }
    return []
}

export default function PrintOrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        printApi.orders()
            .then(({ data }) => setOrders(toArray(data)))
            .catch(() => toast.error('Could not load your orders.'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1">My orders</h1>
                    <p className="text-sm text-muted-foreground">Physical stickers printed and shipped to your customers.</p>
                </div>
                <Link to="/dashboard/stickers"
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0">
                    <Sparkles className="w-4 h-4" /> New sticker
                </Link>
            </div>

            {orders.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-12 text-center">
                    <Package className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">You haven't ordered any stickers yet.</p>
                    <Link to="/dashboard/stickers"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
                        <Sparkles className="w-4 h-4" /> Design your first sticker
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <Link key={order.id} to={`/dashboard/orders/${order.id}`}
                            className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{order.order_number}</span>
                                    <OrderStatusBadge status={order.status} />
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {toArray(order.items).map((i: any) => `${i.product_name} x${i.quantity}`).join(', ')}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="font-semibold text-sm">${order.total?.toFixed?.(2) ?? (order.total_cents / 100).toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
