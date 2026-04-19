import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { profileApi } from '@/lib/api'
import { User, Lock, Trash2, Loader2, Camera } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
    const { user, refreshUser, logout } = useAuth()
    const navigate = useNavigate()

    // Profile
    const [firstName, setFirstName] = useState(user?.first_name || '')
    const [lastName, setLastName] = useState(user?.last_name || '')
    const [businessName, setBusinessName] = useState(user?.business_name || '')
    const [profileLoading, setProfileLoading] = useState(false)

    // Password
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordLoading, setPasswordLoading] = useState(false)

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfileLoading(true)
        try {
            await profileApi.update({ first_name: firstName, last_name: lastName, business_name: businessName })
            await refreshUser()
            toast.success('Profile updated')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setProfileLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        setPasswordLoading(true)
        try {
            await profileApi.changePassword({
                current_password: currentPassword || undefined,
                password: newPassword,
                password_confirmation: confirmPassword,
            })
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            toast.success('Password changed')
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password')
        } finally {
            setPasswordLoading(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            await profileApi.uploadAvatar(file)
            await refreshUser()
            toast.success('Avatar updated')
        } catch {
            toast.error('Failed to upload avatar')
        }
    }

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
        if (!confirm('This will delete ALL your campaigns, ScanLogos, and data permanently. Continue?')) return
        try {
            await profileApi.deleteAccount()
            await logout()
            navigate('/')
            toast.success('Account deleted')
        } catch {
            toast.error('Failed to delete account')
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences.</p>
            </div>

            {/* Avatar */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                `${user?.first_name?.[0]}${user?.last_name?.[0]}`
                            )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90">
                            <Camera className="w-3.5 h-3.5" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    </div>
                    <div>
                        <p className="font-semibold">{user?.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-primary capitalize mt-0.5">
                            {user?.plan} plan · {user?.is_admin ? 'Unlimited credits' : `${user?.credits ?? 0} credits`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <User className="w-4 h-4" /> Profile Information
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">First name</label>
                            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Last name</label>
                            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Business name</label>
                        <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                    </div>
                    <button type="submit" disabled={profileLoading}
                        className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm disabled:opacity-50">
                        {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4" /> Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Current password</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder={user?.avatar ? 'Leave blank if Google-only account' : ''}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">New password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Confirm new password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30" />
                    </div>
                    <button type="submit" disabled={passwordLoading}
                        className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 text-sm disabled:opacity-50">
                        {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-destructive/20 rounded-2xl p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-2 text-destructive">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={handleDeleteAccount}
                    className="px-6 py-2.5 bg-destructive text-destructive-foreground font-semibold rounded-xl hover:bg-destructive/90 text-sm">
                    Delete Account
                </button>
            </div>
        </div>
    )
}
