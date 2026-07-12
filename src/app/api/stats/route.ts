import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { statsResponseSchema } from "@/lib/validators/api";
import { getUserStats } from "@/services/stats.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const stats = await getUserStats(session.user.id);
    return NextResponse.json(statsResponseSchema.parse(stats));
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
