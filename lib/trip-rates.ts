import { prisma } from "@/lib/prisma";

export async function getActiveTripRate(userId: string, at: Date = new Date()) {
  return prisma.tripRate.findFirst({
    where: { userId, validFrom: { lte: at } },
    orderBy: { validFrom: "desc" },
  });
}

export function buildTripDescription(t: {
  departure: string;
  destination: string;
  km: number;
  purpose: string;
}) {
  return `Trajet : ${t.departure} → ${t.destination} (${t.km} km) — ${t.purpose}`;
}
