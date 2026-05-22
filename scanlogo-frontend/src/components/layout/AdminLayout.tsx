import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, FileText, Send,
    LogOut, Menu, X, Sun, Moon, ArrowLeft, Shield
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import toast from 'react-hot-toast'

const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: FileText, label: 'Blog Posts', path: '/admin/blogs' },
    { icon: Send, label: 'Auto-Posts', path: '/admin/autopost' },
]

export default function AdminLayout() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        toast.success('Signed out')
        navigate('/login')
    }

    const isActive = (path: string) => {
        if (path === '/admin') return location.pathname === '/admin'
        return location.pathname.startsWith(path)
    }

    const sidebar = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-border">
                <Link to="/admin" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-tight">Now<span className="text-primary">QR</span></span>
                        <span className="text-[10px] text-red-500 font-semibold leading-tight">ADMIN PANEL</span>
                    </div>
                </Link>
            </div>

            {/* Back to Dashboard */}
            <div className="p-4">
                <Link
                    to="/dashboard"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/80 transition-all text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
                {adminNavItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.path)
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <item.icon className="w-4.5 h-4.5" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* Admin Badge */}
            <div className="p-4 border-t border-border">
                <div className="bg-red-500/10 rounded-xl p-3 text-center">
                    <Shield className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Admin Access</span>
                </div>
            </div>

            {/* User + Logout */}
            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-sm overflow-hidden relative">
                        <span className="select-none">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                        {user?.avatar && (
                            <img src={user.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
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
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 border-r border-border flex-col bg-card flex-shrink-0 overflow-y-auto">
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
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-lg">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Admin Panel</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
                        </button>

                        {/* Profile dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs overflow-hidden relative">
                                        <span className="select-none">{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                                        {user?.avatar && (
                                            <img src={user.avatar} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                                        )}
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard" className="flex items-center gap-2">
                                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="w-4 h-4" /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
