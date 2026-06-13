"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { Conversation } from "@/src/types/entities/conversation";
import type { PopulatedUser } from "@/src/types/entities/user";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { UserProfileModal } from "@/src/components/chat/user-profile-modal";
import { GroupDetailsModal } from "@/src/components/chat/group/group-details-modal";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { useDeleteConversation, useRemoveParticipant } from "@/src/hooks/use-chat";
import { ChevronLeft, Search, MoreVertical, Users } from "lucide-react";
import { useChatStore } from "@/src/stores/chat.store";
import { usePresenceStore } from "@/src/stores/presence.store";
import { userApi } from "@/src/services/user.api";
import { useAuthStore } from "@/src/stores/auth.store";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { SearchMode } from "./search-mode";
import { ConversationStatus } from "./conversation-status";
import { HeaderDropdown } from "./header-dropdown";
import { getConversationName, getConversationAvatar, getParticipantCount } from "./chat-header-utils";
import { ConfirmDialog } from "@/src/components/shared/confirm-dialog";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const { user } = useCurrentUser();
  const isGroup = conversation.type === "group";
  const name = getConversationName(conversation, user?._id);
  const avatar = getConversationAvatar(conversation, user?._id);
  const participants = conversation.participants as PopulatedUser[];
  const otherParticipant = participants.find((p) => p._id !== user?._id);
  const isOnline = usePresenceStore((s) =>
    otherParticipant ? s.onlineUsers.has(otherParticipant._id) : false,
  );
  const otherParticipantLastSeen = otherParticipant?.lastSeen;

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
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
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

  const isBlocked =
    blockedOverride !== null ? blockedOverride : blockedFromUser;

  const typingUsersList = conversation?._id
    ? typingUsers[conversation._id]
    : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSearch();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (searchMatchIds.length === 0) return;
        const nextIndex = e.shiftKey
          ? (searchActiveMatchIndex - 1 + searchMatchIds.length) %
            searchMatchIds.length
          : (searchActiveMatchIndex + 1) % searchMatchIds.length;
        setSearchActiveMatchIndex(nextIndex);
        const matchId = searchMatchIds[nextIndex];
        if (matchId) {
          const el = document.getElementById(`msg-${matchId}`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    },
    [
      searchMatchIds,
      searchActiveMatchIndex,
      setSearchActiveMatchIndex,
      clearSearch,
    ],
  );

  const handleSearchNav = useCallback(
    (direction: "up" | "down") => {
      if (searchMatchIds.length === 0) return;
      const nextIndex =
        direction === "down"
          ? (searchActiveMatchIndex + 1) % searchMatchIds.length
          : (searchActiveMatchIndex - 1 + searchMatchIds.length) %
            searchMatchIds.length;
      setSearchActiveMatchIndex(nextIndex);
      const matchId = searchMatchIds[nextIndex];
      if (matchId) {
        const el = document.getElementById(`msg-${matchId}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [searchMatchIds, searchActiveMatchIndex, setSearchActiveMatchIndex],
  );

  const handleBlockToggle = useCallback(async () => {
    if (!otherParticipant) return;
    const newBlocked = !isBlocked;
    setBlockedOverride(newBlocked);
    try {
      const authUser = useAuthStore.getState().user;
      if (newBlocked) {
        await userApi.blockUser(otherParticipant._id);
        if (authUser) {
          useAuthStore.getState().setUser({
            ...authUser,
            blockedUsers: [...authUser.blockedUsers, otherParticipant._id],
          });
        }
        toast.success("User blocked");
      } else {
        await userApi.unblockUser(otherParticipant._id);
        if (authUser) {
          useAuthStore.getState().setUser({
            ...authUser,
            blockedUsers: authUser.blockedUsers.filter(
              (id) => id !== otherParticipant._id,
            ),
          });
        }
        toast.success("User unblocked");
      }
    } catch (err: unknown) {
      setBlockedOverride(!newBlocked);
      const error = err as { message?: string };
      toast.error(error.message || "Failed to update block status");
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

  const handleOpenDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDropdown) {
      setShowDropdown(false);
      setDropdownPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
      setShowDropdown(true);
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    const handleClose = () => {
      setShowDropdown(false);
      setDropdownPosition(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, [showDropdown]);

  if (isSearchActive) {
    return (
      <SearchMode
        searchQuery={searchQuery}
        searchActiveMatchIndex={searchActiveMatchIndex}
        searchMatchIds={searchMatchIds}
        onSearchQueryChange={setSearchQuery}
        onSearchNav={handleSearchNav}
        onSearchInputKeyDown={handleSearchInputKeyDown}
        onCloseSearch={() => setSearchActive(false)}
        onClearSearch={clearSearch}
      />
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
            <UserAvatar
              src={avatar}
              alt={name}
              size="md"
              isOnline={isOnline}
              showIndicator={!isGroup}
            />
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
                <ConversationStatus
                  conversation={conversation}
                  isGroup={isGroup}
                  isOnline={isOnline}
                  otherParticipantLastSeen={otherParticipantLastSeen}
                  typingUsersList={typingUsersList}
                />
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setSearchActive(true)}
            className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => handleOpenDropdown(e)}
            className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
            title="More"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showDropdown &&
            dropdownPosition &&
            createPortal(
              <HeaderDropdown
                ref={dropdownRef}
                show={showDropdown}
                top={dropdownPosition.top}
                right={dropdownPosition.right}
                isGroup={isGroup}
                isBlocked={isBlocked}
                isOwner={conversation.owner === user?._id}
                isAdmin={conversation.admins?.includes(user?._id || "") ?? false}
                onViewProfile={() => {
                  setShowDropdown(false);
                  setShowProfileModal(true);
                }}
                onBlockToggle={handleBlockToggle}
                onGroupInfo={() => {
                  setShowDropdown(false);
                  setShowGroupModal(true);
                }}
                onDeleteGroup={() => {
                  setShowDropdown(false);
                  setShowDeleteConfirm(true);
                }}
                onLeaveGroup={() => {
                  setShowDropdown(false);
                  setShowLeaveConfirm(true);
                }}
              />,
              document.body,
            )}
        </div>
      </motion.div>

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={otherParticipant || null}
        isOnline={isOnline}
        lastSeen={otherParticipantLastSeen}
      />

      <GroupDetailsModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        conversation={conversation}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteConversationMut.mutate(conversation._id, {
            onSuccess: () => setShowDeleteConfirm(false),
          });
        }}
        title="Delete Group?"
        message="This will permanently delete this group and all messages. This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="error"
        isLoading={deleteConversationMut.isPending}
      />

      <ConfirmDialog
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          if (!user) return;
          removeParticipantMut.mutate(
            { conversationId: conversation._id, userId: user._id },
            {
              onSuccess: () => {
                setShowLeaveConfirm(false);
                toast.success("Left group");
              },
            },
          );
        }}
        title="Leave Group?"
        message="You will no longer have access to this group conversation."
        confirmLabel="Leave"
        confirmVariant="warning"
        isLoading={removeParticipantMut.isPending}
      />
    </>
  );
}
