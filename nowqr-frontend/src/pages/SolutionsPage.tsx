import { useReveal } from '@/hooks/useReveal'
import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Heart,
  CreditCard,
  Phone,
  Calendar,
  Video,
  ArrowRight,
  CheckCircle2,
  QrCode,
  Zap,
} from 'lucide-react'

const solutions = [
  {
    id: 'buy',
    icon: ShoppingCart,
    cta: 'Buy Now',
    subdomain: 'buy.nowqr.com',
    title: 'Drive E-Commerce Sales',
    description: 'Turn foot traffic into online sales. Your ScanLogo takes customers directly to your product page, Shopify store, or checkout link.',
    useCases: [
      'Product packaging with instant buy links',
      'In-store displays linking to online shop',
      'Trade show booths with quick checkout',
      'Print ads with direct purchase URLs',
    ],
    example: 'buy.nowqr.com/jordanshop',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
  {
    id: 'give',
    icon: Heart,
    cta: 'Give Now',
    subdomain: 'give.nowqr.com',
    title: 'Boost Donations & Fundraising',
    description: 'Make giving effortless. Put a ScanLogo on bulletins, posters, or event signage and watch donations flow in from one simple scan.',
    useCases: [
      'Church bulletins and pew inserts',
      'Charity gala event materials',
      'Fundraiser flyers and posters',
      'Nonprofit annual reports',
    ],
    example: 'give.nowqr.com/gracechurch',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
  {
    id: 'pay',
    icon: CreditCard,
    cta: 'Pay Now',
    subdomain: 'pay.nowqr.com',
    title: 'Simplify Payments & Invoicing',
    description: 'Send customers directly to PayPal, Stripe, Venmo, or any payment link. Perfect for service businesses and freelancers.',
    useCases: [
      'Service invoices with instant pay',
      'Freelancer business cards',
      'Food truck and vendor payments',
      'Rent and bill collection',
    ],
    example: 'pay.nowqr.com/plumberpro',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
  {
    id: 'call',
    icon: Phone,
    cta: 'Call Now',
    subdomain: 'call.nowqr.com',
    title: 'Click-to-Call Services',
    description: 'One scan, one tap, and the phone is ringing. Perfect for service businesses where a phone conversation closes the deal.',
    useCases: [
      'Salon and barbershop window signs',
      'Contractor yard signs',
      'Restaurant table tents',
      'Emergency service vehicles',
    ],
    example: 'call.nowqr.com/salonbliss',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
  {
    id: 'book',
    icon: Calendar,
    cta: 'Book Now',
    subdomain: 'book.nowqr.com',
    title: 'Fill Your Appointment Book',
    description: 'Connect your ScanLogo to Calendly, Acuity, or any booking page. Customers schedule in seconds — no phone calls, no back-and-forth.',
    useCases: [
      'Medical office patient intake',
      'Beauty salon appointment cards',
      'Fitness class registration',
      'Consultation booking for coaches',
    ],
    example: 'book.nowqr.com/drsmith',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
  {
    id: 'watch',
    icon: Video,
    cta: 'Watch Now',
    subdomain: 'see.nowqr.com',
    title: 'Promote Video Content',
    description: 'Link your ScanLogo to YouTube, Vimeo, or any video page. Turn print materials into multimedia experiences.',
    useCases: [
      'Church sermon replays',
      'Real estate property tours',
      'Product demonstration videos',
      'Training and tutorial content',
    ],
    example: 'see.nowqr.com/pastortom',
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/20',
  },
]

export default function SolutionsPage() {
  const { ref: headerRef, isVisible: headerVisible } = useReveal(0.05)

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div ref={headerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-3xl mx-auto ${headerVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Solutions
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              One platform.{' '}
              <span className="gradient-text">Every action.</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you want people to buy, give, book, call, or watch — NowQR creates the bridge between your ad and their action.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      {solutions.map((solution, index) => (
        <SolutionBlock key={solution.id} solution={solution} index={index} />
      ))}

      {/* Bottom CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <QrCode className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Don't see your use case?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            NowQR supports custom call-to-actions. Enter any destination URL and create a campaign that fits your unique business needs.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25"
          >
            Create Your Custom Campaign
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function SolutionBlock({
  solution,
  index,
}: {
  solution: (typeof solutions)[0]
  index: number
}) {
  const { ref, isVisible } = useReveal(0.05)
  const reversed = index % 2 === 1

  return (
    <section id={solution.id} className={`py-16 lg:py-24 ${index % 2 === 0 ? '' : 'bg-muted/20'}`}>
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center`}>
          {/* Content */}
          <div className={`${reversed ? 'lg:order-2' : ''} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${solution.bgColor}`}>
                <solution.icon className={`w-5 h-5 ${solution.iconColor}`} />
              </div>
              <span className={`text-sm font-bold ${solution.iconColor}`}>{solution.cta}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              {solution.title}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {solution.description}
            </p>

            <div className="mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Perfect for</div>
              <ul className="space-y-2.5">
                {solution.useCases.map(uc => (
                  <li key={uc} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 ${solution.iconColor} flex-shrink-0`} />
                    <span>{uc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${solution.bgColor} border ${solution.borderColor}`}>
              <QrCode className={`w-4 h-4 ${solution.iconColor}`} />
              <code className="text-sm font-mono font-semibold">{solution.example}</code>
            </div>
          </div>

          {/* Visual Card */}
          <div className={`${reversed ? 'lg:order-1' : ''} ${isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <div className="relative bg-primary p-1" style={{ borderRadius: '12px' }}>
              <div className="bg-card rounded-[calc(1.5rem-4px)] p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary flex items-center justify-center">
                    <solution.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{solution.cta}</h3>
                  <p className="text-sm text-muted-foreground">{solution.subdomain}</p>
                  
                  {/* Mock ScanLogo */}
                  <div className="py-6">
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-primary p-0.5 animate-pulse-glow">
                      <div className="w-full h-full rounded-[calc(1rem-2px)] bg-card flex items-center justify-center">
                        <QrCode className={`w-10 h-10 ${solution.iconColor}`} />
                      </div>
                    </div>
                    <div className={`mt-3 text-xs font-bold uppercase tracking-wider ${solution.iconColor}`}>
                      Tap to {solution.cta.split(' ')[0].toLowerCase()}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-muted-foreground">Safe Scan Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
