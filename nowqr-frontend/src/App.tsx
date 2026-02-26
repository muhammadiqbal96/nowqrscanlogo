import { Routes, Route, useLocation, Outlet } from 'react-router-dom'
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
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage'
import CampaignBuilderPage from '@/pages/dashboard/CampaignBuilderPage'
import CampaignsListPage from '@/pages/dashboard/CampaignsListPage'
import ScanLogoBuilderPage from '@/pages/dashboard/ScanLogoBuilderPage'
import ScanLogosListPage from '@/pages/dashboard/ScanLogosListPage'
import ScanLogoDetailPage from '@/pages/dashboard/ScanLogoDetailPage'
import AnalyticsDashboardPage from '@/pages/dashboard/AnalyticsDashboardPage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import CreditsPage from '@/pages/dashboard/CreditsPage'

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
  const isAuthPage = ['/login', '/signup', '/forgot-password', '/auth/callback', '/reset-password'].includes(location.pathname)
  const showChrome = !isAuthPage && !isDashboard

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

          {/* Auth pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Dashboard (protected) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHomePage />} />
              <Route path="campaigns" element={<CampaignsListPage />} />
              <Route path="campaigns/new" element={<CampaignBuilderPage />} />
              <Route path="campaigns/:id" element={<CampaignBuilderPage />} />
              <Route path="scanlogos" element={<ScanLogosListPage />} />
              <Route path="scanlogos/new" element={<ScanLogoBuilderPage />} />
              <Route path="scanlogos/:id" element={<ScanLogoDetailPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
              <Route path="credits" element={<CreditsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </main>
      {showChrome && <Footer />}
    </div>
  )
}

export default App
