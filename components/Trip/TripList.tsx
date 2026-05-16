"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast/ToastProvider";
import { onRefresh } from "@/lib/refresh-bus";

type Trip = {
  id: string;
  date: string;
  departure: string;
  destination: string;
  km: number;
  roundTrip: boolean;
  purpose: string;
  ratePerKm: number;
  indemnity: number;
  fiscalYear: number;
  transactionId: string | null;
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("fr-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type EditDraft = {
  date: string;
  departure: string;
  destination: string;
  km: string;
  roundTrip: boolean;
  purpose: string;
};

function toDraft(t: Trip): EditDraft {
  const single = t.roundTrip ? t.km / 2 : t.km;
  return {
    date: t.date.slice(0, 10),
    departure: t.departure,
    destination: t.destination,
    km: String(Math.round(single * 100) / 100),
    roundTrip: t.roundTrip,
    purpose: t.purpose,
  };
}

export function TripList() {
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [years, setYears] = useState<number[]>([currentYear]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load(y: number) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/trips?year=${y}`);
      if (!r.ok) throw new Error();
      const j = await r.json();
      setTrips(j.items);
      const ys = new Set<number>([
        currentYear,
        ...j.items.map((t: Trip) => t.fiscalYear),
      ]);
      setYears(Array.from(ys).sort((a, b) => b - a));
    } catch {
      setError("Impossible de charger les trajets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(year);
  }, [year]);

  useEffect(() => onRefresh(() => load(year)), [year]);

  const totals = useMemo(() => {
    const km = trips.reduce((s, t) => s + t.km, 0);
    const indemnity = trips.reduce((s, t) => s + t.indemnity, 0);
    return { km, indemnity };
  }, [trips]);

  function startEdit(t: Trip) {
    setEditingId(t.id);
    setDraft(toDraft(t));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const kmNum = Number(draft.km.replace(",", "."));
    if (!draft.date) return toast.error("Date requise");
    if (!draft.destination.trim()) return toast.error("Destination requise");
    if (!draft.purpose.trim()) return toast.error("Motif requis");
    if (!Number.isFinite(kmNum) || kmNum <= 0) return toast.error("Km invalide");

    setSavingId(id);
    try {
      const r = await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: draft.date,
          departure: draft.departure.trim() || "Domicile",
          destination: draft.destination.trim(),
          km: kmNum,
          roundTrip: draft.roundTrip,
          purpose: draft.purpose.trim(),
        }),
      });
      if (!r.ok) throw new Error();
      const updated: Trip = await r.json();
      setTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
      cancelEdit();
      toast.success("Trajet modifié");
    } catch {
      toast.error("Modification échouée");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce trajet (et la transaction liée) ?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      setTrips((prev) => prev.filter((t) => t.id !== id));
      toast.success("Trajet supprimé");
    } catch {
      toast.error("Suppression échouée");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm text-zinc-600">
          Année
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="ml-2 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-zinc-500">
          {trips.length} trajet{trips.length > 1 ? "s" : ""}
        </p>
      </div>

      {!loading && trips.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Total km</p>
            <p className="mt-1 text-xl font-semibold text-[#1a1a2e]">
              {totals.km.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Indemnité</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">
              {fmtMoney(totals.indemnity)} €
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <ul className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </ul>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : trips.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-zinc-500 shadow-sm">
          Aucun trajet pour {year}.
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((t) => {
            const isEditing = editingId === t.id && draft;
            return (
              <li key={t.id} className="rounded-2xl bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">{fmtDate(t.date)}</p>
                    <p className="truncate text-sm font-medium text-[#1a1a2e]">
                      {t.departure} → {t.destination}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{t.purpose}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-700">
                      {fmtMoney(t.indemnity)} €
                    </p>
                    <p className="text-xs text-zinc-500">
                      {t.km} km{t.roundTrip ? " (A/R)" : ""}
                    </p>
                  </div>
                </div>

                {isEditing && draft && (
                  <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
                    <label className="block">
                      <span className="text-xs text-zinc-500">Date</span>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-zinc-500">Départ</span>
                      <input
                        value={draft.departure}
                        onChange={(e) => setDraft({ ...draft, departure: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-zinc-500">Destination</span>
                      <input
                        value={draft.destination}
                        onChange={(e) => setDraft({ ...draft, destination: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <label className="block">
                        <span className="text-xs text-zinc-500">Km (aller simple)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.1"
                          min="0"
                          value={draft.km}
                          onChange={(e) => setDraft({ ...draft, km: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="flex items-end gap-2 pb-2">
                        <input
                          type="checkbox"
                          checked={draft.roundTrip}
                          onChange={(e) => setDraft({ ...draft, roundTrip: e.target.checked })}
                          className="h-5 w-5"
                        />
                        <span className="text-sm text-zinc-700">A/R</span>
                      </label>
                    </div>
                    <label className="block">
                      <span className="text-xs text-zinc-500">Motif</span>
                      <input
                        value={draft.purpose}
                        onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={savingId === t.id}
                        className="text-xs text-zinc-500 disabled:opacity-50"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(t.id)}
                        disabled={savingId === t.id}
                        className="text-xs font-medium text-emerald-700 disabled:opacity-50"
                      >
                        {savingId === t.id ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="text-xs text-[#1a1a2e]"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === t.id}
                        onClick={() => remove(t.id)}
                        className="text-xs text-red-600 disabled:opacity-50"
                      >
                        {deletingId === t.id ? "Suppression…" : "Supprimer"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
