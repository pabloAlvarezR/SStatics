import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OwnerTierControls } from "@/components/profile/OwnerTierControls";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { auth } from "@/lib/auth";
import { isOwnerSteamId, isOwnerTier } from "@/lib/tier";
import { prisma } from "@/lib/prisma";
import { getPublicUserStats } from "@/services/stats.service";
import { minutesToHours } from "@/services/steam.service";
import { getLatestSnapshotsForLibrary } from "@/repositories/snapshot.repository";

interface PublicProfilePageProps {
  params: Promise<{ steamId: string }>;
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { steamId } = await params;
  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      personaName: true,
      bio: true,
      isProfilePublic: true,
      showStatsOnProfile: true,
      id: true,
    },
  });

  if (!user || !user.isProfilePublic) {
    return { title: "Perfil no disponible · SStatics" };
  }

  let hoursLabel = "";
  if (user.showStatsOnProfile) {
    const latest = await getLatestSnapshotsForLibrary(user.id);
    const totalMinutes = latest.reduce((sum, g) => sum + g.playtimeMinutes, 0);
    hoursLabel = ` · ${minutesToHours(totalMinutes).toLocaleString("es-ES")} h`;
  }

  const title = `${user.personaName}${hoursLabel} · SStatics`;
  const description =
    user.bio?.trim() ||
    `Perfil de ${user.personaName} en SStatics — estadísticas de Steam.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { steamId } = await params;
  const session = await auth();

  let viewerIsOwner = false;
  if (session?.user?.id) {
    const viewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tier: true, steamId: true },
    });
    viewerIsOwner = Boolean(
      viewer && (isOwnerTier(viewer.tier) || isOwnerSteamId(viewer.steamId)),
    );
  }

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
      tier: true,
      unlimitedScans: true,
    },
  });

  if (!user) {
    notFound();
  }

  if (!user.isProfilePublic && !viewerIsOwner) {
    notFound();
  }

  const stats = user.showStatsOnProfile ? await getPublicUserStats(user.id) : null;
  const canManageTiers =
    viewerIsOwner &&
    session?.user?.steamId !== user.steamId &&
    !isOwnerTier(user.tier) &&
    !isOwnerSteamId(user.steamId);

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
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">
              {user.personaName}
            </h1>
            {user.bio && (
              <p className="mt-2 max-w-xl text-sm text-steam-text-muted">{user.bio}</p>
            )}
            <p className="mt-2 text-xs text-steam-text-muted">
              En SStatics desde {new Date(user.createdAt).toLocaleDateString("es-ES")}
              {!user.isProfilePublic && viewerIsOwner && (
                <span className="ml-2 text-steam-text-muted/60">(perfil privado)</span>
              )}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <ShareProfileButton steamId={user.steamId} />
            </div>
            {canManageTiers && (
              <OwnerTierControls
                steamId={user.steamId}
                initialTier={user.tier}
                initialUnlimitedScans={user.unlimitedScans}
              />
            )}
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
