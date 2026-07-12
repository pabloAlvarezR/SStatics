import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifySteamLoginProof } from "@/lib/steam-login-proof";
import { getPlayerSummary } from "@/services/steam.service";
import { resolveUserTier } from "@/lib/tier";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      steamId: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    steamId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "steam",
      name: "Steam",
      credentials: {
        steamId: { label: "Steam ID", type: "text" },
        loginProof: { label: "Login proof", type: "text" },
      },
      async authorize(credentials) {
        const steamId = credentials?.steamId as string | undefined;
        const loginProof = credentials?.loginProof as string | undefined;

        if (!steamId || !(await verifySteamLoginProof(steamId, loginProof))) {
          return null;
        }

        let personaName = `Usuario ${steamId.slice(-4)}`;
        let avatarUrl: string | null = null;
        let profileUrl: string | null = null;

        try {
          const summary = await getPlayerSummary(steamId);
          if (summary) {
            personaName = summary.personaname;
            avatarUrl = summary.avatarfull;
            profileUrl = summary.profileurl;
          }
        } catch {
          // Continue with defaults if profile fetch fails
        }

        const existing = await prisma.user.findUnique({
          where: { steamId },
          select: { tier: true },
        });
        const tier = resolveUserTier(personaName, existing?.tier, steamId);

        const user = await prisma.user.upsert({
          where: { steamId },
          create: {
            steamId,
            personaName,
            avatarUrl,
            profileUrl,
            tier,
          },
          update: {
            personaName,
            avatarUrl,
            profileUrl,
            tier,
          },
        });

        return {
          id: user.id,
          steamId: user.steamId,
          name: user.personaName,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.steamId = user.steamId;
      }
      return token;
    },
    async session({ session, token }) {
      const id = token.id as string | undefined;
      const steamId = token.steamId as string | undefined;
      if (id && steamId) {
        session.user.id = id;
        session.user.steamId = steamId;
      }
      return session;
    },
  },
  trustHost: true,
});
