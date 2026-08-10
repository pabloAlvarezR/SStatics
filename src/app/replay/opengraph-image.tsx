import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { getMonthlyReplay } from "@/services/replay.service";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const session = await auth();
  const now = new Date();
  let title = "Replay SStatics";
  let subtitle = "Tu mes en Steam";

  if (session?.user?.id) {
    const data = await getMonthlyReplay(
      session.user.id,
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
    );
    if (data) {
      title = data.label;
      subtitle = `+${data.hoursGained.toLocaleString("es-ES")} h ganadas`;
    }
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
          background: "#171a21",
          color: "#c7d5e0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a4d007", marginBottom: 16 }}>SStatics Replay</div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 32, color: "#8f98a0", marginTop: 20 }}>{subtitle}</div>
      </div>
    ),
    { ...size },
  );
}
