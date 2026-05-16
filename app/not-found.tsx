import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">🧭</div>
      <h1 className="text-lg font-semibold text-[#1a1a2e]">Page introuvable</h1>
      <p className="text-sm text-zinc-600">Cette page n&apos;existe pas ou plus.</p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-white"
      >
        Retour au bilan
      </Link>
    </div>
  );
}
