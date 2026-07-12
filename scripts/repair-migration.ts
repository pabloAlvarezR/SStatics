/**
 * Repara la BD tras una migración fallida y aplica optimize_snapshots.
 * Uso: npx tsx scripts/repair-migration.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();
const MIGRATION_NAME = "20260712203000_optimize_snapshots";

async function main() {
  console.log("🔧 Reparando migración fallida...\n");

  // 1. Limpiar tabla huérfana de intento anterior
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PlaytimeSnapshot_new"`);
  console.log("✓ Tabla PlaytimeSnapshot_new eliminada (si existía)");

  // 2. Verificar si la migración ya está aplicada (columna captureDate existe)
  const cols = await prisma.$queryRaw<{ name: string }[]>`
    PRAGMA table_info('PlaytimeSnapshot')
  `;
  const hasCaptureDate = cols.some((c) => c.name === "captureDate");

  if (hasCaptureDate) {
    console.log("✓ La columna captureDate ya existe — migración ya aplicada en BD");
  } else {
    // 3. Aplicar SQL de migración manualmente
    const sqlPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      MIGRATION_NAME,
      "migration.sql",
    );
    const sql = readFileSync(sqlPath, "utf-8");

    // Ejecutar statement por statement (SQLite no permite múltiples en executeRaw a veces)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      const preview = statement.replace(/\s+/g, " ").slice(0, 80);
      console.log(`  → ${preview}...`);
      await prisma.$executeRawUnsafe(statement);
    }

    const count = await prisma.playtimeSnapshot.count();
    console.log(`✓ Migración SQL aplicada — ${count} snapshots en BD`);
  }

  // 4. Marcar migración como aplicada en _prisma_migrations
  const existing = await prisma.$queryRaw<{ migration_name: string; finished_at: string | null }[]>`
    SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name = ${MIGRATION_NAME}
  `;

  if (existing.length > 0 && existing[0].finished_at) {
    console.log("✓ Migración ya marcada como completada en _prisma_migrations");
  } else if (existing.length > 0) {
    await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET finished_at = ${new Date().toISOString()}, applied_steps_count = 1, logs = NULL
      WHERE migration_name = ${MIGRATION_NAME}
    `;
    console.log("✓ Migración marcada como completada en _prisma_migrations");
  } else {
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        ${randomUUID()},
        'manual-repair',
        ${new Date().toISOString()},
        ${MIGRATION_NAME},
        NULL,
        NULL,
        ${new Date().toISOString()},
        1
      )
    `;
    console.log("✓ Registro de migración insertado en _prisma_migrations");
  }

  // 5. Verificar estado final
  const finalCols = await prisma.$queryRaw<{ name: string }[]>`
    PRAGMA table_info('PlaytimeSnapshot')
  `;
  console.log("\nColumnas finales:", finalCols.map((c) => c.name).join(", "));

  const snapshotCount = await prisma.playtimeSnapshot.count();
  console.log(`Snapshots totales: ${snapshotCount}`);
  console.log("\n✅ Reparación completada. Ejecuta: npx prisma migrate status");
}

main()
  .catch((e) => {
    console.error("❌ Error en reparación:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
