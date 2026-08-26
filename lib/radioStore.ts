import fs from "fs";
import path from "path";
import prisma from "./prisma";

function readFallbackRadios() {
  try {
    const filePath = path.join(process.cwd(), "data", "radios.ts");
    const raw = fs.readFileSync(filePath, "utf8");
    const match = raw.match(/export const radios = ([\s\S]*);\s*$/);

    if (!match) return [];

    const radios = Function(`return ${match[1]}`)();

    return radios.map((radio: any, index: number) => ({
      ...radio,
      position: radio.position || index + 1,
    }));
  } catch (error) {
    console.error("Fallback radios error:", error);
    return [];
  }
}

export async function getRadios() {
  try {
    return await prisma.radio.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
    });
  } catch (error) {
    console.error("DB getRadios error. Using fallback:", error);
    return readFallbackRadios();
  }
}

export async function getRadioBySlug(slug: string) {
  try {
    const radio = await prisma.radio.findUnique({
      where: { slug },
    });

    if (radio) return radio;
  } catch (error) {
    console.error("DB getRadioBySlug error. Using fallback:", error);
  }

  return readFallbackRadios().find((radio: any) => radio.slug === slug) || null;
}

export async function reorderRadios(radios: any[]) {
  try {
    await prisma.$transaction(
      radios.map((radio, index) =>
        prisma.radio.update({
          where: { id: Number(radio.id) },
          data: { position: index + 1 },
        })
      )
    );

    return await getRadios();
  } catch (error) {
    console.error("DB reorderRadios error:", error);
    return radios;
  }
}

export async function toggleRadio(id: number) {
  try {
    const radio = await prisma.radio.findUnique({
      where: { id: Number(id) },
    });

    if (!radio) return await getRadios();

    await prisma.radio.update({
      where: { id: Number(id) },
      data: {
        status: radio.status === "online" ? "offline" : "online",
      },
    });

    return await getRadios();
  } catch (error) {
    console.error("DB toggleRadio error:", error);
    return await getRadios();
  }
}

export async function updateRadio(updated: any) {
  try {
    await prisma.radio.update({
      where: { id: Number(updated.id) },
      data: {
        slug: updated.slug,
        name: updated.name,
        genre: updated.genre,
        description: updated.description,
        streamUrl: updated.streamUrl,
        logo: updated.logo,
        originalLogo: updated.originalLogo || "",
        status: updated.status || "online",
        color: updated.color || "from-cyan-600 to-fuchsia-900",
      },
    });

    return await getRadios();
  } catch (error) {
    console.error("DB updateRadio error:", error);
    return await getRadios();
  }
}
