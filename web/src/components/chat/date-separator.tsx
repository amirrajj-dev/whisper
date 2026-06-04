'use client';

import { format, isToday, isYesterday, isSameYear } from 'date-fns';

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = new Date(date);
  let label: string;

  if (isToday(d)) {
    label = 'Today';
  } else if (isYesterday(d)) {
    label = 'Yesterday';
  } else if (isSameYear(d, new Date())) {
    label = format(d, 'MMMM d');
  } else {
    label = format(d, 'MMMM d, yyyy');
  }

  return (
    <div className="flex items-center gap-3 my-4 px-4">
      <div className="flex-1 h-px bg-base-300" />
      <span className="text-xs font-medium text-base-content/40 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-base-300" />
    </div>
  );
}
