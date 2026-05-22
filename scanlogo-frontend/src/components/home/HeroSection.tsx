import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MousePointerClick,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'

const actionTiles = [
  { label: 'Buy', value: 'Checkout', color: 'bg-primary text-primary-foreground' },
  { label: 'Book', value: 'Calendar', color: 'bg-amber-400 text-slate-950' },
  { label: 'Give', value: 'Donation', color: 'bg-rose-500 text-white' },
  { label: 'Watch', value: 'Video', color: 'bg-lime-400 text-slate-950' },
]

const metrics = [
  { label: 'Scans today', value: '1,284' },
  { label: 'Click-through', value: '38%' },
  { label: 'Live actions', value: '6' },
]

export default function HeroSection() {
  const { ref: heroRef, isVisible } = useReveal(0.05)

  return (
    <section className="relative overflow-hidden pt-28 pb-16 lg:pt-32 lg:pb-24">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(171_80%_32%/0.14),transparent_34%),linear-gradient(180deg,transparent_0%,hsl(171_72%_96%)_100%)] dark:bg-[linear-gradient(120deg,hsl(171_80%_32%/0.18),transparent_34%),linear-gradient(180deg,transparent_0%,hsl(178_48%_9%)_100%)]" />
      <div className="absolute left-0 right-0 top-28 h-px bg-primary/20" />
      <div className="absolute left-[-10%] top-52 h-28 w-[120%] -rotate-6 bg-primary/5" />
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div ref={heroRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-4xl ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6" style={{ borderRadius: '12px' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Action QR studio for scan, tap, and click campaigns
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.06] mb-6">
            ScanLogo Studio for campaigns that move people from attention to action.
          </h1>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mb-8 leading-relaxed">
            Build one animated ScanLogo, connect it to a destination URL, publish the ad page, and use the same asset on counters, flyers, posts, and screens.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-base"
              style={{ borderRadius: '12px' }}
            >
              Create a ScanLogo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/solutions"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-card/80 border border-border font-semibold hover:bg-muted transition-colors text-base"
              style={{ borderRadius: '12px' }}
            >
              Browse action types
            </Link>
          </div>
        </div>

        <div className={`grid lg:grid-cols-[0.9fr_1.35fr] gap-6 lg:gap-8 items-stretch ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '180ms' }}>
          <div className="bg-card/90 backdrop-blur border border-border p-5 lg:p-6 shadow-xl shadow-primary/5" style={{ borderRadius: '24px' }}>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-primary">Action board</p>
                <h2 className="text-2xl font-bold mt-1">Pick the outcome first.</h2>
              </div>
              <MousePointerClick className="w-8 h-8 text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {actionTiles.map((action) => (
                <div key={action.label} className="border border-border bg-background p-4" style={{ borderRadius: '16px' }}>
                  <div className={`inline-flex h-9 w-9 items-center justify-center text-sm font-bold mb-4 ${action.color}`} style={{ borderRadius: '12px' }}>
                    {action.label[0]}
                  </div>
                  <p className="text-xs text-muted-foreground">{action.label} Now</p>
                  <p className="text-sm font-semibold">{action.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Destination URL embedded in the ScanLogo
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Enlarges on tap for clean scanning
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Clicks route through tracked short links
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-slate-950 text-white shadow-2xl shadow-slate-950/20" style={{ borderRadius: '28px' }}>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-lime-400" />
              </div>
              <div className="text-xs text-white/55">Live campaign preview</div>
            </div>

            <div className="grid md:grid-cols-[1.05fr_0.8fr] gap-6 p-5 lg:p-8">
              <div className="bg-white text-slate-950 p-5 lg:p-6" style={{ borderRadius: '22px' }}>
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-xs font-semibold text-primary">Quick Bite Kitchen</p>
                    <h3 className="text-2xl font-bold mt-1">Order lunch in two taps</h3>
                  </div>
                  <div className="h-12 w-12 bg-primary/10 flex items-center justify-center" style={{ borderRadius: '14px' }}>
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center bg-primary p-2 animate-pulse-glow" style={{ borderRadius: '28px' }}>
                  <div className="flex h-full w-full items-center justify-center bg-white" style={{ borderRadius: '24px' }}>
                    <QrCode className="w-20 h-20 text-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-100 p-3" style={{ borderRadius: '14px' }}>
                    <p className="text-slate-500 text-xs">CTA</p>
                    <p className="font-bold">Tap to Order</p>
                  </div>
                  <div className="bg-slate-100 p-3" style={{ borderRadius: '14px' }}>
                    <p className="text-slate-500 text-xs">URL</p>
                    <p className="font-bold">/r/lunch</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-white/10 border border-white/10 p-4" style={{ borderRadius: '18px' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-5 h-5 text-lime-300" />
                    <span className="font-semibold">Safe Scan verified</span>
                  </div>
                  <p className="text-sm text-white/65">The enlarged ScanLogo keeps the same tracked destination for scan and click actions.</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between bg-white/10 border border-white/10 p-4" style={{ borderRadius: '16px' }}>
                      <span className="text-sm text-white/65">{metric.label}</span>
                      <span className="text-xl font-bold">{metric.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <div className="bg-primary p-4" style={{ borderRadius: '16px' }}>
                    <ScanLine className="w-5 h-5 mb-3" />
                    <p className="text-sm font-semibold">Scan-ready</p>
                  </div>
                  <div className="bg-amber-400 text-slate-950 p-4" style={{ borderRadius: '16px' }}>
                    <BarChart3 className="w-5 h-5 mb-3" />
                    <p className="text-sm font-semibold">Tracked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '320ms' }}>
          {['Restaurants', 'Retailers', 'Nonprofits', 'Events'].map((name) => (
            <div key={name} className="border border-border bg-card/70 px-4 py-3 text-center text-sm font-semibold text-muted-foreground" style={{ borderRadius: '14px' }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
