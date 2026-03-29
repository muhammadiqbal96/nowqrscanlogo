import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HomePage from '@/pages/HomePage'
import FeaturesPage from '@/pages/FeaturesPage'
import SolutionsPage from '@/pages/SolutionsPage'
import PricingPage from '@/pages/PricingPage'
import ResourcesPage from '@/pages/ResourcesPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import CampaignBuilderPage from '@/pages/dashboard/CampaignBuilderPage'
import CampaignDetailPage from '@/pages/dashboard/CampaignDetailPage'
import CampaignsListPage from '@/pages/dashboard/CampaignsListPage'
import ScanLogoBuilderPage from '@/pages/dashboard/ScanLogoBuilderPage'
import ScanLogosListPage from '@/pages/dashboard/ScanLogosListPage'
import ScanLogoDetailPage from '@/pages/dashboard/ScanLogoDetailPage'
import AnalyticsDashboardPage from '@/pages/dashboard/AnalyticsDashboardPage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import CreditsPage from '@/pages/dashboard/CreditsPage'
import FlyerEditorPage from '@/pages/dashboard/FlyerEditorPage'
import TemplateSelectionPage from '@/pages/dashboard/TemplateSelectionPage'
import CampaignPublicPage from '@/pages/CampaignPublicPage'
import BlogListPage from '@/pages/BlogListPage'
import BlogDetailPage from '@/pages/BlogDetailPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminBlogsPage from '@/pages/admin/AdminBlogsPage'
import AdminAutoPostPage from '@/pages/admin/AdminAutoPostPage'
import AutoPostDashboardPage from '@/pages/dashboard/autopost/AutoPostDashboardPage'
import PlatformsPage from '@/pages/dashboard/autopost/PlatformsPage'
import SubscriptionsPage from '@/pages/dashboard/autopost/SubscriptionsPage'
import NewSubscriptionPage from '@/pages/dashboard/autopost/NewSubscriptionPage'
import PostsPage from '@/pages/dashboard/autopost/PostsPage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.slice(1))
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function App() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const isAdmin = location.pathname.startsWith('/admin')
  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/auth/callback', '/reset-password'].includes(location.pathname)
  const isPublicPage = location.pathname.startsWith('/p/')
  const showChrome = !isAuthPage && !isDashboard && !isAdmin && !isPublicPage

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <ScrollToTop />
      {showChrome && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Public marketing pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />

          {/* Public blog pages */}
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />

          {/* Public campaign pages */}
          <Route path="/p/:slug" element={<CampaignPublicPage />} />

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Dashboard (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="campaigns" element={<CampaignsListPage />} />
              <Route path="campaigns/new" element={<CampaignBuilderPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="campaigns/:id/templates" element={<TemplateSelectionPage />} />
              <Route path="campaigns/:id/flyer" element={<FlyerEditorPage />} />
              <Route path="scanlogos" element={<ScanLogosListPage />} />
              <Route path="scanlogos/new" element={<ScanLogoBuilderPage />} />
              <Route path="scanlogos/:id" element={<ScanLogoDetailPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="autopost" element={<AutoPostDashboardPage />} />
              <Route path="autopost/platforms" element={<PlatformsPage />} />
              <Route path="autopost/subscriptions" element={<SubscriptionsPage />} />
              <Route path="autopost/subscriptions/new" element={<NewSubscriptionPage />} />
              <Route path="autopost/posts" element={<PostsPage />} />
            </Route>
          </Route>

          {/* Admin Panel (protected + admin only) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="blogs" element={<AdminBlogsPage />} />
              <Route path="autopost" element={<AdminAutoPostPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
      {showChrome && <Footer />}
    </div>
  )
}

export default App
