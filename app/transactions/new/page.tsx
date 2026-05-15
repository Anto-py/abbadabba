"use client";

import { useState } from "react";
import { TransactionForm } from "@/components/Transaction/TransactionForm";
import { TripForm } from "@/components/Trip/TripForm";

type Tab = "EXPENSE" | "INCOME" | "TRIP";

const TABS: { id: Tab; label: string; activeClass: string }[] = [
  { id: "EXPENSE", label: "− Dépense", activeClass: "bg-red-600 text-white" },
  { id: "INCOME", label: "+ Recette", activeClass: "bg-emerald-600 text-white" },
  { id: "TRIP", label: "🚗 Trajet km", activeClass: "bg-[#1a1a2e] text-white" },
];

export default function NewTransactionPage() {
  const [tab, setTab] = useState<Tab>("EXPENSE");

  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">Nouvelle saisie</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Recette, dépense ou trajet kilométrique.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl py-2.5 text-sm font-medium ${
              tab === t.id ? t.activeClass : "bg-white text-zinc-600 shadow-sm"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "EXPENSE" && <TransactionForm initialType="EXPENSE" key="expense" />}
        {tab === "INCOME" && <TransactionForm initialType="INCOME" key="income" />}
        {tab === "TRIP" && <TripForm />}
      </div>
    </div>
  );
}
