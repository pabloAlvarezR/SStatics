import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scanUsageSchema } from "@/lib/validators/api";
import { getDailyScanUsage } from "@/services/scan.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const usage = await getDailyScanUsage(session.user.id);
    return NextResponse.json(scanUsageSchema.parse(usage));
  } catch (error) {
    console.error("Scans API error:", error);
    return NextResponse.json({ error: "Error al obtener escaneos" }, { status: 500 });
  }
}
