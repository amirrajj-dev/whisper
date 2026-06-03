'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ThemePicker } from '@/src/components/ui/theme-picker'
import { LogIn } from 'lucide-react'

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-base-100/80 backdrop-blur-xl border-b border-base-300/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/whisper-responsive/icons8-chat-64.svg"
              alt="Whisper"
              width={32}
              height={32}
            />
            <span className="font-bold text-lg">Whisper</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemePicker />
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm gap-1.5">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
            <div className="sm:hidden">
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
