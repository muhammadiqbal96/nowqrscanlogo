import { useState, useRef, useEffect } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { Images, X, ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const templates = Array.from({ length: 46 }, (_, i) => ({
  id: i + 1,
  src: `/templates/${String(i + 1).padStart(2, '0')}.png`,
  alt: `NowQR Template ${i + 1}`,
}))

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
                    className="relative w-full h-full overflow-hidden bg-white group-hover:shadow-2xl group-hover:shadow-primary/15 transition-all duration-300"
                    style={{
                      borderRadius: '10px',
                      border: '3px solid white',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
                    }}
                  >
                    <img
                      src={t.src}
                      alt={t.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
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
              <img
                src={templates[currentIndex].src}
                alt={templates[currentIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
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
