"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type Geocoded = { fromLabel: string; toLabel: string; km: number };

export function TripForm() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [departure, setDeparture] = useState("Domicile");
  const [destination, setDestination] = useState("");
  const [km, setKm] = useState("");
  const [roundTrip, setRoundTrip] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [activeRate, setActiveRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [distError, setDistError] = useState<string | null>(null);
  const [geocoded, setGeocoded] = useState<Geocoded | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setActiveRate(j?.activeTripRate?.ratePerKm ?? null))
      .finally(() => setRateLoading(false));
  }, []);

  const kmNum = Number(km.replace(",", "."));
  const totalKm = Number.isFinite(kmNum) && kmNum > 0 ? round2(roundTrip ? kmNum * 2 : kmNum) : 0;
  const indemnity = activeRate && totalKm > 0 ? round2(totalKm * activeRate) : 0;

  async function calculate() {
    setDistError(null);
    setGeocoded(null);
    if (!destination.trim()) {
      setDistError("Saisis une destination d'abord");
      return;
    }
    setCalculating(true);
    try {
      const r = await fetch("/api/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: departure.trim(),
          to: destination.trim(),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Calcul impossible");
      setKm(String(j.km));
      setGeocoded({ fromLabel: j.from.label, toLabel: j.to.label, km: j.km });
    } catch (e) {
      setDistError(e instanceof Error ? e.message : "Calcul impossible");
    } finally {
      setCalculating(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) return setError("Date requise");
    if (!destination.trim()) return setError("Destination requise");
    if (!Number.isFinite(kmNum) || kmNum <= 0) return setError("Km invalide");
    if (!purpose.trim()) return setError("Motif requis");
    if (!activeRate) return setError("Aucun taux €/km défini — voir Réglages");

    setSubmitting(true);
    try {
      const r = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          departure: departure.trim() || "Domicile",
          destination: destination.trim(),
          km: kmNum,
          roundTrip,
          purpose: purpose.trim(),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? "Enregistrement échoué");
      }
      router.push("/trips");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
        <span className="text-xs text-zinc-500">Départ</span>
        <input
          value={departure}
          onChange={(e) => {
            setDeparture(e.target.value);
            setGeocoded(null);
          }}
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs text-zinc-500">Destination</span>
        <input
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            setGeocoded(null);
          }}
          placeholder="Ex. École Saint-Joseph, Bruxelles"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="block">
            <span className="text-xs text-zinc-500">Km (aller simple)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="0"
              required
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-lg"
            />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(e) => setRoundTrip(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm text-zinc-700">A/R</span>
          </label>
        </div>

        <button
          type="button"
          onClick={calculate}
          disabled={calculating || !destination.trim()}
          className="w-full rounded-lg border border-[#1a1a2e] bg-white py-2 text-sm font-medium text-[#1a1a2e] disabled:opacity-50"
        >
          {calculating ? "Calcul…" : "📍 Calculer la distance"}
        </button>

        {distError && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{distError}</p>
        )}

        {geocoded && (
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            <p>
              <span className="font-medium text-zinc-700">Départ :</span> {geocoded.fromLabel}
            </p>
            <p className="mt-1">
              <span className="font-medium text-zinc-700">Arrivée :</span> {geocoded.toLabel}
            </p>
            <p className="mt-1 text-zinc-500">
              Distance routière calculée : {geocoded.km} km (modifiable ci-dessus).
            </p>
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-xs text-zinc-500">Motif</span>
        <input
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="Ex. Animation atelier IA"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {rateLoading ? (
          "Chargement du taux…"
        ) : activeRate == null ? (
          <span className="text-amber-800">Aucun taux €/km défini — voir Réglages.</span>
        ) : (
          <>
            Indemnité : <strong>{indemnity.toFixed(2)} €</strong>{" "}
            <span className="text-xs text-emerald-700">
              ({totalKm} km × {activeRate.toFixed(4)} €/km)
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#1a1a2e] py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Enregistrement…" : "Enregistrer le trajet"}
      </button>
    </form>
  );
}
