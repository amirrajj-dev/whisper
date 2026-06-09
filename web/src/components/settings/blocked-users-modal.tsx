'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Shield, ShieldOff, UserX, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { UserProfileModal } from '@/src/components/chat/user-profile-modal';
import { useBlockedUsers, useUnblockUser } from '@/src/hooks/use-blocked-users';
import { formatDistanceToNow } from 'date-fns';
import type { BlockedUser } from '@/src/services/user.api';

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BlockedUsersModal({ isOpen, onClose }: BlockedUsersModalProps) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null);

  const { data: blockedUsers, isLoading, isError, refetch } = useBlockedUsers();
  const unblockMutation = useUnblockUser();

  const filtered = useMemo(() => {
    if (!blockedUsers) return [];
    if (!search.trim()) return blockedUsers;
    const q = search.toLowerCase();
    return blockedUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [blockedUsers, search]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-base-300/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center">
                    <ShieldOff className="w-4 h-4 text-base-content/60" />
                  </div>
                  <h3 className="text-lg font-semibold">Blocked users</h3>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Search blocked users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input outline-none input-sm w-full pl-9 bg-base-200 border-none"
                  />
                </div>

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-base-300 shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-base-300 rounded w-24" />
                          <div className="h-2.5 bg-base-300 rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <p className="text-sm text-base-content/60 mb-3">
                      Failed to load blocked users
                    </p>
                    <button onClick={() => refetch()} className="btn btn-ghost btn-sm">
                      Try again
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mb-3">
                      <Shield className="w-6 h-6 text-base-content/40" />
                    </div>
                    <p className="text-sm font-medium">
                      {search ? 'No users found' : 'No blocked users'}
                    </p>
                    <p className="text-xs text-base-content/40 mt-1">
                      {search
                        ? 'Try a different search term'
                        : 'Blocked users will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[320px] overflow-y-auto">
                    {filtered.map((user) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/50 transition-colors group"
                      >
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <UserAvatar
                            src={user.avatarUrl}
                            alt={user.username}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.username}
                            </p>
                            <p className="text-xs text-base-content/40 truncate">
                              {user.email}
                              {user.blockedAt && (
                                <span className="ml-1.5">
                                  &middot; Blocked{' '}
                                  {formatDistanceToNow(new Date(user.blockedAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                            </p>
                          </div>
                        </button>
                        <button
                          onClick={() => unblockMutation.mutate(user._id)}
                          disabled={unblockMutation.isPending}
                          className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Unblock"
                        >
                          {unblockMutation.isPending &&
                          unblockMutation.variables === user._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UserProfileModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </>
  );
}
