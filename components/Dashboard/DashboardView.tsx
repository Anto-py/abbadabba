"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardData } from "./types";
import { YearSelector } from "./YearSelector";
import { SummaryCards } from "./SummaryCards";
import { CategoryChart } from "./CategoryChart";
import { MonthlyChart } from "./MonthlyChart";
import { MarginalRateEditor } from "./MarginalRateEditor";

type Props = { initialYear: number };

export function DashboardView({ initialYear }: Props) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (y: number) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard?year=${y}`);
      if (!r.ok) throw new Error("Chargement échoué");
      setData(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(year);
  }, [year, load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <YearSelector
          year={year}
          availableYears={data?.availableYears ?? []}
          onChange={setYear}
        />
        {data && (
          <MarginalRateEditor
            rate={data.marginalTaxRate}
            onSaved={() => load(year)}
          />
        )}
      </div>

      {data && (
        <p className="text-right text-xs text-zinc-500">
          {data.transactionCount} transaction
          {data.transactionCount > 1 ? "s" : ""}
        </p>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data ? (
        <Skeleton />
      ) : data ? (
        <>
          <SummaryCards totals={data.totals} />
          <MonthlyChart byMonth={data.byMonth} />
          <CategoryChart categories={data.byCategory} />
        </>
      ) : null}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-24 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
      <div className="h-48 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
