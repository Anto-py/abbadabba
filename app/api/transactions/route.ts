import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const where: { userId: string; fiscalYear?: number } = { userId };
  if (year) where.fiscalYear = Number(year);

  const txs = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { category: { select: { code: true, name: true } } },
  });
  return NextResponse.json(txs);
}

export async function POST(request: Request) {
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
  return NextResponse.json(created, { status: 201 });
}
