import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ReplayClient } from "@/components/replay/ReplayClient";
import { getMonthlyReplay } from "@/services/replay.service";

interface ReplayPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function ReplayPage({ searchParams }: ReplayPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?loginRequired=1&callbackUrl=/replay");
  }

  const params = await searchParams;
  const now = new Date();
  const year = Number(params.year) || now.getUTCFullYear();
  const month = Number(params.month) || now.getUTCMonth() + 1;

  const data = await getMonthlyReplay(session.user.id, year, month);
  if (!data) {
    redirect("/replay");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wider text-steam-green">
          Replay mensual
        </p>
        <h1 className="text-2xl font-bold text-steam-text sm:text-3xl">{data.label}</h1>
        <p className="max-w-2xl text-sm text-steam-text-muted">
          Resumen generado a partir de tus snapshots diarios en SStatics.
        </p>
      </header>

      <ReplayClient initialData={data} />

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/share/week" className="steam-btn-secondary min-h-11">
          Compartir mi semana
        </Link>
        <Link href="/" className="steam-btn-secondary min-h-11">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
