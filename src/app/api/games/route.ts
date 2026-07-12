import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { libraryResponseSchema } from "@/lib/validators/api";
import { getLibraryForUser } from "@/services/chart.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const data = await getLibraryForUser(session.user.id);
    return NextResponse.json(libraryResponseSchema.parse(data));
  } catch (error) {
    console.error("Games API error:", error);
    return NextResponse.json({ error: "Error al obtener biblioteca" }, { status: 500 });
  }
}
