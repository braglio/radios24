import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Radios 24",
    short_name: "Radios 24",
    description: "Radio online sin fronteras.",
    start_url: "/",
    display: "standalone",
    background_color: "#050506",
    theme_color: "#09090b",
    lang: "es-PY",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
