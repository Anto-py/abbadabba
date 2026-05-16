export default function Loading() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4" aria-busy="true">
      <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-200" />
      <ul className="mt-5 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-16 animate-pulse rounded-xl bg-white shadow-sm" />
        ))}
      </ul>
    </div>
  );
}
