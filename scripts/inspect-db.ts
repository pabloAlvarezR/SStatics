import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const nullDates = await prisma.$queryRaw<{ cnt: number }[]>`
    SELECT COUNT(*) as cnt FROM PlaytimeSnapshot WHERE capturedAt IS NULL
  `;
  console.log("Null capturedAt:", nullDates);

  const sample = await prisma.$queryRaw<
    { id: string; capturedAt: string; playtimeMinutes: number }[]
  >`SELECT id, capturedAt, playtimeMinutes FROM PlaytimeSnapshot LIMIT 5`;
  console.log("Sample:", sample);

  const newTableCount = await prisma.$queryRaw<{ cnt: number }[]>`
    SELECT COUNT(*) as cnt FROM sqlite_master WHERE name = 'PlaytimeSnapshot_new'
  `;
  console.log("PlaytimeSnapshot_new exists:", newTableCount[0]?.cnt);

  const newRows = await prisma.$queryRaw<{ cnt: number }[]>`
    SELECT COUNT(*) as cnt FROM PlaytimeSnapshot_new
  `.catch(() => [{ cnt: -1 }]);
  console.log("Rows in PlaytimeSnapshot_new:", newRows);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
