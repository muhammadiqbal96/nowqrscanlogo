import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { authApi } from '@/lib/api'
import toast from 'react-hot-toast'

type ApiErrorResponse = {
    message?: string
    errors?: Record<string, string[]>
}

function validatePassword(value: string): string | null {
    if (value.length < 8) {
        return 'Password must be at least 8 characters'
    }
    if (!/[a-z]/.test(value)) {
        return 'Password must include at least one lowercase letter'
    }
    if (!/[A-Z]/.test(value)) {
        return 'Password must include at least one uppercase letter'
    }
    if (!/[0-9]/.test(value)) {
        return 'Password must include at least one number'
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
        return 'Password must include at least one special character'
    }

    return null
}

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [confirmTouched, setConfirmTouched] = useState(false)
    const [loading, setLoading] = useState(false)

    const token = searchParams.get('token') || ''
    const email = searchParams.get('email') || ''
    const passwordsDoNotMatch =
        confirmTouched && passwordConfirmation.length > 0 && password !== passwordConfirmation

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const passwordValidationError = validatePassword(password)
        if (passwordValidationError) {
            toast.error(passwordValidationError)
            return
        }

        if (password !== passwordConfirmation) {
            setConfirmTouched(true)
            toast.error('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            await authApi.resetPassword({ email, token, password, password_confirmation: passwordConfirmation })
            toast.success('Password reset successfully!')
            navigate('/login')
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: ApiErrorResponse } }
            const data = axiosError.response?.data
            const passwordError = data?.errors?.password?.[0]
            const passwordConfirmationError = data?.errors?.password_confirmation?.[0]

            toast.error(passwordConfirmationError || passwordError || data?.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    if (!token || !email) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
                    <p className="text-muted-foreground mb-4">This password reset link is invalid or has expired.</p>
                    <Link to="/forgot-password" className="text-primary font-semibold hover:underline">Request a new link</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5" /></svg>
                        </div>
                        <span className="text-xl font-bold">Now<span className="text-primary">QR</span></span>
                    </Link>
                    <h1 className="text-3xl font-bold mb-2">Set new password</h1>
                    <p className="text-muted-foreground">Enter your new password below.</p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all pr-10"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordConfirmation}
                            onChange={(e) => {
                                setPasswordConfirmation(e.target.value)
                                if (!confirmTouched) {
                                    setConfirmTouched(true)
                                }
                            }}
                            onBlur={() => setConfirmTouched(true)}
                            className={`w-full px-4 py-3 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all ${passwordsDoNotMatch ? 'border-red-500' : 'border-border'
                                }`}
                        />
                        {passwordsDoNotMatch && (
                            <p className="mt-1 text-sm text-red-600">Passwords do not match.</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            </div>
        </div>
    )
}
