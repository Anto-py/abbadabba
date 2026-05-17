"use client";

import { SessionProvider as NextAuthSessionProvider, signIn, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

function RefreshErrorWatcher() {
  const { data } = useSession();
  useEffect(() => {
    if ((data as { error?: string } | null)?.error === "RefreshAccessTokenError") {
      signIn("google");
    }
  }, [data]);
  return null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <RefreshErrorWatcher />
      {children}
    </NextAuthSessionProvider>
  );
}
