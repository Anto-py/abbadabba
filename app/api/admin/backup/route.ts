import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rebuildYearSheet } from "@/lib/google-sheets";
import { uploadToYearFolder } from "@/lib/google-drive";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

async function buildBackup(userId: string, year: number) {
  const [transactions, trips, categories, user] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, fiscalYear: year },
      include: { category: { select: { code: true, name: true, deductionRate: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.trip.findMany({
      where: { userId, fiscalYear: year },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({
      where: { userId },
      select: { code: true, name: true, deductionRate: true, isDefault: true },
      orderBy: { code: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, marginalTaxRate: true, homeAddress: true },
    }),
  ]);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    year,
    user,
    categories,
    transactions,
    trips,
  };
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : NaN;
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Session Google expirée — reconnecte-toi." },
      { status: 401 },
    );
  }

  const backup = await buildBackup(userId, year);
  if (backup.transactions.length === 0 && backup.trips.length === 0) {
    return NextResponse.json(
      { error: "Aucune donnée à exporter pour cette année." },
      { status: 400 },
    );
  }

  let sheetResult: { spreadsheetId: string } | null = null;
  try {
    sheetResult = await rebuildYearSheet({ userId, year, accessToken });
  } catch (e) {
    console.error("Backup: rebuild Sheets failed", e);
  }

  const json = JSON.stringify(backup, null, 2);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `Abbadaba_${year}_backup_${stamp}.json`;

  let driveResult: { driveId: string; webViewLink: string } | null = null;
  try {
    driveResult = await uploadToYearFolder(
      accessToken,
      Buffer.from(json, "utf8"),
      "application/json",
      fileName,
      year,
    );
  } catch (e) {
    console.error("Backup: Drive JSON upload failed", e);
    return NextResponse.json(
      { error: "Échec de la sauvegarde JSON sur Drive." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    year,
    counts: { transactions: backup.transactions.length, trips: backup.trips.length },
    sheet: sheetResult
      ? {
          spreadsheetId: sheetResult.spreadsheetId,
          url: `https://docs.google.com/spreadsheets/d/${sheetResult.spreadsheetId}/edit`,
        }
      : null,
    drive: {
      fileId: driveResult.driveId,
      url: driveResult.webViewLink,
      fileName,
    },
  });
}
