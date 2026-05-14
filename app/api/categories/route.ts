import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedUserCategories } from "@/lib/seed-user-categories";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await seedUserCategories(userId);

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { code, name, deductionRate, proofRequired } = body ?? {};

  if (!code || !name || typeof deductionRate !== "number") {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  if (deductionRate < 0 || deductionRate > 100) {
    return NextResponse.json({ error: "Taux entre 0 et 100" }, { status: 400 });
  }

  const normalizedCode = String(code).toUpperCase().replace(/[^A-Z0-9_]/g, "_");

  try {
    const created = await prisma.category.create({
      data: {
        code: normalizedCode,
        name,
        deductionRate,
        proofRequired: proofRequired ?? true,
        isDefault: false,
        userId,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Code déjà utilisé" }, { status: 409 });
    }
    throw e;
  }
}
