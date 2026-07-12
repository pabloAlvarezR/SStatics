export const AUTH_CALLBACK_COOKIE = "sstatics_callback_url";

export function isSafeCallbackPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}
