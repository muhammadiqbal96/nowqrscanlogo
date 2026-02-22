import { Link } from 'react-router-dom'
import { Github, Twitter, Linkedin, Instagram, ArrowUpRight } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Solutions', href: '/solutions' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'ScanLogos', href: '/features#scanlogos' },
  ],
  Solutions: [
    { label: 'Buy Now', href: '/solutions#buy' },
    { label: 'Give Now', href: '/solutions#give' },
    { label: 'Book Now', href: '/solutions#book' },
    { label: 'Call Now', href: '/solutions#call' },
    { label: 'Watch Now', href: '/solutions#watch' },
  ],
  Resources: [
    { label: 'Help Center', href: '/resources' },
    { label: 'Blog', href: '/resources' },
    { label: 'Documentation', href: '/resources' },
    { label: 'API', href: '/resources' },
    { label: 'Contact Support', href: '/resources' },
  ],
  Company: [
    { label: 'About Us', href: '/resources' },
    { label: 'Privacy Policy', href: '/resources' },
    { label: 'Terms of Service', href: '/resources' },
    { label: 'Careers', href: '/resources' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-white text-center shadow-2xl shadow-primary/20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to create your first ScanLogo?
              </h3>
              <p className="text-white/80 max-w-lg mx-auto mb-6 text-sm md:text-base">
                Join thousands of businesses using NowQR to drive action with beautiful, animated QR codes. No subscription — pay once, use forever.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/15 text-white font-medium rounded-xl hover:bg-white/25 transition-colors border border-white/20"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5"/></svg>
              </div>
              <span className="text-lg font-bold">Now<span className="text-primary">QR</span></span>
            </Link>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              Create AI-powered ad pages and animated ScanLogo QR buttons that drive real action.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NowQR. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>nowqr.com</span>
            <span className="mx-2">·</span>
            <span>scanlogos.com</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
