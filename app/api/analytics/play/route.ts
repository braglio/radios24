import { NextResponse } from "next/server";
import { readRadiosFile } from "../../radios/_utils";
import { recordAnalytics } from "../../../../lib/analyticsStore";

export const dynamic = "force-dynamic";

const requestWindows = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(req: Request) {
  const key = req.headers.get("x-real-ip") || "anonymous";
  const now = Date.now();
  const current = requestWindows.get(key);

  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > 30;
}

export async function POST(req: Request) {
  try {
    if (isRateLimited(req)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = await req.json();
    const slug = String(body.slug || "").trim();
    const type = body.type === "open" ? "open" : body.type === "play" ? "play" : null;

    if (!type || !/^[a-z0-9-]{1,80}$/.test(slug)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const exists = readRadiosFile().some(
      (radio: { slug?: string; status?: string }) =>
        radio.slug === slug && radio.status === "online"
    );

    if (!exists) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    recordAnalytics(slug, type);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
