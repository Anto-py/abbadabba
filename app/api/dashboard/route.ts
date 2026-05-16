import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Année invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { marginalTaxRate: true },
  });
  const rate = user?.marginalTaxRate ?? 45;

  const txs = await prisma.transaction.findMany({
    where: { userId, fiscalYear: year },
    include: { category: { select: { id: true, code: true, name: true } } },
  });

  const years = await prisma.transaction.findMany({
    where: { userId },
    select: { fiscalYear: true },
    distinct: ["fiscalYear"],
    orderBy: { fiscalYear: "desc" },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalDeductible = 0;
  const byCategory = new Map<
    string,
    { code: string; name: string; expense: number; deductible: number }
  >();
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    income: 0,
    expense: 0,
    deductible: 0,
  }));

  for (const t of txs) {
    const m = new Date(t.date).getUTCMonth();
    if (t.type === "INCOME") {
      totalIncome += t.amount;
      byMonth[m].income += t.amount;
    } else {
      totalExpense += t.amount;
      byMonth[m].expense += t.amount;
      const ded = t.deductibleAmount ?? 0;
      byMonth[m].deductible += ded;
      totalDeductible += ded;
      if (t.category) {
        const key = t.category.id;
        const cur = byCategory.get(key) ?? {
          code: t.category.code,
          name: t.category.name,
          expense: 0,
          deductible: 0,
        };
        cur.expense += t.amount;
        cur.deductible += ded;
        byCategory.set(key, cur);
      }
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  const categories = Array.from(byCategory.values())
    .map((c) => ({
      ...c,
      expense: round(c.expense),
      deductible: round(c.deductible),
    }))
    .sort((a, b) => b.deductible - a.deductible);

  const taxBeforeDeduction = (totalIncome * rate) / 100;
  const taxableBase = Math.max(0, totalIncome - totalDeductible);
  const taxAfterDeduction = (taxableBase * rate) / 100;

  return NextResponse.json({
    year,
    availableYears: years.map((y) => y.fiscalYear),
    marginalTaxRate: rate,
    totals: {
      income: round(totalIncome),
      expense: round(totalExpense),
      deductible: round(totalDeductible),
      taxBeforeDeduction: round(taxBeforeDeduction),
      taxAfterDeduction: round(taxAfterDeduction),
    },
    byCategory: categories,
    byMonth: byMonth.map((m) => ({
      month: m.month,
      income: round(m.income),
      expense: round(m.expense),
      deductible: round(m.deductible),
    })),
    transactionCount: txs.length,
  });
}
