import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";
import { getFriendsLeaderboard } from "@/services/leaderboard.service";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.steamId) {
    redirect("/?loginRequired=1&callbackUrl=/leaderboard");
  }

  const data = await getFriendsLeaderboard(session.user.id);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-steam-green">
          Entre amigos
        </p>
        <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">Leaderboard</h1>
        <p className="max-w-2xl text-sm text-steam-text-muted">
          Horas ganadas en los últimos 7 días entre tú y tus amigos en SStatics. El ranking
          global llegará cuando haya más gente en la plataforma.
        </p>
      </header>

      <LeaderboardClient initialData={data} />

      <div className="text-center">
        <Link href="/friends" className="steam-btn-secondary min-h-11">
          Ver amigos
        </Link>
      </div>
    </div>
  );
}
