import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { gameHistorySchema } from "@/lib/validators/api";
import { getGameHistory } from "@/services/chart.service";

export async function GET(
  _request: NextRequest,
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

    const data = await getGameHistory(session.user.id, appId);

    if (!data) {
      return NextResponse.json({ error: "Juego no encontrado" }, { status: 404 });
    }

    return NextResponse.json(gameHistorySchema.parse(data));
  } catch (error) {
    console.error("Game history API error:", error);
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
  }
}
