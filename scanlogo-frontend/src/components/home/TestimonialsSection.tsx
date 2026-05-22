import { useReveal } from '@/hooks/useReveal'
import { Star, Quote, TrendingUp } from 'lucide-react'

const testimonials = [
  {
    name: 'Pastor Thomas Reid',
    role: 'Grace Community Church',
    avatar: 'TR',
    rating: 5,
    text: "We put a ScanLogo on our church bulletin and donations went up 34% in the first month. People just tap and give — it's that simple.",
    metric: '+34%',
    metricLabel: 'Donations',
  },
  {
    name: 'Maria Santos',
    role: 'Sweet Bites Bakery',
    avatar: 'MS',
    rating: 5,
    text: "I created a beautiful ad page in literally 5 minutes. The AI wrote better copy than I ever could. My online orders doubled since using ScanLogo. The best part is the animated button - customers love scanning it right from the counter display.",
    metric: '2x',
    metricLabel: 'Orders',
  },
  {
    name: 'James Mitchell',
    role: 'Mitchell Plumbing Co.',
    avatar: 'JM',
    rating: 5,
    text: "I printed my ScanLogo on my van and business cards. When people scan it, they go right to my booking page. No more phone tag.",
    metric: '0',
    metricLabel: 'Phone Tag',
  },
  {
    name: 'Dr. Sarah Kim',
    role: 'Kim Dental Practice',
    avatar: 'SK',
    rating: 5,
    text: "The animated QR is a conversation starter. Patients love it. And changing where it links is just one click in the dashboard. We've seen a 40% increase in online bookings since we started using ScanLogo at our front desk.",
    metric: '+40%',
    metricLabel: 'Bookings',
  },
  {
    name: 'David Okafor',
    role: 'Youth Sports Foundation',
    avatar: 'DO',
    rating: 5,
    text: "We raised $15,000 with a single ScanLogo on our event posters. The give.scanlogos.com link looked professional and trustworthy.",
    metric: '$15k',
    metricLabel: 'Raised',
  },
  {
    name: 'Lisa Chang',
    role: 'Bloom Hair Studio',
    avatar: 'LC',
    rating: 5,
    text: "No monthly fees was the selling point for me. I paid once and I've been using my ScanLogo for 6 months. Best $47 I've spent.",
    metric: '$47',
    metricLabel: 'One-time',
  },
  {
    name: 'Rebecca Torres',
    role: 'Torres Real Estate',
    avatar: 'RT',
    rating: 5,
    text: "I put ScanLogos on my property signs. People scan right from the sidewalk and see the full listing. It's been a game-changer for open houses. My listings get 3x more inquiries now.",
    metric: '3x',
    metricLabel: 'Inquiries',
  },
  {
    name: 'Chef Marcus Brown',
    role: 'Flame & Fork BBQ',
    avatar: 'MB',
    rating: 5,
    text: "Our table tent ScanLogos let customers order and pay without waiting. Tips are up 20% and the customer experience is smooth.",
    metric: '+20%',
    metricLabel: 'Tips',
  },
]

const stats = [
  { value: '2,500+', label: 'Active Businesses' },
  { value: '1.2M+', label: 'Scans Tracked' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '<10 min', label: 'Avg. Setup Time' },
]

export default function TestimonialsSection() {
  const { ref, isVisible } = useReveal(0.05)

  // Split into 2 columns for Pinterest masonry
  const col1 = [testimonials[0], testimonials[2], testimonials[4], testimonials[6]]
  const col2 = [testimonials[1], testimonials[3], testimonials[5], testimonials[7]]

  const renderCard = (t: typeof testimonials[0], index: number) => (
    <div
      key={t.name}
      className={`bg-card border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
      style={{ borderRadius: '12px', animationDelay: `${index * 100}ms` }}
    >
      <div className="p-6">
        {/* Metric badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10" style={{ borderRadius: '12px' }}>
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-bold text-foreground">{t.metric}</span>
            <span className="text-xs text-muted-foreground">{t.metricLabel}</span>
          </div>
        </div>

        <Quote className="w-8 h-8 text-primary/15 mb-3" />

        {/* Stars */}
        <div className="flex items-center gap-0.5 mb-3">
          {[...Array(t.rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
          ))}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          "{t.text}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <div className="w-10 h-10 bg-primary flex items-center justify-center text-white text-xs font-bold" style={{ borderRadius: '12px' }}>
            {t.avatar}
          </div>
          <div>
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-muted-foreground">{t.role}</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section className="py-24 lg:py-32 overflow-hidden bg-muted/30">
      <div ref={ref}>
        {/* Stats bar */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-card border border-border"
              style={{ borderRadius: '12px', animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-14 px-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4" style={{ borderRadius: '12px' }}>
            <Star className="w-3.5 h-3.5" />
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Loved by businesses{' '}
            <span className="text-primary">everywhere</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See how churches, restaurants, salons, and nonprofits are using ScanLogo to drive real action.
          </p>
        </div>

        {/* 2-Column Pinterest Masonry */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Column 1 */}
            <div className="flex flex-col gap-5">
              {col1.map((t, i) => renderCard(t, i * 2))}
            </div>
            {/* Column 2 — offset top for stagger effect */}
            <div className="flex flex-col gap-5 sm:mt-10">
              {col2.map((t, i) => renderCard(t, i * 2 + 1))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
