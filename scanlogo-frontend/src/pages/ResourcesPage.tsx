import { useState } from 'react'
import { useReveal } from '@/hooks/useReveal'
import {
  BookOpen,
  HelpCircle,
  FileText,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Search,
  ExternalLink,
  Lightbulb,
  Video,
  Users,
  Shield,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const resourceCategories = [
  {
    icon: BookOpen,
    title: 'Getting Started Guides',
    description: 'Step-by-step instructions to create your first campaign.',
    articles: [
      'How to create your first AI ad page',
      'Choosing the right ScanLogo style',
      'Understanding dynamic QR codes',
      'Setting up your destination URL',
    ],
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Lightbulb,
    title: 'Tips & Strategies',
    description: 'Maximize your ScanLogo engagement with proven tactics.',
    articles: [
      'Best practices for print ScanLogo placement',
      'How to write compelling CTA text',
      'Optimizing your ad page for conversions',
      'When to update your destination URL',
    ],
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Video,
    title: 'Video Tutorials',
    description: 'Watch and learn at your own pace.',
    articles: [
      'ScanLogo studio walkthrough (5 min)',
      'Creating animated ScanLogos',
      'Using the analytics dashboard',
      'Advanced editor techniques',
    ],
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Technical reference and API docs for developers.',
    articles: [
      'API authentication & rate limits',
      'Webhook integration',
      'Bulk QR code generation',
      'White-label configuration',
    ],
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
]

const generalFaqs = [
  {
    q: 'What is a ScanLogo?',
    a: 'A ScanLogo is an animated, branded QR code button. Unlike standard QR codes, ScanLogos are designed to look like logos, shields, and creative shapes — and they animate with spins, pulses, and glows to grab attention.',
  },
  {
    q: 'Do I need a website to use ScanLogo?',
    a: 'No! ScanLogo hosts your ad page for you on a campaign URL like buy.scanlogos.com/yourbrand. You just need a destination URL where you want to send people - this can be a PayPal link, YouTube video, booking page, or any URL.',
  },
  {
    q: "Why can't I put my phone number on the ad page?",
    a: 'By design, the ad page has no phone numbers, emails, or external links. The ScanLogo is the only interactive element. This keeps the design clean and forces one clear action — maximizing conversion rates.',
  },
  {
    q: 'What is a dynamic QR code?',
    a: 'A dynamic QR code lets you change where it points without changing the code itself. So if you printed 1,000 flyers and need to update the link, just change it in your dashboard — no reprinting needed.',
  },
  {
    q: 'How does the credit system work?',
    a: 'Each action costs a small number of credits: generating an AI page (5 credits), creating a ScanLogo (3 credits), updating a URL (1 credit), exporting for social (2 credits). Buy credits once and use them at your pace.',
  },
  {
    q: 'Can I cancel or get a refund?',
    a: "Since ScanLogo is a one-time payment (not a subscription), there's nothing to cancel. We offer a 30-day satisfaction guarantee - if you're not happy, we'll work it out.",
  },
  {
    q: 'What formats can I download my ScanLogo in?',
    a: 'You can download your ScanLogo as PNG (for print), GIF (for animated use), or WebP (for web). All formats are high-resolution and ready to use.',
  },
  {
    q: 'How do I track my ScanLogo performance?',
    a: 'Your dashboard shows real-time analytics: total scans, device types, geographic locations, peak scan times, and more. Use this data to optimize your campaigns.',
  },
]

const contactOptions = [
  {
    icon: MessageSquare,
    title: 'Live Chat',
    desc: 'Chat with our team in real-time',
    action: 'Start Chat',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Mail,
    title: 'Email Support',
    desc: 'support@scanlogos.com',
    action: 'Send Email',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Users,
    title: 'Community',
    desc: 'Join our user community',
    action: 'Join Now',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Shield,
    title: 'Enterprise',
    desc: 'Custom solutions for teams',
    action: 'Contact Sales',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
]

export default function ResourcesPage() {
  const { ref: headerRef, isVisible: headerVisible } = useReveal(0.05)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = generalFaqs.filter(
    faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div ref={headerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-3xl mx-auto ${headerVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <HelpCircle className="w-3.5 h-3.5" />
              Resources & Help
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              How can we{' '}
              <span className="gradient-text">help you?</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Guides, tutorials, FAQs, and support - everything you need to get the most out of ScanLogo.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resourceCategories.map((cat) => (
              <div
                key={cat.title}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className={`inline-flex p-3 rounded-xl ${cat.bgColor} mb-4`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{cat.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{cat.description}</p>
                <ul className="space-y-2">
                  {cat.articles.map(article => (
                    <li key={article}>
                      <a
                        href="#"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group/link"
                      >
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                        <span>{article}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  View all <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Quick answers to the most common questions.</p>
          </div>
          <div className="space-y-3">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map(faq => (
                <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No results found. Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
            <p className="text-muted-foreground">Reach out to us through any of these channels.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactOptions.map(opt => (
              <div
                key={opt.title}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className={`inline-flex p-3 rounded-xl ${opt.bgColor} mb-4`}>
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <h3 className="font-semibold mb-1">{opt.title}</h3>
                <p className="text-xs text-muted-foreground mb-4">{opt.desc}</p>
                <span className="text-xs font-semibold text-primary group-hover:underline">{opt.action} →</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-semibold pr-4">{question}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-6 pb-4 animate-fade-in">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}
