import { NextResponse } from "next/server";
import { readRadiosFile } from "../_utils";
import { getSonicPanelInfo } from "../../../../lib/sonicpanel";

export const dynamic = "force-dynamic";

type LiveResponse = {
  total: number;
  online: number;
  offline: number;
  listeners: number;
  radios: Array<{
    id: number;
    slug: string;
    name: string;
    isOnline: boolean;
    title: string;
    listeners: number;
    bitrate: string;
    art: string;
  }>;
};

let cached: { expiresAt: number; value: LiveResponse } | null = null;

export async function GET() {
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.value, {
      headers: { "Cache-Control": "private, max-age=10" },
    });
  }

  const radios = readRadiosFile().filter(
    (radio: { status?: string; streamUrl?: string }) =>
      radio.status === "online" && Boolean(radio.streamUrl)
  );

  const results = await Promise.all(
    radios.map(async (radio: any) => {
      const info = await getSonicPanelInfo(radio.streamUrl);

      return {
        id: radio.id,
        slug: radio.slug,
        name: radio.name,
        isOnline: info.ok,
        title: info.title,
        listeners: info.listeners,
        bitrate: info.bitrate,
        art: info.art,
      };
    })
  );

  const online = results.filter((radio) => radio.isOnline).length;
  const offline = results.length - online;
  const listeners = results.reduce(
    (sum, radio) => sum + Number(radio.listeners || 0),
    0
  );
  const value = { total: results.length, online, offline, listeners, radios: results };

  cached = { expiresAt: Date.now() + 20_000, value };

  return NextResponse.json(value, {
    headers: { "Cache-Control": "private, max-age=10" },
  });
}
