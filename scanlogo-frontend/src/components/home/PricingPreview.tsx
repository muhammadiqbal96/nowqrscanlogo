import { Link } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'
import { CheckCircle2, X, Crown, ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    popular: false,
    features: [
      { text: '1 basic QR code', ok: true },
      { text: 'Watermarked exports', ok: true },
      { text: 'Limited templates', ok: true },
      { text: 'Animated ScanLogos', ok: false },
      { text: 'Dynamic QR codes', ok: false },
      { text: 'AI copy generation', ok: false },
    ],
  },
  {
    name: 'Creator Pack',
    price: '$47',
    period: 'one-time',
    popular: true,
    features: [
      { text: '200 credits', ok: true },
      { text: 'All animated ScanLogos', ok: true },
      { text: 'Dynamic QR codes', ok: true },
      { text: 'Full editor access', ok: true },
      { text: 'AI copy generation', ok: true },
      { text: 'Full analytics', ok: true },
    ],
  },
  {
    name: 'Agency Bundle',
    price: '$97',
    period: 'one-time',
    popular: false,
    features: [
      { text: '600 credits', ok: true },
      { text: 'Everything in Creator', ok: true },
      { text: 'Multi-campaign mgmt', ok: true },
      { text: 'Team collaboration', ok: true },
      { text: 'Priority support', ok: true },
      { text: 'API access', ok: true },
    ],
  },
]

export default function PricingPreview() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section className="py-24 lg:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.78fr_1.22fr] gap-8 lg:gap-12 items-start">
          <div className={`lg:sticky lg:top-28 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5" style={{ borderRadius: '12px' }}>
              <Zap className="w-3.5 h-3.5" />
              Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] mb-5">
              Credits for building, exporting, and tracking ScanLogos.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-7">
              No subscriptions. Buy the pack that fits the number of campaigns you want to launch.
            </p>

            <div className="bg-slate-950 text-white p-6" style={{ borderRadius: '24px' }}>
              <Crown className="w-6 h-6 text-amber-300 mb-4" />
              <p className="text-sm text-white/65 mb-2">Most teams start here</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold">$47</span>
                <span className="text-white/60 pb-1">one-time</span>
              </div>
              <p className="text-sm text-white/70">Creator Pack includes animated ScanLogos, dynamic links, AI copy, exports, and analytics.</p>
            </div>
          </div>

          <div className="space-y-4">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={cn(
                  'bg-card border p-5 lg:p-6 transition-all duration-300',
                  plan.popular ? 'border-primary/40 shadow-xl shadow-primary/10' : 'border-border hover:border-primary/25',
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                )}
                style={{ borderRadius: '22px', animationDelay: `${index * 120}ms` }}
              >
                <div className="grid md:grid-cols-[0.7fr_1.3fr_0.45fr] gap-5 items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      {plan.popular && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-primary text-primary-foreground" style={{ borderRadius: '999px' }}>
                          <Crown className="w-3 h-3" />
                          Popular
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
                    </div>
                  </div>

                  <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
                    {plan.features.map(f => (
                      <li key={f.text} className="flex items-center gap-2.5 text-sm">
                        {f.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={f.ok ? '' : 'text-muted-foreground/50'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/signup"
                    className={cn(
                      'inline-flex justify-center px-4 py-3 font-semibold text-sm transition-all',
                      plan.popular
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                    style={{ borderRadius: '12px' }}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}

            <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '460ms' }}>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-5 py-3 text-primary font-semibold hover:bg-primary/10 transition-colors"
                style={{ borderRadius: '12px' }}
              >
                See full pricing details
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
