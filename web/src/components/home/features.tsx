'use client'

import { motion } from 'framer-motion'
import { Zap, Shield, Bell, Image, Users, Sparkles, MessageCircle } from 'lucide-react'
import { Reveal } from '@/src/components/shared/reveal'

const features = [
  { icon: Zap, title: 'Real-Time Messaging', description: 'Lightning-fast messages delivered instantly with WebSocket technology. No delays, no refresh needed.', color: 'text-primary' },
  { icon: Shield, title: 'Secure Conversations', description: 'End-to-end encryption ensures your conversations remain private. Your data, your control.', color: 'text-secondary' },
  { icon: Bell, title: 'Instant Notifications', description: 'Never miss a message with smart notifications. Stay connected wherever you are.', color: 'text-accent' },
  { icon: Image, title: 'Media Sharing', description: 'Share images, videos, and files seamlessly. Built-in preview for a smooth experience.', color: 'text-info' },
  { icon: Users, title: 'Group Chats', description: 'Create groups for teams, friends, or communities. Rich collaboration features included.', color: 'text-success' },
  { icon: Sparkles, title: 'Modern Experience', description: 'Beautiful interface with customizable themes. Chat in style, your way.', color: 'text-warning' },
]



const floatingBubble = (i: number) => ({
  y: [0, -15 - i * 5, 0],
  opacity: [0.06, 0.1, 0.06] as number[],
  transition: { duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' as const },
})

export function Features() {
  return (
    <section id="features" className="py-24 relative scroll-mt-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={floatingBubble(0)} className="absolute top-20 left-[8%] text-primary/20"><MessageCircle className="w-8 h-8" /></motion.div>
        <motion.div animate={floatingBubble(1)} className="absolute bottom-32 right-[10%] text-secondary/20"><MessageCircle className="w-6 h-6" /></motion.div>
        <motion.div animate={floatingBubble(2)} className="absolute top-1/2 right-[5%] text-accent/15"><MessageCircle className="w-10 h-10" /></motion.div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Reveal className="text-center mb-16" delay={50}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">Powerful features designed for seamless communication</p>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="card bg-base-200/50 hover:bg-base-200 transition-all duration-300 border border-base-300/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="card-body">
                    <div className={`w-12 h-12 rounded-xl bg-base-300/50 flex items-center justify-center mb-3 ${feature.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="card-title text-lg">{feature.title}</h3>
                    <p className="text-base-content/60 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
