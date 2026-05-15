"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProofCapture } from "./ProofCapture";

type Category = {
  id: string;
  code: string;
  name: string;
  deductionRate: number;
  proofRequired: boolean;
};

type TxType = "EXPENSE" | "INCOME";

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function TransactionForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<TxType>("EXPENSE");
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories);
  }, []);

  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const amountNum = Number(amount.replace(",", "."));
  const deductible =
    type === "EXPENSE" && category && amountNum > 0
      ? Math.round(((amountNum * category.deductionRate) / 100) * 100) / 100
      : 0;

  const proofRequired = type === "EXPENSE" && (category?.proofRequired ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) return setError("Date requise");
    if (!amountNum || amountNum <= 0) return setError("Montant invalide");
    if (!categoryId) return setError("Catégorie requise");
    if (!description.trim()) return setError("Nom requis");
    if (proofRequired && !proof) return setError("Preuve requise");

    setSubmitting(true);
    try {
      let proofPayload: {
        proofUrl?: string;
        proofFileName?: string;
        proofDriveId?: string;
      } = {};

      if (proof) {
        setProgress("Upload de la preuve…");
        const fd = new FormData();
        fd.append("file", proof);
        fd.append("type", type);
        fd.append("categoryId", categoryId);
        fd.append("date", date);
        fd.append("description", description);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const j = await up.json().catch(() => ({}));
          throw new Error(j.error ?? "Upload échoué");
        }
        const upJson = await up.json();
        proofPayload = {
          proofUrl: upJson.webViewLink,
          proofFileName: upJson.fileName,
          proofDriveId: upJson.driveId,
        };
      }

      setProgress("Enregistrement…");
      const r = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          amount: amountNum,
          categoryId,
          description,
          ...proofPayload,
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
      setProgress(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("EXPENSE")}
          className={`rounded-xl py-3 text-sm font-medium ${
            type === "EXPENSE"
              ? "bg-red-600 text-white"
              : "bg-white text-zinc-600 shadow-sm"
          }`}
        >
          − Dépense
        </button>
        <button
          type="button"
          onClick={() => setType("INCOME")}
          className={`rounded-xl py-3 text-sm font-medium ${
            type === "INCOME"
              ? "bg-emerald-600 text-white"
              : "bg-white text-zinc-600 shadow-sm"
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
          placeholder="0,00"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-lg"
        />
      </label>

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
              {c.name} {type === "EXPENSE" ? `(${c.deductionRate}%)` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs text-zinc-500">Nom</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === "INCOME" ? "Ex. Cours particuliers Pierre" : "Ex. Claude Pro mai"}
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      {type === "EXPENSE" && category && amountNum > 0 && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Déductible : <strong>{deductible.toFixed(2)} €</strong>{" "}
          <span className="text-xs text-emerald-700">
            ({category.deductionRate}%)
          </span>
        </div>
      )}

      <div>
        <span className="text-xs text-zinc-500">Preuve</span>
        <div className="mt-1">
          <ProofCapture value={proof} onChange={setProof} required={proofRequired} />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#1a1a2e] py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? (progress ?? "Enregistrement…") : "Enregistrer"}
      </button>
    </form>
  );
}
