const PROOF_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres");
  }
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Prueba de un solo uso tras verificar OpenID — evita login con steamId arbitrario */
export async function createSteamLoginProof(steamId: string): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacSha256(getSecret(), `${steamId}:${ts}`);
  return `${ts}.${sig}`;
}

export async function verifySteamLoginProof(
  steamId: string,
  proof: string | undefined,
): Promise<boolean> {
  if (!proof) return false;

  const [ts, sig] = proof.split(".");
  if (!ts || !sig) return false;

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return false;

  const age = Date.now() - timestamp;
  if (age < 0 || age > PROOF_TTL_MS) return false;

  const expected = await hmacSha256(getSecret(), `${steamId}:${ts}`);
  return timingSafeEqualHex(sig, expected);
}
