import { Link } from 'react-router-dom'
import { ArrowRight, Play, Star, CheckCircle2 } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'

export default function HeroSection() {
  const { ref: heroRef, isVisible } = useReveal(0.05)

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-float delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div
        ref={heroRef}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <div className={isVisible ? 'animate-fade-in-up' : 'opacity-0'}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6" style={{ borderRadius: '12px' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by 2,500+ businesses worldwide
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Turn Every Scan{' '}
              <br className="hidden sm:block" />
              Into a{' '}
              <span className="text-primary">Customer.</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Build stunning ad pages, track every scan, and convert clicks to customers — all without code, designers, or monthly fees.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 text-base"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group inline-flex items-center gap-3 px-8 py-4 text-base font-medium rounded-2xl border border-border hover:bg-muted transition-colors">
                <Play className="w-5 h-5 text-primary" />
                Watch Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  'bg-primary',
                  'bg-primary',
                  'bg-primary',
                  'bg-primary',
                  'bg-primary',
                ].map((bg, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-background ${bg} flex items-center justify-center text-white text-[10px] font-bold`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-1 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1 font-semibold text-foreground">4.9</span>
                </div>
                <span>Trusted by <strong className="text-foreground">2,500+</strong> businesses</span>
              </div>
            </div>
          </div>

          {/* Right visual - ScanLogo mockup + Images */}
          <div className={isVisible ? 'animate-fade-in-up delay-300' : 'opacity-0'} style={{ animationDelay: '300ms' }}>
            <div className="relative">
              {/* Background gradient collage behind the phone */}
              <div className="absolute inset-0 -m-6 grid grid-cols-3 gap-2 opacity-20 dark:opacity-15 blur-[1px] rounded-3xl overflow-hidden">
                {[
                  'linear-gradient(135deg, #1e293b, #475569)',
                  'linear-gradient(175deg, #18181b, #d4a574)',
                  'linear-gradient(160deg, #dc2626, #b91c1c)',
                  'linear-gradient(160deg, #f97316, #ec4899)',
                  'linear-gradient(135deg, #0ea5e9, #6366f1)',
                  'linear-gradient(180deg, #0f172a, #22d3ee)',
                  'linear-gradient(135deg, #7c3aed, #1e1b4b)',
                  'linear-gradient(170deg, #064e3b, #86efac)',
                  'linear-gradient(160deg, #1e3a5f, #0d9488)',
                ].map((bg, n) => (
                  <div
                    key={n}
                    className="w-full h-24 rounded-lg"
                    style={{ background: bg }}
                  />
                ))}
              </div>

              {/* Phone mockup */}
              <div className="relative mx-auto w-72 sm:w-80">
                <div className="bg-card border border-border rounded-[2.5rem] p-3 shadow-2xl shadow-black/10 dark:shadow-black/30">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-card rounded-b-2xl z-10" />
                  
                  {/* Screen content */}
                  <div className="bg-primary/5 rounded-[2rem] overflow-hidden">
                    {/* Ad Page Preview */}
                    <div className="p-6 pt-10">
                      <div className="text-center space-y-4">
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                          <span className="text-2xl">☕</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Brew & Bean Coffee</h3>
                          <p className="text-xs text-muted-foreground mt-1">Artisan coffee, brewed with love</p>
                        </div>
                        <div className="bg-card/80 rounded-xl p-3 text-xs text-muted-foreground">
                          <p>Fresh roasted beans, handcrafted drinks, and a cozy atmosphere. Visit us today!</p>
                        </div>
                        
                        {/* ScanLogo button */}
                        <div className="pt-4">
                          <div className="relative inline-block">
                            <div className="w-28 h-28 mx-auto rounded-2xl bg-primary p-0.5 animate-pulse-glow">
                              <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2.5" fill="none"/><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2.5" fill="none"/><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2.5" fill="none"/><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="currentColor"/><rect x="14" y="14" width="3" height="3" fill="currentColor" rx="0.5"/><rect x="19" y="14" width="3" height="3" fill="currentColor" rx="0.5"/><rect x="14" y="19" width="3" height="3" fill="currentColor" rx="0.5"/><rect x="19" y="19" width="3" height="3" fill="currentColor" rx="0.5"/></svg>
                              </div>
                            </div>
                            <div className="mt-2 text-xs font-semibold text-primary">TAP TO ORDER</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-1 pt-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] text-muted-foreground">Safe Scan Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating template previews — hidden on mobile to prevent overflow */}
                <div className="hidden sm:block absolute -left-12 top-8 w-20 h-28 rounded-xl overflow-hidden border-2 border-background shadow-xl animate-float rotate-[-6deg]">
                  <div className="w-full h-full" style={{ background: 'linear-gradient(160deg, #f97316, #ec4899)' }}>
                    <div className="p-2 pt-4 text-white text-[5px] font-bold leading-tight opacity-70">SUNSET<br/>PROMO</div>
                  </div>
                </div>

                <div className="hidden sm:block absolute -right-10 top-32 w-20 h-28 rounded-xl overflow-hidden border-2 border-background shadow-xl animate-float delay-200 rotate-[4deg]">
                  <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, #0f172a, #020617)' }}>
                    <div className="p-2 pt-4 text-[5px] font-bold leading-tight" style={{ color: '#22d3ee', opacity: 0.7 }}>NEON<br/>NIGHT</div>
                  </div>
                </div>

                <div className="hidden sm:block absolute -left-6 bottom-16 w-18 h-24 rounded-xl overflow-hidden border-2 border-background shadow-xl animate-float delay-400 rotate-[3deg]">
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #7c3aed, #1e1b4b)' }}>
                    <div className="p-2 pt-3 text-[5px] font-bold leading-tight" style={{ color: '#c4b5fd', opacity: 0.7 }}>ROYAL<br/>PURPLE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted by logos bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-center gap-8 lg:gap-16 overflow-hidden">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Trusted by</span>
            {['Churches', 'Restaurants', 'Salons', 'Nonprofits', 'Coaches', 'Retailers'].map((name) => (
              <span key={name} className="text-sm font-semibold text-muted-foreground/50 whitespace-nowrap hidden sm:block">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
