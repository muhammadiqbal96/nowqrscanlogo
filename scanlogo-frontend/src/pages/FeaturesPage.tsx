import { useReveal } from '@/hooks/useReveal'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  QrCode,
  Palette,
  Zap,
  BarChart3,
  Shield,
  Globe,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  MousePointerClick,
  Layers,
  RefreshCw,
  Download,
  Eye,
  Lock,
} from 'lucide-react'

const mainFeatures = [
  {
    id: 'ai-builder',
    icon: Sparkles,
    title: 'AI-Powered Ad Page Builder',
    description: 'Just describe your business in a few sentences. Our GPT-4o AI instantly generates professional headlines, compelling descriptions, and action-driven CTA text. You review it, tweak if you want, and you\'re done.',
    highlights: [
      'GPT-4o generates headlines, copy & CTAs',
      'Auto-fills into mobile-optimized templates',
      'Edit and refine with one click',
      'Multiple tone options (professional, casual, urgent)',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'scanlogos',
    icon: QrCode,
    title: 'Animated ScanLogo Buttons',
    description: 'Not your average QR code. ScanLogos are beautifully designed, animated buttons shaped like shields, gears, eyes, and logos. They spin, pulse, and glow — grabbing attention and building brand recognition.',
    highlights: [
      'Pre-made animated button styles',
      'Embed your logo in the center',
      'Spinning, pulsing & expanding animations',
      'Works on screens and in print',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'editor',
    icon: Palette,
    title: 'Canva-Style Drag & Drop Editor',
    description: 'Design your ad page with an intuitive visual editor. Change colors, swap fonts, upload images, add your logo. Zero design experience required — if you can drag, you can design.',
    highlights: [
      'Intuitive drag-and-drop interface',
      'Custom colors, fonts & branding',
      'Upload logos and images',
      'Mobile-optimized output guaranteed',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'dynamic-qr',
    icon: Zap,
    title: 'Dynamic QR Codes',
    description: 'Change your destination URL anytime without reprinting or regenerating. Your ScanLogo stays the same — the link behind it updates instantly from your dashboard.',
    highlights: [
      'Change destination URL anytime',
      'No reprinting needed',
      'Short branded URLs (nqr.ai/abc)',
      'Instant redirect updates',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'See exactly who\'s scanning, when, where, and on what device. Track campaign performance in real-time and optimize your strategy with data.',
    highlights: [
      'Real-time scan tracking',
      'Device & browser detection',
      'Geographic location data',
      'Time-of-day analysis',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    id: 'safe-scan',
    icon: Shield,
    title: 'Safe Scan Verification',
    description: 'Every ScanLogo displays a "Safe Scan" shield badge, giving your customers confidence that the link is verified and trustworthy before they tap.',
    highlights: [
      'Trust badge on every ScanLogo',
      'Verified link destination',
      'Spam & malware protection',
      'HTTPS-secured redirects',
    ],
    color: 'from-primary to-primary',
    bgColor: 'bg-primary/10',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
]

const additionalFeatures = [
  { icon: Globe, title: 'Branded Campaign URLs', desc: 'buy.scanlogos.com/yourbrand' },
  { icon: Smartphone, title: 'Scan or Click', desc: 'Works on every device' },
  { icon: MousePointerClick, title: 'One CTA Only', desc: 'Clean, focused design' },
  { icon: Layers, title: 'Multiple Campaigns', desc: 'Manage all in one dashboard' },
  { icon: RefreshCw, title: 'Unlimited Updates', desc: 'Change URLs anytime' },
  { icon: Download, title: 'Export Anywhere', desc: 'PNG, GIF, WebP formats' },
  { icon: Eye, title: 'Live Preview', desc: 'See changes in real-time' },
  { icon: Lock, title: 'No Contact Info', desc: 'ScanLogo is the only CTA' },
]

export default function FeaturesPage() {
  const { ref: headerRef, isVisible: headerVisible } = useReveal(0.05)

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div ref={headerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-3xl mx-auto ${headerVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The tools that make{' '}
              <span className="gradient-text">ScanLogo focused</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Every feature is designed to help small businesses create professional campaigns and drive action — without complexity or monthly fees.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              Start Building
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features */}
      {mainFeatures.map((feature, index) => (
        <FeatureBlock key={feature.id} feature={feature} index={index} />
      ))}

      {/* Additional Features Grid */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">And so much more</h2>
            <p className="text-muted-foreground">Every detail is covered.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {additionalFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/20 hover:shadow-md transition-all"
              >
                <f.icon className="w-6 h-6 mx-auto mb-3 text-primary" />
                <div className="text-sm font-semibold mb-1">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureBlock({
  feature,
  index,
}: {
  feature: (typeof mainFeatures)[0]
  index: number
}) {
  const { ref, isVisible } = useReveal(0.05)
  const reversed = index % 2 === 1

  return (
    <section id={feature.id} className={`py-16 lg:py-24 ${index % 2 === 0 ? '' : 'bg-muted/20'}`}>
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reversed ? 'direction-rtl' : ''}`}>
          {/* Content */}
          <div className={`${reversed ? 'lg:order-2' : ''} ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className={`inline-flex p-3 rounded-2xl ${feature.iconBg} mb-5`}>
              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              {feature.title}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {feature.description}
            </p>
            <ul className="space-y-3">
              {feature.highlights.map(h => (
                <li key={h} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className={`w-4.5 h-4.5 mt-0.5 ${feature.iconColor} flex-shrink-0`} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className={`${reversed ? 'lg:order-1' : ''} ${isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
            <div className={`${feature.bgColor} rounded-3xl p-8 lg:p-12 border border-border/50`} style={{ borderRadius: '12px' }}>
              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-4 flex-1 h-6 bg-muted rounded-lg" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-20 bg-muted/50 rounded-xl mt-4" />
                  <div className="flex gap-3 mt-4">
                    <div className="h-10 rounded-xl flex-1 bg-primary opacity-80" />
                    <div className="h-10 rounded-xl flex-1 bg-muted" />
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
