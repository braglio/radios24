import { NextResponse } from "next/server";
import { readRadiosFile, writeRadiosFile } from "../_utils";

export async function POST(req: Request) {
  const { id } = await req.json();
  const radios = readRadiosFile();

  const radio = radios.find((r: any) => r.id === id);
  if (radio) {
    radio.status = radio.status === "online" ? "offline" : "online";
  }

  writeRadiosFile(radios);
  return NextResponse.json({ radios });
}
