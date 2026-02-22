import { useReveal } from '@/hooks/useReveal'
import {
  Sparkles,
  QrCode,
  Palette,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
} from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Copy',
    description: 'Enter your business info and our GPT-4o AI instantly writes headlines, descriptions, and CTA text for you.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: QrCode,
    title: 'Animated ScanLogos',
    description: 'Not just a QR code — a branded, animated button shaped like shields, gears, eyes, and more.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Palette,
    title: 'Canva-Style Editor',
    description: 'Drag-and-drop page design with your colors, fonts, logo, and images. No design skills needed.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Zap,
    title: 'Dynamic QR Codes',
    description: 'Change where your ScanLogo points anytime — without reprinting. Update from your dashboard.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track every scan — see device type, location, time of day, and total engagement live.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Safe Scan Badge',
    description: 'Build instant trust with a verified badge. Your customers know the link is safe before they tap.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Globe,
    title: 'Branded Hosting',
    description: 'Your ad page lives on a clean subdomain: buy.nowqr.com/yourbrand — professional and memorable.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    icon: Smartphone,
    title: 'Scan or Click',
    description: 'ScanLogos work both ways — scan on mobile or click on desktop. One code, every device.',
    bgColor: 'bg-primary/10',
    textColor: 'text-primary',
  },
]

export default function FeaturesSection() {
  const { ref, isVisible } = useReveal(0.05)

  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Powerful Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Everything you need to{' '}
            <span className="gradient-text">drive action</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From AI-generated content to animated QR codes, NowQR gives small businesses the tools to create campaigns that convert — without the complexity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 ${
                isVisible ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4`}>
                <feature.icon className={`w-5 h-5 ${feature.textColor}`} />
              </div>

              <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

              {/* Hover gradient line */}
              <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
