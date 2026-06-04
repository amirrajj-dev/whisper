'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/src/stores/auth.store'
import { Hero } from '@/src/components/home/hero'
import { Features } from '@/src/components/home/features'
import { Showcase } from '@/src/components/home/showcase'
import { Stats } from '@/src/components/home/stats'
import { ThemeShowcase } from '@/src/components/home/theme-showcase'
import { Testimonials } from '@/src/components/home/testimonials'
import { CTA } from '@/src/components/home/cta'
import { Footer } from '@/src/components/home/footer'
import { Navbar } from '@/src/components/home/navbar'
import { Loader2 } from 'lucide-react'

function SectionDivider() {
  return (
    <div className="relative h-24 md:h-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
    </div>
  )
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/app')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SectionDivider />
        <Features />
        <SectionDivider />
        <Stats />
        <SectionDivider />
        <Showcase />
        <SectionDivider />
        <ThemeShowcase />
        <SectionDivider />
        <Testimonials />
        <SectionDivider />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
