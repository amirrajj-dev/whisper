"use client";

import { motion } from "framer-motion";
import type { Message } from "@/src/types/entities/message";
import type { PopulatedUser } from "@/src/types/entities/user";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { format } from "date-fns";
import { Reply, Edit3, Trash2, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MessageContent } from "./message-content";
import { getSenderName, getSenderId, getSenderAvatar } from "./message-utils";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  conversationType?: "private" | "group";
  conversationAdmins?: string[];
  conversationOwner?: string;
  searchQuery?: string;
}

export function MessageBubble({
  message,
  showAvatar = true,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  conversationType,
  conversationAdmins,
  conversationOwner,
  searchQuery,
}: MessageBubbleProps) {
  const { user } = useCurrentUser();
  const isOwn = getSenderId(message.senderId) === user?._id;
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
  }, []);

  const handleOpenMenu = (
    e: React.MouseEvent | React.TouchEvent,
    clientX: number,
    clientY: number,
  ) => {
    e.preventDefault();
    setContextMenu({ x: clientX, y: clientY });
    setTimeout(() => {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let adjustedX = clientX;
        let adjustedY = clientY;

        if (adjustedX + rect.width > viewportWidth) {
          adjustedX = viewportWidth - rect.width - 10;
        }
        if (adjustedX < 0) {
          adjustedX = 10;
        }

        if (adjustedY + rect.height > viewportHeight) {
          adjustedY = viewportHeight - rect.height - 10;
        }
        if (adjustedY < 0) {
          adjustedY = 10;
        }

        const cursorRect = { x: clientX, y: clientY, width: 5, height: 20 };
        if (Math.abs(adjustedX - cursorRect.x) < 20) {
          adjustedX = isOwn ? adjustedX - rect.width - 10 : adjustedX + 20;
        }

        setContextMenu({ x: adjustedX, y: adjustedY });
      }
    }, 0);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Message copied");
    } catch {
      toast.error("Failed to copy message");
    }
    setContextMenu(null);
  };

  const canDelete =
    isOwn ||
    (conversationType === "group" &&
      (conversationOwner === user?._id ||
        conversationAdmins?.includes(user?._id || "")));

  const canEdit = isOwn && message.type === "text";

  const replyToData = message.replyTo as {
    _id: string;
    content: string;
    type: string;
    senderId: string | { _id: string; username: string };
  } | null;

  const getReplySenderName = () => {
    if (!replyToData) return "";
    if (typeof replyToData.senderId === "string") return "Unknown";
    return replyToData.senderId.username;
  };

  const getReplyContent = () => {
    if (!replyToData) return "";
    const content = replyToData.content;
    return content.length > 60 ? content.substring(0, 60) + "..." : content;
  };

  return (
    <motion.div
      id={`msg-${message._id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""} ${
        isGrouped ? "mt-0.5" : "mt-3"
      } group`}
    >
      {showAvatar ? (
        <UserAvatar
          src={getSenderAvatar(message.senderId)}
          alt={getSenderName(message.senderId)}
          size="sm"
          className="mt-1"
        />
      ) : (
        <div className="w-7 shrink-0" />
      )}

      <div
        ref={bubbleRef}
        className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
      >
        {!isGrouped && !isOwn && (
          <span className="text-xs text-base-content/40 mb-0.5 ml-1">
            {getSenderName(message.senderId)}
          </span>
        )}

        {replyToData && !message.deleted ? (
          <div
            className={`relative ${isOwn ? "items-end" : "items-start"} flex flex-col`}
          >
            <div
              className={`text-xs p-2 rounded-t-lg ${
                isOwn
                  ? "bg-primary rounded-br-none text-primary-content"
                  : "bg-base-200 rounded-bl-none text-base-content"
              }`}
              onContextMenu={(e)=>handleOpenMenu(e , e.clientX , e.clientY)}
              onClick={(e) =>
                isMobile && handleOpenMenu(e, e.clientX, e.clientY)
              }
            >
              <div
                className={`p-1.5 rounded mb-1.5 ${
                  isOwn ? "bg-primary-content/20" : "bg-base-300/50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-0.5 h-3 rounded-full bg-primary/60" />
                  <span className="text-[11px] text-primary font-medium opacity-80">
                    {getReplySenderName()}
                  </span>
                </div>
                <p className="text-[11px] opacity-70 line-clamp-2 pl-2">
                  {getReplyContent()}
                </p>
              </div>

              <div>
                <MessageContent
                  message={message}
                  searchQuery={searchQuery}
                  isOwn={isOwn}
                />
              </div>
            </div>

            <div
              className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`text-[10px] ${isOwn ? "text-primary-content/40" : "text-base-content/40"}`}
              >
                {format(new Date(message.createdAt), "HH:mm")}
              </span>
              {message.edited && (
                <span
                  className={`text-[10px] ${isOwn ? "text-primary-content/30" : "text-base-content/30"}`}
                >
                  edited
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              className={`relative px-3 py-2 ${
                isOwn
                  ? "bg-primary text-primary-content rounded-2xl rounded-tr-md"
                  : "bg-base-200 rounded-2xl rounded-tl-md"
              }`}
              onContextMenu={(e)=>handleOpenMenu(e , e.clientX , e.clientY)}
              onClick={(e) =>
                isMobile && handleOpenMenu(e, e.clientX, e.clientY)
              }
            >
              <MessageContent
                message={message}
                searchQuery={searchQuery}
                isOwn={isOwn}
              />
              <div
                className={`flex items-center gap-1 mt-0.5 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`text-[10px] ${isOwn ? "text-primary-content/60" : "text-base-content/40"}`}
                >
                  {format(new Date(message.createdAt), "HH:mm")}
                </span>
                {isOwn && !message.deleted && (
                  <span className="inline-flex items-center text-[10px]">
                    {message.readBy && message.readBy.length > 0 ? (
                      <span className="relative w-4 h-3.5 text-info">
                        <svg
                          className="absolute left-0 top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        <svg
                          className="absolute left-[5px] top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </span>
                    ) : message.deliveredTo && message.deliveredTo.length > 1 ? (
                      <span className="relative w-4 h-3.5 text-primary-content/70">
                        <svg
                          className="absolute left-0 top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                        <svg
                          className="absolute left-[5px] top-0 w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </span>
                    ) : (
                      <svg className="w-3 h-3 text-primary-content/40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </span>
                )}
                {message.edited && !message.deleted && (
                  <span
                    className={`text-[10px] ${isOwn ? "text-primary-content/50" : "text-base-content/30"}`}
                  >
                    edited
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {contextMenu && !message.deleted && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenu(null)}
            />
            <div
              ref={menuRef}
              className="fixed z-50 bg-base-100 rounded-xl border border-base-300 shadow-2xl py-1 min-w-[160px]"
              style={{
                top: contextMenu.y,
                left: contextMenu.x,
                maxWidth: "calc(100vw - 20px)",
              }}
            >
              {onReply && (
                <button
                  onClick={() => {
                    onReply(message);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
                >
                  <Reply className="w-4 h-4 text-base-content/60" />
                  Reply
                </button>
              )}
              {canEdit && onEdit && (
                <button
                  onClick={() => {
                    onEdit(message);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
                >
                  <Edit3 className="w-4 h-4 text-base-content/60" />
                  Edit
                </button>
              )}
              <button
                onClick={handleCopy}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left"
              >
                <Copy className="w-4 h-4 text-base-content/60" />
                Copy
              </button>
              {canDelete && onDelete && (
                <>
                  <div className="h-px bg-base-300 my-1" />
                  <button
                    onClick={() => {
                      onDelete(message._id);
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-base-200 transition-colors text-left text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
