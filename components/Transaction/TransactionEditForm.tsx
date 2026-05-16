"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onCategoriesChanged } from "@/lib/categories-bus";

type Category = {
  id: string;
  code: string;
  name: string;
  deductionRate: number;
};

type TxType = "EXPENSE" | "INCOME";

type Transaction = {
  id: string;
  type: TxType;
  date: string;
  amount: number;
  description: string | null;
  categoryId: string | null;
  proofUrl: string | null;
  proofFileName: string | null;
};

export function TransactionEditForm({ id }: { id: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TxType>("EXPENSE");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [txRes, catRes] = await Promise.all([
          fetch(`/api/transactions/${id}`),
          fetch("/api/categories", { cache: "no-store" }),
        ]);
        if (!txRes.ok) throw new Error("Transaction introuvable");
        const txJson = (await txRes.json()) as Transaction;
        const cats: Category[] = catRes.ok ? await catRes.json() : [];
        if (cancelled) return;
        setTx(txJson);
        setCategories(cats);
        setType(txJson.type);
        setDate(new Date(txJson.date).toISOString().slice(0, 10));
        setAmount(String(txJson.amount));
        setCategoryId(txJson.categoryId ?? "");
        setDescription(txJson.description ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const off = onCategoriesChanged(() => {
      fetch("/api/categories", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : []))
        .then((cats: Category[]) => {
          if (cancelled) return;
          setCategories(cats);
          setCategoryId((current) =>
            current && cats.some((c) => c.id === current) ? current : "",
          );
        });
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [id]);

  const amountNum = Number(amount.replace(",", "."));
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );
  const deductible =
    type === "EXPENSE" && category && amountNum > 0
      ? Math.round(((amountNum * category.deductionRate) / 100) * 100) / 100
      : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) return setError("Date requise");
    if (!amountNum || amountNum <= 0) return setError("Montant invalide");
    if (type === "EXPENSE" && !categoryId) return setError("Catégorie requise");
    if (!description.trim()) return setError("Nom requis");

    setSubmitting(true);
    try {
      const r = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          amount: amountNum,
          categoryId: type === "EXPENSE" ? categoryId : null,
          description,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Enregistrement échoué");
      }
      router.push("/transactions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Chargement…</p>;
  if (!tx) return <p className="text-sm text-red-700">{error ?? "Introuvable"}</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`rounded-xl py-3 text-sm font-medium ${
            type === "EXPENSE" ? "bg-red-600 text-white" : "bg-white text-zinc-600 shadow-sm"
          }`}
        >
          − Dépense
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`rounded-xl py-3 text-sm font-medium ${
            type === "INCOME" ? "bg-emerald-600 text-white" : "bg-white text-zinc-600 shadow-sm"
          }`}
        >
          + Recette
        </button>
      </div>

      <label className="block">
        <span className="text-xs text-zinc-500">Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs text-zinc-500">Montant (€ TTC)</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-lg"
        />
      </label>

      {type === "EXPENSE" && (
        <label className="block">
          <span className="text-xs text-zinc-500">Catégorie</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.deductionRate}%)
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="text-xs text-zinc-500">Nom</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      {type === "EXPENSE" && category && amountNum > 0 && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Déductible : <strong>{deductible.toFixed(2)} €</strong>{" "}
          <span className="text-xs text-emerald-700">({category.deductionRate}%)</span>
        </div>
      )}

      {tx.proofUrl && (
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          Preuve actuelle :{" "}
          <a
            href={tx.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#1a1a2e] underline"
          >
            {tx.proofFileName ?? "ouvrir"} ↗
          </a>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-[#1a1a2e] py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/transactions")}
          className="rounded-xl px-4 py-3 text-sm text-zinc-600"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
