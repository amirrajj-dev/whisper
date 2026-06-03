'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/src/components/shared/reveal'

export function CTA() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <Reveal delay={100} y={30} duration={0.6}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary p-12 md:p-20 text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/5"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/5"
            />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-content mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-primary-content/80 max-w-xl mx-auto mb-8">
                Join thousands of users already experiencing the future of communication. Start chatting in minutes.
              </p>
              <button className="btn bg-white text-primary hover:bg-white/90 border-none btn-lg gap-2 shadow-xl">
                Start Chatting Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
