export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4" aria-busy="true">
      <div className="h-7 w-32 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-200" />
      <div className="mt-6 space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
