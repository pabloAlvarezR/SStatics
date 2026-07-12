declare module "openid" {
  export class RelyingParty {
    constructor(returnUrl: string, realm: string, stateless?: boolean, strict?: boolean, extensions?: unknown[]);
    authenticate(
      providerUrl: string,
      immediate: boolean,
      callback: (error: Error | null, authUrl?: string) => void,
    ): void;
    verifyAssertion(
      requestOrUrl: string | { method: string; url: string; headers?: Record<string, string> },
      callback: (
        error: Error | null,
        result?: { authenticated: boolean; claimedIdentifier?: string },
      ) => void,
    ): void;
  }
}
