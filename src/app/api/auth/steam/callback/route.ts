import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth";
import { createSteamLoginProof } from "@/lib/steam-login-proof";
import { verifySteamLogin } from "@/lib/steam-openid";

export async function GET(request: NextRequest) {
  let steamId: string | null = null;

  try {
    steamId = await verifySteamLogin(request);
  } catch (error) {
    console.error("Steam verification error:", error);
    return Response.redirect(new URL("/?error=steam_callback_failed", request.url));
  }

  if (!steamId) {
    return Response.redirect(new URL("/?error=steam_verification_failed", request.url));
  }

  // signIn lanza NEXT_REDIRECT en éxito — no capturar ese error
  const loginProof = await createSteamLoginProof(steamId);
  return signIn("steam", {
    steamId,
    loginProof,
    redirectTo: "/library",
  });
}
