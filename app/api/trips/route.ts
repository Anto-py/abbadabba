import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncYearSheet } from "@/lib/google-sheets";
import { getActiveTripRate, buildTripDescription } from "@/lib/trip-rates";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const where: { userId: string; fiscalYear?: number } = { userId };
  if (yearParam) {
    const y = Number(yearParam);
    if (!Number.isFinite(y)) {
      return NextResponse.json({ error: "Année invalide" }, { status: 400 });
    }
    where.fiscalYear = y;
  }

  const items = await prisma.trip.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      transaction: { select: { id: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { date, departure, destination, km, roundTrip, purpose } = body ?? {};

  if (typeof date !== "string") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  if (typeof destination !== "string" || !destination.trim()) {
    return NextResponse.json({ error: "Destination requise" }, { status: 400 });
  }
  if (typeof purpose !== "string" || !purpose.trim()) {
    return NextResponse.json({ error: "Motif requis" }, { status: 400 });
  }
  if (typeof km !== "number" || !Number.isFinite(km) || km <= 0) {
    return NextResponse.json({ error: "Km invalide" }, { status: 400 });
  }

  const isRoundTrip = Boolean(roundTrip);
  const totalKm = round2(isRoundTrip ? km * 2 : km);
  const dep = (typeof departure === "string" && departure.trim()) || "Domicile";

  const rate = await getActiveTripRate(userId, d);
  if (!rate) {
    return NextResponse.json(
      { error: "Aucun taux kilométrique actif à cette date" },
      { status: 400 },
    );
  }

  const category = await prisma.category.findUnique({
    where: { userId_code: { userId, code: "DEPLACEMENT_KM" } },
  });
  if (!category) {
    return NextResponse.json(
      { error: "Catégorie DEPLACEMENT_KM introuvable" },
      { status: 500 },
    );
  }

  const indemnity = round2(totalKm * rate.ratePerKm);
  const fiscalYear = d.getFullYear();
  const description = buildTripDescription({
    departure: dep,
    destination: destination.trim(),
    km: totalKm,
    purpose: purpose.trim(),
  });

  const trip = await prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.create({
      data: {
        type: "EXPENSE",
        date: d,
        amount: indemnity,
        description,
        categoryId: category.id,
        deductionRate: 100,
        deductibleAmount: indemnity,
        fiscalYear,
        userId,
      },
    });
    return tx.trip.create({
      data: {
        date: d,
        departure: dep,
        destination: destination.trim(),
        km: totalKm,
        roundTrip: isRoundTrip,
        purpose: purpose.trim(),
        ratePerKm: rate.ratePerKm,
        indemnity,
        transactionId: txn.id,
        tripRateId: rate.id,
        fiscalYear,
        userId,
      },
      include: { transaction: { select: { id: true } } },
    });
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    syncYearSheet({ userId, year: fiscalYear, accessToken });
  }

  return NextResponse.json(trip, { status: 201 });
}
