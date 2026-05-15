import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncYearSheet } from "@/lib/google-sheets";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : NaN;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const trips = await tx.trip.deleteMany({ where: { userId, fiscalYear: year } });
    const transactions = await tx.transaction.deleteMany({
      where: { userId, fiscalYear: year },
    });
    return { trips: trips.count, transactions: transactions.count };
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    syncYearSheet({ userId, year, accessToken });
  }

  return NextResponse.json({ year, deleted: result });
}
