const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    pending_payment: { label: 'Awaiting payment', className: 'bg-amber-100 text-amber-800' },
    paid: { label: 'Paid', className: 'bg-blue-100 text-blue-800' },
    submitted: { label: 'Sent to printer', className: 'bg-blue-100 text-blue-800' },
    in_production: { label: 'In production', className: 'bg-indigo-100 text-indigo-800' },
    shipped: { label: 'Shipped', className: 'bg-green-100 text-green-800' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700' },
    payment_failed: { label: 'Payment failed', className: 'bg-red-100 text-red-800' },
    // Deliberately reassuring: the customer paid, and the problem is ours to fix.
    fulfilment_failed: { label: 'Processing', className: 'bg-amber-100 text-amber-800' },
}

export function OrderStatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${style.className}`}>
            {style.label}
        </span>
    )
}
