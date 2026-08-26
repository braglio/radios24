import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  readRadiosFile,
  type StoredRadio,
} from "@/app/api/radios/_utils";
import PlayerClient from "@/components/PlayerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PlayerPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const radios = readRadiosFile();
  const radio = radios.find(
    (item: StoredRadio) => item.slug === slug && item.status === "online"
  );

  if (!radio) return { title: "Emisora no encontrada" };

  return {
    title: `Escuchar ${radio.name}`,
    description: `${radio.description} Escuchá ${radio.name} en vivo por Radios 24.`,
    alternates: { canonical: `/player/${radio.slug}` },
    openGraph: {
      title: `${radio.name} en vivo | Radios 24`,
      description: radio.description,
      images: [{ url: radio.logo, alt: radio.name }],
    },
  };
}

export default async function PlayerPage({
  params,
}: PlayerPageProps) {
  const { slug } = await params;
  const radios = readRadiosFile();
  const radio = radios.find(
    (item: StoredRadio) => item.slug === slug && item.status === "online"
  );

  if (!radio) notFound();

  return <PlayerClient radio={radio} />;
}
