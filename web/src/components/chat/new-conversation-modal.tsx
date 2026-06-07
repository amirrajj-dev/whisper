'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, UserPlus, Loader2, Check, Camera, Hash } from 'lucide-react';
import { UserAvatar } from '@/src/components/common/user-avatar';
import { userApi } from '@/src/services/user.api';
import { chatApi } from '@/src/services/chat.api';
import { toast } from 'sonner';
import type { User } from '@/src/types/entities/user';
import type { Conversation } from '@/src/types/entities/conversation';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

type TabType = 'private' | 'group';

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [tab, setTab] = useState<TabType>('private');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await userApi.getUsers({ page: 1, limit: 50 });
      if (!query.trim()) {
        setUsers(res.users as User[]);
      } else {
        const filtered = (res.users as User[])?.filter((u: User) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        ) || [];
        setUsers(filtered);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setUsers([]);
      setSelectedUsers([]);
      setGroupName('');
      setGroupAvatar(null);
      setTab('private');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    loadUsers(searchQuery);
  }, [isOpen, searchQuery, loadUsers]);

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const handleCreate = async () => {
    if (creating) return;

    if (tab === 'private') {
      if (selectedUsers.length === 0) {
        toast.error('Please select a user');
        return;
      }
      setCreating(true);
      try {
        const conv = await chatApi.createConversation({
          type: 'private',
          participants: [selectedUsers[0]._id],
        });
        onConversationCreated(conv._id);
        if ((conv as Conversation & { isExisting?: boolean }).isExisting) {
          toast.success('Conversation with this user already exists');
        } else {
          toast.success('Conversation created');
        }
      } catch (err) {
        toast.error((err as { message?: string })?.message || 'Failed to create conversation');
      } finally {
        setCreating(false);
      }
    } else {
      if (!groupName.trim()) {
        toast.error('Please enter a group name');
        return;
      }
      if (selectedUsers.length < 2) {
        toast.error('Please select at least 2 participants');
        return;
      }
      setCreating(true);
      try {
        const conv = await chatApi.createConversation(
          {
            type: 'group',
            participants: selectedUsers.map((u) => u._id),
            name: groupName.trim(),
          },
          groupAvatar || undefined,
        );
        onConversationCreated(conv._id);
        toast.success('Group created');
      } catch (err) {
        toast.error((err as { message?: string })?.message || 'Failed to create group');
      } finally {
        setCreating(false);
      }
    }
  };

  return (
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
              <h3 className="text-lg font-semibold">New Conversation</h3>
              <button onClick={onClose} className="btn btn-ghost btn-sm btn-square">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-base-300">
              <button
                onClick={() => setTab('private')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                  tab === 'private' ? 'text-primary' : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Private Chat</span>
                </div>
                {tab === 'private' && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setTab('group')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                  tab === 'group' ? 'text-primary' : 'text-base-content/60 hover:text-base-content'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Group Chat</span>
                </div>
                {tab === 'group' && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {tab === 'group' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center hover:bg-base-300 transition-colors overflow-hidden">
                        {groupAvatar ? (
                          <img src={URL.createObjectURL(groupAvatar)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-base-content/40" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setGroupAvatar(e.target.files?.[0] || null)}
                      />
                    </label>
                    <div className="flex-1 relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name"
                        className="input input-bordered w-full pl-9 text-sm"
                        maxLength={100}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tab === 'private' ? 'Search users...' : 'Add participants...'}
                  className="input input-bordered w-full pl-9 text-sm"
                  autoFocus
                />
              </div>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <span
                      key={u._id}
                      className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full"
                    >
                      {u.username}
                      <button onClick={() => toggleUser(u)} className="hover:text-primary-content">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-base-content/40" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-sm text-base-content/40">
                    {searchQuery ? 'No users found' : 'No users available'}
                  </div>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedUsers.some((s) => s._id === u._id);
                    return (
                      <motion.button
                        key={u._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => toggleUser(u)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${
                          isSelected
                            ? 'bg-primary/10 ring-1 ring-primary/30'
                            : 'hover:bg-base-200'
                        }`}
                      >
                        <UserAvatar src={u.avatarUrl} alt={u.username} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.username}</p>
                          <p className="text-xs text-base-content/40 truncate">{u.email}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-content'
                              : 'border-base-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-base-300 flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  creating ||
                  (tab === 'private' && selectedUsers.length === 0) ||
                  (tab === 'group' && (!groupName.trim() || selectedUsers.length < 2))
                }
                className="btn btn-primary btn-sm gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : tab === 'private' ? (
                  'Start Chat'
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
