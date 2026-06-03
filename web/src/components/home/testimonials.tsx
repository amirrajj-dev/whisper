'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Reveal } from '@/src/components/shared/reveal'

const testimonials = [
  { name: 'Sarah Chen', role: 'Product Designer', quote: 'Whisper has completely transformed how our team communicates. The real-time features are incredible and the interface is a joy to use.', avatar: '/avatar-placeholder.png', rating: 5 },
  { name: 'Marcus Rivera', role: 'Software Engineer', quote: "The speed and reliability of Whisper is unmatched. It's become an essential part of our daily workflow and I can't imagine going back.", avatar: '/avatar-placeholder.png', rating: 5 },
  { name: 'Emily Watson', role: 'Community Manager', quote: 'Managing large groups has never been easier. The moderation tools and group features are top-notch. Our community loves it.', avatar: '/avatar-placeholder.png', rating: 5 },
]

export function Testimonials() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-12" delay={50}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Loved by Users</h2>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">Hear what our community has to say</p>
        </Reveal>

        <Reveal delay={150}>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="card bg-base-200/50 border border-base-300/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="card-body relative">
                  <div className="absolute top-3 right-4 text-4xl text-base-content/10 font-serif leading-none">&rdquo;</div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="avatar">
                      <div className="w-12 rounded-full ring ring-primary/20 ring-offset-base-100 ring-offset-2">
                        <Image src={t.avatar} alt={t.name} width={48} height={48} className="object-cover" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t.name}</h4>
                      <p className="text-xs text-base-content/50">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-base-content/70 leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
