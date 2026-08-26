import { NextResponse } from "next/server";
import { readRadiosFile, writeRadiosFile } from "../_utils";

export async function POST(req: Request) {
  const { id, direction } = await req.json();
  const radios = readRadiosFile();

  const index = radios.findIndex((r: any) => r.id === id);
  if (index === -1) return NextResponse.json({ radios });

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= radios.length) return NextResponse.json({ radios });

  [radios[index], radios[target]] = [radios[target], radios[index]];
  writeRadiosFile(radios);

  return NextResponse.json({ radios });
}
