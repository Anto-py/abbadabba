import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "../lib/categories-seed";

const prisma = new PrismaClient();

async function main() {
  // Seed requires a userId — seed is run after first user login in production
  // For dev, create a system seed user
  const seedUser = await prisma.user.upsert({
    where: { email: "seed@abbadaba.local" },
    update: {},
    create: { email: "seed@abbadaba.local", name: "Seed" },
  });

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, deductionRate: cat.deductionRate },
      create: {
        ...cat,
        isDefault: true,
        userId: seedUser.id,
      },
    });
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
