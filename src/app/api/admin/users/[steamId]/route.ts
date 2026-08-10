import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  adminUserTierResponseSchema,
  adminUserTierUpdateSchema,
} from "@/lib/validators/api";
import {
  AdminError,
  assertCallerIsOwner,
  getUserTierForAdmin,
  updateUserTierBySteamId,
} from "@/services/admin.service";

interface RouteContext {
  params: Promise<{ steamId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { steamId } = await context.params;

  try {
    await assertCallerIsOwner(session.user.id);
    const data = await getUserTierForAdmin(steamId);
    return NextResponse.json(adminUserTierResponseSchema.parse(data));
  } catch (error) {
    if (error instanceof AdminError) {
      const status =
        error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[GET /api/admin/users/[steamId]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { steamId } = await context.params;

  try {
    const body = await request.json();
    const updates = adminUserTierUpdateSchema.parse(body);
    const data = await updateUserTierBySteamId(session.user.id, steamId, updates);
    return NextResponse.json(adminUserTierResponseSchema.parse(data));
  } catch (error) {
    if (error instanceof AdminError) {
      const status =
        error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "PROTECTED_OWNER"
              ? 403
              : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("[PATCH /api/admin/users/[steamId]]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
