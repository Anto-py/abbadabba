import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../lib/categories-seed";

const prisma = new PrismaClient();

async function main() {
  const seedUser = await prisma.user.upsert({
    where: { email: "seed@abbadaba.local" },
    update: {},
    create: { email: "seed@abbadaba.local", name: "Seed" },
  });

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_code: { userId: seedUser.id, code: cat.code } },
      update: { name: cat.name, deductionRate: cat.deductionRate },
      create: { ...cat, isDefault: true, userId: seedUser.id },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories for dev user`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
