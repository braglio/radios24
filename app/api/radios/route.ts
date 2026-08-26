import { NextResponse } from "next/server";
import { readRadiosFile, validateRadio, writeRadiosFile } from "./_utils";

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

export async function POST(request: Request) {
  const radios = readRadiosFile();
  const nextId = radios.reduce(
    (highest: number, radio: { id?: number }) =>
      Math.max(highest, Number(radio.id) || 0),
    0
  ) + 1;
  const radio = validateRadio({ ...(await request.json()), id: nextId });

  if (!radio) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (radios.some((item: { slug?: string }) => item.slug === radio.slug)) {
    return NextResponse.json(
      { error: "Ya existe una emisora con ese slug" },
      { status: 409 }
    );
  }

  const updatedRadios = [...radios, radio];
  writeRadiosFile(updatedRadios);

  return NextResponse.json({ radios: updatedRadios, radio }, { status: 201 });
}
