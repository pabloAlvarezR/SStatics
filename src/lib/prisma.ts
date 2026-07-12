import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaOptimized: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Aplica PRAGMAs de SQLite para mejor rendimiento en lecturas frecuentes */
export async function ensureSqliteOptimizations(): Promise<void> {
  if (globalForPrisma.prismaOptimized) return;
  globalForPrisma.prismaOptimized = true;

  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL");
    await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL");
    await prisma.$executeRawUnsafe("PRAGMA cache_size = -64000");
    await prisma.$executeRawUnsafe("PRAGMA temp_store = MEMORY");
    await prisma.$executeRawUnsafe("PRAGMA mmap_size = 268435456");
  } catch {
    // Ignorar si no es SQLite (p. ej. PostgreSQL en producción)
  }
}
