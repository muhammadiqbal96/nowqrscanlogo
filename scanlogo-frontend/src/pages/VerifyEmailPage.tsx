import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const email = searchParams.get('email') || ''

    const handleResend = async () => {
        if (!email) {
            toast.error('Email is missing. Please sign up again.')
            return
        }

        setLoading(true)
        try {
            const res = await authApi.resendVerification(email)
            setSent(true)
            toast.success(res.data?.message || 'Verification email sent.')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send verification email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    {sent ? <CheckCircle2 className="w-7 h-7 text-primary" /> : <Mail className="w-7 h-7 text-primary" />}
                </div>

                <h1 className="text-2xl font-bold mb-2">Verify your email</h1>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {sent
                        ? 'Verification email sent. Please open your inbox and click the verification link.'
                        : 'Your account is created. Please verify your email before signing in.'}
                </p>

                <div className="mb-6 p-3 rounded-xl bg-muted/50 border border-border text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="font-medium break-all">{email || 'Not provided'}</div>
                </div>

                <button
                    onClick={handleResend}
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send verification email'}
                </button>

                <Link
                    to="/login"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
            </div>
        </div>
    )
}
