"use client";

import { useState } from "react";
import type { Message } from "@/src/types/entities/message";
import { ImageLightbox } from "@/src/components/chat/image-lightbox";
import { HighlightedText } from "./highlighted-text";
import { VideoMessagePlayer } from "./video-message-player";
import { VoiceMessagePlayer } from "./voice-message-player";
import { FileMessageCard } from "./file-message-card";

interface MessageContentProps {
  message: Message;
  searchQuery?: string;
  isOwn: boolean;
}

export function MessageContent({ message, searchQuery, isOwn }: MessageContentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (message.deleted) {
    return (
      <span className="italic text-primary-content text-xs">
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
            onClick={() => setLightboxOpen(true)}
          />
          <ImageLightbox
            src={message.content}
            alt="Shared image"
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </div>
      );
    case "video":
      return <VideoMessagePlayer src={message.content} isOwn={isOwn} />;
    case "voice":
      return (
        <div className="max-w-[300px] sm:max-w-[340px] -mx-1.5">
          <VoiceMessagePlayer src={message.content} isOwn={isOwn} />
        </div>
      );
    case "file":
      return <FileMessageCard src={message.content} isOwn={isOwn} />;
    default:
      return <HighlightedText text={message.content} query={searchQuery} />;
  }
}
