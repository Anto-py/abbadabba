"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/auth");

  return (
    <div className="flex h-dvh flex-col bg-[#f0f2f5]">
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
