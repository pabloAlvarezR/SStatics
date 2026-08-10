import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/library",
  "/game",
  "/friends",
  "/profile",
  "/leaderboard",
  "/replay",
  "/share",
];

const useSecureCookies = process.env.NODE_ENV === "production";
const sessionCookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

/**
 * Middleware ligero para Edge: solo valida el JWT de sesión.
 * No importar @/lib/auth aquí — arrastra Prisma/Steam y supera el límite de 1 MB en Vercel.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirige /games/123 → /game/123 (ruta API usa plural; la página usa singular)
  if (pathname.startsWith("/games/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/games\//, "/game/");
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: useSecureCookies,
      cookieName: sessionCookieName,
    });

    if (!token) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("loginRequired", "1");
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/library/:path*",
    "/game/:path*",
    "/games/:path*",
    "/friends/:path*",
    "/profile/:path*",
    "/leaderboard/:path*",
    "/replay/:path*",
    "/share/:path*",
  ],
};
