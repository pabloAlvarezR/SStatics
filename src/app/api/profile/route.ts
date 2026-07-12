import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { profileResponseSchema, profileUpdateSchema } from "@/lib/validators/api";
import { prisma } from "@/lib/prisma";

function toProfileResponse(user: {
  id: string;
  steamId: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  bio: string | null;
  isProfilePublic: boolean;
  defaultView: string;
  gridDensity: string;
  accentColor: string | null;
  showStatsOnProfile: boolean;
  inviteCode: string;
  createdAt: Date;
  lastSyncAt: Date | null;
}) {
  return profileResponseSchema.parse({
    id: user.id,
    steamId: user.steamId,
    personaName: user.personaName,
    avatarUrl: user.avatarUrl,
    profileUrl: user.profileUrl,
    bio: user.bio,
    isProfilePublic: user.isProfilePublic,
    defaultView: user.defaultView as "grid" | "list",
    gridDensity: user.gridDensity as "compact" | "normal" | "large",
    accentColor: user.accentColor,
    showStatsOnProfile: user.showStatsOnProfile,
    inviteCode: user.inviteCode,
    tier: (user as { tier?: string }).tier ?? "free",
    createdAt: user.createdAt.toISOString(),
    lastSyncAt: user.lastSyncAt?.toISOString() ?? null,
  });
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(toProfileResponse(user));
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const updates = profileUpdateSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json(toProfileResponse(user));
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
