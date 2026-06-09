"use client";

export function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) {
    return <span className="text-sm">{text}</span>;
  }

  const parts = text.split(
    new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <span className="text-sm">
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-warning/30 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}
