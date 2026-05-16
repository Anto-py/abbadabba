"use client";

import { DashboardData, formatEUR, formatEURPrecise } from "./types";

type Props = { totals: DashboardData["totals"] };

export function SummaryCards({ totals }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card label="Recettes" value={formatEUR(totals.income)} accent="text-emerald-700" />
        <Card label="Dépenses" value={formatEUR(totals.expense)} accent="text-red-600" />
        <Card
          label="Déductible"
          value={formatEUR(totals.deductible)}
          accent="text-[#1a1a2e]"
        />
        <Card
          label="Imposable"
          value={formatEUR(totals.income - totals.deductible)}
          accent="text-zinc-700"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Impôts après déductions
        </p>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">
          {formatEURPrecise(totals.taxAfterDeduction)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          (recettes − déductible) × taux marginal
        </p>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
