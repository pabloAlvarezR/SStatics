import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { leaderboardResponseSchema } from "@/lib/validators/api";
import { getFriendsLeaderboard } from "@/services/leaderboard.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const data = await getFriendsLeaderboard(session.user.id);
    return NextResponse.json(leaderboardResponseSchema.parse(data));
  } catch (error) {
    console.error("[GET /api/leaderboard]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
