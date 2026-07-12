import { RelyingParty } from "openid";
import type { NextRequest } from "next/server";

function getRealm(): string {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function createRelyingParty(returnUrl: string): RelyingParty {
  return new RelyingParty(returnUrl, getRealm(), true, false, []);
}

export function getSteamLoginUrl(returnUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rp = createRelyingParty(returnUrl);
    rp.authenticate("https://steamcommunity.com/openid", false, (error, authUrl) => {
      if (error) reject(error);
      else if (!authUrl) reject(new Error("No se pudo generar URL de autenticación"));
      else resolve(authUrl);
    });
  });
}

export function verifySteamLogin(request: NextRequest): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const returnUrl = `${getRealm()}/api/auth/steam/callback`;
    const rp = createRelyingParty(returnUrl);

    // openid.verifyAssertion acepta la URL completa (con query string) o un req HTTP
    rp.verifyAssertion(request.url, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result?.authenticated || !result.claimedIdentifier) {
        resolve(null);
        return;
      }

      const match = result.claimedIdentifier.match(/\/id\/(\d+)$/);
      resolve(match ? match[1] : null);
    });
  });
}
