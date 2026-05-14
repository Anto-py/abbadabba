import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/categories-seed";

export async function seedUserCategories(userId: string) {
  const existing = await prisma.category.findFirst({ where: { userId } });
  if (existing) return;

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
