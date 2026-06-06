'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Conversation } from '@/src/types/entities/conversation';
import type { PopulatedUser } from '@/src/types/entities/user';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { UserProfileModal } from '@/src/components/chat/user-profile-modal';
import { GroupDetailsModal } from '@/src/components/chat/group-details-modal';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { useDeleteConversation, useRemoveParticipant } from '@/src/hooks/use-chat';
import { ChevronLeft, Search, X, ChevronUp, ChevronDown, MoreVertical, Shield, ShieldOff, UserPlus, Users, Crown, LogOut, Trash2, User, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useChatStore } from '@/src/stores/chat.store';
import { userApi } from '@/src/services/user.api';
import { toast } from 'sonner';

interface ChatHeaderProps {
  conversation: Conversation;
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

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
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
    typingUsers,
    setSearchActive,
    setSearchQuery,
    setSearchActiveMatchIndex,
    clearSearch,
  } = useChatStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [blockedOverride, setBlockedOverride] = useState<boolean | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const deleteConversationMut = useDeleteConversation();
  const removeParticipantMut = useRemoveParticipant();

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
      setShowGroupModal(true);
    } else {
      setShowProfileModal(true);
    }
  }, [isGroup]);

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
              <p className="text-xs text-base-content/40 truncate min-h-[16px]">
                {(() => {
                  const typingUsersList = !isGroup && conversation?._id ? typingUsers[conversation._id] : undefined;
                  if (typingUsersList?.length) {
                    const names = typingUsersList.map((u) => u.username).filter(Boolean);
                    const text = names.length === 1 ? `${names[0]} is typing...` : `${names.length} people are typing...`;
                    return <span className="text-success">{text}</span>;
                  }
                  if (isGroup) return `${getParticipantCount(conversation)} members`;
                  if (isOnline) return 'Online';
                  if (otherParticipant?.lastSeen) return `Last seen ${formatDistanceToNow(new Date(otherParticipant.lastSeen), { addSuffix: true })}`;
                  return '';
                })()}
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
                            setShowGroupModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                        >
                          <Info className="w-4 h-4 text-base-content/40" />
                          Group Info
                        </button>
                        {conversation.owner === user?._id && (
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              setShowGroupModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                          >
                            <Crown className="w-4 h-4 text-base-content/40" />
                            Transfer Ownership
                          </button>
                        )}
                        {conversation.admins?.includes(user?._id || '') || conversation.owner === user?._id ? (
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              setShowGroupModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                          >
                            <UserPlus className="w-4 h-4 text-base-content/40" />
                            Add Participants
                          </button>
                        ) : null}
                        {conversation.owner === user?._id && (
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              setShowDeleteConfirm(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Group
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            setShowLeaveConfirm(true);
                          }}
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

      <GroupDetailsModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        conversation={conversation}
      />

      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-6"
            >
              <h3 className="font-semibold text-lg mb-2">Delete Group?</h3>
              <p className="text-sm text-base-content/60 mb-4">
                This will permanently delete this group and all messages. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button
                  onClick={() => {
                    deleteConversationMut.mutate(conversation._id, {
                      onSuccess: () => {
                        setShowDeleteConfirm(false);
                        toast.success('Group deleted');
                      },
                    });
                  }}
                  className="btn btn-error btn-sm"
                >
                  {deleteConversationMut.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowLeaveConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-6"
            >
              <h3 className="font-semibold text-lg mb-2">Leave Group?</h3>
              <p className="text-sm text-base-content/60 mb-4">
                You will no longer have access to this group conversation.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowLeaveConfirm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button
                  onClick={() => {
                    if (!user) return;
                    removeParticipantMut.mutate(
                      { conversationId: conversation._id, userId: user._id },
                      {
                        onSuccess: () => {
                          setShowLeaveConfirm(false);
                          toast.success('Left group');
                        },
                      },
                    );
                  }}
                  className="btn btn-warning btn-sm"
                >
                  {removeParticipantMut.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
