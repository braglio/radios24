import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readRadiosFile, writeRadiosFile } from "../_utils";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = Number(formData.get("id"));
  const file = formData.get("logo");

  if (!Number.isInteger(id) || !(file instanceof File)) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size < 1 || file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Usá una imagen PNG, JPG o WEBP de hasta 2 MB" },
      { status: 400 }
    );
  }

  const radios = readRadiosFile();
  const index = radios.findIndex((radio: { id: number }) => radio.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Emisora no encontrada" }, { status: 404 });
  }

  const filename = `radio-${id}-${randomUUID()}.${extension}`;
  const destination = path.join(process.cwd(), "public", "logos", filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(destination, bytes, { mode: 0o644 });
  radios[index] = { ...radios[index], logo: `/logos/${filename}` };
  writeRadiosFile(radios);

  return NextResponse.json({ radios });
}
