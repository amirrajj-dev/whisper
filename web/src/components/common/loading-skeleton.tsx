'use client';

import { motion } from 'framer-motion';

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-base-300 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-base-300 rounded w-24" />
        <div className="h-2.5 bg-base-300 rounded w-40" />
      </div>
      <div className="h-2.5 bg-base-300 rounded w-10" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 p-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-base-300 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-base-300 rounded w-20" />
        <div className="h-4 bg-base-300 rounded w-64" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-16 border-b border-base-300 flex items-center px-4 gap-3 animate-pulse">
        <div className="w-9 h-9 rounded-full bg-base-300" />
        <div className="h-4 bg-base-300 rounded w-32" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
      <div className="p-4 border-t border-base-300 animate-pulse">
        <div className="h-12 bg-base-300 rounded-xl" />
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <motion.div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 rounded-full bg-base-content/40"
        />
      ))}
    </motion.div>
  );
}
