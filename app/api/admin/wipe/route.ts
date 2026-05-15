import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.$transaction(async (tx) => {
    const trips = await tx.trip.deleteMany({ where: { userId } });
    const transactions = await tx.transaction.deleteMany({ where: { userId } });
    return { trips: trips.count, transactions: transactions.count };
  });

  return NextResponse.json({ deleted: result });
}
