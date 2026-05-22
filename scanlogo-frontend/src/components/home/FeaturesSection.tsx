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
    description: 'Your action page lives on a clean campaign URL that keeps the ScanLogo experience focused and memorable.',
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
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden bg-background">
      <div className="absolute inset-x-0 top-0 h-px bg-border" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,hsl(171_80%_32%/0.07),transparent)]" />

      <div ref={ref} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-10 lg:gap-14 items-start">
          <div className={`lg:sticky lg:top-28 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-5" style={{ borderRadius: '12px' }}>
              <Sparkles className="w-3.5 h-3.5" />
              Product system
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] mb-5">
              A campaign studio built around the ScanLogo itself.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-7">
              The workflow starts with the action, then connects the ad page, QR destination, downloadable creative, and analytics in one place.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['AI', 'Copy'],
                ['QR', 'Action'],
                ['GIF', 'Exports'],
              ].map(([value, label]) => (
                <div key={label} className="border border-border bg-card p-4" style={{ borderRadius: '16px' }}>
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
            <div className={`sm:col-span-2 bg-slate-950 text-white p-6 lg:p-7 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ borderRadius: '24px' }}>
              <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6 items-center">
                <div>
                  <div className="inline-flex p-3 bg-white/10 mb-5" style={{ borderRadius: '16px' }}>
                    <QrCode className="w-6 h-6 text-lime-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Animated ScanLogos</h3>
                  <p className="text-white/68 leading-relaxed">
                    Branded QR buttons can enlarge for scanning, act as click targets, and keep the tracked destination URL attached.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Pulse', 'Spin', 'Glow', 'Badge', 'Shape', 'Tap'].map((item, index) => (
                    <div key={item} className="aspect-square bg-white/10 border border-white/10 flex items-center justify-center text-xs font-semibold" style={{ borderRadius: index === 0 ? '999px' : '16px' }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {features.filter((feature) => feature.title !== 'Animated ScanLogos').map((feature, index) => (
              <div
                key={feature.title}
                className={`group bg-card border border-border p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ borderRadius: '18px', animationDelay: `${(index + 1) * 70}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`inline-flex p-3 ${feature.bgColor}`} style={{ borderRadius: '14px' }}>
                    <feature.icon className={`w-5 h-5 ${feature.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
