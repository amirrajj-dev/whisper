"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "primary" | "error" | "warning";
  isLoading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: "btn-primary",
  error: "btn-error",
  warning: "btn-warning",
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm mx-4 bg-base-100 rounded-2xl shadow-2xl border border-base-300 p-6"
          >
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-sm text-base-content/60 mb-4">{message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
              <button
                onClick={onConfirm}
                className={`btn btn-sm ${variantClasses[confirmVariant] || "btn-primary"}`}
              >
                {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
