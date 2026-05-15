import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTripRate } from "@/lib/trip-rates";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marginalTaxRate: true, homeAddress: true },
  });
  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const activeRate = await getActiveTripRate(userId);
  return NextResponse.json({
    marginalTaxRate: user.marginalTaxRate,
    homeAddress: user.homeAddress,
    activeTripRate: activeRate
      ? { id: activeRate.id, ratePerKm: activeRate.ratePerKm, validFrom: activeRate.validFrom }
      : null,
  });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const data: { marginalTaxRate?: number; homeAddress?: string | null } = {};

  if ("marginalTaxRate" in body) {
    const rate = body.marginalTaxRate;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: "Taux marginal invalide (0–100)" },
        { status: 400 },
      );
    }
    data.marginalTaxRate = rate;
  }

  if ("homeAddress" in body) {
    const addr = body.homeAddress;
    if (addr === null || addr === "") {
      data.homeAddress = null;
    } else if (typeof addr === "string") {
      data.homeAddress = addr.trim() || null;
    } else {
      return NextResponse.json({ error: "Adresse invalide" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { marginalTaxRate: true, homeAddress: true },
  });
  return NextResponse.json(updated);
}
