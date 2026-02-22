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
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-14 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent{' '}
            <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No subscriptions. Pay once and use NowQR at your own pace.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                'relative bg-card border rounded-3xl p-7 transition-all duration-300',
                plan.popular
                  ? 'border-primary/30 shadow-xl shadow-primary/10 md:scale-105'
                  : 'border-border hover:border-primary/20',
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              )}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="mb-5">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm ml-1">/ {plan.period}</span>
              </div>

              <ul className="space-y-2.5 mb-6">
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
                  'block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all',
                  plan.popular
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <div className={`text-center ${isVisible ? 'animate-fade-in-up delay-500' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            See full pricing details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
