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
    desc: 'Create a free ScanLogo account. Explore the studio with no payment needed upfront.',
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

const workflowGroups = [
  { label: 'Plan', detail: 'Choose the action and generate the message.', steps: steps.slice(0, 3) },
  { label: 'Build', detail: 'Design the page and craft the ScanLogo.', steps: steps.slice(3, 6) },
  { label: 'Launch', detail: 'Publish, share, and optimize performance.', steps: steps.slice(6, 9) },
]

export default function HowItWorksSection() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section id="how-it-works" className="py-24 lg:py-32 overflow-hidden bg-muted/20">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-12 items-end mb-12 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5" style={{ borderRadius: '12px' }}>
            <Target className="w-3.5 h-3.5" />
            How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08]">
              Build a ScanLogo campaign in three clear phases.
            </h2>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed lg:max-w-xl">
            The process is organized like a production board: plan the action, build the branded page, then launch the ScanLogo anywhere people already see you.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6">
          {workflowGroups.map((group, groupIndex) => (
            <div
              key={group.label}
              className={`bg-card border border-border p-5 lg:p-6 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ borderRadius: '24px', animationDelay: `${groupIndex * 120}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-primary">PHASE {groupIndex + 1}</span>
                  <h3 className="text-2xl font-bold mt-1">{group.label}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{group.detail}</p>
                </div>
                <div className="h-11 w-11 bg-primary/10 text-primary flex items-center justify-center font-bold" style={{ borderRadius: '14px' }}>
                  {groupIndex + 1}
                </div>
              </div>

              <div className="space-y-3">
                {group.steps.map((step) => (
                  <div key={step.num} className="flex gap-3 border border-border bg-background p-4" style={{ borderRadius: '16px' }}>
                    <div className={`h-10 w-10 ${step.lightBg} flex items-center justify-center flex-shrink-0`} style={{ borderRadius: '12px' }}>
                      <step.icon className={`w-4 h-4 ${step.textColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-muted-foreground">{step.num}</span>
                        <h4 className="text-sm font-semibold">{step.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
