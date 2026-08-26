import type { MetadataRoute } from "next";
import { radios } from "@/data/radios";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: "https://radios24.com",
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...radios
      .filter((radio) => radio.status === "online")
      .map((radio) => ({
        url: `https://radios24.com/player/${radio.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  ];
}
