import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gameFriendsComparisonResponseSchema } from "@/lib/validators/api";
import { getFriendsGameComparison } from "@/services/game-friends.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { appId: appIdParam } = await params;
    const appId = parseInt(appIdParam, 10);

    if (isNaN(appId)) {
      return NextResponse.json({ error: "AppID inválido" }, { status: 400 });
    }

    const cacheOnly = request.nextUrl.searchParams.get("cacheOnly") === "1";

    const data = await getFriendsGameComparison(session.user.id, appId, { cacheOnly });
    return NextResponse.json(gameFriendsComparisonResponseSchema.parse(data));
  } catch (error) {
    console.error("Game friends comparison API error:", error);
    return NextResponse.json({ error: "Error al obtener comparación" }, { status: 500 });
  }
}
