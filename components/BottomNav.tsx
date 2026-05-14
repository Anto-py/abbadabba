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
    href: "/transactions/new",
    label: "Ajouter",
    primary: true,
    icon: <path d="M12 5v14M5 12h14" />,
  },
  {
    href: "/transactions",
    label: "Liste",
    icon: <path d="M4 6h16M4 12h16M4 18h16" />,
  },
  {
    href: "/categories",
    label: "Catégories",
    icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
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
