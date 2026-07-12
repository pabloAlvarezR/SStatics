import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GameDetailClient } from "@/components/game/GameDetailClient";
import { getGameHistory } from "@/services/chart.service";
import { getDailyScanUsage } from "@/services/scan.service";

interface GamePageProps {
  params: Promise<{ appId: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?loginRequired=1");
  }

  const { appId: appIdParam } = await params;
  const appId = parseInt(appIdParam, 10);

  if (isNaN(appId)) {
    notFound();
  }

  const [history, scanUsage] = await Promise.all([
    getGameHistory(session.user.id, appId),
    getDailyScanUsage(session.user.id),
  ]);

  if (!history) {
    notFound();
  }

  return (
    <GameDetailClient
      key={appId}
      appId={appId}
      initialData={history}
      initialScanUsage={scanUsage}
    />
  );
}
