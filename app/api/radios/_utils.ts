import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "radios.ts");

export type StoredRadio = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  description: string;
  streamUrl: string;
  logo: string;
  originalLogo: string;
  status: "online" | "offline";
  color: string;
};

export function readRadiosFile() {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/export const radios = ([\s\S]*);/);
  if (!match) return [];
  return Function(`return ${match[1]}`)();
}

export function writeRadiosFile(radios: any[]) {
  const content = `export const radios = ${JSON.stringify(radios, null, 2)};\n`;
  fs.writeFileSync(filePath, content, "utf8");
}

export function validateRadio(input: unknown): StoredRadio | null {
  if (!input || typeof input !== "object") return null;
  const radio = input as Record<string, unknown>;
  const id = Number(radio.id);
  const slug = String(radio.slug || "").trim();
  const name = String(radio.name || "").trim();
  const genre = String(radio.genre || "").trim();
  const description = String(radio.description || "").trim();
  const streamUrl = String(radio.streamUrl || "").trim();
  const logo = String(radio.logo || "").trim();
  const originalLogo = String(radio.originalLogo || "").trim();
  const status = radio.status === "offline" ? "offline" : "online";
  const color = String(radio.color || "from-cyan-600 to-fuchsia-900").trim();

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !/^[a-z0-9-]{1,80}$/.test(slug) ||
    !name ||
    name.length > 100 ||
    !genre ||
    genre.length > 100 ||
    description.length > 400 ||
    !logo.startsWith("/logos/") ||
    !/^from-[a-z0-9-]+ to-[a-z0-9-]+$/.test(color)
  ) {
    return null;
  }

  try {
    const url = new URL(streamUrl);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "stream.lacurulla.com"
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return {
    id,
    slug,
    name,
    genre,
    description,
    streamUrl,
    logo,
    originalLogo,
    status,
    color,
  };
}
