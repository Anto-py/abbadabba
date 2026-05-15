import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/categories-seed";

const INITIAL_TRIP_RATE = 0.4259;

export async function seedUserCategories(userId: string) {
  const existing = await prisma.category.findFirst({ where: { userId } });
  if (!existing) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        code: c.code,
        name: c.name,
        deductionRate: c.deductionRate,
        proofRequired: c.proofRequired,
        isDefault: true,
        userId,
      })),
    });
  }

  const existingRate = await prisma.tripRate.findFirst({ where: { userId } });
  if (!existingRate) {
    await prisma.tripRate.create({
      data: {
        ratePerKm: INITIAL_TRIP_RATE,
        validFrom: new Date(),
        userId,
      },
    });
  }
}
