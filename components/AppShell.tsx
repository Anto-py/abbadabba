"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/auth");

  return (
    <div className="flex min-h-dvh flex-col bg-[#f0f2f5]">
      <main className={`flex-1 ${hideNav ? "" : "pb-24"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
