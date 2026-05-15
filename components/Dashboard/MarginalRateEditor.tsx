"use client";

import { useEffect, useState } from "react";

type Props = {
  rate: number;
  onSaved: (rate: number) => void;
};

export function MarginalRateEditor({ rate, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setValue(String(rate));
  }, [rate, editing]);

  async function save() {
    const num = Number(value.replace(",", "."));
    if (!Number.isFinite(num) || num < 0 || num > 100) {
      setError("0–100");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marginalTaxRate: num }),
      });
      if (!r.ok) throw new Error();
      const j = await r.json();
      onSaved(j.marginalTaxRate);
      setEditing(false);
    } catch {
      setError("Échec");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-zinc-600 shadow-sm hover:text-[#1a1a2e]"
      >
        Taux marginal&nbsp;: <strong className="text-[#1a1a2e]">{rate}&nbsp;%</strong>
        <span aria-hidden className="text-zinc-400">✎</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs shadow-sm">
      <span className="text-zinc-500">Taux marginal</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        className="w-14 rounded border border-zinc-200 px-1 py-0.5 text-right text-xs"
        disabled={saving}
      />
      <span className="text-zinc-500">%</span>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="ml-1 rounded bg-[#1a1a2e] px-2 py-0.5 text-xs text-white disabled:opacity-60"
      >
        {saving ? "…" : "OK"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setError(null);
          setValue(String(rate));
        }}
        disabled={saving}
        className="rounded px-1 text-zinc-500"
      >
        ✕
      </button>
      {error && <span className="ml-1 text-red-600">{error}</span>}
    </div>
  );
}
