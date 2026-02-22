import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Chrome } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5"/></svg>
              </div>
              <span className="text-xl font-bold">Now<span className="text-primary">QR</span></span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Enter your credentials to access your dashboard.</p>
          </div>

          {/* Social login */}
          <button className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-muted transition-colors mb-4 text-sm font-medium">
            <Chrome className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded border-border" />
              <label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary/5 border-l border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center p-12 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-primary flex items-center justify-center mb-8 animate-float shadow-2xl shadow-primary/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white"/><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none"/><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white"/><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5"/><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5"/><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5"/></svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Your campaigns are waiting</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Access your dashboard to manage campaigns, track analytics, update destination URLs, and create new ScanLogos.
          </p>
        </div>
      </div>
    </div>
  )
}
