"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard",
    label: "Bilan",
    icon: (
      <path d="M3 3v18h18M7 14l4-4 4 4 5-5" />
    ),
  },
  {
    href: "/transactions",
    label: "Liste",
    icon: <path d="M4 6h16M4 12h16M4 18h16" />,
  },
  {
    href: "/transactions/new",
    label: "Ajouter",
    primary: true,
    icon: <path d="M12 5v14M5 12h14" />,
  },
  {
    href: "/trips",
    label: "Trajets",
    icon: (
      <>
        <path d="M5 17a2 2 0 100-4 2 2 0 000 4zM19 17a2 2 0 100-4 2 2 0 000 4z" />
        <path d="M3 13l2-6h10l2 6M7 7V5h6v2" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "Réglages",
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/transactions/new" &&
              pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs ${
                  item.primary
                    ? "bg-[#1a1a2e] text-white"
                    : active
                      ? "text-[#1a1a2e]"
                      : "text-zinc-500"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={item.primary ? "h-6 w-6" : "h-5 w-5"}
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
                <span className={item.primary ? "font-medium" : ""}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
