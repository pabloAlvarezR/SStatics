import { NextRequest, NextResponse } from "next/server";
import { AUTH_CALLBACK_COOKIE, isSafeCallbackPath } from "@/lib/auth-callback";
import { getSteamLoginUrl } from "@/lib/steam-openid";

export async function GET(request: NextRequest) {
  try {
    const returnUrl = `${process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/steam/callback`;
    const authUrl = await getSteamLoginUrl(returnUrl);
    const response = NextResponse.redirect(authUrl);

    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (isSafeCallbackPath(callbackUrl)) {
      response.cookies.set(AUTH_CALLBACK_COOKIE, callbackUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Steam login error:", error);
    return NextResponse.redirect("/?error=steam_login_failed");
  }
}
