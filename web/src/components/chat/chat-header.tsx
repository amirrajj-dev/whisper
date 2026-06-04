'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Conversation } from '@/src/types/entities/conversation';
import type { PopulatedUser } from '@/src/types/entities/user';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { UserProfileModal } from '@/src/components/chat/user-profile-modal';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { ChevronLeft, Search, X, ChevronUp, ChevronDown, MoreVertical, Shield, ShieldOff, UserPlus, Users, Crown, LogOut, Trash2, User, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '@/src/stores/chat.store';
import { userApi } from '@/src/services/user.api';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: Conversation;
  onToggleInfo?: () => void;
  onBack?: () => void;
}

function getConversationName(conversation: Conversation, currentUserId?: string): string {
  if (conversation.name) return conversation.name;
  const participants = conversation.participants as PopulatedUser[];
  if (participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.username || 'Unknown';
  }
  return 'Unknown';
}

function getConversationAvatar(conversation: Conversation, currentUserId?: string): string | null {
  if (conversation.avatarUrl) return conversation.avatarUrl;
  const participants = conversation.participants as PopulatedUser[];
  if (!conversation.name && participants.length) {
    const other = participants.find((p) => p._id !== currentUserId);
    return other?.avatarUrl || null;
  }
  return null;
}

function getParticipantCount(conversation: Conversation): number {
  return (conversation.participants as PopulatedUser[]).length;
}

export function ChatHeader({ conversation, onToggleInfo, onBack }: ChatHeaderProps) {
  const { user } = useCurrentUser();
  const isGroup = conversation.type === 'group';
  const name = getConversationName(conversation, user?._id);
  const avatar = getConversationAvatar(conversation, user?._id);
  const participants = conversation.participants as PopulatedUser[];
  const otherParticipant = participants.find((p) => p._id !== user?._id);
  const isOnline = !isGroup && otherParticipant?.lastSeen === null;

  const {
    isSearchActive,
    searchQuery,
    searchActiveMatchIndex,
    searchMatchIds,
    setSearchActive,
    setSearchQuery,
    setSearchActiveMatchIndex,
    clearSearch,
  } = useChatStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [blockedOverride, setBlockedOverride] = useState<boolean | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const blockedFromUser = useMemo(() => {
    if (!otherParticipant || !user) return false;
    return (user.blockedUsers ?? []).includes(otherParticipant._id);
  }, [otherParticipant, user]);

  const isBlocked = blockedOverride !== null ? blockedOverride : blockedFromUser;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSearch();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchMatchIds.length === 0) return;
        const nextIndex =
          e.shiftKey
            ? (searchActiveMatchIndex - 1 + searchMatchIds.length) % searchMatchIds.length
            : (searchActiveMatchIndex + 1) % searchMatchIds.length;
        setSearchActiveMatchIndex(nextIndex);
        const matchId = searchMatchIds[nextIndex];
        if (matchId) {
          const el = document.getElementById(`msg-${matchId}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [searchMatchIds, searchActiveMatchIndex, setSearchActiveMatchIndex, clearSearch],
  );

  const handleSearchNav = useCallback(
    (direction: 'up' | 'down') => {
      if (searchMatchIds.length === 0) return;
      const nextIndex =
        direction === 'down'
          ? (searchActiveMatchIndex + 1) % searchMatchIds.length
          : (searchActiveMatchIndex - 1 + searchMatchIds.length) % searchMatchIds.length;
      setSearchActiveMatchIndex(nextIndex);
      const matchId = searchMatchIds[nextIndex];
      if (matchId) {
        const el = document.getElementById(`msg-${matchId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [searchMatchIds, searchActiveMatchIndex, setSearchActiveMatchIndex],
  );

  const handleBlockToggle = useCallback(async () => {
    if (!otherParticipant) return;
    const newBlocked = !isBlocked;
    setBlockedOverride(newBlocked);
    try {
      if (newBlocked) {
        await userApi.blockUser(otherParticipant._id);
        toast.success('User blocked');
      } else {
        await userApi.unblockUser(otherParticipant._id);
        toast.success('User unblocked');
      }
    } catch (err: unknown) {
      setBlockedOverride(!newBlocked);
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update block status');
    }
    setShowDropdown(false);
  }, [otherParticipant, isBlocked]);

  const handleClickHeader = useCallback(() => {
    if (isGroup) {
      onToggleInfo?.();
    } else {
      setShowProfileModal(true);
    }
  }, [isGroup, onToggleInfo]);

  if (isSearchActive) {
    return (
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 border-b border-base-300 flex items-center gap-2 px-3 lg:px-4 bg-base-100/80 backdrop-blur-sm shrink-0"
      >
        <button
          onClick={() => setSearchActive(false)}
          className="btn btn-ghost btn-sm btn-square shrink-0"
          aria-label="Close search"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-base-content/40 shrink-0" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/30"
            autoFocus
          />
        </div>
        {searchMatchIds.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-base-content/40 shrink-0">
            <span>
              {searchMatchIds.length > 0
                ? `${searchActiveMatchIndex + 1} of ${searchMatchIds.length}`
                : '0 results'}
            </span>
            <button
              onClick={() => handleSearchNav('up')}
              className="btn btn-ghost btn-xs btn-square"
              aria-label="Previous match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSearchNav('down')}
              className="btn btn-ghost btn-xs btn-square"
              aria-label="Next match"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <button
          onClick={clearSearch}
          className="btn btn-ghost btn-xs btn-square shrink-0"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 border-b border-base-300 flex items-center justify-between px-3 lg:px-4 bg-base-100/80 backdrop-blur-sm shrink-0"
      >
        <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm btn-square lg:hidden"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleClickHeader}
            className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1 text-left"
          >
            <UserAvatar src={avatar} alt={name} size="md" isOnline={isOnline} showIndicator={!isGroup} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm truncate">{name}</span>
                {isGroup && (
                  <span className="badge badge-ghost badge-xs gap-1 shrink-0">
                    <Users className="w-2.5 h-2.5" />
                    {getParticipantCount(conversation)}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/40 truncate">
                {isGroup
                  ? `${getParticipantCount(conversation)} members`
                  : isOnline
                    ? 'Online'
                    : otherParticipant?.lastSeen
                      ? `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastSeen), { addSuffix: true })}`
                      : ''}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              setSearchActive(true);
            }}
            className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
              title="More"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden z-50"
                >
                  <div className="py-1">
                    {!isGroup && otherParticipant && (
                      <>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setShowProfileModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                          <User className="w-4 h-4 text-base-content/40" />
                          View Profile
                        </button>
                        <button
                          onClick={handleBlockToggle}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                          {isBlocked ? (
                            <ShieldOff className="w-4 h-4 text-base-content/40" />
                          ) : (
                            <Shield className="w-4 h-4 text-base-content/40" />
                          )}
                          {isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </>
                    )}

                    {isGroup && (
                      <>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            onToggleInfo?.();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                          <Info className="w-4 h-4 text-base-content/40" />
                          Group Info
                        </button>
                        {conversation.owner === user?._id && (
                          <button
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                          >
                            <Crown className="w-4 h-4 text-base-content/40" />
                            Transfer Ownership
                          </button>
                        )}
                        {conversation.admins?.includes(user?._id || '') || conversation.owner === user?._id ? (
                          <button
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                          >
                            <UserPlus className="w-4 h-4 text-base-content/40" />
                            Add Participants
                          </button>
                        ) : null}
                        {conversation.owner === user?._id && (
                          <button
                            onClick={() => setShowDropdown(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Group
                          </button>
                        )}
                        <button
                          onClick={() => setShowDropdown(false)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left text-warning"
                        >
                          <LogOut className="w-4 h-4" />
                          Leave Group
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={otherParticipant || null}
        isOnline={isOnline}
        lastSeen={otherParticipant?.lastSeen}
      />
    </>
  );
}
