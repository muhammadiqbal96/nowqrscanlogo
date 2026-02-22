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
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // Wait for page to render, then scroll to the anchor
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
  const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}

export default App
