"use client";

import { useEffect, useState } from "react";

export function HomeAddressManager() {
  const [address, setAddress] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const v = (j?.homeAddress as string | null) ?? "";
        setAddress(v);
        setInitial(v);
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = address.trim() !== initial.trim();

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeAddress: address.trim() || null }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        throw new Error(j?.error ?? "Échec");
      }
      const j = await r.json();
      const v = (j?.homeAddress as string | null) ?? "";
      setAddress(v);
      setInitial(v);
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" aria-busy="true" />
    );

  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
      <label className="block">
        <span className="text-xs text-zinc-500">
          Adresse complète (utilisée pour calculer la distance des trajets depuis « Domicile »)
        </span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Rue Exemple 12, 1000 Bruxelles"
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {savedAt && !dirty && !error && (
        <p className="text-xs text-emerald-700">Enregistré.</p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="w-full rounded-xl bg-[#1a1a2e] py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Enregistrer l'adresse"}
      </button>
    </div>
  );
}
