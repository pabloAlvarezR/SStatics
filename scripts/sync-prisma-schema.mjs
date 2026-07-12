import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filename) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const databaseUrl = process.env.DATABASE_URL ?? "";
const provider =
  databaseUrl.startsWith("file:") || databaseUrl.startsWith("sqlite:")
    ? "sqlite"
    : "postgresql";

const schemaPath = path.join(root, "prisma", "schema.prisma");
const schema = fs.readFileSync(schemaPath, "utf8");
const nextSchema = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`,
);

if (nextSchema !== schema) {
  fs.writeFileSync(schemaPath, nextSchema);
}

const lockPath = path.join(root, "prisma", "migrations", "migration_lock.toml");
if (fs.existsSync(lockPath)) {
  const lock = fs.readFileSync(lockPath, "utf8");
  const nextLock = lock.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);
  if (nextLock !== lock) {
    fs.writeFileSync(lockPath, nextLock);
  }
}

console.log(`[prisma] DATABASE_URL → provider "${provider}"`);
