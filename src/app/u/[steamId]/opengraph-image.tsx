import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getLatestSnapshotsForLibrary } from "@/repositories/snapshot.repository";
import { minutesToHours } from "@/services/steam.service";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ steamId: string }>;
}

export default async function Image({ params }: Props) {
  const { steamId } = await params;
  const user = await prisma.user.findUnique({
    where: { steamId },
    select: {
      id: true,
      personaName: true,
      isProfilePublic: true,
      showStatsOnProfile: true,
    },
  });

  const name = user?.isProfilePublic ? user.personaName : "SStatics";
  let hoursText = "Perfil Steam";

  if (user?.isProfilePublic && user.showStatsOnProfile) {
    const latest = await getLatestSnapshotsForLibrary(user.id);
    const total = minutesToHours(
      latest.reduce((sum, g) => sum + g.playtimeMinutes, 0),
    );
    hoursText = `${total.toLocaleString("es-ES")} horas totales`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "#1b2838",
          color: "#c7d5e0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a4d007", marginBottom: 16 }}>SStatics</div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>{name}</div>
        <div style={{ fontSize: 32, color: "#8f98a0", marginTop: 24 }}>{hoursText}</div>
      </div>
    ),
    { ...size },
  );
}
