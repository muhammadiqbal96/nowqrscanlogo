import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  QrCode,
  Sparkles,
  BarChart3,
  Palette,
  Shield,
  Zap,
  ShoppingCart,
  Heart,
  Phone,
  Calendar,
  Video,
  CreditCard,
  BookOpen,
  HelpCircle,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const featuresItems = [
  { icon: Sparkles, label: 'AI Ad Page Builder', desc: 'AI writes your headlines & copy', href: '/features#ai-builder' },
  { icon: QrCode, label: 'Animated ScanLogos', desc: 'Branded QR code buttons that move', href: '/features#scanlogos' },
  { icon: Palette, label: 'Canva-Style Editor', desc: 'Drag-and-drop page design', href: '/features#editor' },
  { icon: Zap, label: 'Dynamic QR Codes', desc: 'Change destination anytime', href: '/features#dynamic-qr' },
  { icon: BarChart3, label: 'Analytics Dashboard', desc: 'Track scans, devices & locations', href: '/features#analytics' },
  { icon: Shield, label: 'Safe Scan Badge', desc: 'Build trust with verified links', href: '/features#safe-scan' },
]

const solutionsItems = [
  { icon: ShoppingCart, label: 'Buy Now', desc: 'E-commerce & product sales', href: '/solutions#buy' },
  { icon: Heart, label: 'Give Now', desc: 'Donations & fundraising', href: '/solutions#give' },
  { icon: CreditCard, label: 'Pay Now', desc: 'Payment & invoicing', href: '/solutions#pay' },
  { icon: Phone, label: 'Call Now', desc: 'Click-to-call services', href: '/solutions#call' },
  { icon: Calendar, label: 'Book Now', desc: 'Appointment scheduling', href: '/solutions#book' },
  { icon: Video, label: 'Watch Now', desc: 'Video & media campaigns', href: '/solutions#watch' },
]

const resourcesItems = [
  { icon: BookOpen, label: 'Blog', desc: 'Tips and strategies', href: '/resources' },
  { icon: HelpCircle, label: 'Help Center', desc: 'Guides and tutorials', href: '/resources' },
  { icon: FileText, label: 'Documentation', desc: 'API and developer docs', href: '/resources' },
  { icon: MessageSquare, label: 'Contact Support', desc: 'Get help from our team', href: '/resources' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveDropdown(null)
  }, [location])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const toggleDropdown = (name: string) => {
    setActiveDropdown(prev => prev === name ? null : name)
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-5 left-6 right-6 sm:left-10 sm:right-10 lg:left-16 lg:right-16 xl:left-24 xl:right-24 z-50 transition-all duration-300',
          scrolled
            ? 'bg-card shadow-xl shadow-black/10 dark:shadow-black/30 border border-border'
            : 'bg-card/95 backdrop-blur-md border border-border/60 shadow-md'
        )}
        style={{ borderRadius: '12px' }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex items-center h-[4.5rem] lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5 text-primary-foreground" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-300 border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight leading-tight">
                  Scan<span className="text-primary">Logo</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-medium leading-tight -mt-0.5">Click. Scan. Convert.</span>
              </div>
            </Link>

            {/* Desktop Nav - Centered */}
            <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <NavLink to="/" label="Home" />
              <DropdownTrigger
                label="Features"
                isOpen={activeDropdown === 'features'}
                onToggle={() => toggleDropdown('features')}
              />
              <DropdownTrigger
                label="Solutions"
                isOpen={activeDropdown === 'solutions'}
                onToggle={() => toggleDropdown('solutions')}
              />
              <NavLink to="/resources" label="Resources" />
              <NavLink to="/blog" label="Blog" />
              <NavLink to="/pricing" label="Pricing" />
            </div>

            {/* Desktop Right */}
            <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              {isAuthenticated ? (
                <>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                  >
                    Start Building
                  </Link>
                </>
              )}
            </div>

            {/* Mobile controls — pushed to right */}
            <div className="flex lg:hidden items-center gap-2 ml-auto">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Dropdown Menus */}
        {activeDropdown === 'features' && (
          <DesktopDropdown items={featuresItems} onClose={() => setActiveDropdown(null)} />
        )}
        {activeDropdown === 'solutions' && (
          <DesktopDropdown items={solutionsItems} onClose={() => setActiveDropdown(null)} />
        )}
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border animate-slide-in-right overflow-y-auto">
            <div className="p-5">
              {/* Mobile Header */}
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold">Scan<span className="text-primary">Logo</span></span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Links */}
              <div className="space-y-1">
                <MobileNavLink to="/" label="Home" onClick={() => setMobileOpen(false)} />

                <MobileAccordion label="Features" items={featuresItems} onNavigate={() => setMobileOpen(false)} />
                <MobileAccordion label="Solutions" items={solutionsItems} onNavigate={() => setMobileOpen(false)} />
                <MobileAccordion label="Resources" items={resourcesItems} onNavigate={() => setMobileOpen(false)} />

                <MobileNavLink to="/blog" label="Blog" onClick={() => setMobileOpen(false)} />
                <MobileNavLink to="/pricing" label="Pricing" onClick={() => setMobileOpen(false)} />
              </div>

              {/* Mobile CTA */}
              <div className="mt-8 space-y-3">
                {isAuthenticated ? (
                  <>
                    {user?.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="block w-full text-center px-4 py-3 text-sm font-medium rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-medium rounded-xl border border-border hover:bg-muted transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center px-4 py-3 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    >
                      Start Building
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
        isActive ? 'text-primary bg-primary/10' : 'hover:bg-muted text-foreground/80 hover:text-foreground'
      )}
    >
      {label}
    </Link>
  )
}

function DropdownTrigger({
  label,
  isOpen,
  onToggle,
}: {
  label: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-colors',
        isOpen ? 'text-primary bg-primary/10' : 'hover:bg-muted text-foreground/80 hover:text-foreground'
      )}
    >
      {label}
      <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')} />
    </button>
  )
}

function DesktopDropdown({
  items,
  onClose,
}: {
  items: { icon: React.ElementType; label: string; desc: string; href: string }[]
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 top-20 z-40" onClick={onClose} />
      <div className="absolute top-full left-0 right-0 z-50 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="bg-card shadow-2xl shadow-black/15 dark:shadow-black/40 border border-border p-6" style={{ borderRadius: '12px' }}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {items.map(item => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group cursor-pointer"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function MobileNavLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
    >
      {label}
    </Link>
  )
}

function MobileAccordion({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: { icon: React.ElementType; label: string; desc: string; href: string }[]
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted transition-colors"
      >
        {label}
        <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5 animate-fade-in">
          {items.map(item => (
            <Link
              key={item.label}
              to={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <item.icon className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
