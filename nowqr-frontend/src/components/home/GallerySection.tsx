import { useState, useRef, useEffect } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { Images, X, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const templates = [
  { id: 1, bg: '#ffffff', accent: '#1e293b', label: 'Modern Clean' },
  { id: 2, bg: 'linear-gradient(175deg, #18181b, #09090b)', accent: '#d4a574', label: 'Dark Luxury' },
  { id: 3, bg: '#dc2626', accent: '#ffffff', label: 'Bold Statement' },
  { id: 4, bg: 'linear-gradient(160deg, #f97316, #ec4899)', accent: '#ffffff', label: 'Sunset Gradient' },
  { id: 5, bg: '#f8fafc', accent: '#334155', label: 'Minimalist' },
  { id: 6, bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', accent: '#ffffff', label: 'Ocean Breeze' },
  { id: 7, bg: 'linear-gradient(180deg, #0f172a, #020617)', accent: '#22d3ee', label: 'Neon Night' },
  { id: 8, bg: 'linear-gradient(170deg, #fef3c7, #d6d3d1)', accent: '#92400e', label: 'Warm Earth' },
  { id: 9, bg: 'linear-gradient(180deg, #ecfdf5, #d1fae5)', accent: '#059669', label: 'Mint Fresh' },
  { id: 10, bg: 'linear-gradient(135deg, #7c3aed, #4f46e5, #1e1b4b)', accent: '#c4b5fd', label: 'Royal Purple' },
  { id: 11, bg: '#1c1917', accent: '#fbbf24', label: 'Coffee House' },
  { id: 12, bg: 'linear-gradient(145deg, #fb7185, #f97316)', accent: '#ffffff', label: 'Coral Pop' },
  { id: 13, bg: 'linear-gradient(170deg, #064e3b, #14532d)', accent: '#86efac', label: 'Forest Deep' },
  { id: 14, bg: 'linear-gradient(135deg, #e9d5ff, #fce7f3, #fef9c3)', accent: '#7c3aed', label: 'Soft Pastel' },
  { id: 15, bg: 'linear-gradient(160deg, #1e3a5f, #0d9488)', accent: '#2dd4bf', label: 'Tech Blue' },
  { id: 16, bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', accent: '#ffffff', label: 'Ocean Breeze' },
]

const categories = [
  'Restaurant', 'Church', 'Salon', 'Nonprofit', 'Real Estate', 'Fitness',
  'E-Commerce', 'Coaching', 'Events', 'Medical', 'Food Truck', 'Photography',
  'Education', 'Hospitality', 'Retail', 'Agency',
]

// Scattered mosaic — 16 cards across 5 zones
// Positions defined in a 1060×1140 coordinate system, rendered via percentages so it scales on all screens
const scatterCards = [
  // Zone 1 — Top: 2 small left + 1 tall right
  { top: 0,   left: 0,    w: 180, h: 220, rotate: -3, z: 2 },
  { top: 30,  left: 200,  w: 170, h: 200, rotate: 2,  z: 3 },
  { top: 0,   left: 860,  w: 200, h: 320, rotate: -2, z: 4 },
  // Zone 2 — Upper Middle: wide left, portrait center, tall right (bleeds up)
  { top: 240, left: 10,   w: 300, h: 190, rotate: 1,  z: 3 },
  { top: 260, left: 380,  w: 180, h: 260, rotate: -4, z: 5 },
  { top: 200, left: 640,  w: 190, h: 310, rotate: 3,  z: 6 },
  // Zone 3 — Center: square left, HERO center, tall right lower
  { top: 460, left: 30,   w: 190, h: 190, rotate: -2, z: 3 },
  { top: 430, left: 310,  w: 320, h: 280, rotate: 1,  z: 7 },
  { top: 490, left: 720,  w: 200, h: 280, rotate: -3, z: 4 },
  // Zone 4 — Lower Middle: 2 square stacked left, wide center, portrait right
  { top: 680, left: 0,    w: 170, h: 170, rotate: 3,  z: 2 },
  { top: 870, left: 20,   w: 160, h: 160, rotate: -1, z: 3 },
  { top: 740, left: 250,  w: 300, h: 180, rotate: 2,  z: 5 },
  { top: 720, left: 640,  w: 190, h: 270, rotate: -4, z: 4 },
  // Zone 5 — Bottom: wide banner + 2 small right
  { top: 960, left: 50,   w: 500, h: 160, rotate: -1, z: 6 },
  { top: 950, left: 620,  w: 160, h: 180, rotate: 3,  z: 3 },
  { top: 970, left: 810,  w: 150, h: 160, rotate: -2, z: 2 },
]

const CANVAS_W = 1060
const CANVAS_H = 1140

export default function GallerySection() {
  const { ref, isVisible } = useReveal(0.05)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])

  // GSAP entrance + parallax — works at every screen size
  useEffect(() => {
    if (!sectionRef.current) return

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[]

    cards.forEach((card, i) => {
      const speed = 0.15 + (i % 5) * 0.1

      // Smooth entrance
      gsap.fromTo(
        card,
        { y: 60 + i * 4, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 110%',
            end: 'top 55%',
            scrub: 2,
          },
        },
      )

      // Parallax drift
      gsap.to(card, {
        y: -70 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 3,
        },
      })
    })

    return () => { ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, [])

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % templates.length)
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length)

  const displayTemplates = templates.slice(0, 16)

  return (
    <>
      <section
        className="py-24 lg:py-32 overflow-hidden bg-muted/20"
        ref={(el) => {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = el as HTMLDivElement | null
          sectionRef.current = el as HTMLDivElement | null
        }}
      >
        {/* Header */}
        <div className={`text-center max-w-3xl mx-auto mb-10 px-4 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4" style={{ borderRadius: '12px' }}>
            <Images className="w-3.5 h-3.5" />
            Template Gallery
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Beautiful templates,{' '}
            <span className="text-primary">ready to use</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Browse our collection of professionally designed ScanLogo templates.
          </p>
        </div>

        {/* Top Templates Label */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm" style={{ borderRadius: '12px' }}>
              <Sparkles className="w-4 h-4" />
              Top Templates
            </div>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        {/* Scattered mosaic — single layout, scales via percentages on all screens */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div
            className="relative mx-auto w-full"
            style={{
              maxWidth: `${CANVAS_W}px`,
              /* Aspect-ratio preserves proportions at every width */
              aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            }}
          >
            {displayTemplates.map((t, i) => {
              const c = scatterCards[i]
              if (!c) return null
              return (
                <div
                  key={t.id}
                  ref={(el) => { cardsRef.current[i] = el }}
                  className="absolute cursor-pointer group opacity-0"
                  style={{
                    top: `${(c.top / CANVAS_H) * 100}%`,
                    left: `${(c.left / CANVAS_W) * 100}%`,
                    width: `${(c.w / CANVAS_W) * 100}%`,
                    height: `${(c.h / CANVAS_H) * 100}%`,
                    zIndex: c.z,
                    transform: `rotate(${c.rotate}deg)`,
                  }}
                  onClick={() => openLightbox(i)}
                >
                  <div
                    className="relative w-full h-full overflow-hidden group-hover:shadow-2xl group-hover:shadow-primary/15 transition-all duration-300"
                    style={{
                      borderRadius: '10px',
                      border: '3px solid white',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                    }}
                  >
                    <div
                      className="w-full h-full group-hover:scale-105 transition-transform duration-700 flex flex-col items-center justify-center"
                      style={{ background: t.bg }}
                    >
                      <div className="text-center px-2">
                        <div className="font-bold text-[8px] sm:text-[10px] lg:text-sm leading-tight" style={{ color: t.accent }}>{t.label}</div>
                        <div className="mt-1 w-8 h-0.5 mx-auto rounded" style={{ backgroundColor: t.accent, opacity: 0.4 }} />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3">
                      <span className="text-white font-semibold text-[9px] sm:text-xs lg:text-sm">{categories[i]}</span>
                      <span className="text-white/70 text-[7px] sm:text-[10px] lg:text-xs">#{t.id}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className={`text-center ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 text-sm"
            style={{ borderRadius: '12px' }}
          >
            Start Creating Your Own
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={closeLightbox}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
          <div className="relative z-10 max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-card overflow-hidden shadow-2xl border border-border" style={{ borderRadius: '12px' }}>
              <div
                className="w-full flex items-center justify-center"
                style={{ background: templates[currentIndex].bg, height: '70vh' }}
              >
                <div className="text-center px-8">
                  <div className="font-bold text-3xl mb-3" style={{ color: templates[currentIndex].accent }}>
                    {templates[currentIndex].label}
                  </div>
                  <div className="w-24 h-1 mx-auto rounded" style={{ backgroundColor: templates[currentIndex].accent, opacity: 0.4 }} />
                  <p className="mt-4 text-sm" style={{ color: templates[currentIndex].accent, opacity: 0.6 }}>Template Preview</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={goPrev}
                className="p-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
                style={{ borderRadius: '12px' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white/70 text-sm font-medium">
                {currentIndex + 1} / {templates.length}
              </span>
              <button
                onClick={goNext}
                className="p-3 bg-white/10 text-white hover:bg-white/20 transition-colors"
                style={{ borderRadius: '12px' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
