import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { HomeFeed } from "@/components/home/HomeFeed";
import { getRecentGamesFeed } from "@/services/feed.service";

interface HomeProps {
  searchParams: Promise<{ error?: string; invite?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  steam_login_failed: "No se pudo iniciar el login con Steam. Inténtalo de nuevo.",
  steam_verification_failed: "La verificación de Steam falló. Inténtalo de nuevo.",
  steam_callback_failed: "Error en el callback de Steam. Inténtalo de nuevo.",
};

function LandingPage({
  errorMessage,
  inviteCode,
}: {
  errorMessage: string | null;
  inviteCode?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <section className="flex w-full max-w-4xl flex-col items-center py-12 text-center sm:py-20">
        <div className="mb-6 rounded-xl bg-[#030606] p-3 shadow-2xl shadow-steam-green/10 sm:p-4" data-ps1-logo>
          <Image
            src="/branding/logo-grande.png"
            alt="SStatics"
            width={200}
            height={200}
            className="h-16 w-auto sm:h-24"
            priority
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-steam-text sm:text-5xl lg:text-6xl">
          Tus estadísticas de{" "}
          <span className="bg-gradient-to-r from-steam-green to-[#c4e830] bg-clip-text text-transparent">
            Steam
          </span>
          , visualizadas
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-steam-text-muted sm:text-lg">
          Analiza las horas invertidas en cada juego de tu biblioteca. Compara con amigos,
          personaliza tu perfil y descubre en qué percentil de jugadores estás.
        </p>

        {inviteCode && (
          <div className="mt-6 w-full max-w-md rounded border border-steam-green/30 bg-steam-green/10 px-4 py-3 text-sm text-steam-green">
            ¡Te han invitado a SStatics! Inicia sesión con Steam para unirte.
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 w-full max-w-md rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link href="/api/auth/steam" className="steam-btn-primary min-w-[220px] text-base">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            Iniciar sesión con Steam
          </Link>
        </div>

        <p className="mt-6 max-w-lg text-xs text-steam-text-muted sm:text-sm">
          Requiere que los <strong className="text-steam-text">detalles de juegos</strong> de tu
          perfil de Steam sean públicos para sincronizar la biblioteca.
        </p>
      </section>

      <section className="grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
        {[
          {
            title: "Resumen diario",
            desc: "Tus últimos juegos jugados y su evolución al iniciar sesión.",
          },
          {
            title: "Gráficos de evolución",
            desc: "Sigue cómo crecen tus horas con el tiempo, punto a punto.",
          },
          {
            title: "Amigos en la plataforma",
            desc: "Descubre qué amigos de Steam ya usan SStatics e invita al resto.",
          },
          {
            title: "Perfil personalizable",
            desc: "Bio, preferencias de vista y perfil público para compartir tus stats.",
          },
          {
            title: "Modo nostálgico",
            desc: "Hay detalles escondidos de la era PS1 por toda la web. ¿Los encuentras todos?",
          },
        ].map((feature) => (
          <div key={feature.title} className="steam-panel p-5 sm:p-6">
            <h3 className="text-base font-semibold text-steam-text">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-steam-text-muted">{feature.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user?.id) {
    const feed = await getRecentGamesFeed(session.user.id);
    return <HomeFeed initialData={feed} userName={session.user.name} />;
  }

  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;

  return <LandingPage errorMessage={errorMessage} inviteCode={params.invite} />;
}
