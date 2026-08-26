import { NextResponse } from "next/server";
import { readAnalytics } from "../../../../lib/analyticsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const { openEvents, playEvents, byRadio, updatedAt } = readAnalytics();

  return NextResponse.json(
    { openEvents, playEvents, byRadio, updatedAt },
    { headers: { "Cache-Control": "no-store" } }
  );
}
