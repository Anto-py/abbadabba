import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-md px-5 pt-8">
      <header className="mb-6">
        <p className="text-sm text-zinc-500">Bonjour</p>
        <h1 className="text-2xl font-semibold text-[#1a1a2e]">
          {session?.user?.name ?? "Bienvenue"}
        </h1>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-600">
          Le tableau de bord arrive en phase 5. Pour l&apos;instant tu peux
          tester l&apos;authentification et la navigation.
        </p>
      </section>
    </div>
  );
}
