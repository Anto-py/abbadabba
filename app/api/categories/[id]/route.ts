import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, deductionRate, proofRequired } = body ?? {};

  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (deductionRate !== undefined && (deductionRate < 0 || deductionRate > 100)) {
    return NextResponse.json({ error: "Taux entre 0 et 100" }, { status: 400 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(deductionRate !== undefined && { deductionRate }),
      ...(proofRequired !== undefined && { proofRequired }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat || cat.userId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const txCount = await prisma.transaction.count({ where: { categoryId: id } });
  if (txCount > 0) {
    return NextResponse.json(
      { error: `Catégorie liée à ${txCount} transaction(s)` },
      { status: 400 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
