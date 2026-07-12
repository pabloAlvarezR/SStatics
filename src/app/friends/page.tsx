import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FriendsList } from "@/components/friends/FriendsList";
import { getFriendsForUser } from "@/services/friends.service";

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.steamId) {
    redirect("/");
  }

  const friends = await getFriendsForUser(session.user.id, session.user.steamId);

  return <FriendsList initialData={friends} />;
}
