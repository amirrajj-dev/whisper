"use client";

import { motion } from "framer-motion";
import type { Message } from "@/src/types/entities/message";
import type { PopulatedUser } from "@/src/types/entities/user";
import { useCurrentUser } from "@/src/hooks/use-auth";
import { UserAvatar } from "@/src/components/common/user-avatar";
import { format } from "date-fns";
import { FileText, Reply, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isGrouped?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  conversationType?: 'private' | 'group';
  conversationAdmins?: string[];
  conversationOwner?: string;
  searchQuery?: string;
}

function getSenderName(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return "Unknown";
  return sender.username;
}

function getSenderId(sender: string | PopulatedUser): string {
  if (typeof sender === "string") return sender;
  return sender._id;
}

function getSenderAvatar(sender: string | PopulatedUser): string | undefined {
  if (typeof sender === "string") return undefined;
  return sender.avatarUrl;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) {
    return <span className="text-sm">{text}</span>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span className="text-sm">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-warning/30 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

function MessageContent({ message, searchQuery }: { message: Message; searchQuery?: string }) {
  if (message.deleted) {
    return (
      <span className="italic text-base-content/40 text-xs">
        [Message deleted]
      </span>
    );
  }

  switch (message.type) {
    case "image":
      return (
        <div className="space-y-1">
          <img
            src={message.content}
            alt="Shared image"
            className="max-w-[280px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </div>
      );
    case "video":
      return (
        <video
          src={message.content}
          controls
          className="max-w-[280px] rounded-lg"
          preload="metadata"
        />
      );
    case "voice":
      return (
        <audio
          src={message.content}
          controls
          className="max-w-[220px] h-10"
          preload="none"
        />
      );
    case "file":
      return (
        <a
          href={message.content}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm bg-base-300/50 rounded-lg p-2 hover:bg-base-300 transition-colors"
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Download file</span>
        </a>
      );
    default:
      return <HighlightedText text={message.content} query={searchQuery} />;
  }
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
  const [showActions, setShowActions] = useState(false);
  const isOwn = getSenderId(message.senderId) === user?._id;

  const canDelete =
    isOwn ||
    (conversationType === 'group' &&
      (conversationOwner === user?._id ||
        conversationAdmins?.includes(user?._id || '')));

  const canEdit = isOwn && message.type === 'text';

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
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
        className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
      >
        {!isGrouped && !isOwn && (
          <span className="text-xs text-base-content/40 mb-0.5 ml-1">
            {getSenderName(message.senderId)}
          </span>
        )}

        {/* Reply Message Box (Telegram Style) */}
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
                <MessageContent message={message} searchQuery={searchQuery} />
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
          /* Normal Message Box */
          <>
            <div
              className={`relative px-3 py-2 ${
                isOwn
                  ? "bg-primary text-primary-content rounded-2xl rounded-tr-md"
                  : "bg-base-200 rounded-2xl rounded-tl-md"
              }`}
            >
              <MessageContent message={message} searchQuery={searchQuery} />
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
                    <span className="text-[10px]">
                      {message.deliveredTo && message.deliveredTo.length > 1 ? (
                        <svg className="w-3.5 h-3.5 text-primary-content/50" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 19.4l-5.7-5.7 1.4-1.4L9 16.6l10-10 1.4 1.4z"/>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-primary-content/40" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 19.4l-5.7-5.7 1.4-1.4L9 16.6l10-10 1.4 1.4z"/>
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

        {/* Action Buttons */}
        {showActions && !message.deleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex gap-0.5 mt-0.5 ${isOwn ? "flex-row-reverse" : ""}`}
          >
            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content/70"
                title="Reply"
              >
                <Reply className="w-3 h-3" />
              </button>
            )}
            {canEdit && onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-base-content/70"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(message._id)}
                className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
