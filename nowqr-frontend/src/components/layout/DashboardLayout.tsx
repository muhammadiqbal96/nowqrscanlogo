import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Megaphone, QrCode, BarChart3, Settings, CreditCard,
    LogOut, Menu, X, ChevronDown, Sun, Moon, Plus
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import toast from 'react-hot-toast'

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Megaphone, label: 'Campaigns', path: '/dashboard/campaigns' },
    { icon: QrCode, label: 'ScanLogos', path: '/dashboard/scanlogos' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: CreditCard, label: 'Credits', path: '/dashboard/credits' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
]

export default function DashboardLayout() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        toast.success('Signed out')
        navigate('/login')
    }

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === '/dashboard'
        return location.pathname.startsWith(path)
    }

    const sidebar = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="2" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="16.5" y="4.5" width="3" height="3" rx="0.5" fill="white" /><rect x="2" y="14" width="8" height="8" rx="1.5" stroke="white" strokeWidth="2.5" fill="none" /><rect x="4.5" y="16.5" width="3" height="3" rx="0.5" fill="white" /><rect x="14" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="14" width="3" height="3" fill="white" rx="0.5" /><rect x="14" y="19" width="3" height="3" fill="white" rx="0.5" /><rect x="19" y="19" width="3" height="3" fill="white" rx="0.5" /></svg>
                    </div>
                    <span className="text-xl font-bold">Now<span className="text-primary">QR</span></span>
                </Link>
            </div>

            {/* New Campaign CTA */}
            <div className="p-4">
                <Link
                    to="/dashboard/campaigns/new"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-lg shadow-primary/25"
                >
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.path)
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <item.icon className="w-4.5 h-4.5" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Credits */}
            <div className="p-4 border-t border-border">
                <div className="bg-muted rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Credits</span>
                        <span className="text-xs font-bold text-primary">{user?.credits ?? 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((user?.credits ?? 0) / 6, 100)}%` }} />
                    </div>
                    <Link to="/dashboard/credits" className="block text-xs text-primary font-medium mt-2 hover:underline">
                        Buy more credits
                    </Link>
                </div>
            </div>

            {/* User + Logout */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-border flex-col bg-card">
                {sidebar}
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card shadow-xl z-50">
                        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X className="w-5 h-5" />
                        </button>
                        {sidebar}
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="flex-1" />

                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative">
                            <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <>{user?.first_name?.[0]}{user?.last_name?.[0]}</>
                                    )}
                                </div>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>

                            {profileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                                        <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                                            <Settings className="w-4 h-4" /> Settings
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted w-full text-left transition-colors">
                                            <LogOut className="w-4 h-4" /> Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
