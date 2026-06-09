"use client";

import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  ShieldOff,
  Info,
  Crown,
  UserPlus,
  Trash2,
  LogOut,
} from "lucide-react";

interface HeaderDropdownProps {
  show: boolean;
  top: number;
  right: number;
  isGroup: boolean;
  isBlocked: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  onViewProfile: () => void;
  onBlockToggle: () => void;
  onGroupInfo: () => void;
  onDeleteGroup: () => void;
  onLeaveGroup: () => void;
}

export const HeaderDropdown = forwardRef<HTMLDivElement, HeaderDropdownProps>(
  function HeaderDropdown(
    {
      show,
      top,
      right,
      isGroup,
      isBlocked,
      isOwner,
      isAdmin,
      onViewProfile,
      onBlockToggle,
      onGroupInfo,
      onDeleteGroup,
      onLeaveGroup,
    },
    ref,
  ) {
    const canManage = isOwner || isAdmin;

    return (
      <AnimatePresence>
        {show && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.1 }}
            className="fixed w-56 bg-base-100 rounded-xl shadow-xl border border-base-300 overflow-hidden z-[9999]"
            style={{ top, right }}
          >
            <div className="py-1">
              {!isGroup && (
                <>
                  <button
                    onClick={onViewProfile}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-base-content/40" />
                    View Profile
                  </button>
                  <button
                    onClick={onBlockToggle}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                  >
                    {isBlocked ? (
                      <ShieldOff className="w-4 h-4 text-base-content/40" />
                    ) : (
                      <Shield className="w-4 h-4 text-base-content/40" />
                    )}
                    {isBlocked ? "Unblock User" : "Block User"}
                  </button>
                </>
              )}

              {isGroup && (
                <>
                  <button
                    onClick={onGroupInfo}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                  >
                    <Info className="w-4 h-4 text-base-content/40" />
                    Group Info
                  </button>
                  {canManage && (
                    <button
                      onClick={onGroupInfo}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                    >
                      <UserPlus className="w-4 h-4 text-base-content/40" />
                      Add Participants
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={onGroupInfo}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left"
                    >
                      <Crown className="w-4 h-4 text-base-content/40" />
                      Transfer Ownership
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={onDeleteGroup}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-200 transition-colors text-left text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Group
                    </button>
                  )}
                  <button
                    onClick={onLeaveGroup}
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
    );
  },
);
