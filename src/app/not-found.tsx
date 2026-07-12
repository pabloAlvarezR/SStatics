import Image from "next/image";
import Link from "next/link";
import { Ps1PeekImage } from "@/components/ps1/Ps1PeekImage";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
      <div className="mb-6 rounded-lg bg-[#030606] p-3" data-ps1-logo>
        <Image
          src="/branding/logo-pequeno.png"
          alt="SStatics"
          width={64}
          height={64}
        />
      </div>

      <h1 className="text-6xl font-bold text-steam-green">404</h1>
      <p className="mt-4 text-lg text-steam-text">Página no encontrada</p>
      <p className="mt-2 max-w-md text-sm text-steam-text-muted">
        El juego o la página que buscas no existe.
      </p>

      <div className="mt-8 space-y-3">
        <Ps1PeekImage
          src="/branding/medievil.png"
          hint="Pasa el cursor · Sir Daniel tiene algo que decir"
          className="max-w-[200px]"
        />
        <p className="max-w-sm text-xs italic text-steam-text-muted/80">
          &ldquo;Esta página ha pasado al más allá... como yo.&rdquo;
          <span className="mt-1 block text-[10px] not-italic text-steam-text-muted/50">
            — MediEvil, 1998
          </span>
        </p>
      </div>

      <Link href="/" className="steam-btn-primary mt-10 min-h-11">
        △ Volver al inicio
      </Link>
    </div>
  );
}
