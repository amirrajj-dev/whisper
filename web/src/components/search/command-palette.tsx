'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Users, Hash, Command, ArrowRight, Loader2, X } from 'lucide-react';
import { useConversations } from '@/src/hooks/use-chat';
import { useChatStore } from '@/src/stores/chat.store';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { useMediaQuery } from '@/src/hooks/use-media-query';
import type { Conversation } from '@/src/types/entities/conversation';
import type { PopulatedUser } from '@/src/types/entities/user';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (id: string) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectConversation }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data } = useConversations();
  const { setActiveConversation } = useChatStore();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const conversations: Conversation[] = data?.pages?.flatMap((p: any) => p.conversations) || [];

  const filtered = query.trim()
    ? conversations.filter((c) => {
        const name = c.name || '';
        const participants = (c.participants as PopulatedUser[]) || [];
        const searchStr = [name, ...participants.map((p) => p.username)].join(' ').toLowerCase();
        return searchStr.includes(query.toLowerCase());
      })
    : conversations.slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = useCallback(
    (id: string) => {
      setActiveConversation(id);
      onSelectConversation(id);
      onClose();
    },
    [setActiveConversation, onSelectConversation, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]._id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-base-300/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300">
              <Search className="w-5 h-5 text-base-content/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search conversations..."
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-base-content/30"
              />
              {query && (
                <button onClick={() => setQuery('')} className="btn btn-ghost btn-xs btn-square">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {isDesktop && (
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-base-200 rounded border border-base-300 text-base-content/40">
                  <Command className="w-2.5 h-2.5" />
                  K
                </kbd>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center mb-2">
                    <Search className="w-5 h-5 text-base-content/30" />
                  </div>
                  <p className="text-sm text-base-content/60">
                    {query ? 'No conversations found' : 'No recent conversations'}
                  </p>
                </div>
              ) : (
                filtered.map((conv, i) => (
                  <button
                    key={conv._id}
                    onClick={() => handleSelect(conv._id)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors ${
                      i === selectedIndex ? 'bg-primary/10' : 'hover:bg-base-200'
                    }`}
                  >
                    <UserAvatar
                      src={conv.avatarUrl || undefined}
                      alt={conv.name || 'Conversation'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.name || (conv.participants as PopulatedUser[])?.[0]?.username || 'Unknown'}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-base-content/40 truncate">{conv.lastMessage}</p>
                      )}
                    </div>
                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition-opacity ${
                        i === selectedIndex ? 'opacity-100 text-primary' : 'opacity-0'
                      }`}
                    />
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-t border-base-300 bg-base-200/50">
              <span className="text-[10px] text-base-content/30 flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-base-200 rounded border border-base-300 text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="text-[10px] text-base-content/30 flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-base-200 rounded border border-base-300 text-[10px]">↵</kbd>
                open
              </span>
              <span className="text-[10px] text-base-content/30 flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-base-200 rounded border border-base-300 text-[10px]">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
