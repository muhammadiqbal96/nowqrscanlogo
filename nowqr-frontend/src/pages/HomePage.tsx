import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import SolutionsPreview from '@/components/home/SolutionsPreview'
import PricingPreview from '@/components/home/PricingPreview'
import GallerySection from '@/components/home/GallerySection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <SolutionsPreview />
      <GallerySection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingPreview />
    </>
  )
}
