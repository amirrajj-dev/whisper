'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { UserProfileModal } from '@/src/components/chat/user-profile-modal';
import { useCurrentUser } from '@/src/hooks/use-auth';
import { useAddParticipants, useRemoveParticipant, usePromoteToAdmin, useDemoteFromAdmin, useTransferOwnership, useDeleteConversation, useUpdateConversation } from '@/src/hooks/use-chat';
import { usePresenceStore } from '@/src/stores/presence.store';
import { userApi } from '@/src/services/user.api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { X, Users, Crown, Shield, ShieldCheck, UserPlus, LogOut, Trash2, Search, Gavel } from 'lucide-react';
import type { Conversation } from '@/src/types/entities/conversation';
import type { PopulatedUser } from '@/src/types/entities/user';


interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

type Role = 'owner' | 'admin' | 'member';

function getParticipantRole(conversation: Conversation, userId: string): Role {
  if (conversation.owner === userId) return 'owner';
  if ((conversation.admins ?? []).includes(userId)) return 'admin';
  return 'member';
}

function getMembersFromConversation(conversation: Conversation): Array<PopulatedUser & { role: Role }> {
  const participants = conversation.participants as PopulatedUser[];
  return participants.map(p => ({
    ...p,
    role: getParticipantRole(conversation, p._id),
  })).sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });
}

function AddParticipantsModal({
  isOpen,
  onClose,
  conversationId,
  existingParticipantIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  existingParticipantIds: string[];
}) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<PopulatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const addParticipants = useAddParticipants();

  const fetchUsersRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchUsersRef.current?.abort();
    const controller = new AbortController();
    fetchUsersRef.current = controller;
    userApi.getUsers({ page: 1, limit: 100 })
      .then(res => {
        if (!controller.signal.aborted) {
          setAllUsers(res.users?.filter((u: PopulatedUser) => !existingParticipantIds.includes(u._id)) ?? []);
          setLoading(false);
          setSelected([]);
          setSearch('');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => { controller.abort(); };
  }, [isOpen, existingParticipantIds]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return allUsers;
    const q = search.toLowerCase();
    return allUsers.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [allUsers, search]);

  const toggleUser = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!selected.length) return;
    try {
      await addParticipants.mutateAsync({ conversationId, userIds: selected });
      toast.success('Participants added');
      onClose();
      setSelected([]);
      setSearch('');
    } catch {
      // error handled by hook
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
            <div className="p-4 border-b border-base-300 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Add Participants</h3>
              <button onClick={onClose} className="btn btn-ghost btn-xs btn-square">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-bordered input-sm w-full pl-9 text-sm"
                  autoFocus
                />
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-sm" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => toggleUser(u._id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        selected.includes(u._id) ? 'bg-primary/10' : 'hover:bg-base-200'
                      }`}
                    >
                      <UserAvatar src={u.avatarUrl} alt={u.username} size="sm" />
                      <span className="text-sm flex-1 truncate">{u.username}</span>
                      {selected.includes(u._id) && (
                        <span className="text-xs text-primary font-medium">Selected</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : search.trim() ? (
                <p className="text-sm text-base-content/40 text-center py-4">No users found</p>
              ) : (
                <p className="text-sm text-base-content/40 text-center py-4">Type to search users</p>
              )}
            </div>
            <div className="p-4 border-t border-base-300 flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!selected.length || addParticipants.isPending}
                className="btn btn-primary btn-sm"
              >
                {addParticipants.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                Add {selected.length > 0 ? `(${selected.length})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function GroupDetailsModal({ isOpen, onClose, conversation }: GroupDetailsModalProps) {
  const { user: currentUser } = useCurrentUser();
  const [showProfileFor, setShowProfileFor] = useState<PopulatedUser | null>(null);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const deleteConversation = useDeleteConversation();
  const removeParticipant = useRemoveParticipant();
  const promoteToAdmin = usePromoteToAdmin();
  const demoteFromAdmin = useDemoteFromAdmin();
  const transferOwnership = useTransferOwnership();
  const updateConversation = useUpdateConversation();

  const currentUserRole = useMemo(() => {
    if (!conversation || !currentUser) return 'member' as Role;
    return getParticipantRole(conversation, currentUser._id);
  }, [conversation, currentUser]);

  const members = useMemo(() => {
    if (!conversation) return [];
    return getMembersFromConversation(conversation);
  }, [conversation]);

  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const onlineCount = useMemo(() => {
    return members.filter(m => onlineUsers.has(m._id)).length;
  }, [members, onlineUsers]);

  const handlePromote = useCallback(async (userId: string) => {
    if (!conversation) return;
    try {
      await promoteToAdmin.mutateAsync({ conversationId: conversation._id, userId });
      toast.success('User promoted to admin');
    } catch {
      // handled by hook
    }
  }, [conversation, promoteToAdmin]);

  const handleDemote = useCallback(async (userId: string) => {
    if (!conversation) return;
    try {
      await demoteFromAdmin.mutateAsync({ conversationId: conversation._id, userId });
      toast.success('User demoted from admin');
    } catch {
      // handled by hook
    }
  }, [conversation, demoteFromAdmin]);

  const handleRemove = useCallback(async (userId: string) => {
    if (!conversation) return;
    try {
      await removeParticipant.mutateAsync({ conversationId: conversation._id, userId });
      toast.success('Participant removed');
    } catch {
      // handled by hook
    }
  }, [conversation, removeParticipant]);

  const handleTransfer = useCallback(async (newOwnerId: string) => {
    if (!conversation) return;
    try {
      await transferOwnership.mutateAsync({ conversationId: conversation._id, newOwnerId });
      toast.success('Ownership transferred');
      setShowTransferConfirm(null);
    } catch {
      // handled by hook
    }
  }, [conversation, transferOwnership]);

  const handleDeleteGroup = useCallback(async () => {
    if (!conversation) return;
    try {
      await deleteConversation.mutateAsync(conversation._id);
      toast.success('Group deleted');
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      // handled by hook
    }
  }, [conversation, deleteConversation, onClose]);

  const handleLeaveGroup = useCallback(async () => {
    if (!conversation || !currentUser) return;
    try {
      await removeParticipant.mutateAsync({ conversationId: conversation._id, userId: currentUser._id });
      toast.success('Left group');
      setShowLeaveConfirm(false);
      onClose();
    } catch {
      // handled by hook
    }
  }, [conversation, currentUser, removeParticipant, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddParticipants) { setShowAddParticipants(false); return; }
        if (showTransferConfirm) { setShowTransferConfirm(null); return; }
        if (showDeleteConfirm) { setShowDeleteConfirm(false); return; }
        if (showLeaveConfirm) { setShowLeaveConfirm(false); return; }
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, showAddParticipants, showTransferConfirm, showDeleteConfirm, showLeaveConfirm]);

  if (!conversation || !currentUser) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!showAddParticipants && !showTransferConfirm && !showDeleteConfirm && !showLeaveConfirm) {
                  onClose();
                }
              }}
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
                  <div className="relative">
                    <label className={`cursor-pointer ${currentUserRole === 'owner' ? 'group' : ''}`}>
                      <UserAvatar
                        src={avatarFile ? URL.createObjectURL(avatarFile) : (conversation.avatarUrl || null)}
                        alt={conversation.name || 'Group'}
                        size="xl"
                      />
                      {currentUserRole === 'owner' && (
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && conversation) {
                            setAvatarFile(file);
                            updateConversation.mutate(
                              { id: conversation._id, data: {}, avatarFile: file },
                              { onSuccess: () => setAvatarFile(null) },
                            );
                          }
                        }}
                        disabled={currentUserRole !== 'owner'}
                      />
                    </label>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-base-100">
                      <Users className="w-2.5 h-2.5 text-primary-content" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-center mt-4"
                >
                  {editingName ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!nameInput.trim() || !conversation) return;
                        updateConversation.mutate(
                          { id: conversation._id, data: { name: nameInput.trim() } },
                          { onSuccess: () => setEditingName(false) },
                        );
                      }}
                      className="flex items-center gap-2 justify-center"
                    >
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="input input-bordered input-sm text-center text-sm"
                        autoFocus
                        maxLength={100}
                      />
                      <button type="submit" className="btn btn-primary btn-sm" disabled={updateConversation.isPending}>
                        {updateConversation.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditingName(false)} className="btn btn-ghost btn-sm">Cancel</button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold">{conversation.name || 'Group'}</h2>
                      {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                        <button
                          onClick={() => {
                            setNameInput(conversation.name || '');
                            setEditingName(true);
                          }}
                          className="btn btn-ghost btn-xs btn-square text-base-content/40"
                          title="Edit name"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5 text-base-content/40" />
                    <span className="text-xs text-base-content/50">
                      {members.length} members{onlineCount > 0 ? `, ${onlineCount} online` : ''}
                    </span>
                  </div>
                  {conversation.createdAt && (
                    <p className="text-xs text-base-content/30 mt-0.5">
                      Created {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-6 pb-6"
              >
                <div className="flex items-center justify-between mb-3 pt-2 border-t border-base-200">
                  <h3 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
                    Members ({members.length})
                  </h3>
                  {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                    <button
                      onClick={() => setShowAddParticipants(true)}
                      className="btn btn-ghost btn-xs gap-1 text-primary"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto scrollbar-thin">
                  {members.map((member) => {
                    const isSelf = member._id === currentUser._id;
                    const role = member.role;
                    const isOnline = onlineUsers.has(member._id);

                    let roleBadge: { label: string; className: string; icon: React.ReactNode } | null = null;
                    if (role === 'owner') {
                      roleBadge = {
                        label: 'Owner',
                        className: 'badge-warning',
                        icon: <Crown className="w-2.5 h-2.5" />,
                      };
                    } else if (role === 'admin') {
                      roleBadge = {
                        label: 'Admin',
                        className: 'badge-info',
                        icon: <ShieldCheck className="w-2.5 h-2.5" />,
                      };
                    }

                    return (
                      <div
                        key={member._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200/60 transition-colors group"
                      >
                        <button
                          onClick={() => setShowProfileFor(member)}
                          className="shrink-0"
                        >
                          <UserAvatar
                            src={member.avatarUrl || null}
                            alt={member.username}
                            size="sm"
                            isOnline={isOnline}
                            showIndicator
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowProfileFor(member)}
                              className="text-sm font-medium truncate hover:underline text-left"
                            >
                              {member.username}
                              {isSelf && <span className="text-base-content/40 ml-1">(you)</span>}
                            </button>
                            {roleBadge && (
                              <span className={`badge badge-xs gap-1 shrink-0 ${roleBadge.className}`}>
                                {roleBadge.icon}
                                {roleBadge.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-base-content/40">
                            {isOnline
                              ? 'Online'
                              : member.lastSeen
                                ? `Last seen ${formatDistanceToNow(new Date(member.lastSeen), { addSuffix: true })}`
                                : ''}
                          </p>
                        </div>

                        {/* Actions based on current user's role and target's role */}
                        {!isSelf && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {currentUserRole === 'owner' && (
                              <>
                                {role === 'admin' && (
                                  <button
                                    onClick={() => handleDemote(member._id)}
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-warning"
                                    title="Demote from admin"
                                  >
                                    <Gavel className="w-3 h-3" />
                                  </button>
                                )}
                                {role === 'member' && (
                                  <button
                                    onClick={() => handlePromote(member._id)}
                                    className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-info"
                                    title="Promote to admin"
                                  >
                                    <Shield className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setShowTransferConfirm(member._id)}
                                  className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-primary"
                                  title="Transfer ownership"
                                >
                                  <Crown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleRemove(member._id)}
                                  className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            {currentUserRole === 'admin' && role === 'member' && (
                              <>
                                <button
                                  onClick={() => handlePromote(member._id)}
                                  className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-info"
                                  title="Promote to admin"
                                >
                                  <Shield className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleRemove(member._id)}
                                  className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions section */}
                <div className="mt-4 pt-3 border-t border-base-200 space-y-2">
                  {currentUserRole === 'owner' && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200/60">
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-4 h-4 text-error" />
                          <div>
                            <p className="text-sm font-medium">Delete Group</p>
                            <p className="text-xs text-base-content/40">Permanently delete this group</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="btn btn-ghost btn-xs text-error"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200/60">
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium">Leave Group</p>
                        <p className="text-xs text-base-content/40">Remove yourself from this group</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowLeaveConfirm(true)}
                      className="btn btn-ghost btn-xs text-warning"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transfer ownership confirmation */}
      <AnimatePresence>
        {showTransferConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowTransferConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-6"
            >
              <h3 className="font-semibold text-lg mb-2">Transfer Ownership?</h3>
              <p className="text-sm text-base-content/60 mb-4">
                You will no longer be the owner of this group. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowTransferConfirm(null)} className="btn btn-ghost btn-sm">Cancel</button>
                <button
                  onClick={() => handleTransfer(showTransferConfirm)}
                  className="btn btn-primary btn-sm"
                >
                  {transferOwnership.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                  Transfer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete group confirmation */}
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
                  onClick={handleDeleteGroup}
                  className="btn btn-error btn-sm"
                >
                  {deleteConversation.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave group confirmation */}
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
                  onClick={handleLeaveGroup}
                  className="btn btn-warning btn-sm"
                >
                  {removeParticipant.isPending ? <span className="loading loading-spinner loading-xs" /> : null}
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AddParticipantsModal
        isOpen={showAddParticipants}
        onClose={() => setShowAddParticipants(false)}
        conversationId={conversation._id}
        existingParticipantIds={members.map(m => m._id)}
      />

      <UserProfileModal
        isOpen={!!showProfileFor}
        onClose={() => setShowProfileFor(null)}
        user={showProfileFor}
        isOnline={showProfileFor ? onlineUsers.has(showProfileFor._id) : false}
        lastSeen={showProfileFor?.lastSeen}
      />
    </>
  );
}
