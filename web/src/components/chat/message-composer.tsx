'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image,
  Loader2,
  Reply,
  Check,
} from 'lucide-react';
import { EmojiPicker } from '@/src/components/chat/emoji-picker';
import { useSendMessage, useEditMessage } from '@/src/hooks/use-chat';
import { useChatStore } from '@/src/stores/chat.store';
import { socketManager } from '@/src/socket/socket.manager';
import type { MessageType } from '@/src/types/entities/message';

interface MessageComposerProps {
  conversationId: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMutation = useSendMessage();
  const editMutation = useEditMessage();
  const {
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
  } = useChatStore();

  const isEditing = !!editingMessage;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const editingMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingMessage && editingMessage.messageId !== editingMessageIdRef.current) {
      editingMessageIdRef.current = editingMessage.messageId;
      setContent(editingMessage.content);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        const len = editingMessage.content.length;
        textareaRef.current?.setSelectionRange(len, len);
      });
    }
    if (!editingMessage) {
      editingMessageIdRef.current = null;
    }
  }, [editingMessage]);

  useEffect(() => {
    if (replyingTo) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [replyingTo]);

  const handleTyping = useCallback(() => {
    if (!socketManager.isConnected()) return;
    socketManager.startTyping(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.stopTyping(conversationId);
    }, 2000);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketManager.stopTyping(conversationId);
    };
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    if (!content.trim() && !file) return;

    if (isEditing) {
      editMutation.mutate(
        {
          messageId: editingMessage.messageId,
          conversationId,
          data: { content: content.trim() },
        },
        {
          onSuccess: () => {
            setContent('');
            setEditingMessage(null);
            socketManager.stopTyping(conversationId);
          },
        },
      );
      return;
    }

    let type: MessageType = 'text';
    if (file) {
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else type = 'file';
    }

    sendMutation.mutate(
      {
        data: {
          conversationId,
          type,
          content: content.trim(),
          replyTo: replyingTo?.messageId,
        },
        file: file || undefined,
      },
      {
        onSuccess: () => {
          setContent('');
          setFile(null);
          setFilePreview(null);
          setReplyingTo(null);
          socketManager.stopTyping(conversationId);
        },
      },
    );
  }, [content, file, conversationId, replyingTo, sendMutation, editMutation, isEditing, editingMessage, setReplyingTo, setEditingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
      setEditingMessage(null);
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setContent('');
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  return (
    <div {...getRootProps()} className="relative">
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <Image className="w-8 h-8 mx-auto mb-1 text-primary" />
            <p className="text-sm font-medium text-primary">Drop file to attach</p>
          </div>
        </div>
      )}
      <input {...getInputProps()} />

      <AnimatePresence>
        {replyingTo && !isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 bg-base-200 border-t border-base-300"
          >
            <Reply className="w-3 h-3 text-primary shrink-0" />
            <span className="text-xs text-base-content/60 truncate flex-1">
              Replying to <span className="font-medium text-base-content/80">{replyingTo.senderName}</span>: {replyingTo.content}
            </span>
            <button onClick={() => setReplyingTo(null)} className="btn btn-ghost btn-xs btn-square">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-4 py-1.5 bg-base-200 border-t border-base-300"
          >
            <Check className="w-3 h-3 text-success shrink-0" />
            <span className="text-xs text-base-content/60 flex-1">
              Editing message
            </span>
            <button onClick={cancelEdit} className="btn btn-ghost btn-xs btn-square">
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filePreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-base-200 border-t border-base-300"
          >
            <div className="relative inline-block">
              <img
                src={filePreview}
                alt="Attached preview"
                className="h-16 rounded-lg object-cover"
              />
              <button
                onClick={removeFile}
                className="absolute -top-1.5 -right-1.5 btn btn-circle btn-xs btn-error text-error-content"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 p-3 border-t border-base-300 bg-base-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70"
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>
          <label className="btn btn-ghost btn-sm btn-square text-base-content/40 hover:text-base-content/70 cursor-pointer" title="Attach file">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setFile(f);
                  if (f.type.startsWith('image/')) {
                    setFilePreview(URL.createObjectURL(f));
                  }
                }
              }}
            />
          </label>
        </div>

        <TextareaAutosize
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={isDragActive ? '' : isEditing ? 'Edit your message...' : 'Type a message...'}
          maxRows={5}
          className="flex-1 resize-none bg-base-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px]"
          disabled={sendMutation.isPending || editMutation.isPending}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={(!content.trim() && !file) || sendMutation.isPending || editMutation.isPending}
          className="btn btn-primary btn-sm btn-square"
        >
          {(sendMutation.isPending || editMutation.isPending) ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full right-4 mb-2 z-50"
          >
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
