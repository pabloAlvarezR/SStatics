import type { FriendActivityItem } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";
import { getUserHoursDelta } from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";
import { getFriendsForUser } from "@/services/friends.service";

/** Top amigos en plataforma por horas ganadas en 7d (perfiles públicos). */
export async function getFriendActivitySnippets(
  userId: string,
  steamId: string,
  limit = 3,
): Promise<FriendActivityItem[]> {
  const friendsData = await getFriendsForUser(userId, steamId);
  const platformFriends = friendsData.friends.filter(
    (f) => f.isOnPlatform && f.sstaticsUserId && f.isProfilePublic,
  );

  if (platformFriends.length === 0) return [];

  const scored = await Promise.all(
    platformFriends.map(async (f) => {
      const delta = await getUserHoursDelta(f.sstaticsUserId!, 7);
      return {
        steamId: f.steamId,
        personaName: f.personaName,
        avatarUrl: f.avatarUrl,
        hoursGained7d: minutesToHours(delta),
      };
    }),
  );

  return scored
    .filter((f) => f.hoursGained7d > 0)
    .sort((a, b) => b.hoursGained7d - a.hoursGained7d)
    .slice(0, limit);
}

export async function getCurrentUserInviteCode(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });
  return user?.inviteCode ?? null;
}
