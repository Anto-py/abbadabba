import Link from "next/link";
import { TripList } from "@/components/Trip/TripList";

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-6 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a2e]">Carnet de bord</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Trajets professionnels et indemnités kilométriques.
          </p>
        </div>
        <Link
          href="/transactions/new"
          className="rounded-xl bg-[#1a1a2e] px-3 py-2 text-xs font-medium text-white"
        >
          + Trajet
        </Link>
      </div>
      <div className="mt-5">
        <TripList />
      </div>
    </div>
  );
}
