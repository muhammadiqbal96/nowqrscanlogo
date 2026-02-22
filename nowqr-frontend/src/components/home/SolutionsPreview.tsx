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
    subdomain: 'buy.nowqr.com',
    desc: 'E-commerce & product sales',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Heart,
    cta: 'Give Now',
    subdomain: 'give.nowqr.com',
    desc: 'Donations & fundraising',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: CreditCard,
    cta: 'Pay Now',
    subdomain: 'pay.nowqr.com',
    desc: 'Payments & invoicing',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Phone,
    cta: 'Call Now',
    subdomain: 'call.nowqr.com',
    desc: 'Click-to-call services',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Calendar,
    cta: 'Book Now',
    subdomain: 'book.nowqr.com',
    desc: 'Appointment scheduling',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Video,
    cta: 'Watch Now',
    subdomain: 'see.nowqr.com',
    desc: 'Video & media campaigns',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
]

export default function SolutionsPreview() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section className="py-24 lg:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-14 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <ShoppingCart className="w-3.5 h-3.5" />
            Solutions
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            One scan for{' '}
            <span className="gradient-text">every action</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether people need to buy, give, book, call, or watch — your ScanLogo takes them there instantly.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {solutions.map((s, index) => (
            <Link
              key={s.cta}
              to={`/solutions#${s.cta.split(' ')[0].toLowerCase()}`}
              className={`group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-primary flex-shrink-0`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{s.cta}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{s.desc}</p>
                  <code className="text-xs font-mono text-muted-foreground/70">{s.subdomain}</code>
                </div>
              </div>
              <ArrowRight className="absolute top-6 right-6 w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center ${isVisible ? 'animate-fade-in-up delay-500' : 'opacity-0'}`} style={{ animationDelay: '500ms' }}>
          <Link
            to="/solutions"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Explore all solutions
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
