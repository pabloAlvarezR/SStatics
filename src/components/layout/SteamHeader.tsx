import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Ps1FaceButtons } from "@/components/ps1/Ps1FaceButtons";
import { SyncButton } from "@/components/ui/SyncButton";
import { getDailyScanUsage } from "@/services/scan.service";

export async function SteamHeader() {
  const session = await auth();
  const scanUsage = session?.user?.id
    ? await getDailyScanUsage(session.user.id)
    : undefined;

  return (
    <header className="sticky top-0 z-50 border-b border-steam-border/30 bg-steam-bg-dark/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={session ? "/" : "/"} className="group flex items-center gap-3" data-ps1-logo>
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#030606] p-0.5">
            <Image
              src="/branding/logo-pequeno.png"
              alt="SStatics"
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-bold tracking-tight text-steam-text group-hover:text-steam-green transition-colors">
              SStatics
            </span>
            <span className="ml-2 text-xs text-steam-text-muted">Steam Analytics</span>
            <Ps1FaceButtons size="xs" className="ml-2 opacity-25 transition-opacity group-hover:opacity-60" />
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {session ? (
            <>
              <Link
                href="/"
                className="min-h-11 rounded px-2 py-2 text-xs font-medium text-steam-text-muted transition-colors hover:text-steam-link sm:px-3 sm:text-sm"
              >
                Inicio
              </Link>
              <Link
                href="/library"
                className="min-h-11 rounded px-2 py-2 text-xs font-medium text-steam-text-muted transition-colors hover:text-steam-link sm:px-3 sm:text-sm"
              >
                Biblioteca
              </Link>
              <Link
                href="/friends"
                className="min-h-11 rounded px-2 py-2 text-xs font-medium text-steam-text-muted transition-colors hover:text-steam-link sm:px-3 sm:text-sm"
              >
                Amigos
              </Link>
              <Link
                href="/leaderboard"
                className="min-h-11 rounded px-2 py-2 text-xs font-medium text-steam-text-muted transition-colors hover:text-steam-link sm:px-3 sm:text-sm"
              >
                Ranking
              </Link>
              <Link
                href="/profile"
                className="hidden min-h-11 rounded px-3 py-2 text-sm font-medium text-steam-text-muted transition-colors hover:text-steam-link sm:block"
              >
                Perfil
              </Link>
              <SyncButton initialScanUsage={scanUsage} />
              <div className="flex items-center gap-2 border-l border-steam-border/30 pl-2 sm:pl-4">
                <Link href="/profile" className="flex items-center gap-2">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? "Avatar"}
                      width={32}
                      height={32}
                      className="rounded-sm border border-steam-border/50"
                    />
                  )}
                  <span className="hidden max-w-[100px] truncate text-sm font-medium text-steam-text md:block">
                    {session.user.name}
                  </span>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="min-h-11 text-xs text-steam-text-muted transition-colors hover:text-steam-link sm:text-sm"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </>
          ) : (
            <Link href="/api/auth/steam" className="steam-btn-primary text-sm">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
