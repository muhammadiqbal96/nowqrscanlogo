import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Megaphone, MoreVertical, Trash2, ExternalLink, Loader2, Eye } from 'lucide-react'
import { campaignApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

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

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this campaign?')) return
    try {
      await campaignApi.delete(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
      toast.success('Campaign deleted')
    } catch {
      toast.error('Failed to delete')
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
                      {campaign.public_url && (
                        <a href={campaign.public_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                          <ExternalLink className="w-3.5 h-3.5" /> Open Page
                        </a>
                      )}
                      <button onClick={() => { setOpenMenu(null); handleDelete(campaign.id) }} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-destructive">
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
    </div>
  )
}
