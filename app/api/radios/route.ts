import { NextResponse } from "next/server";
import { readRadiosFile } from "./_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const radios = readRadiosFile();

  return NextResponse.json(
    { radios },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
