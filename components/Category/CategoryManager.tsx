"use client";

import { useEffect, useState, useTransition } from "react";

type Category = {
  id: string;
  code: string;
  name: string;
  deductionRate: number;
  proofRequired: boolean;
  isDefault: boolean;
};

export function CategoryManager() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draftCode, setDraftCode] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftRate, setDraftRate] = useState(100);
  const [draftProof, setDraftProof] = useState(true);
  const [, startTransition] = useTransition();

  async function load() {
    setLoading(true);
    const r = await fetch("/api/categories");
    if (r.ok) setItems(await r.json());
    else setError("Erreur chargement");
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function patchItem(id: string, patch: Partial<Category>) {
    const prev = items;
    setItems((arr) => arr.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const r = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) {
      setItems(prev);
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? "Erreur mise à jour");
    }
  }

  async function removeItem(id: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const r = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (r.ok) setItems((arr) => arr.filter((c) => c.id !== id));
    else {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? "Suppression impossible");
    }
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const r = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: draftCode,
        name: draftName,
        deductionRate: draftRate,
        proofRequired: draftProof,
      }),
    });
    if (r.ok) {
      const c = await r.json();
      setItems((arr) => [...arr, c].sort((a, b) => a.code.localeCompare(b.code)));
      setDraftCode("");
      setDraftName("");
      setDraftRate(100);
      setDraftProof(true);
      setShowForm(false);
    } else {
      const j = await r.json().catch(() => ({}));
      setError(j.error ?? "Création impossible");
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Chargement…</p>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="rounded-xl bg-white px-3 py-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#1a1a2e]">
                  {c.name}
                </p>
                <p className="text-xs text-zinc-500">{c.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={c.deductionRate}
                  onChange={(e) =>
                    startTransition(() =>
                      patchItem(c.id, { deductionRate: Number(e.target.value) }),
                    )
                  }
                  className="w-16 rounded-md border border-zinc-200 px-2 py-1 text-right text-sm"
                />
                <span className="text-sm text-zinc-500">%</span>
                <button
                  onClick={() => removeItem(c.id)}
                  className="ml-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  aria-label="Supprimer"
                >
                  ✕
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {showForm ? (
        <form
          onSubmit={submitNew}
          className="space-y-3 rounded-xl bg-white p-3 shadow-sm"
        >
          <input
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            placeholder="CODE_CATEGORIE"
            required
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Nom"
            required
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={draftRate}
              onChange={(e) => setDraftRate(Number(e.target.value))}
              className="w-20 rounded-md border border-zinc-200 px-2 py-2 text-sm"
            />
            <span className="text-sm text-zinc-500">% déductible</span>
            <label className="ml-auto flex items-center gap-1 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={draftProof}
                onChange={(e) => setDraftProof(e.target.checked)}
              />
              preuve
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-[#1a1a2e] py-2 text-sm font-medium text-white"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-md px-3 py-2 text-sm text-zinc-600"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm text-zinc-600 hover:border-[#1a1a2e] hover:text-[#1a1a2e]"
        >
          + Ajouter une catégorie
        </button>
      )}
    </div>
  );
}
