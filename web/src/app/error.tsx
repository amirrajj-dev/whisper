"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
      <p className="text-sm text-base-content/60 max-w-sm mb-4">
        We&apos;ve been notified and are working on it.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="btn btn-primary btn-sm"
      >
        Try again
      </button>
    </div>
  );
}
