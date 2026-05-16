"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { onRefresh } from "@/lib/refresh-bus";
import { onCategoriesChanged } from "@/lib/categories-bus";

type TxType = "EXPENSE" | "INCOME";

type TransactionItem = {
  id: string;
  type: TxType;
  date: string;
  amount: number;
  description: string | null;
  deductibleAmount: number | null;
  proofUrl: string | null;
  proofFileName: string | null;
  category: { id: string; code: string; name: string } | null;
};

type ListResponse = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
};

type CategoryOpt = { id: string; name: string; code: string };

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmtAmount(n: number) {
  return n.toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" });
}

export function TransactionList() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [type, setType] = useState<"" | TxType>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(() => {
    fetch("/api/categories", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((cats: CategoryOpt[]) => setCategories(cats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCategories();
    return onCategoriesChanged(loadCategories);
  }, [loadCategories]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("year", String(year));
    params.set("page", String(page));
    if (type) params.set("type", type);
    if (categoryId) params.set("categoryId", categoryId);
    if (month) params.set("month", month);
    try {
      const r = await fetch(`/api/transactions?${params.toString()}`);
      if (!r.ok) throw new Error("Erreur chargement");
      const j = (await r.json()) as ListResponse;
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [year, page, type, categoryId, month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(
    () =>
      onRefresh(() => {
        load();
        loadCategories();
      }),
    [load, loadCategories],
  );

  useEffect(() => {
    setPage(1);
  }, [year, type, categoryId, month]);

  const years = useMemo(() => {
    const set = new Set<number>([currentYear, year]);
    return Array.from(set).sort((a, b) => b - a);
  }, [year, currentYear]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette transaction (et sa preuve sur Drive) ?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Suppression impossible");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Année</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm font-medium text-[#1a1a2e]"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="ml-auto rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
          >
            <option value="">Tous les mois</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "" | TxType)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
          >
            <option value="">Tous les types</option>
            <option value="EXPENSE">Dépenses</option>
            <option value="INCOME">Recettes</option>
          </select>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <ul className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </ul>
      ) : !data || data.items.length === 0 ? (
        <p className="rounded-xl bg-white px-3 py-6 text-center text-sm text-zinc-500 shadow-sm">
          Aucune transaction.
        </p>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {data.total} résultat{data.total > 1 ? "s" : ""}
          </p>
          <ul className="space-y-2">
            {data.items.map((tx) => (
              <li key={tx.id} className="rounded-xl bg-white px-3 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-base font-semibold ${
                          tx.type === "INCOME" ? "text-emerald-700" : "text-red-700"
                        }`}
                      >
                        {tx.type === "INCOME" ? "+" : "−"} {fmtAmount(tx.amount)} €
                      </span>
                      <span className="text-xs text-zinc-400">{fmtDate(tx.date)}</span>
                    </div>
                    <p className="truncate text-sm text-[#1a1a2e]">
                      {tx.description ?? <em className="text-zinc-400">sans nom</em>}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {tx.category ? tx.category.name : tx.type === "INCOME" ? "Recette" : "—"}
                      {tx.deductibleAmount != null && (
                        <span className="ml-2 text-emerald-700">
                          ({fmtAmount(tx.deductibleAmount)} € déd.)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {tx.proofUrl && (
                      <a
                        href={tx.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md px-2 py-1 text-xs text-[#1a1a2e] hover:bg-zinc-100"
                        title={tx.proofFileName ?? "Preuve"}
                      >
                        Preuve ↗
                      </a>
                    )}
                    <Link
                      href={`/transactions/${tx.id}/edit`}
                      className="rounded-md px-2 py-1 text-xs text-[#1a1a2e] hover:bg-zinc-100"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === tx.id ? "…" : "Supprimer"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-40"
              >
                ← Précédent
              </button>
              <span className="text-xs text-zinc-500">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
