"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BackupResult = {
  year: number;
  counts: { transactions: number; trips: number };
  sheet: { spreadsheetId: string; url: string } | null;
  drive: { fileId: string; url: string; fileName: string };
};

type ConfirmMode = null | "reset" | "wipe";

export function YearResetManager() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState<number>(currentYear);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "backup" | "reset" | "wipe">(null);
  const [error, setError] = useState<string | null>(null);
  const [backup, setBackup] = useState<BackupResult | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    fetch(`/api/dashboard?year=${currentYear}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const list = (j?.availableYears as number[] | undefined) ?? [];
        const merged = Array.from(new Set([currentYear, ...list])).sort((a, b) => b - a);
        setYears(merged);
      })
      .finally(() => setLoading(false));
  }, [currentYear]);

  async function doBackup() {
    setBusy("backup");
    setError(null);
    setBackup(null);
    try {
      const r = await fetch(`/api/admin/backup?year=${year}`, { method: "POST" });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? "Échec de l'export");
      setBackup(j as BackupResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  function openConfirm(mode: Exclude<ConfirmMode, null>) {
    setConfirmMode(mode);
    setConfirmStep(1);
    setConfirmText("");
    setError(null);
  }

  function closeConfirm() {
    setConfirmMode(null);
    setConfirmStep(1);
    setConfirmText("");
  }

  async function doReset() {
    setBusy("reset");
    setError(null);
    try {
      const r = await fetch(`/api/admin/reset-year?year=${year}`, { method: "DELETE" });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? "Échec de la remise à zéro");
      closeConfirm();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  async function doWipe() {
    setBusy("wipe");
    setError(null);
    try {
      const r = await fetch(`/api/admin/wipe`, { method: "DELETE" });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? "Échec du wipe");
      closeConfirm();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Chargement…</p>;

  const confirmWord = confirmMode === "wipe" ? "VIDER" : "RESET";

  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <label className="block">
        <span className="text-xs text-zinc-500">Année fiscale à clôturer</span>
        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setBackup(null);
            setError(null);
          }}
          className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-base"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={doBackup}
        disabled={busy !== null}
        className="w-full rounded-xl bg-[#1a1a2e] py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy === "backup" ? "Export en cours…" : "Sauvegarder dans Drive"}
      </button>

      {backup && (
        <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <p className="font-medium">
            Sauvegarde {backup.year} OK — {backup.counts.transactions} transactions,{" "}
            {backup.counts.trips} trajets.
          </p>
          <div className="mt-1 flex flex-col gap-1">
            {backup.sheet && (
              <a
                href={backup.sheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Ouvrir le Google Sheet
              </a>
            )}
            <a
              href={backup.drive.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Ouvrir le backup JSON ({backup.drive.fileName})
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => openConfirm("reset")}
        disabled={busy !== null}
        className="w-full rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Remettre à zéro l'année {year}
      </button>

      <p className="text-xs text-zinc-500">
        La remise à zéro supprime toutes les transactions et trajets de l'année. Les
        catégories, les taux km et les fichiers de preuves sur Drive sont préservés.
      </p>

      <hr className="my-2 border-zinc-200" />

      <button
        type="button"
        onClick={() => openConfirm("wipe")}
        disabled={busy !== null}
        className="w-full rounded-xl bg-red-700 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Vider la database (toutes années)
      </button>

      <p className="text-xs text-zinc-500">
        Supprime <strong>toutes les transactions et tous les trajets</strong> de la base
        de données, toutes années confondues. Utilisateur, catégories, taux km et fichiers
        Drive (Sheets + preuves) sont préservés.
      </p>

      {error && !confirmMode && <p className="text-sm text-red-600">{error}</p>}

      {confirmMode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeConfirm}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmStep === 1 && (
              <>
                <h3 className="text-lg font-semibold text-[#1a1a2e]">
                  {confirmMode === "wipe"
                    ? "Vider la database"
                    : `Remise à zéro ${year}`}
                </h3>
                <p className="text-sm text-zinc-700">
                  Cette action est <strong>irréversible</strong>.{" "}
                  {confirmMode === "wipe"
                    ? "Toutes les transactions et trajets de toutes les années seront supprimés de la base."
                    : `Toutes les transactions et trajets de ${year} seront supprimés de la base.`}{" "}
                  As-tu déjà exporté la sauvegarde sur Drive ?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    className="flex-1 rounded-xl border border-zinc-300 py-2 text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep(2)}
                    className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white"
                  >
                    Continuer
                  </button>
                </div>
              </>
            )}
            {confirmStep === 2 && (
              <>
                <h3 className="text-lg font-semibold text-[#1a1a2e]">
                  Dernière confirmation
                </h3>
                <p className="text-sm text-zinc-700">
                  Tape{" "}
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5">{confirmWord}</code>{" "}
                  pour confirmer{" "}
                  {confirmMode === "wipe"
                    ? "le vidage de la database"
                    : `la suppression définitive de l'année ${year}`}
                  .
                </p>
                <input
                  autoFocus
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmWord}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-base"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    className="flex-1 rounded-xl border border-zinc-300 py-2 text-sm font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={confirmMode === "wipe" ? doWipe : doReset}
                    disabled={
                      confirmText !== confirmWord ||
                      busy === "reset" ||
                      busy === "wipe"
                    }
                    className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busy === "reset" || busy === "wipe"
                      ? "Suppression…"
                      : "Confirmer la suppression"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
