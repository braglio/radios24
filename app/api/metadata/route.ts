import { NextResponse } from "next/server";
import { readRadiosFile } from "../radios/_utils";
import { getSonicPanelInfo } from "../../../lib/sonicpanel";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();

  if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json(
      { ok: false, title: "Emisora no válida" },
      { status: 400 }
    );
  }

  const radio = readRadiosFile().find(
    (item: { slug?: string; status?: string; streamUrl?: string }) =>
      item.slug === slug && item.status === "online" && Boolean(item.streamUrl)
  );

  if (!radio) {
    return NextResponse.json(
      { ok: false, title: "Emisora no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(await getSonicPanelInfo(radio.streamUrl), {
    headers: {
      "Cache-Control": "public, max-age=10, stale-while-revalidate=20",
    },
  });
}
