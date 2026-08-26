import { NextResponse } from "next/server";
import { readRadiosFile, writeRadiosFile } from "../_utils";

export async function POST(req: Request) {
  const { ids } = await req.json();

  if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const radios = readRadiosFile();
  const existingIds = radios.map((radio: { id: number }) => radio.id);
  const uniqueIds = new Set(ids);

  if (
    ids.length !== radios.length ||
    uniqueIds.size !== ids.length ||
    existingIds.some((id: number) => !uniqueIds.has(id))
  ) {
    return NextResponse.json(
      { error: "El orden no coincide con el catálogo actual" },
      { status: 409 }
    );
  }

  const byId = new Map(radios.map((radio: { id: number }) => [radio.id, radio]));
  const ordered = ids.map((id: number) => byId.get(id));

  writeRadiosFile(ordered);
  return NextResponse.json({ radios: ordered });
}
