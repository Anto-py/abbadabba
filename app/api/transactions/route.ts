import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncYearSheet } from "@/lib/google-sheets";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const type = searchParams.get("type");
  const categoryId = searchParams.get("categoryId");
  const month = searchParams.get("month");
  const pageRaw = Number(searchParams.get("page") ?? "1");
  const pageSizeRaw = Number(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize =
    Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 && pageSizeRaw <= 100
      ? Math.floor(pageSizeRaw)
      : DEFAULT_PAGE_SIZE;

  const where: Prisma.TransactionWhereInput = { userId };

  if (year) {
    const y = Number(year);
    if (!Number.isFinite(y)) {
      return NextResponse.json({ error: "Année invalide" }, { status: 400 });
    }
    where.fiscalYear = y;

    if (month) {
      const m = Number(month);
      if (!Number.isFinite(m) || m < 1 || m > 12) {
        return NextResponse.json({ error: "Mois invalide" }, { status: 400 });
      }
      where.date = {
        gte: new Date(Date.UTC(y, m - 1, 1)),
        lt: new Date(Date.UTC(y, m, 1)),
      };
    }
  }

  if (type === "EXPENSE" || type === "INCOME") {
    where.type = type;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { category: { select: { id: true, code: true, name: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    type,
    date,
    amount,
    categoryId,
    description,
    proofUrl,
    proofFileName,
    proofDriveId,
  } = body ?? {};

  if (type !== "EXPENSE" && type !== "INCOME") {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (typeof date !== "string") {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  let deductionRate: number | null = null;
  let deductibleAmount: number | null = null;

  if (categoryId) {
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat || cat.userId !== userId) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
    }
    if (type === "EXPENSE") {
      deductionRate = cat.deductionRate;
      deductibleAmount = Math.round(((amount * cat.deductionRate) / 100) * 100) / 100;
    }
  }

  const created = await prisma.transaction.create({
    data: {
      type,
      date: d,
      amount,
      description: description || null,
      categoryId: categoryId || null,
      deductionRate,
      deductibleAmount,
      proofUrl: proofUrl || null,
      proofFileName: proofFileName || null,
      proofDriveId: proofDriveId || null,
      fiscalYear: d.getFullYear(),
      userId,
    },
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    syncYearSheet({ userId, year: created.fiscalYear, accessToken });
  }

  return NextResponse.json(created, { status: 201 });
}
