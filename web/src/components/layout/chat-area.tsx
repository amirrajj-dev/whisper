'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useConversation } from '@/src/hooks/use-chat';
import { MessageBubble } from '@/src/components/chat/message-bubble';
import { MessageComposer } from '@/src/components/chat/message-composer';
import { ChatHeader } from '@/src/components/chat/chat-header';
import { DateSeparator } from '@/src/components/chat/date-separator';
import { TypingIndicator } from '@/src/components/chat/typing-indicator';
import { ChatSkeleton } from '@/src/components/common/loading-skeleton';
import { EmptyState } from '@/src/components/common/empty-state';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useChatStore } from '@/src/stores/chat.store';
import { socketManager } from '@/src/socket/socket.manager';
import { useDeleteMessage } from '@/src/hooks/use-chat';
import { getSenderId, getSenderName } from '@/src/components/chat/message/message-utils';
import type { Message } from '@/src/types/entities/message';

interface ChatAreaProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatArea({ conversationId, onBack }: ChatAreaProps) {
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);

  const { setReplyingTo, setEditingMessage, searchQuery, isSearchActive, setSearchMatchIds, clearSearch } = useChatStore();
  const deleteMessage = useDeleteMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottom = useRef(true);

  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return [...messagesData.pages].reverse().flatMap((p) => p.messages);
  }, [messagesData]);

  useEffect(() => {
    return () => {
      clearSearch();
      setEditingMessage(null);
      setReplyingTo(null);
    };
  }, [conversationId, clearSearch, setEditingMessage, setReplyingTo]);

  useEffect(() => {
    if (!isSearchActive || !searchQuery.trim()) {
      setSearchMatchIds([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const ids = allMessages
      .filter((msg) => !msg.deleted && msg.content.toLowerCase().includes(query))
      .map((msg) => msg._id);
    setSearchMatchIds(ids);
  }, [allMessages, searchQuery, isSearchActive, setSearchMatchIds]);

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    for (const msg of allMessages) {
      const msgDate = format(new Date(msg.createdAt), 'yyyy-MM-dd');
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === msgDate) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
    }
    return groups;
  }, [allMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isNearBottom.current) {
      scrollToBottom();
    }
  }, [allMessages.length, scrollToBottom]);

  const latestMessageId = useMemo(() => {
    if (!allMessages.length) return null;
    return allMessages[allMessages.length - 1]._id;
  }, [allMessages]);

  useEffect(() => {
    if (!conversationId) return;
    socketManager.joinConversation(conversationId);
    socketManager.setViewingConversation(conversationId);
    return () => {
      socketManager.leaveConversation(conversationId);
      socketManager.clearViewingConversation();
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !messagesData?.pages?.length) return;
    const timer = setTimeout(() => {
      socketManager.markAsRead(conversationId);
      queryClient.invalidateQueries({ queryKey: ['message-unread-counts'] });
    }, 500);
    return () => clearTimeout(timer);
  }, [conversationId, messagesData?.pages?.length, queryClient]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    isNearBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading || conversationLoading) {
    return <ChatSkeleton />;
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Conversation not found"
          description="This conversation may have been deleted or you don't have access."
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <ChatHeader conversation={conversation} onBack={onBack} />


      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-sm text-primary" />
          </div>
        )}

        <div className="py-2">
          {groupedMessages.map((group) => (
            <div key={group.messages[0]._id}>
              <DateSeparator date={group.date} />
              {group.messages.map((msg, idx) => {
                const prevMsg = idx > 0 ? group.messages[idx - 1] : undefined;
                const senderId = getSenderId(msg.senderId);
                const prevSenderId = prevMsg
                  ? getSenderId(prevMsg.senderId)
                  : undefined;
                const showAvatar = !prevMsg || senderId !== prevSenderId;

                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    showAvatar={showAvatar}
                    isGrouped={!showAvatar}
                    conversationType={conversation?.type}
                    conversationAdmins={conversation?.admins as string[] | undefined}
                    conversationOwner={conversation?.owner as string | undefined}
                    searchQuery={isSearchActive ? searchQuery : undefined}
                    onReply={(m) =>
                      setReplyingTo({
                        messageId: m._id,
                        content: m.content,
                        senderName: getSenderName(m.senderId),
                      })
                    }
                    onEdit={(m) => setEditingMessage({ messageId: m._id, content: m.content })}
                    onDelete={(id) => deleteMessage.mutate(id)}
                  />
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* <TypingIndicator conversationId={conversationId} /> */}
      </div>

      <MessageComposer conversationId={conversationId} onMessageSent={scrollToBottom} />
    </div>
  );
}
