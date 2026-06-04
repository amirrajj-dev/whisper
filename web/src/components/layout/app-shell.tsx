"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { ConversationList } from "./conversation-list";
import { ChatArea } from "./chat-area";
import { NotificationsView } from "@/src/components/notifications/notifications-view";
import { CommandPalette } from "@/src/components/search/command-palette";
import { NewConversationModal } from "@/src/components/chat/new-conversation-modal";
import { useChatStore } from "@/src/stores/chat.store";
import { useSocket } from "@/src/hooks/use-socket";
import { useMediaQuery } from "@/src/hooks/use-media-query";

type View = "conversations" | "notifications";

const slideVariants = {
  enter: (isMobile: boolean) => ({
    x: isMobile ? "30%" : 0,
    opacity: isMobile ? 0 : 1,
  }),
  center: { x: 0, opacity: 1 },
  exit: (isMobile: boolean) => ({
    x: isMobile ? "-30%" : 0,
    opacity: isMobile ? 0 : 1,
  }),
};

export function AppShell() {
  const { activeConversationId, setActiveConversation } = useChatStore();
  const [view, setView] = useState<View>("conversations");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1023px)");

  useSocket();

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
    },
    [setActiveConversation],
  );

  const handleBack = useCallback(() => {
    if (activeConversationId) {
      setActiveConversation(null);
    } else {
      setView("conversations");
    }
  }, [activeConversationId, setActiveConversation]);

  const handleShowConversations = useCallback(() => {
    setActiveConversation(null);
    setView("conversations");
  }, [setActiveConversation]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const showSidebar = true;

  const mainContent = () => {
    if (view === "notifications") {
      return (
        <motion.div
          key="notifications"
          custom={isMobile}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`flex flex-col bg-base-100 ${isMobile ? "w-full" : "w-80 border-r border-base-300"}`}
        >
          <NotificationsView
            onBack={isMobile ? () => setView("conversations") : undefined}
          />
        </motion.div>
      );
    }

    if (!activeConversationId) {
      return (
        <motion.div
          key="conversation-list"
          custom={isMobile}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`flex flex-col border-r border-base-300 bg-base-100 ${
            isMobile ? "w-full" : "w-80"
          }`}
        >
          <ConversationList onSelectConversation={handleSelectConversation} />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="chat-area"
        custom={isMobile}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0"
      >
        <ChatArea conversationId={activeConversationId} onBack={handleBack} />
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      {showSidebar && (
        <Sidebar
          onNewConversation={() => setShowNewConversation(true)}
          onShowNotifications={() => setView("notifications")}
          onSearch={() => setShowCommandPalette(true)}
          onShowConversations={handleShowConversations}
        />
      )}

      <AnimatePresence mode="wait" custom={isMobile}>
        {mainContent()}
      </AnimatePresence>

      {!activeConversationId && view === "conversations" && !isMobile && (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-base-100/50">
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-base-200 flex items-center justify-center mx-auto mb-4">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  className="w-10 h-10 text-base-content/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </motion.div>
            </div>
            <h2 className="text-xl font-semibold mb-1">
              Select a conversation
            </h2>
            <p className="text-sm text-base-content/40">
              Choose from your existing conversations or start a new one
            </p>
          </div>
        </div>
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectConversation={handleSelectConversation}
      />

      <NewConversationModal
        isOpen={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onConversationCreated={(id) => {
          setShowNewConversation(false);
          handleSelectConversation(id);
        }}
      />
    </div>
  );
}
