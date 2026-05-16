"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#f0f2f5",
          color: "#1a1a2e",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ fontSize: "3rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Erreur critique
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#52525b" }}>
          L&apos;application a rencontré un problème. Recharge la page.
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#a1a1aa" }}>
            Réf. {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            background: "#1a1a2e",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
