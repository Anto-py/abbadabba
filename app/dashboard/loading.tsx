export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-5 pt-8" aria-busy="true">
      <div className="mb-5 space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
        <div className="h-48 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
