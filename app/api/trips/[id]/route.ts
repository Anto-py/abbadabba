import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncYearSheet } from "@/lib/google-sheets";
import { buildTripDescription } from "@/lib/trip-rates";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { transaction: { select: { id: true } } },
  });
  if (!trip || trip.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json(trip);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { date, departure, destination, km, roundTrip, purpose } = body ?? {};

  let nextDate = existing.date;
  if (date !== undefined) {
    if (typeof date !== "string") {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    }
    nextDate = d;
  }

  const nextDeparture =
    typeof departure === "string" && departure.trim() ? departure.trim() : existing.departure;
  const nextDestination =
    typeof destination === "string" && destination.trim()
      ? destination.trim()
      : existing.destination;
  const nextPurpose =
    typeof purpose === "string" && purpose.trim() ? purpose.trim() : existing.purpose;
  const nextRoundTrip = typeof roundTrip === "boolean" ? roundTrip : existing.roundTrip;

  let nextKm = existing.km;
  if (km !== undefined) {
    if (typeof km !== "number" || !Number.isFinite(km) || km <= 0) {
      return NextResponse.json({ error: "Km invalide" }, { status: 400 });
    }
    // Si l'utilisateur saisit km en aller simple, et coche A/R, on double.
    // Convention API : km = aller simple, server applique le ×2 selon roundTrip.
    nextKm = round2(nextRoundTrip ? km * 2 : km);
  } else if (typeof roundTrip === "boolean" && roundTrip !== existing.roundTrip) {
    // Toggle A/R sans nouveau km : on déduit l'aller simple existant.
    const single = existing.roundTrip ? existing.km / 2 : existing.km;
    nextKm = round2(roundTrip ? single * 2 : single);
  }

  const nextIndemnity = round2(nextKm * existing.ratePerKm);
  const nextFiscalYear = nextDate.getFullYear();
  const nextDescription = buildTripDescription({
    departure: nextDeparture,
    destination: nextDestination,
    km: nextKm,
    purpose: nextPurpose,
  });

  const updated = await prisma.$transaction(async (tx) => {
    if (existing.transactionId) {
      await tx.transaction.update({
        where: { id: existing.transactionId },
        data: {
          date: nextDate,
          amount: nextIndemnity,
          deductibleAmount: nextIndemnity,
          description: nextDescription,
          fiscalYear: nextFiscalYear,
        },
      });
    }
    return tx.trip.update({
      where: { id },
      data: {
        date: nextDate,
        departure: nextDeparture,
        destination: nextDestination,
        km: nextKm,
        roundTrip: nextRoundTrip,
        purpose: nextPurpose,
        indemnity: nextIndemnity,
        fiscalYear: nextFiscalYear,
      },
      include: { transaction: { select: { id: true } } },
    });
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    const years = new Set<number>([nextFiscalYear, existing.fiscalYear]);
    for (const year of years) {
      syncYearSheet({ userId, year, accessToken });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip || trip.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.trip.delete({ where: { id } });
    if (trip.transactionId) {
      await tx.transaction.delete({ where: { id: trip.transactionId } });
    }
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    syncYearSheet({ userId, year: trip.fiscalYear, accessToken });
  }

  return NextResponse.json({ ok: true });
}
