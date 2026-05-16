"use client";

import { useMemo, useState } from "react";

type Host = "railway" | "render" | "coolify" | "vercel-neon" | "other";

type Form = {
  host: Host;
  databaseUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  nextauthUrl: string;
  allowedEmails: string;
  nextauthSecret: string;
  n8nUrl: string;
  n8nApiKey: string;
};

const TOTAL_STEPS = 6;

const HOST_LABELS: Record<Host, string> = {
  railway: "Railway",
  render: "Render",
  coolify: "Coolify / VPS",
  "vercel-neon": "Vercel + Neon",
  other: "Autre",
};

const DB_HINTS: Record<Host, string> = {
  railway:
    "Railway : ajoute un service PostgreSQL au projet, puis copie la variable DATABASE_URL exposée par le service (onglet Variables).",
  render:
    "Render : crée une base PostgreSQL (Dashboard → New → PostgreSQL), puis copie l'Internal Database URL.",
  coolify:
    "Coolify : crée un service PostgreSQL dans le projet, puis copie la connection string interne (postgres://...).",
  "vercel-neon":
    "Vercel + Neon : crée une base sur neon.tech, puis colle la connection string « Pooled connection » avec ?sslmode=require.",
  other:
    "Format attendu : postgres://utilisateur:motdepasse@hote:5432/nom_de_base?sslmode=require",
};

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, "");
}

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<Form>({
    host: "railway",
    databaseUrl: "",
    googleClientId: "",
    googleClientSecret: "",
    nextauthUrl: "",
    allowedEmails: "",
    nextauthSecret: "",
    n8nUrl: "",
    n8nApiKey: "",
  });

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const envBlock = useMemo(() => {
    const lines = [
      `DATABASE_URL="${form.databaseUrl}"`,
      `GOOGLE_CLIENT_ID="${form.googleClientId}"`,
      `GOOGLE_CLIENT_SECRET="${form.googleClientSecret}"`,
      `NEXTAUTH_URL="${form.nextauthUrl}"`,
      `NEXTAUTH_SECRET="${form.nextauthSecret}"`,
      `ALLOWED_EMAILS="${form.allowedEmails}"`,
    ];
    if (form.n8nUrl) lines.push(`N8N_WEBHOOK_URL="${form.n8nUrl}"`);
    if (form.n8nApiKey) lines.push(`N8N_INTERNAL_API_KEY="${form.n8nApiKey}"`);
    return lines.join("\n");
  }, [form]);

  async function copyEnv() {
    try {
      await navigator.clipboard.writeText(envBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const canNext = (() => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return form.databaseUrl.trim().startsWith("postgres");
      case 3:
        return form.googleClientId.trim().length > 0 && form.googleClientSecret.trim().length > 0;
      case 4:
        return (
          form.nextauthUrl.trim().startsWith("http") &&
          form.allowedEmails.trim().length > 0 &&
          form.nextauthSecret.trim().length > 0
        );
      case 5:
        return true;
      default:
        return true;
    }
  })();

  return (
    <div className="min-h-dvh bg-[#f0f2f5] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1a1a2e]">Configuration d'Abbadaba</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Étape {step} sur {TOTAL_STEPS}
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-[#1a1a2e] transition-all"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </header>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {step === 1 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">Bienvenue</h2>
              <p className="text-sm text-zinc-700">
                Cet assistant te guide pour générer le fichier <code className="rounded bg-zinc-100 px-1">.env</code>{" "}
                à coller dans ton hébergeur. Compte ~20 min, et garde sous la main un compte Google et l'accès à
                ton hébergeur.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-800">Où héberges-tu l'app ?</label>
                <select
                  value={form.host}
                  onChange={(e) => update("host", e.target.value as Host)}
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  {(Object.keys(HOST_LABELS) as Host[]).map((h) => (
                    <option key={h} value={h}>
                      {HOST_LABELS[h]}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-zinc-500">
                  Le choix sert uniquement à adapter les instructions affichées.
                </p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">Base de données PostgreSQL</h2>
              <p className="text-sm text-zinc-700">{DB_HINTS[form.host]}</p>
              <div>
                <label className="block text-sm font-medium text-zinc-800">DATABASE_URL</label>
                <input
                  type="text"
                  value={form.databaseUrl}
                  onChange={(e) => update("databaseUrl", e.target.value)}
                  placeholder="postgres://user:pass@host:5432/dbname"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">Identifiants Google OAuth</h2>
              <ol className="ml-5 list-decimal space-y-1 text-sm text-zinc-700">
                <li>
                  Ouvre la{" "}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1a1a2e] underline"
                  >
                    Google Cloud Console
                  </a>{" "}
                  et crée un projet.
                </li>
                <li>Active les APIs Google Drive et Google Sheets.</li>
                <li>
                  Crée des identifiants OAuth 2.0 (type « Application Web »). Redirige URI :{" "}
                  <code className="rounded bg-zinc-100 px-1 text-xs">
                    {form.nextauthUrl || "https://ton-app.exemple.com"}/api/auth/callback/google
                  </code>
                </li>
                <li>Sur l'écran de consentement, publie en « Production » (scopes non sensibles).</li>
                <li>Copie le Client ID et Client Secret ci-dessous.</li>
              </ol>
              <div>
                <label className="block text-sm font-medium text-zinc-800">GOOGLE_CLIENT_ID</label>
                <input
                  type="text"
                  value={form.googleClientId}
                  onChange={(e) => update("googleClientId", e.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800">GOOGLE_CLIENT_SECRET</label>
                <input
                  type="text"
                  value={form.googleClientSecret}
                  onChange={(e) => update("googleClientSecret", e.target.value)}
                  placeholder="GOCSPX-..."
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">Configuration de l'application</h2>
              <div>
                <label className="block text-sm font-medium text-zinc-800">NEXTAUTH_URL</label>
                <p className="text-xs text-zinc-500">URL publique complète de ton app (sans / final).</p>
                <input
                  type="text"
                  value={form.nextauthUrl}
                  onChange={(e) => update("nextauthUrl", e.target.value)}
                  placeholder="https://abbadaba.mondomaine.com"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800">ALLOWED_EMAILS</label>
                <p className="text-xs text-zinc-500">
                  Emails Google autorisés à se connecter, séparés par virgule.
                </p>
                <input
                  type="text"
                  value={form.allowedEmails}
                  onChange={(e) => update("allowedEmails", e.target.value)}
                  placeholder="moi@gmail.com"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800">NEXTAUTH_SECRET</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={form.nextauthSecret}
                    onChange={(e) => update("nextauthSecret", e.target.value)}
                    placeholder="Clique sur Générer →"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => update("nextauthSecret", generateSecret())}
                    className="rounded-lg bg-[#1a1a2e] px-3 py-2 text-sm font-medium text-white"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">N8n (optionnel)</h2>
              <p className="text-sm text-zinc-700">
                Laisse vide si tu n'utilises pas N8n. La sauvegarde Google Sheets fonctionne déjà sans N8n.
              </p>
              <div>
                <label className="block text-sm font-medium text-zinc-800">N8N_WEBHOOK_URL</label>
                <input
                  type="text"
                  value={form.n8nUrl}
                  onChange={(e) => update("n8nUrl", e.target.value)}
                  placeholder="https://n8n.mondomaine.com/webhook/abbadaba"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800">N8N_INTERNAL_API_KEY</label>
                <input
                  type="text"
                  value={form.n8nApiKey}
                  onChange={(e) => update("n8nApiKey", e.target.value)}
                  placeholder="clé partagée app ↔ N8n"
                  className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                />
              </div>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">Récapitulatif</h2>
              <p className="text-sm text-zinc-700">
                Copie ce bloc et colle-le dans les variables d'environnement de ton hébergeur. Redémarre l'app
                ensuite.
              </p>
              <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
                {envBlock}
              </pre>
              <button
                type="button"
                onClick={copyEnv}
                className="w-full rounded-lg bg-[#1a1a2e] px-4 py-3 text-sm font-medium text-white"
              >
                {copied ? "Copié ✓" : "Copier dans le presse-papier"}
              </button>
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Coolify uniquement :</strong> pense à activer <code>is_literal: true</code> sur les
                variables contenant des caractères spéciaux.
              </div>
            </section>
          )}
        </div>

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-40"
          >
            Précédent
          </button>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={!canNext}
              className="rounded-lg bg-[#1a1a2e] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Suivant
            </button>
          ) : (
            <span className="text-xs text-zinc-500">Fin de la configuration</span>
          )}
        </div>
      </div>
    </div>
  );
}
