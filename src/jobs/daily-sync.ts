import cron from "node-cron";
import { syncAllUsers } from "@/services/sync.service";

let cronStarted = false;

export function startDailySyncCron() {
  if (cronStarted || process.env.NODE_ENV === "test") return;
  cronStarted = true;

  cron.schedule("0 3 * * *", async () => {
    try {
      const count = await syncAllUsers();
      console.log(`[SStatics Cron] Sincronizados ${count} usuario(s)`);
    } catch (error) {
      console.error("[SStatics Cron] Error en sync diario:", error);
    }
  });

  console.log("[SStatics Cron] Sync diario programado a las 03:00");
}
