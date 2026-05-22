import { useState } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  X,
  Sparkles,
  Crown,
  Building2,
  HelpCircle,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Sparkles,
    price: '$0',
    period: 'forever',
    description: 'Try ScanLogo and explore all the features before you commit.',
    color: 'from-primary to-primary',
    borderColor: 'border-border',
    popular: false,
    features: [
      { text: '1 basic QR code', included: true },
      { text: 'Watermarked exports', included: true },
      { text: 'Limited templates', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Animated ScanLogos', included: false },
      { text: 'Dynamic QR codes', included: false },
      { text: 'AI copy generation', included: false },
      { text: 'Full editor access', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    icon: Crown,
    price: '$47',
    period: 'one-time',
    description: 'Everything you need to create professional campaigns and drive action.',
    color: 'from-primary to-primary',
    borderColor: 'border-primary/30',
    popular: true,
    features: [
      { text: '200 credits included', included: true },
      { text: 'All animated ScanLogos', included: true },
      { text: 'Dynamic QR codes', included: true },
      { text: 'Full Canva-style editor', included: true },
      { text: 'AI copy generation', included: true },
      { text: 'Full analytics dashboard', included: true },
      { text: 'Export PNG, GIF, WebP', included: true },
      { text: 'Branded subdomains', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'agency',
    name: 'Agency Bundle',
    icon: Building2,
    price: '$97',
    period: 'one-time',
    description: 'For power users and agencies managing multiple campaigns.',
    color: 'from-primary to-primary',
    borderColor: 'border-violet-500/30',
    popular: false,
    features: [
      { text: '600 credits included', included: true },
      { text: 'Everything in Creator Pack', included: true },
      { text: 'Multi-campaign management', included: true },
      { text: 'Advanced analytics & reports', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'White-label options', included: true },
      { text: 'Bulk QR creation', included: true },
      { text: 'API access', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]

const creditCosts = [
  { action: 'Generate an AI ad page', cost: '5 credits' },
  { action: 'Create a ScanLogo', cost: '3 credits' },
  { action: 'Update a dynamic URL', cost: '1 credit' },
  { action: 'Export for social media', cost: '2 credits' },
]

const faqs = [
  {
    q: 'Is there really no monthly subscription?',
    a: 'Correct! ScanLogo uses a one-time payment model. You buy credits and use them at your own pace. No recurring charges, no surprise fees.',
  },
  {
    q: 'What happens when I run out of credits?',
    a: 'Simply purchase a credit top-up whenever you need more. Buy only what you need, when you need it.',
  },
  {
    q: 'Can I change my ScanLogo destination after creating it?',
    a: 'Yes! That\'s the beauty of dynamic QR codes. Update your destination URL anytime from your dashboard — costs just 1 credit.',
  },
  {
    q: 'Do the free plan QR codes expire?',
    a: 'Free plan QR codes stay active but have watermarks and limited features. Upgrade anytime to unlock full functionality.',
  },
  {
    q: 'Can I use ScanLogo for my clients?',
    a: 'Absolutely! The Agency Bundle is designed for exactly this — manage multiple campaigns, collaborate with team members, and use white-label options.',
  },
]

export default function PricingPage() {
  const { ref: headerRef, isVisible: headerVisible } = useReveal(0.05)

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div ref={headerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-3xl mx-auto ${headerVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Simple Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Pay once.{' '}
              <span className="gradient-text">Use forever.</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Buy credits and use them at your own pace.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <PricingCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Credit Costs */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Credit Cost Breakdown</h2>
            <p className="text-muted-foreground">Transparent pricing for every action.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <div className="px-6 py-3">Action</div>
              <div className="px-6 py-3 text-right">Cost</div>
            </div>
            {creditCosts.map((item) => (
              <div key={item.action} className="grid grid-cols-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <div className="px-6 py-4 text-sm font-medium">{item.action}</div>
                <div className="px-6 py-4 text-sm text-right font-semibold text-primary">{item.cost}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <HelpCircle className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our pricing.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function PricingCard({ plan, index }: { plan: (typeof plans)[0]; index: number }) {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <div
      ref={ref}
      className={cn(
        'relative bg-card border rounded-3xl p-8 transition-all duration-300',
        plan.popular
          ? 'border-primary/30 shadow-xl shadow-primary/10 scale-[1.02] lg:scale-105'
          : 'border-border hover:border-primary/20 hover:shadow-lg',
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 text-xs font-bold bg-primary text-primary-foreground rounded-full shadow-lg">
            <Crown className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      <div className="inline-flex p-3 rounded-2xl bg-primary mb-5">
        <plan.icon className="w-5 h-5 text-white" />
      </div>

      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
      <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

      <div className="mb-6">
        <span className="text-4xl font-bold">{plan.price}</span>
        <span className="text-muted-foreground ml-2 text-sm">/ {plan.period}</span>
      </div>

      <Link
        to="/signup"
        className={cn(
          'block w-full text-center py-3.5 rounded-xl font-semibold transition-all text-sm',
          plan.popular
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5'
            : 'bg-muted hover:bg-muted/80 text-foreground'
        )}
      >
        {plan.id === 'free' ? 'Get Started Free' : 'Get Started'}
      </Link>

      <div className="mt-8 space-y-3">
        {plan.features.map(f => (
          <div key={f.text} className="flex items-center gap-3 text-sm">
            {f.included ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            )}
            <span className={f.included ? '' : 'text-muted-foreground/50'}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold pr-4">{question}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-6 pb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}
