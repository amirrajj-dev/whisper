'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import type { FileRejection } from 'react-dropzone';
import { toast } from 'sonner';
import { FILE_MAX_SIZE, ACCEPTED_FILE_TYPES } from '@/src/constants';
import {
  Send,
  Paperclip,
  Smile,
  X,
  Image,
  Loader2,
  Reply,
  Check,
  Film,
  FileText,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import { EmojiPicker } from '@/src/components/chat/emoji-picker';
import { useSendMessage, useEditMessage } from '@/src/hooks/use-chat';
import { useChatStore } from '@/src/stores/chat.store';
import { useAuthStore } from '@/src/stores/auth.store';
import { socketManager } from '@/src/socket/socket.manager';
import type { MessageType } from '@/src/types/entities/message';

interface MessageComposerProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export function MessageComposer({ conversationId, onMessageSent }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingThrottleRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMutation = useSendMessage();
  const editMutation = useEditMessage();
  const {
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    addTypingUser,
    removeTypingUser,
  } = useChatStore();

  const { user } = useAuthStore();

  const isEditing = !!editingMessage;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        setFile(recordedFile);
        setFilePreview(URL.createObjectURL(blob));
        setIsRecording(false);
        setRecordingTime(0);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = useCallback((f: File) => {
    if (f.size > FILE_MAX_SIZE) {
      toast.error(`File too large. Maximum size is ${FILE_MAX_SIZE / (1024 * 1024)}MB`);
      return;
    }
    if (!ACCEPTED_FILE_TYPES.includes(f.type)) {
      toast.error('File type not supported');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image/') || f.type.startsWith('video/') || f.type.startsWith('audio/')) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;
    handleFileSelect(f);
  }, [handleFileSelect]);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (rejection?.errors?.[0]) {
      const error = rejection.errors[0];
      if (error.code === 'file-too-large') {
        toast.error(`File too large. Maximum size is ${FILE_MAX_SIZE / (1024 * 1024)}MB`);
      } else if (error.code === 'file-invalid-type') {
        toast.error('File type not supported');
      } else {
        toast.error(error.message);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 1,
    maxSize: FILE_MAX_SIZE,
    accept: ACCEPTED_FILE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
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
    const now = Date.now();
    if (now - typingThrottleRef.current > 2000) {
      socketManager.startTyping(conversationId);
      typingThrottleRef.current = now;
    }
    if (user) {
      addTypingUser(conversationId, { userId: user._id, username: user.username });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketManager.stopTyping(conversationId);
      if (user) removeTypingUser(conversationId, user._id);
    }, 3000);
  }, [conversationId, user, addTypingUser, removeTypingUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketManager.stopTyping(conversationId);
      if (user) removeTypingUser(conversationId, user._id);
    };
  }, [conversationId, user, removeTypingUser]);

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
            if (user) removeTypingUser(conversationId, user._id);
            requestAnimationFrame(() => textareaRef.current?.focus());
            onMessageSent?.();
          },
        },
      );
      return;
    }

    let type: MessageType = 'text';
    if (file) {
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'voice';
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
          if (user) removeTypingUser(conversationId, user._id);
          requestAnimationFrame(() => textareaRef.current?.focus());
          onMessageSent?.();
        },
      },
    );
  }, [content, file, conversationId, replyingTo, sendMutation, editMutation, isEditing, editingMessage, setReplyingTo, setEditingMessage, user, removeTypingUser, onMessageSent]);

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
    if (filePreview) URL.revokeObjectURL(filePreview);
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
        {file && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 bg-base-200 border-t border-base-300"
          >
            <div className="relative inline-flex items-center gap-2 bg-base-300/50 rounded-lg p-2 pr-3">
              {file.type.startsWith('image/') && filePreview && (
                <img src={filePreview} alt="" className="h-14 rounded object-cover" />
              )}
              {file.type.startsWith('video/') && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[120px]">{file.name}</p>
                  </div>
                </div>
              )}
              {file.type.startsWith('audio/') && (
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  {filePreview && (
                    <audio src={filePreview} controls className="h-9 sm:h-12 w-52 sm:w-70 md:w-80" preload="none" />
                  )}
                </div>
              )}
              {!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/') && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[150px]">{file.name}</p>
                    <p className="text-[10px] text-base-content/40">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              )}
              <button
                onClick={removeFile}
                className="btn btn-ghost btn-xs btn-square shrink-0 ml-1"
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
                if (f) handleFileSelect(f);
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!!file}
            className={`btn btn-sm btn-square relative ${
              isRecording
                ? 'bg-error text-white hover:bg-error/90 animate-pulse'
                : 'btn-ghost text-base-content/40 hover:text-error'
            }`}
            title={isRecording ? 'Stop recording' : 'Record voice'}
          >
            {isRecording ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-xs font-mono tabular-nums">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {isRecording ? (
          <div className="flex-1 flex items-center gap-3 bg-error/5 rounded-xl px-4 py-3 sm:py-3.5 min-h-[44px] sm:min-h-[52px]">
            <div className="flex gap-1 items-end">
              <span className="w-1.5 h-4 sm:h-5 rounded-full bg-error animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-3 sm:h-4 rounded-full bg-error animate-[bounce_0.6s_infinite]" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-5 sm:h-6 rounded-full bg-error animate-[bounce_0.6s_infinite]" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm sm:text-base text-error font-medium">Recording... {formatTime(recordingTime)}</span>
            <div className="flex-1" />
            <button
              onClick={cancelRecording}
              className="btn btn-ghost btn-xs btn-square text-base-content/40 hover:text-error"
              title="Cancel recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
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
            className="flex-1 resize-none translate-y-1 bg-base-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 min-h-[40px]"
            disabled={sendMutation.isPending || editMutation.isPending}
          />
        )}

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
            className="absolute bottom-full left-0 mb-2 z-50"
          >
            <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
