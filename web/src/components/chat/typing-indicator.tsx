'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useChatStore } from '@/src/stores/chat.store';

interface TypingIndicatorProps {
  conversationId: string;
}

const TYPING_TIMEOUT = 4000;

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { typingUsers, removeTypingUser } = useChatStore();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const conversationIdRef = useRef(conversationId);

  conversationIdRef.current = conversationId;

  const users = typingUsers[conversationId];

  useEffect(() => {
    const currentIds = new Set(users?.map((u) => u.userId) || []);
    const existingIds = new Set(timersRef.current.keys());

    for (const id of existingIds) {
      if (!currentIds.has(id)) {
        clearTimeout(timersRef.current.get(id)!);
        timersRef.current.delete(id);
      }
    }

    if (!users?.length) return;

    for (const u of users) {
      if (timersRef.current.has(u.userId)) {
        clearTimeout(timersRef.current.get(u.userId)!);
      }
      const timer = setTimeout(() => {
        removeTypingUser(conversationIdRef.current, u.userId);
        timersRef.current.delete(u.userId);
      }, TYPING_TIMEOUT);
      timersRef.current.set(u.userId, timer);
    }

    return () => {
      for (const [, timer] of timersRef.current) clearTimeout(timer);
      timersRef.current.clear();
    };
  }, [users, conversationId, removeTypingUser]);

  if (!users?.length) return null;

  const names = users.map((u) => u.username).filter(Boolean);
  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.length} people are typing...`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 px-4 py-1 text-xs text-base-content/40"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-base-content/30"
          />
        ))}
      </div>
      <span>{text}</span>
    </motion.div>
  );
}
