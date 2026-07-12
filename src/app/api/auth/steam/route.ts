import { NextResponse } from "next/server";
import { getSteamLoginUrl } from "@/lib/steam-openid";

export async function GET() {
  try {
    const returnUrl = `${process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/steam/callback`;
    const authUrl = await getSteamLoginUrl(returnUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Steam login error:", error);
    return NextResponse.redirect("/?error=steam_login_failed");
  }
}
