'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { Hero } from '@/src/components/home/hero'
import { Features } from '@/src/components/home/features'
import { Showcase } from '@/src/components/home/showcase'
import { Stats } from '@/src/components/home/stats'
import { ThemeShowcase } from '@/src/components/home/theme-showcase'
import { Testimonials } from '@/src/components/home/testimonials'
import { CTA } from '@/src/components/home/cta'
import { Footer } from '@/src/components/home/footer'
import { Navbar } from '@/src/components/home/navbar'

function SectionDivider() {
  return (
    <div className="relative h-24 md:h-32">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
    </div>
  )
}

function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-50 btn btn-primary btn-circle btn-md shadow-lg"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default function Home() {
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
      <BackToTop />
    </>
  )
}
