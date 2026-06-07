'use client';

import { useEffect, useMemo } from 'react';
import { useConversations, useMessageUnreadCounts } from '@/src/hooks/use-chat';
import { ConversationItem } from '@/src/components/chat/conversation-item';
import { ConversationSkeleton } from '@/src/components/common/loading-skeleton';
import { useChatStore } from '@/src/stores/chat.store';
import { motion } from 'framer-motion';
import { MessageSquare, Search, X, AlertCircle } from 'lucide-react';
import type { Conversation } from '@/src/types/entities/conversation';
import type { PopulatedUser } from '@/src/types/entities/user';

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, isError, refetch } = useConversations();
  const { activeConversationId, conversationsSearch, setConversationsSearch, setUnreadCounts } = useChatStore();
  const unreadCountsQuery = useMessageUnreadCounts();

  useEffect(() => {
    if (unreadCountsQuery.data) {
      setUnreadCounts(unreadCountsQuery.data);
    }
  }, [unreadCountsQuery.data, setUnreadCounts]);

  const conversations = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.conversations);
  }, [data]);

  const filtered = useMemo(() => {
    if (!conversationsSearch.trim()) return conversations;
    const q = conversationsSearch.toLowerCase();
    return conversations.filter((c: Conversation) => {
      const name = c.name || '';
      const participants = (c.participants as PopulatedUser[]) || [];
      const participantNames = participants.map((p) => p.username || '').join(' ');
      return name.toLowerCase().includes(q) || participantNames.toLowerCase().includes(q);
    });
  }, [conversations, conversationsSearch]);

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="p-3 border-b border-base-300">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={conversationsSearch}
            onChange={(e) => setConversationsSearch(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 pr-8 text-sm"
          />
          {conversationsSearch && (
            <button
              onClick={() => setConversationsSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-base-content/40" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isError ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-error" />
            </div>
            <p className="text-sm font-medium">Failed to load conversations</p>
            <p className="text-xs text-base-content/40 mt-1 mb-3">
              Something went wrong. Please try again.
            </p>
            <button onClick={() => refetch()} className="btn btn-primary btn-xs">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-base-content/40" />
            </div>
            <p className="text-sm font-medium">
              {conversationsSearch ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              {conversationsSearch
                ? 'Try a different search term'
                : 'Start a new conversation to get going'}
            </p>
          </div>
        ) : (
          <>
            {filtered.map((conversation, index) => (
              <motion.div
                key={conversation._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <ConversationItem
                  conversation={conversation}
                  isActive={activeConversationId === conversation._id}
                  onClick={() => onSelectConversation(conversation._id)}
                />
              </motion.div>
            ))}
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full py-3 text-xs text-primary hover:bg-base-200 transition-colors"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
