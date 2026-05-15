import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardView } from "@/components/Dashboard/DashboardView";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-5">
        <p className="text-sm text-zinc-500">Bonjour</p>
        <h1 className="text-2xl font-semibold text-[#1a1a2e]">
          {session?.user?.name ?? "Bienvenue"}
        </h1>
      </header>

      <DashboardView initialYear={year} />
    </div>
  );
}
