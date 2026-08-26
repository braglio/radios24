import { NextResponse } from "next/server";
import { readRadiosFile, validateRadio, writeRadiosFile } from "../_utils";

export async function POST(req: Request) {
  const updated = validateRadio(await req.json());
  if (!updated) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const radios = readRadiosFile();

  const index = radios.findIndex((radio: { id: number }) => radio.id === updated.id);
  if (index === -1) {
    return NextResponse.json({ error: "Emisora no encontrada" }, { status: 404 });
  }

  radios[index] = updated;
  writeRadiosFile(radios);
  return NextResponse.json({ radios });
}
