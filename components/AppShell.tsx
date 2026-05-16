"use client";

import { useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { notifyRefresh } from "@/lib/refresh-bus";

const THRESHOLD = 70;
const MAX_PULL = 110;
const DAMPING = 0.5;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/auth") || pathname.startsWith("/setup");

  const mainRef = useRef<HTMLElement>(null);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing) return;
    const main = mainRef.current;
    if (main && main.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    setPull(Math.min(delta * DAMPING, MAX_PULL));
  }

  async function onTouchEnd() {
    if (startY.current === null || refreshing) {
      startY.current = null;
      return;
    }
    const triggered = pull >= THRESHOLD;
    startY.current = null;

    if (!triggered) {
      setPull(0);
      return;
    }

    setRefreshing(true);
    setPull(THRESHOLD);
    notifyRefresh();
    router.refresh();
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
    setPull(0);
  }

  const indicatorHeight = refreshing ? THRESHOLD : pull;
  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div className="relative flex h-dvh flex-col bg-[#f0f2f5]">
      {!hideNav && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-50 flex items-end justify-center overflow-hidden"
          style={{
            height: `${indicatorHeight}px`,
            transition: startY.current === null ? "height 200ms ease" : "none",
          }}
        >
          <div className="pb-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-6 w-6 text-[#1a1a2e] ${refreshing ? "animate-spin" : ""}`}
              style={{
                opacity: refreshing ? 1 : progress,
                transform: refreshing ? "none" : `rotate(${progress * 180}deg)`,
                transition: refreshing ? "none" : "transform 100ms linear",
              }}
              aria-hidden="true"
            >
              {refreshing ? (
                <>
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </>
              ) : (
                <>
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </>
              )}
            </svg>
          </div>
        </div>
      )}
      <main
        ref={mainRef}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          hideNav ? "" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"
        }`}
        onTouchStart={hideNav ? undefined : onTouchStart}
        onTouchMove={hideNav ? undefined : onTouchMove}
        onTouchEnd={hideNav ? undefined : onTouchEnd}
        onTouchCancel={hideNav ? undefined : onTouchEnd}
        style={{
          transform: `translateY(${indicatorHeight}px)`,
          transition: startY.current === null ? "transform 200ms ease" : "none",
        }}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
