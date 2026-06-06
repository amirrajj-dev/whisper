'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { userApi } from '@/src/services/user.api';
import { formatDistanceToNow } from 'date-fns';
import {
  X,
  Shield,
  ShieldOff,
  User,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PopulatedUser } from '@/src/types/entities/user';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: PopulatedUser | null;
  isOnline?: boolean;
  lastSeen?: string | null;
}

export function UserProfileModal({
  isOpen,
  onClose,
  user: targetUser,
  isOnline,
  lastSeen,
}: UserProfileModalProps) {
  const { user: currentUser } = useCurrentUser();
  const [blockedOverride, setBlockedOverride] = useState<boolean | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const blockedFromUser = useMemo(() => {
    if (!targetUser || !currentUser) return false;
    return (currentUser.blockedUsers ?? []).includes(targetUser._id);
  }, [targetUser, currentUser]);

  const isBlocked = blockedOverride !== null ? blockedOverride : blockedFromUser;

  const handleBlockToggle = useCallback(async () => {
    if (!targetUser) return;
    setIsBlocking(true);
    const newBlocked = !isBlocked;
    setBlockedOverride(newBlocked);
    try {
      if (newBlocked) {
        await userApi.blockUser(targetUser._id);
        toast.success('User blocked');
      } else {
        await userApi.unblockUser(targetUser._id);
        toast.success('User unblocked');
      }
    } catch (err: unknown) {
      setBlockedOverride(!newBlocked);
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update block status');
    } finally {
      setIsBlocking(false);
    }
  }, [targetUser, isBlocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!targetUser || !currentUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden"
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-b from-primary/10 to-base-100 pt-8 pb-6 px-6 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              >
                <UserAvatar
                  src={targetUser.avatarUrl}
                  alt={targetUser.username}
                  size="xl"
                  isOnline={isOnline}
                  showIndicator
                />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-center mt-4"
              >
                <h2 className="text-xl font-bold">{targetUser.username}</h2>
                {isOnline !== undefined && (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-success' : 'bg-base-content/30'
                      }`}
                    />
                    <span className="text-xs text-base-content/50">
                      {isOnline
                        ? 'Online'
                        : lastSeen
                          ? `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                          : 'Offline'}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {targetUser.bio && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18 }}
                className="px-6"
              >
                <div className="flex items-start gap-2 px-4 py-3 bg-base-200/50 rounded-xl">
                  <MessageCircle className="w-3.5 h-3.5 text-base-content/40 mt-0.5 shrink-0" />
                  <p className="text-sm text-base-content/70 leading-relaxed">{targetUser.bio}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="px-6 pb-6 space-y-3"
            >
              {currentUser._id !== targetUser._id && (
                <button
                  onClick={handleBlockToggle}
                  disabled={isBlocking}
                  className={`btn btn-sm w-full ${
                    isBlocked
                      ? 'btn-ghost text-base-content/60 hover:text-error'
                      : 'btn-ghost text-base-content/60 hover:text-warning'
                  }`}
                >
                  {isBlocking ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : isBlocked ? (
                    <ShieldOff className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </button>
              )}

              <div className="space-y-2 pt-2 border-t border-base-200">
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">ID: {targetUser._id}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
