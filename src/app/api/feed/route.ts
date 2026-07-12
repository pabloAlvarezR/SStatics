import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { feedResponseSchema } from "@/lib/validators/api";
import { getRecentGamesFeed } from "@/services/feed.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const feed = await getRecentGamesFeed(session.user.id);
    return NextResponse.json(feedResponseSchema.parse(feed));
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json({ error: "Error al obtener feed" }, { status: 500 });
  }
}
