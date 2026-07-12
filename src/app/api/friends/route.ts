import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { friendsResponseSchema } from "@/lib/validators/api";
import { getFriendsForUser } from "@/services/friends.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.steamId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getFriendsForUser(session.user.id, session.user.steamId);
    return NextResponse.json(friendsResponseSchema.parse(data));
  } catch (error) {
    console.error("Friends API error:", error);
    return NextResponse.json({ error: "Error al obtener amigos" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.steamId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getFriendsForUser(session.user.id, session.user.steamId, {
      forceSync: true,
    });
    return NextResponse.json(friendsResponseSchema.parse(data));
  } catch (error) {
    console.error("Friends sync API error:", error);
    return NextResponse.json({ error: "Error al sincronizar amigos" }, { status: 500 });
  }
}
