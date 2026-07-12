import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/library", "/game", "/friends", "/profile"];

/**
 * Middleware ligero para Edge: solo valida el JWT de sesión.
 * No importar @/lib/auth aquí — arrastra Prisma/Steam y supera el límite de 1 MB en Vercel.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/game/:path*", "/friends/:path*", "/profile/:path*"],
};
