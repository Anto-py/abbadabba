import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rates = await prisma.tripRate.findMany({
    where: { userId },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items: rates });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const ratePerKm = body?.ratePerKm;
  const validFromStr = body?.validFrom;

  if (typeof ratePerKm !== "number" || !Number.isFinite(ratePerKm) || ratePerKm <= 0) {
    return NextResponse.json({ error: "Taux invalide" }, { status: 400 });
  }
  if (typeof validFromStr !== "string") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const validFrom = new Date(validFromStr);
  if (isNaN(validFrom.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const created = await prisma.tripRate.create({
    data: { ratePerKm, validFrom, userId },
  });
  return NextResponse.json(created, { status: 201 });
}
