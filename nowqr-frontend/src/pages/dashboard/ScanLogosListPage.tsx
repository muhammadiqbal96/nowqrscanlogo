import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, QrCode, MoreVertical, Trash2, ExternalLink, Loader2, Edit } from 'lucide-react'
import { scanLogoApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function ScanLogosListPage() {
  const [scanLogos, setScanLogos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  useEffect(() => {
    loadScanLogos()
  }, [])

  const loadScanLogos = async () => {
    try {
      const res = await scanLogoApi.list()
      setScanLogos(res.data.data || [])
    } catch {
      toast.error('Failed to load ScanLogos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this ScanLogo?')) return
    try {
      await scanLogoApi.delete(id)
      setScanLogos((prev) => prev.filter((s) => s.id !== id))
      toast.success('ScanLogo deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">ScanLogos</h1>
          <p className="text-muted-foreground text-sm mt-1">Your animated QR code buttons.</p>
        </div>
        <Link to="/dashboard/scanlogos/new" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> New ScanLogo
        </Link>
      </div>

      {scanLogos.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold mb-2">No ScanLogos yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Create a campaign first, then build an animated ScanLogo to link to your destination.
          </p>
          <Link to="/dashboard/scanlogos/new" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm">
            <Plus className="w-4 h-4" /> Create ScanLogo
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scanLogos.map((logo) => (
            <div key={logo.id} className="bg-card border border-border rounded-2xl p-5 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${logo.color || '#c8401a'}20` }}>
                  <QrCode className="w-6 h-6" style={{ color: logo.color || '#c8401a' }} />
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === logo.id ? null : logo.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === logo.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                        <Link to={`/dashboard/scanlogos/${logo.id}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <a href={logo.short_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full">
                          <ExternalLink className="w-3.5 h-3.5" /> Test Link
                        </a>
                        <button onClick={() => { setOpenMenu(null); handleDelete(logo.id) }} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted w-full text-destructive">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm font-semibold truncate mb-1">{logo.cta_text || 'ScanLogo'}</p>
              <p className="text-xs text-muted-foreground truncate mb-1">{logo.destination_url}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{logo.shape}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{logo.animation}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${logo.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                  {logo.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
