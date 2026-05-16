"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-lg font-semibold text-[#1a1a2e]">Une erreur est survenue</h1>
      <p className="text-sm text-zinc-600">
        Quelque chose s&apos;est mal passé. Tu peux réessayer.
      </p>
      {error.digest && (
        <p className="text-xs text-zinc-400">Réf. {error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-white"
      >
        Réessayer
      </button>
    </div>
  );
}
