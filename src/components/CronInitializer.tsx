import { startDailySyncCron } from "@/jobs/daily-sync";

/** node-cron solo en desarrollo local; en Vercel usa /api/cron/sync */
if (process.env.NODE_ENV === "development" && !process.env.VERCEL) {
  startDailySyncCron();
}

export function CronInitializer() {
  return null;
}
