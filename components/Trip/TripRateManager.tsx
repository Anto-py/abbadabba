"use client";

import { useEffect, useState } from "react";

type TripRate = {
  id: string;
  ratePerKm: number;
  validFrom: string;
  createdAt: string;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmtRate(r: number) {
  return r.toLocaleString("fr-BE", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TripRateManager() {
  const [rates, setRates] = useState<TripRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [rate, setRate] = useState("");
  const [validFrom, setValidFrom] = useState(todayInputValue());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/trip-rates");
      if (!r.ok) throw new Error();
      const j = await r.json();
      setRates(j.items);
    } catch {
      setError("Impossible de charger les taux");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const active = rates.find((r) => new Date(r.validFrom) <= now);

  async function submit() {
    const num = Number(rate.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      setFormError("Taux invalide");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const r = await fetch("/api/trip-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratePerKm: num,
          validFrom: new Date(validFrom + "T00:00:00").toISOString(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? "Échec");
      }
      setRate("");
      setValidFrom(todayInputValue());
      setAdding(false);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Chargement…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Taux actif</p>
        {active ? (
          <p className="mt-1 text-2xl font-semibold text-[#1a1a2e]">
            {fmtRate(active.ratePerKm)} €/km
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">Aucun taux défini.</p>
        )}
        {active && (
          <p className="mt-1 text-xs text-zinc-500">
            En vigueur depuis le {fmtDate(active.validFrom)}
          </p>
        )}
      </div>

      {adding ? (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Nouveau taux (€/km)</label>
            <input
              type="text"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0,4259"
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">
              Date d&apos;entrée en vigueur
            </label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="flex-1 rounded-xl bg-[#1a1a2e] py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setAdding(false);
                setFormError(null);
              }}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border border-zinc-300 bg-white py-2 text-sm font-medium text-[#1a1a2e]"
        >
          + Modifier le taux
        </button>
      )}

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Historique</p>
        <ul className="mt-2 divide-y divide-zinc-100">
          {rates.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-zinc-600">{fmtDate(r.validFrom)}</span>
              <span className="font-medium text-[#1a1a2e]">{fmtRate(r.ratePerKm)} €/km</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
