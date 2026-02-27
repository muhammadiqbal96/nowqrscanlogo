import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Search, Shield, ChevronLeft, ChevronRight, MoreHorizontal, Gift, Crown, ShieldCheck, UserX, Ban, CheckCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

interface UserItem {
    id: number
    first_name: string
    last_name: string
    email: string
    business_name: string | null
    plan: string
    credits: number
    is_admin: boolean
    is_blocked: boolean
    blocked_at: string | null
    created_at: string
    campaigns_count: number
    scan_logos_count: number
    credit_transactions_count: number
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [planFilter, setPlanFilter] = useState('')
    const [blockedFilter, setBlockedFilter] = useState('')
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [total, setTotal] = useState(0)

    // Modal states
    const [creditModal, setCreditModal] = useState<UserItem | null>(null)
    const [creditAmount, setCreditAmount] = useState('')
    const [creditReason, setCreditReason] = useState('')
    const [planModal, setPlanModal] = useState<UserItem | null>(null)
    const [newPlan, setNewPlan] = useState('')

    useEffect(() => {
        loadUsers()
    }, [page, planFilter, blockedFilter])

    const loadUsers = async () => {
        setLoading(true)
        try {
            const res = await adminApi.users.list(page, search, planFilter, blockedFilter)
            setUsers(res.data.data)
            setLastPage(res.data.last_page)
            setTotal(res.data.total)
        } catch (err) {
            console.error('Failed to load users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        loadUsers()
    }

    const handleBlock = async (user: UserItem) => {
        if (!confirm(`Block ${user.first_name} ${user.last_name}? They will be logged out immediately.`)) return
        try {
            await adminApi.users.block(user.id)
            toast.success(`${user.first_name} blocked`)
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to block user')
        }
    }

    const handleUnblock = async (user: UserItem) => {
        try {
            await adminApi.users.unblock(user.id)
            toast.success(`${user.first_name} unblocked`)
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to unblock user')
        }
    }

    const handleDelete = async (user: UserItem) => {
        if (!confirm(`Delete ${user.first_name} ${user.last_name}? This action is irreversible.`)) return
        try {
            await adminApi.users.delete(user.id)
            toast.success('User deleted')
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete')
        }
    }

    const handleToggleAdmin = async (user: UserItem) => {
        const action = user.is_admin ? 'remove admin from' : 'make admin'
        if (!confirm(`${action} ${user.first_name} ${user.last_name}?`)) return
        try {
            await adminApi.users.toggleAdmin(user.id)
            toast.success(user.is_admin ? 'Admin removed' : 'Admin granted')
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed')
        }
    }

    const handleGiveCredits = async () => {
        if (!creditModal || !creditAmount || !creditReason) return
        try {
            await adminApi.users.giveCredits(creditModal.id, parseInt(creditAmount), creditReason)
            toast.success(`${creditAmount} credits given`)
            setCreditModal(null)
            setCreditAmount('')
            setCreditReason('')
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed')
        }
    }

    const handleChangePlan = async () => {
        if (!planModal || !newPlan) return
        try {
            await adminApi.users.changePlan(planModal.id, newPlan)
            toast.success(`Plan changed to ${newPlan}`)
            setPlanModal(null)
            setNewPlan('')
            loadUsers()
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground mt-1">{total} total users</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, email, business..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </form>
                <Select value={planFilter || 'all'} onValueChange={v => { setPlanFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Plans" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={blockedFilter || 'all'} onValueChange={v => { setBlockedFilter(v === 'all' ? '' : v); setPage(1) }}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="false">Active</SelectItem>
                        <SelectItem value="true">Blocked</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No users found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="text-left px-4 py-3 font-medium">User</th>
                                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                                    <th className="text-left px-4 py-3 font-medium">Credits</th>
                                    <th className="text-left px-4 py-3 font-medium">Items</th>
                                    <th className="text-left px-4 py-3 font-medium">Status</th>
                                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium flex items-center gap-1.5">
                                                    {user.first_name} {user.last_name}
                                                    {user.is_admin && <Shield className="w-3.5 h-3.5 text-red-500" />}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md capitalize ${user.plan === 'agency' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : user.plan === 'creator' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium">{user.credits}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {user.campaigns_count}C / {user.scan_logos_count}S
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_blocked ? (
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Blocked</span>
                                            ) : (
                                                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-52">
                                                        <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => { setCreditModal(user); setCreditAmount(''); setCreditReason('') }}
                                                            className="text-emerald-600 dark:text-emerald-400"
                                                        >
                                                            <Gift className="w-4 h-4" />
                                                            Give Credits
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => { setPlanModal(user); setNewPlan(user.plan) }}
                                                            className="text-blue-600 dark:text-blue-400"
                                                        >
                                                            <Crown className="w-4 h-4" />
                                                            Change Plan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleAdmin(user)}
                                                            className={user.is_admin ? 'text-orange-600 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'}
                                                        >
                                                            <ShieldCheck className="w-4 h-4" />
                                                            {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                                                        </DropdownMenuItem>
                                                        {!user.is_admin && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                {user.is_blocked ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleUnblock(user)}
                                                                        className="text-green-600 dark:text-green-400"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Unblock User
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleBlock(user)}
                                                                        className="text-red-600 dark:text-red-400"
                                                                    >
                                                                        <Ban className="w-4 h-4" />
                                                                        Block User
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDelete(user)}
                                                                    className="text-red-600 dark:text-red-400"
                                                                >
                                                                    <UserX className="w-4 h-4" />
                                                                    Delete User
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
                    <button
                        onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                        disabled={page === lastPage}
                        className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Give Credits Modal */}
            {creditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setCreditModal(null)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold mb-1">Give Credits</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            To: {creditModal.first_name} {creditModal.last_name} ({creditModal.email})<br />
                            Current balance: {creditModal.credits} credits
                        </p>
                        <div className="space-y-3">
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                placeholder="Amount"
                                value={creditAmount}
                                onChange={e => setCreditAmount(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                                type="text"
                                placeholder="Reason (e.g. 'Support compensation')"
                                value={creditReason}
                                onChange={e => setCreditReason(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setCreditModal(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted">Cancel</button>
                                <button
                                    onClick={handleGiveCredits}
                                    disabled={!creditAmount || !creditReason}
                                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Give Credits
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Plan Modal */}
            {planModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setPlanModal(null)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold mb-1">Change Plan</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            For: {planModal.first_name} {planModal.last_name}<br />
                            Current plan: <span className="capitalize font-medium">{planModal.plan}</span>
                        </p>
                        <div className="space-y-3">
                            <Select value={newPlan} onValueChange={v => setNewPlan(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="creator">Creator</SelectItem>
                                    <SelectItem value="agency">Agency</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setPlanModal(null)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted">Cancel</button>
                                <button
                                    onClick={handleChangePlan}
                                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90"
                                >
                                    Change Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
