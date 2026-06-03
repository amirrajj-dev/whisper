'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCheck } from 'lucide-react'
import { Reveal } from '@/src/components/shared/reveal'

interface Message {
  id: number
  text: string
  sender: 'me' | 'them'
  time: string
}

const chatMessages: Message[] = [
  { id: 1, text: 'Hey! How are you?', sender: 'them', time: '10:30' },
  { id: 2, text: "I'm great! Just finished the new design system.", sender: 'me', time: '10:31' },
  { id: 3, text: 'That sounds awesome! Can I see it?', sender: 'them', time: '10:32' },
  { id: 4, text: 'Sure! Sending it over now. Let me know what you think.', sender: 'me', time: '10:33' },
  { id: 5, text: 'Wow, this is really impressive! The animations are so smooth.', sender: 'them', time: '10:34' },
]

export function Showcase() {
  const [visibleIds, setVisibleIds] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const runSequence = () => {
      setVisibleIds([])
      setIsTyping(false)
      setCycle((c) => c + 1)

      chatMessages.forEach((msg, i) => {
        const t = setTimeout(() => {
          setVisibleIds((prev) => [...prev, msg.id])
          if (i === 2) {
            setIsTyping(true)
            setTimeout(() => setIsTyping(false), 2000)
          }
        }, (i + 1) * 1200)
        timeouts.push(t)
      })
    }

    runSequence()
    const interval = setInterval(runSequence, 15000)
    timeouts.push(interval)

    return () => timeouts.forEach(clearTimeout)
  }, [])

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-12" delay={50}>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">See It in Action</h2>
          <p className="text-lg text-base-content/60 max-w-2xl mx-auto">A glimpse into the Whisper chat experience</p>
        </Reveal>

        <Reveal delay={150} y={40} duration={0.8}>
          <div className="max-w-md mx-auto">
            <div className="card bg-base-200 shadow-2xl border border-base-300 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-base-300 bg-base-300/50">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <Image src="/avatar-placeholder.png" alt="Avatar" width={40} height={40} className="object-cover" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Alex Johnson</h4>
                  <div className="flex items-center gap-1.5">
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-xs text-base-content/50">Online</span>
                  </div>
                </div>
              </div>

              <div className="p-4 min-h-[320px] flex flex-col gap-3">
                {visibleIds.map((id) => {
                  const msg = chatMessages.find((m) => m.id === id)
                  if (!msg) return null
                  return (
                    <motion.div
                      key={`msg-${cycle}-${id}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.sender === 'me' ? 'bg-primary text-primary-content rounded-br-md' : 'bg-base-300 text-base-content rounded-bl-md'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                          <span className="text-[10px] opacity-60">{msg.time}</span>
                          {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-info" />}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                {isTyping && (
                  <motion.div
                    key="typing-indicator"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-base-300 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-base-content/40" />
                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-base-content/40" />
                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-base-content/40" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-3 border-t border-base-300">
                <div className="flex gap-2">
                  <input type="text" placeholder="Type a message..." className="input input-bordered input-sm flex-1" disabled />
                  <button className="btn btn-primary btn-sm" disabled>Send</button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
