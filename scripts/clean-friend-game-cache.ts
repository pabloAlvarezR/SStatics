import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.steamFriendGameCache.deleteMany();
  console.log(`Eliminadas ${result.count} entradas de SteamFriendGameCache`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
