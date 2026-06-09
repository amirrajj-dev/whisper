"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  User,
  Search,
  PenSquare,
} from "lucide-react";
import { useLogout, useCurrentUser } from "@/src/hooks/use-auth";
import { useNotificationStore } from "@/src/stores/notification.store";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { ThemePicker } from "@/src/components/ui/theme-picker";
import { useMediaQuery } from "@/src/hooks/use-media-query";
import { useUnreadCount } from "@/src/hooks/use-notifications";

interface SidebarProps {
  onNewConversation?: () => void;
  onShowNotifications?: () => void;
  onShowConversations?: () => void;
  onSearch?: () => void;
}

export function Sidebar({
  onNewConversation,
  onShowNotifications,
  onShowConversations,
  onSearch,
}: SidebarProps) {
  const { user } = useCurrentUser();
  const logoutMutation = useLogout();
  const { unreadCount } = useNotificationStore();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useUnreadCount();

  return (
    <motion.div
      className={`${isDesktop ? "w-64" : "w-16"} h-full flex flex-col bg-base-200/50 border-r border-base-300 shrink-0 overflow-visible relative z-10`}
    >
      {/* Header - fixed */}
      <div className="p-3 lg:p-4 border-b border-base-300 flex items-center justify-between gap-2 shrink-0">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/whisper-responsive/icons8-chat-64.svg"
            alt="Whisper"
            width={28}
            height={28}
            className="shrink-0"
          />
          {isDesktop && <span className="font-bold text-lg truncate">Whisper</span>}
        </Link>
        {isDesktop && <ThemePicker />}
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col justify-between py-4 overflow-visible">
        {/* Top buttons */}
        <div className="flex flex-col gap-4 px-2 overflow-visible">
          <div className={`tooltip tooltip-right tooltip-primary z-50`} data-tip="Chats">
            <button
              onClick={() => {
                if (onShowConversations) onShowConversations();
              }}
              className={`btn btn-ghost btn-sm ${isDesktop ? "w-full justify-start gap-3" : "btn-square w-full -translate-x-1.5"}`}
            >
              <MessageSquare className="w-5 h-5 shrink-0" />
              {isDesktop && <span className="text-sm truncate">Chats</span>}
            </button>
          </div>

          <div className={`tooltip tooltip-right tooltip-primary z-50`} data-tip="Search">
            <button
              onClick={onSearch}
              className={`btn btn-ghost btn-sm ${isDesktop ? "w-full justify-start gap-3" : "btn-square w-full -translate-x-1.5"}`}
            >
              <Search className="w-5 h-5 shrink-0" />
              {isDesktop && (
                <>
                  <span className="text-sm truncate flex-1 text-left">Search</span>
                  <kbd className="text-[10px] text-base-content/30 inline-flex items-center gap-0.5 px-1 py-0.5 bg-base-300 rounded ml-auto">
                    <span>⌘</span>K
                  </kbd>
                </>
              )}
            </button>
          </div>

          <div className={`tooltip tooltip-right tooltip-primary relative z-50`} data-tip="Notifications">
            <button
              onClick={onShowNotifications}
              className={`btn btn-ghost btn-sm ${isDesktop ? "w-full justify-start gap-3" : "btn-square w-full -translate-x-1.5"} relative`}
            >
              <Bell className="w-5 h-5 shrink-0" />
              {isDesktop && <span className="text-sm truncate">Notifications</span>}
              {unreadCount > 0 && (
                <span
                  className={`badge badge-primary badge-xs ${isDesktop ? "ml-auto" : "absolute -top-1 -right-1"}`}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="flex flex-col gap-2 px-2 overflow-visible">
          {onNewConversation && (
            <div className={`tooltip tooltip-right tooltip-primary z-50`} data-tip="New Chat">
              <button
                onClick={onNewConversation}
                className={`btn btn-primary btn-sm ${isDesktop ? "w-full justify-start gap-2" : "btn-square w-full translate-x-.5 -translate-y-10"}`}
              >
                <PenSquare className="w-4 h-4 shrink-0" />
                {isDesktop && <span className="text-sm truncate">New Chat</span>}
              </button>
            </div>
          )}

          <div className={`dropdown dropdown-top dropdown-start w-full overflow-visible`}>
            <button role="button" tabIndex={0} className="btn btn-ghost btn-sm w-full cursor-pointer justify-start gap-2 overflow-visible">
              <UserAvatar
                src={user?.avatarUrl}
                alt={user?.username || "User"}
                size="sm"
              />
              {isDesktop && (
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.username || "User"}</p>
                  <p className="text-xs text-base-content/40 truncate">{user?.email}</p>
                </div>
              )}
            </button>
            <ul
              tabIndex={-1}
              className="dropdown-content z-100 menu p-2 shadow-2xl bg-base-200 rounded-xl border border-base-300 w-56"
            >
              <li>
                <Link href="/profile" className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/settings" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </li>
              <li className="border-t border-base-300 mt-1 pt-1">
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="gap-2 text-error w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}