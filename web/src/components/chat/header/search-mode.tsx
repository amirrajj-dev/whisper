"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Search, ChevronUp, ChevronDown, X } from "lucide-react";

interface SearchModeProps {
  searchQuery: string;
  searchActiveMatchIndex: number;
  searchMatchIds: string[];
  onSearchQueryChange: (query: string) => void;
  onSearchNav: (direction: "up" | "down") => void;
  onSearchInputKeyDown: (e: React.KeyboardEvent) => void;
  onCloseSearch: () => void;
  onClearSearch: () => void;
}

export function SearchMode({
  searchQuery,
  searchActiveMatchIndex,
  searchMatchIds,
  onSearchQueryChange,
  onSearchNav,
  onSearchInputKeyDown,
  onCloseSearch,
  onClearSearch,
}: SearchModeProps) {
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-base-300 flex items-center gap-2 px-3 lg:px-4 bg-base-100/80 backdrop-blur-sm shrink-0"
    >
      <button
        onClick={onCloseSearch}
        className="btn btn-ghost btn-sm btn-square shrink-0"
        aria-label="Close search"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <Search className="w-4 h-4 text-base-content/40 shrink-0" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={onSearchInputKeyDown}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-base-content/30"
          autoFocus
        />
      </div>
      {searchMatchIds.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-base-content/40 shrink-0">
          <span>
            {searchMatchIds.length > 0
              ? `${searchActiveMatchIndex + 1} of ${searchMatchIds.length}`
              : "0 results"}
          </span>
          <button
            onClick={() => onSearchNav("up")}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Previous match"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSearchNav("down")}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Next match"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <button
        onClick={onClearSearch}
        className="btn btn-ghost btn-xs btn-square shrink-0"
        aria-label="Clear search"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
