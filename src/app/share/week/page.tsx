import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WeekShareClient } from "@/components/share/WeekShareClient";
import { getWeekShare } from "@/services/replay.service";

export default async function WeekSharePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/?loginRequired=1&callbackUrl=/share/week");
  }

  const data = await getWeekShare(session.user.id);
  if (!data) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-steam-green">
          Mi semana
        </p>
        <h1 className="text-2xl font-bold text-steam-text">Comparte tu progreso</h1>
      </header>

      <WeekShareClient initialData={data} />

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/replay" className="steam-btn-secondary min-h-11">
          Ver replay del mes
        </Link>
        <Link href="/" className="steam-btn-secondary min-h-11">
          Inicio
        </Link>
      </div>
    </div>
  );
}
