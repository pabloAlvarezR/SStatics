import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { getWeekShare } from "@/services/replay.service";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const session = await auth();
  let title = "Mi semana en SStatics";
  let subtitle = "Horas ganadas · 7 días";

  if (session?.user?.id) {
    const data = await getWeekShare(session.user.id);
    if (data) {
      title = data.personaName;
      subtitle = `+${data.hours7d.toLocaleString("es-ES")} h esta semana`;
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
          background: "#1b2838",
          color: "#c7d5e0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a4d007", marginBottom: 16 }}>SStatics</div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 36, color: "#a4d007", marginTop: 24 }}>{subtitle}</div>
      </div>
    ),
    { ...size },
  );
}
