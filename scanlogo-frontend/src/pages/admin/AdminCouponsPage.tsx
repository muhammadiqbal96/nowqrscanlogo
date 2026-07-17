import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Plus, Trash, Ticket, Calendar, Percent, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Coupon {
    id: number
    code: string
    discount_percentage: number
    expires_at: string | null
    is_active: boolean
    created_at: string
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    
    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [code, setCode] = useState('')
    const [discountPercentage, setDiscountPercentage] = useState<number>(10)
    const [expiresAt, setExpiresAt] = useState('')
    const [isActive, setIsActive] = useState(true)

    // Delete Modal State
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadCoupons()
    }, [page])

    const loadCoupons = async () => {
        setLoading(true)
        try {
            const res = await adminApi.coupons.list(page)
            setCoupons(res.data.data)
            setTotalPages(res.data.last_page || 1)
        } catch (err: any) {
            console.error('Failed to load coupons:', err)
            toast.error(err.response?.data?.message || 'Failed to load coupons')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCoupon = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) {
            toast.error('Coupon code is required')
            return
        }
        if (discountPercentage < 1 || discountPercentage > 100) {
            toast.error('Discount percentage must be between 1 and 100')
            return
        }

        setSubmitting(true)
        try {
            await adminApi.coupons.create({
                code: code.trim().toUpperCase(),
                discount_percentage: discountPercentage,
                expires_at: expiresAt || null,
                is_active: isActive,
            })
            toast.success('Coupon created successfully')
            setIsModalOpen(false)
            resetForm()
            loadCoupons()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create coupon')
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            await adminApi.coupons.update(coupon.id, {
                is_active: !coupon.is_active,
            })
            toast.success(`Coupon ${coupon.code} updated`)
            loadCoupons()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update coupon')
        }
    }

    const handleDeleteCoupon = async () => {
        if (!couponToDelete) return

        setDeleting(true)
        try {
            await adminApi.coupons.delete(couponToDelete.id)
            toast.success('Coupon deleted successfully')
            setCouponToDelete(null)
            loadCoupons()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete coupon')
        } finally {
            setDeleting(false)
        }
    }

    const resetForm = () => {
        setCode('')
        setDiscountPercentage(10)
        setExpiresAt('')
        setIsActive(true)
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Ticket className="w-6 h-6 text-primary" />
                        Coupons Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Create, toggle, and delete promotional discount codes</p>
                </div>
                <button
                    onClick={() => {
                        resetForm()
                        setIsModalOpen(true)
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all text-sm self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" />
                    Create Coupon
                </button>
            </div>

            {/* Coupons Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground space-y-2">
                        <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                        <p className="font-semibold text-lg">No coupons found</p>
                        <p className="text-sm max-w-sm mx-auto">Create a promo code to offer percentage discounts to users purchasing plans or credits.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-muted/30">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Code</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expires At</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created At</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {coupons.map((coupon) => {
                                    const isExpired = coupon.expires_at && new Date(coupon.expires_at).setHours(23,59,59,999) < Date.now()
                                    return (
                                        <tr key={coupon.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="p-4 font-bold text-foreground">
                                                <span className="bg-muted px-2.5 py-1 rounded-lg border border-border text-sm font-mono tracking-wider">
                                                    {coupon.code}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Percent className="w-4 h-4 text-primary" />
                                                    {coupon.discount_percentage}% Off
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {coupon.expires_at ? (
                                                    <span className={`flex items-center gap-1.5 ${isExpired ? 'text-destructive font-medium' : ''}`}>
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(coupon.expires_at).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                        {isExpired && ' (Expired)'}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60 italic">Never Expires</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleToggleActive(coupon)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                                        coupon.is_active && !isExpired
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {coupon.is_active && !isExpired ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <X className="w-3.5 h-3.5" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {new Date(coupon.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setCouponToDelete(coupon)}
                                                    className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                                                    title="Delete Coupon"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-all text-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-all text-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Create Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-primary" />
                                Create New Coupon
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Coupon Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. WELCOME50"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground">Alphanumeric, automatically capitalized, no spaces.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Discount Percentage (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="100"
                                        value={discountPercentage || ''}
                                        onChange={(e) => {
                                            const rawVal = e.target.value;
                                            if (rawVal === '') {
                                                setDiscountPercentage(0);
                                                return;
                                            }
                                            const cleaned = rawVal.replace(/^0+/, '');
                                            let val = parseInt(cleaned) || 0;
                                            if (val > 100) val = 100;
                                            setDiscountPercentage(val);
                                        }}
                                        className="w-full pl-3 pr-10 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground text-sm font-medium">
                                        %
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                                    Expiry Date
                                    <span className="text-xs text-muted-foreground/60 italic">(Optional)</span>
                                </label>
                                <input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-border bg-muted text-primary focus:ring-primary w-4 h-4"
                                />
                                <label htmlFor="is_active" className="text-sm font-semibold text-foreground select-none cursor-pointer">
                                    Set as Active immediately
                                </label>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm inline-flex items-center gap-1.5"
                                >
                                    {submitting && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {couponToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
                                <Trash className="w-5 h-5" />
                                Delete Coupon
                            </h2>
                            <button
                                onClick={() => setCouponToDelete(null)}
                                className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to delete the coupon code <span className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded border border-border text-foreground">{couponToDelete.code}</span>?
                            </p>
                            <p className="text-sm text-destructive/80 font-medium">
                                This action is permanent and cannot be undone.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20">
                            <button
                                type="button"
                                onClick={() => setCouponToDelete(null)}
                                className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCoupon}
                                disabled={deleting}
                                className="px-4 py-2 bg-destructive text-destructive-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm inline-flex items-center gap-1.5"
                            >
                                {deleting && <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
