import { useReveal } from '@/hooks/useReveal'
import {
  UserPlus,
  Target,
  Bot,
  PenTool,
  QrCode,
  Palette,
  CreditCard,
  Share2,
  BarChart3,
} from 'lucide-react'

const steps = [
  {
    num: '01',
    icon: UserPlus,
    title: 'Sign Up & Log In',
    desc: 'Create a free account on nowqr.com. Explore the platform — no payment needed upfront.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '02',
    icon: Target,
    title: 'Choose Your Call to Action',
    desc: 'Pick what you want people to DO: Buy Now, Give Now, Book Now, Call Now, or a custom action.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '03',
    icon: Bot,
    title: 'AI Writes Your Ad Page',
    desc: 'Enter your business name and description. Our AI instantly creates headlines, copy, and CTA text.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '04',
    icon: PenTool,
    title: 'Customize in the Editor',
    desc: 'Drag-and-drop your way to a stunning ad page. Add your logo, change colors and fonts.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '05',
    icon: QrCode,
    title: 'Build Your ScanLogo',
    desc: 'Choose an animated style — spinning shield, pulsing eye, rotating gear — and enter your destination URL.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '06',
    icon: Palette,
    title: 'Customize the Button',
    desc: 'Add your logo, pick colors, set CTA text like "TAP TO ORDER", and choose your animation.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '07',
    icon: CreditCard,
    title: 'Make Payment',
    desc: 'One-time payment or credit deduction. Get your finished ad page + downloadable ScanLogo.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '08',
    icon: Share2,
    title: 'Use It Everywhere',
    desc: 'Download as PNG, GIF, or WebP. Print it, post it, embed it on social media — anywhere.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    num: '09',
    icon: BarChart3,
    title: 'Track & Optimize',
    desc: 'See real-time scan analytics: device types, locations, peak times. Update your destination URL anytime.',
    color: 'bg-primary',
    lightBg: 'bg-primary/10',
    textColor: 'text-primary',
  },
]

export default function HowItWorksSection() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section id="how-it-works" className="py-24 lg:py-32 overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Target className="w-3.5 h-3.5" />
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            From zero to{' '}
            <span className="gradient-text">campaign live</span>
            <br />in under 10 minutes
          </h2>
          <p className="text-lg text-muted-foreground">
            Nine simple steps. No design skills. No coding. No website needed.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-primary opacity-20" />

          {/* Mobile: card grid / Desktop: timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:block gap-4 sm:gap-5 lg:space-y-0">
            {steps.map((step, index) => (
              <div
                key={step.num}
                className={`relative ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Mobile/Tablet: Card layout */}
                <div className="lg:hidden bg-card border border-border p-5 hover:border-primary/20 hover:shadow-lg transition-all duration-300" style={{ borderRadius: '12px' }}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-11 h-11 ${step.color} flex items-center justify-center text-white text-xs font-bold shadow-md`} style={{ borderRadius: '12px' }}>
                      {step.num}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <step.icon className={`w-4 h-4 ${step.textColor}`} />
                        <h3 className="text-sm font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>

                {/* Desktop: Timeline layout */}
                <div className="hidden lg:block">
                  <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                    <div className={`${index % 2 === 1 ? 'lg:order-2 lg:pl-12' : 'lg:pr-12 lg:text-right'} mb-4 lg:mb-0`}>
                      <div className={`inline-flex items-center gap-3 ${index % 2 === 0 ? 'lg:flex-row-reverse' : ''}`}>
                        <span className={`text-xs font-bold ${step.textColor} opacity-60`}>{step.num}</span>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 ${step.lightBg}`} style={{ borderRadius: '12px' }}>
                          <step.icon className={`w-4 h-4 ${step.textColor}`} />
                          <span className={`text-sm font-semibold ${step.textColor}`}>{step.title}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-2 max-w-md lg:max-w-sm text-sm leading-relaxed inline-block">
                        {step.desc}
                      </p>
                    </div>

                    {/* Timeline dot */}
                    <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center justify-center">
                      <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white text-xs font-bold shadow-lg z-10`}>
                        {step.num}
                      </div>
                    </div>

                    <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`} />
                  </div>

                  {index < steps.length - 1 && <div className="h-4 lg:h-2" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
