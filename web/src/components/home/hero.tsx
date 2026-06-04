'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MessageCircle, ChevronDown } from 'lucide-react'

const blobAnimation = (i: number) => ({
  scale: [1, 1.15, 1],
  rotate: [0, 180, 360],
  opacity: [0.12, 0.2, 0.12] as number[],
  transition: {
    duration: 10 + i * 3,
    repeat: Infinity,
    ease: 'linear' as const,
  },
} satisfies import('framer-motion').TargetAndTransition)

const scrollToFeatures = () => {
  const el = document.getElementById('features')
  if (el) {
    const navHeight = 64
    const top = el.getBoundingClientRect().top + window.scrollY - navHeight
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={blobAnimation(0)}
          className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[128px]"
        />
        <motion.div
          animate={blobAnimation(1)}
          className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-secondary/15 blur-[128px]"
        />
        <motion.div
          animate={blobAnimation(2)}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/10 blur-[160px]"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-8 inline-block"
          >
            <div className="relative">
              <Image
                src="/whisper-responsive/icons8-chat-128.svg"
                alt="Whisper"
                width={128}
                height={128}
                priority
                className="drop-shadow-2xl"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl -z-10"
              />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
          >
            Where{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Conversations
            </span>
            <br />
            Come Alive
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-base-content/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Experience real-time messaging that feels as natural as a whispered conversation.
            Secure, fast, and beautifully designed for the modern world.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/app" className="btn btn-primary btn-lg gap-2">
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              onClick={scrollToFeatures}
              className="btn btn-outline btn-lg gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Explore Features
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.button
          onClick={scrollToFeatures}
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="btn btn-ghost btn-circle btn-sm text-base-content/40 hover:text-base-content/60"
          aria-label="Scroll to features"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base-100 to-transparent pointer-events-none" />
    </section>
  )
}
