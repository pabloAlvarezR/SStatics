import { NextRequest, NextResponse } from "next/server";
import { syncAllUsers } from "@/services/sync.service";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/** Sync diario invocado por Vercel Cron (o manualmente con CRON_SECRET) */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const count = await syncAllUsers();
    return NextResponse.json({
      success: true,
      syncedUsers: count,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error en sync diario:", error);
    return NextResponse.json({ error: "Error en sync diario" }, { status: 500 });
  }
}
