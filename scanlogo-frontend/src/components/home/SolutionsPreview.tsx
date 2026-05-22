import { Link } from 'react-router-dom'
import { useReveal } from '@/hooks/useReveal'
import {
  ShoppingCart,
  Heart,
  CreditCard,
  Phone,
  Calendar,
  Video,
  ArrowRight,
} from 'lucide-react'

const solutions = [
  {
    icon: ShoppingCart,
    cta: 'Buy Now',
    subdomain: 'buy.scanlogos.com',
    desc: 'E-commerce & product sales',
    detail: 'Send shoppers to a product, cart, or limited offer.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Heart,
    cta: 'Give Now',
    subdomain: 'give.scanlogos.com',
    desc: 'Donations & fundraising',
    detail: 'Connect donors to a giving page from posters or events.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: CreditCard,
    cta: 'Pay Now',
    subdomain: 'pay.scanlogos.com',
    desc: 'Payments & invoicing',
    detail: 'Route customers to invoices, checkout, or payment links.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Phone,
    cta: 'Call Now',
    subdomain: 'call.scanlogos.com',
    desc: 'Click-to-call services',
    detail: 'Turn printed materials into direct calls and inquiries.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Calendar,
    cta: 'Book Now',
    subdomain: 'book.scanlogos.com',
    desc: 'Appointment scheduling',
    detail: 'Open booking calendars for salons, clinics, and service pros.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Video,
    cta: 'Watch Now',
    subdomain: 'see.scanlogos.com',
    desc: 'Video & media campaigns',
    detail: 'Launch trailers, demos, reels, or product walkthroughs.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
]

export default function SolutionsPreview() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section className="py-24 lg:py-32 bg-muted/20">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-8 lg:gap-12 items-start">
          <div className={`lg:sticky lg:top-28 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5" style={{ borderRadius: '12px' }}>
              <ShoppingCart className="w-3.5 h-3.5" />
              Action menu
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] mb-5">
              One ScanLogo can match the exact action you want.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-7">
              Pick a preset, load the destination URL, and let the public ScanLogo enlarge for scanning or click straight through to the tracked link.
            </p>
            <Link
              to="/solutions"
              className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
              style={{ borderRadius: '12px' }}
            >
              Explore all solutions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-card border border-border overflow-hidden" style={{ borderRadius: '24px' }}>
            <div className="hidden md:grid grid-cols-[1.1fr_1fr_1.35fr_0.15fr] gap-4 px-5 py-3 text-xs font-semibold text-muted-foreground border-b border-border">
              <span>Action</span>
              <span>Campaign URL</span>
              <span>Best for</span>
              <span />
            </div>

            <div className="divide-y divide-border">
              {solutions.map((s, index) => (
                <Link
                  key={s.cta}
                  to={`/solutions#${s.cta.split(' ')[0].toLowerCase()}`}
                  className={`group grid md:grid-cols-[1.1fr_1fr_1.35fr_0.15fr] gap-4 items-center p-5 hover:bg-primary/5 transition-colors ${
                    isVisible ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 bg-primary text-white flex items-center justify-center flex-shrink-0" style={{ borderRadius: '14px' }}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{s.cta}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                  <code className="text-xs font-mono text-muted-foreground bg-muted px-3 py-2 w-fit" style={{ borderRadius: '10px' }}>{s.subdomain}</code>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.detail}</p>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
