"use client";

import { DashboardData, formatEUR, formatEURPrecise } from "./types";

type Props = { totals: DashboardData["totals"] };

export function SummaryCards({ totals }: Props) {
  const balancePositive = totals.balance >= 0;
  const advPositive = totals.advantageVsForfait >= 0;

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
          label="Bilan"
          value={formatEUR(totals.balance)}
          accent={balancePositive ? "text-emerald-700" : "text-red-600"}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Économie IPP estimée
        </p>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">
          {formatEURPrecise(totals.ippSavings)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Déductible × 45 % (taux marginal estimé)
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Frais réels vs forfait légal
        </p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            advPositive ? "text-emerald-700" : "text-zinc-500"
          }`}
        >
          {advPositive ? "+" : ""}
          {formatEURPrecise(totals.advantageVsForfait)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Forfait : {formatEURPrecise(totals.forfait)} (30 % des recettes,
          plafond 6 070 €)
          {advPositive
            ? " — frais réels avantageux"
            : " — forfait plus avantageux"}
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
