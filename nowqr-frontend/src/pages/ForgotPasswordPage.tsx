import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
                  <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
                  <rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
                  <rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white" />
                  <rect x="14" y="14" width="3" height="3" fill="white" rx="0.5" />
                  <rect x="19" y="14" width="3" height="3" fill="white" rx="0.5" />
                  <rect x="14" y="19" width="3" height="3" fill="white" rx="0.5" />
                  <rect x="19" y="19" width="3" height="3" fill="white" rx="0.5" />
                </svg>
              </div>
              <span className="text-xl font-bold">Now<span className="text-primary">QR</span></span>
            </Link>

            {!submitted ? (
              <>
                <h1 className="text-3xl font-bold mb-2">Forgot your password?</h1>
                <p className="text-muted-foreground">
                  No worries. Enter your email and we'll send you a reset link.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-2">Check your email</h1>
                <p className="text-muted-foreground">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
              </>
            )}
          </div>

          {!submitted ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm"
              >
                Send Reset Link
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm"
              >
                Resend Email
              </button>
            </div>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary/5 border-l border-border relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="relative text-center p-12 max-w-md">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-primary flex items-center justify-center mb-8 animate-float shadow-2xl shadow-primary/30">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
              <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white" />
              <rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
              <rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white" />
              <rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" />
              <rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white" />
              <rect x="14" y="14" width="3" height="3" fill="white" rx="0.5" />
              <rect x="19" y="14" width="3" height="3" fill="white" rx="0.5" />
              <rect x="14" y="19" width="3" height="3" fill="white" rx="0.5" />
              <rect x="19" y="19" width="3" height="3" fill="white" rx="0.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">We've got you covered</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Password resets are quick and secure. You'll be back to managing your campaigns in no time.
          </p>
        </div>
      </div>
    </div>
  )
}
