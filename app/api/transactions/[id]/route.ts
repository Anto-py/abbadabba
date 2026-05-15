import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromDrive } from "@/lib/google-drive";
import { syncYearSheet } from "@/lib/google-sheets";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { category: { select: { id: true, code: true, name: true, deductionRate: true } } },
  });
  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  return NextResponse.json(tx);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await request.json();
  const { type, date, amount, categoryId, description } = body ?? {};

  const nextType: "EXPENSE" | "INCOME" =
    type === "EXPENSE" || type === "INCOME" ? type : existing.type;

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

  let nextAmount = existing.amount;
  if (amount !== undefined) {
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }
    nextAmount = amount;
  }

  let nextCategoryId: string | null = existing.categoryId;
  if (categoryId !== undefined) {
    nextCategoryId = categoryId || null;
  }
  if (nextType === "INCOME") {
    nextCategoryId = null;
  }

  let nextDeductionRate: number | null = null;
  let nextDeductibleAmount: number | null = null;
  if (nextType === "EXPENSE" && nextCategoryId) {
    const cat = await prisma.category.findUnique({ where: { id: nextCategoryId } });
    if (!cat || cat.userId !== userId) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
    }
    nextDeductionRate = cat.deductionRate;
    nextDeductibleAmount =
      Math.round(((nextAmount * cat.deductionRate) / 100) * 100) / 100;
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type: nextType,
      date: nextDate,
      amount: nextAmount,
      description: description !== undefined ? (description || null) : existing.description,
      categoryId: nextCategoryId,
      deductionRate: nextDeductionRate,
      deductibleAmount: nextDeductibleAmount,
      fiscalYear: nextDate.getFullYear(),
    },
    include: { category: { select: { id: true, code: true, name: true } } },
  });

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;
  if (accessToken) {
    const years = new Set<number>([updated.fiscalYear, existing.fiscalYear]);
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
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const jwt = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = jwt?.accessToken as string | undefined;

  if (tx.proofDriveId && accessToken) {
    try {
      await deleteFromDrive(accessToken, tx.proofDriveId);
    } catch (e) {
      console.error("Drive delete failed (continue with DB delete)", e);
    }
  }

  await prisma.transaction.delete({ where: { id } });

  if (accessToken) {
    syncYearSheet({ userId, year: tx.fiscalYear, accessToken });
  }

  return NextResponse.json({ ok: true });
}
