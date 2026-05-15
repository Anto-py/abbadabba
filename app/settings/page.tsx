import Link from "next/link";
import { TripRateManager } from "@/components/Trip/TripRateManager";
import { HomeAddressManager } from "@/components/Trip/HomeAddressManager";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <h1 className="text-2xl font-semibold text-[#1a1a2e]">Réglages</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Paramètres fiscaux et indemnités kilométriques.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Domicile
        </h2>
        <div className="mt-3">
          <HomeAddressManager />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Indemnité km
        </h2>
        <div className="mt-3">
          <TripRateManager />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Autres</h2>
        <div className="mt-3">
          <Link
            href="/categories"
            className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-[#1a1a2e] shadow-sm"
          >
            Catégories et taux de déductibilité
            <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
