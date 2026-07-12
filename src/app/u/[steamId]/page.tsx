import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { prisma } from "@/lib/prisma";
import { getPublicUserStats } from "@/services/stats.service";

interface PublicProfilePageProps {
  params: Promise<{ steamId: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { steamId } = await params;

  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      id: true,
      steamId: true,
      personaName: true,
      avatarUrl: true,
      bio: true,
      isProfilePublic: true,
      showStatsOnProfile: true,
      createdAt: true,
    },
  });

  if (!user || !user.isProfilePublic) {
    notFound();
  }

  const stats = user.showStatsOnProfile ? await getPublicUserStats(user.id) : null;

  return (
    <div className="space-y-8">
      <div className="steam-panel p-4 sm:p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.personaName}
              width={96}
              height={96}
              className="rounded border border-steam-border/50"
            />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">{user.personaName}</h1>
            {user.bio && (
              <p className="mt-2 max-w-xl text-sm text-steam-text-muted">{user.bio}</p>
            )}
            <p className="mt-2 text-xs text-steam-text-muted">
              En SStatics desde {new Date(user.createdAt).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
      </div>

      {stats ? (
        <StatsOverview initialData={stats} />
      ) : (
        <div className="steam-panel px-6 py-12 text-center">
          <p className="text-steam-text-muted">Este usuario ha ocultado sus estadísticas.</p>
        </div>
      )}

      <div className="text-center">
        <Link href="/library" className="steam-btn-secondary min-h-11">
          Volver a mi biblioteca
        </Link>
      </div>
    </div>
  );
}
