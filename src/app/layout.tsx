import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SteamHeader } from "@/components/layout/SteamHeader";
import { Ps1EasterEggs } from "@/components/ps1/Ps1EasterEggs";
import { Ps1Footer } from "@/components/ps1/Ps1Footer";
import { CronInitializer } from "@/components/CronInitializer";
import { QueryProvider } from "@/lib/query-client";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SStatics — Estadísticas de Steam",
  description:
    "Visualiza tus horas de juego en Steam con gráficos de evolución. Analiza tu biblioteca, compara con amigos y personaliza tu perfil.",
  icons: {
    icon: "/branding/logo-pequeno.png",
    apple: "/branding/logo-pequeno.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans ps1-scanlines">
        <QueryProvider>
          <CronInitializer />
          <SteamHeader />
          <div className="flex min-h-screen flex-col">
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
              {children}
            </main>
            <Ps1Footer />
          </div>
          <Ps1EasterEggs />
        </QueryProvider>
      </body>
    </html>
  );
}
