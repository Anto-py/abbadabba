"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f0f2f5] px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-[#1a1a2e]">Abbadaba</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Comptabilité indépendant complémentaire
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Connexion impossible. Réessaye.
          </p>
        )}

        <button
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#1a1a2e] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2a2a3e]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#fff"
              d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.46C16.86 3.7 14.65 2.8 12 2.8 6.93 2.8 2.8 6.93 2.8 12s4.13 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.98 0-.6-.06-1.06-.15-1.52z"
            />
          </svg>
          Se connecter avec Google
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
