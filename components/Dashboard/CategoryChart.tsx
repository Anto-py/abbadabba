"use client";

import { DashboardData, formatEURPrecise } from "./types";

type Props = { categories: DashboardData["byCategory"] };

export function CategoryChart({ categories }: Props) {
  const top = categories.slice(0, 10);
  const max = top.reduce((m, c) => Math.max(m, c.deductible), 0);

  if (top.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1a1a2e]">
          Déductions par catégorie
        </h2>
        <p className="mt-2 text-sm text-zinc-500">Aucune dépense pour cette année.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[#1a1a2e]">
        Déductions par catégorie
      </h2>
      <p className="text-xs text-zinc-500">Top {top.length}</p>
      <ul className="mt-3 space-y-2">
        {top.map((c) => {
          const pct = max > 0 ? (c.deductible / max) * 100 : 0;
          return (
            <li key={c.code}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-zinc-700">{c.name}</span>
                <span className="font-medium text-[#1a1a2e]">
                  {formatEURPrecise(c.deductible)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-zinc-100">
                <div
                  className="h-2 rounded-full bg-[#1a1a2e]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
