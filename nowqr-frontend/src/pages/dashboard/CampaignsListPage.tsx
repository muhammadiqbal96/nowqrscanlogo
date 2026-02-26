import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Megaphone, MoreVertical, Trash2, ExternalLink, Loader2, Eye, AlertTriangle, FileImage } from 'lucide-react'
import { campaignApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CampaignsListPage() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [openMenu, setOpenMenu] = useState<number | null>(null)
    const [deleteModal, setDeleteModal] = useState<{ id: number; name: string } | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadCampaigns()
    }, [])

    const loadCampaigns = async () => {
        try {
            const res = await campaignApi.list()
            setCampaigns(res.data.data || [])
        } catch {
            toast.error('Failed to load campaigns')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteModal) return
        setDeleting(true)
        try {
            await campaignApi.delete(deleteModal.id)
            setCampaigns((prev) => prev.filter((c) => c.id !== deleteModal.id))
            toast.success('Campaign deleted')
            setDeleteModal(null)
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to delete campaign'
            toast.error(msg)
        } finally {
            setDeleting(false)
        }
    }

    const statusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-600'
            case 'draft': return 'bg-yellow-500/10 text-yellow-600'
            case 'paused': return 'bg-orange-500/10 text-orange-600'
            default: return 'bg-muted text-muted-foreground'
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Campaigns</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage your ad pages and marketing campaigns.</p>
                </div>
                <Link to="/dashboard/campaigns/new" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" /> New Campaign
                </Link>
            </div>

            {campaigns.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Megaphone className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold mb-2">No campaigns yet</h2>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        Create your first campaign — choose a call to action, describe your business, and let AI build your ad page.
                    </p>
                    <Link to="/dashboard/campaigns/new" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm">
                        <Plus className="w-4 h-4" /> Create Campaign
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map((campaign) => (
                        <div key={campaign.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <Link to={`/dashboard/campaigns/${campaign.id}`} className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <Megaphone className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">{campaign.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground capitalize">{campaign.cta_type}</span>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <div className="relative">
                                <button onClick={() => setOpenMenu(openMenu === campaign.id ? null : campaign.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                                {openMenu === campaign.id && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                                            <Link to={`/dashboard/campaigns/${campaign.id}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </Link>
                                            <Link to={`/dashboard/campaigns/${campaign.id}/flyer`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                                                <FileImage className="w-3.5 h-3.5" /> Create Flyer
                                            </Link>
                                            {campaign.public_url && (
                                                <a href={campaign.public_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                                                    <ExternalLink className="w-3.5 h-3.5" /> Open Page
                                                </a>
                                            )}
                                            <button onClick={() => { setOpenMenu(null); setDeleteModal({ id: campaign.id, name: campaign.headline || campaign.business_name || 'Campaign' }) }} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-destructive">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirmation modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal(null)} />
                    <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base">Delete Campaign</h3>
                                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            Are you sure you want to delete <span className="font-medium text-foreground">"{deleteModal.name}"</span>? All associated ScanLogos and scan data will also be removed.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal(null)}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
