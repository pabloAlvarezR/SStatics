import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { StatsOverview } from "@/components/stats/StatsOverview";
import { prisma } from "@/lib/prisma";
import { profileResponseSchema } from "@/lib/validators/api";
import { getUserStats } from "@/services/stats.service";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/");

  const [profile, stats] = await Promise.all([
    Promise.resolve(
      profileResponseSchema.parse({
        id: user.id,
        steamId: user.steamId,
        personaName: user.personaName,
        avatarUrl: user.avatarUrl,
        profileUrl: user.profileUrl,
        bio: user.bio,
        isProfilePublic: user.isProfilePublic,
        defaultView: user.defaultView as "grid" | "list",
        gridDensity: user.gridDensity as "compact" | "normal" | "large",
        accentColor: user.accentColor,
        showStatsOnProfile: user.showStatsOnProfile,
        tier: (user as { tier?: string }).tier ?? "free",
        inviteCode: user.inviteCode,
        createdAt: user.createdAt.toISOString(),
        lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
      }),
    ),
    getUserStats(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <ProfileClient initialData={profile} />
      <section>
        <h2 className="mb-4 text-xl font-bold text-steam-text">Tus estadísticas</h2>
        <StatsOverview initialData={stats} compact />
      </section>
    </div>
  );
}
