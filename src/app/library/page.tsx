import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LibraryGrid } from "@/components/library/LibraryGrid";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { prisma } from "@/lib/prisma";
import { getLibraryForUser } from "@/services/chart.service";
import { getDailyScanUsage } from "@/services/scan.service";
import { getUserStats } from "@/services/stats.service";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultView: true, gridDensity: true },
  });

  const [library, stats, scanUsage] = await Promise.all([
    getLibraryForUser(session.user.id),
    getUserStats(session.user.id),
    getDailyScanUsage(session.user.id),
  ]);

  const serverDefaults = {
    defaultView: (user?.defaultView ?? "grid") as "grid" | "list",
    gridDensity: (user?.gridDensity ?? "normal") as "compact" | "normal" | "large",
  };

  return (
    <div className="space-y-10">
      <StatsOverview initialData={stats} />
      <div className="border-t border-steam-border/20 pt-10">
        <LibraryGrid
          initialData={library}
          initialScanUsage={scanUsage}
          serverDefaults={serverDefaults}
        />
      </div>
    </div>
  );
}
