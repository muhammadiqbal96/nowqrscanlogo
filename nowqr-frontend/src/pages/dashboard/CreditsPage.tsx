import { useEffect, useState } from 'react'
import { CreditCard, Zap, Sparkles, QrCode, Link2, Image, Check, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { creditsApi } from '@/lib/api'
import toast from 'react-hot-toast'

const PLANS = [
  {
    name: 'Creator Pack',
    key: 'creator',
    price: '$47',
    credits: 200,
    features: ['200 credits', 'All animated ScanLogos', 'Dynamic QR codes', 'Full page editor', 'Analytics dashboard'],
    popular: false,
  },
  {
    name: 'Agency Bundle',
    key: 'agency',
    price: '$97',
    credits: 600,
    features: ['600 credits', 'Everything in Creator', 'Multi-campaign management', 'Priority support', 'Best value'],
    popular: true,
  },
]

const CREDIT_COSTS = [
  { icon: Sparkles, action: 'AI-generated ad page', cost: 5 },
  { icon: QrCode, action: 'Create a ScanLogo', cost: 3 },
  { icon: Link2, action: 'Update destination URL', cost: 1 },
  { icon: Image, action: 'Export social media sizes', cost: 2 },
]

export default function CreditsPage() {
  const { user, refreshUser } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const res = await creditsApi.transactions()
      setTransactions(res.data.data || [])
    } catch {
      // Empty
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (plan: string) => {
    setPurchasing(plan)
    try {
      // In production, this would go through Stripe/PayPal first
      // For now, simulate with a mock payment ID
      await creditsApi.purchasePlan(plan, `mock_${Date.now()}`)
      await refreshUser()
      await loadTransactions()
      toast.success(`${plan === 'creator' ? 'Creator Pack' : 'Agency Bundle'} purchased!`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Purchase failed')
    } finally {
      setPurchasing(null)
    }
  }

  const handleTopUp = async () => {
    setPurchasing('topup')
    try {
      await creditsApi.topUp(100, `mock_topup_${Date.now()}`)
      await refreshUser()
      await loadTransactions()
      toast.success('100 credits added!')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Top-up failed')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Credits</h1>
        <p className="text-muted-foreground text-sm mt-1">Buy credits to create campaigns and ScanLogos. No subscriptions.</p>
      </div>

      {/* Current Balance */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold">{user?.credits ?? 0}</p>
            <p className="text-sm text-muted-foreground">Available credits</p>
          </div>
        </div>
        <button
          onClick={handleTopUp}
          disabled={purchasing === 'topup'}
          className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm disabled:opacity-50"
        >
          {purchasing === 'topup' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Top Up +100 ($10)'}
        </button>
      </div>

      {/* Credit Costs */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-4">What credits cost</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CREDIT_COSTS.map((item) => (
            <div key={item.action} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-primary font-bold">{item.cost} credits</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="font-semibold mb-4">Credit Packs</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.key} className={`bg-card border rounded-2xl p-6 relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Best Value
                </span>
              )}
              <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePurchase(plan.key)}
                disabled={purchasing === plan.key}
                className={`w-full py-3 font-semibold rounded-xl text-sm transition-all disabled:opacity-50 ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {purchasing === plan.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Buy ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card border border-border rounded-2xl">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Transaction History
          </h3>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No transactions yet</div>
          ) : (
            transactions.slice(0, 20).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Balance: {tx.balance_after}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
