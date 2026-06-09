"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { useAddParticipants } from "@/src/hooks/use-chat";
import { userApi } from "@/src/services/user.api";
import { X, Search } from "lucide-react";
import type { PopulatedUser } from "@/src/types/entities/user";

interface AddParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  existingParticipantIds: string[];
}

export function AddParticipantsModal({
  isOpen,
  onClose,
  conversationId,
  existingParticipantIds,
}: AddParticipantsModalProps) {
  const [search, setSearch] = useState("");
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
          setSearch("");
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
      onClose();
      setSelected([]);
      setSearch("");
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                  className="input outline-none input-sm w-full pl-9 text-sm"
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
                        selected.includes(u._id) ? "bg-primary/10" : "hover:bg-base-200"
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
                Add {selected.length > 0 ? `(${selected.length})` : ""}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
