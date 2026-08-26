import type { Metadata } from "next";
import AudioProvider from "@/components/audio/AudioProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://radios24.com"),
  title: {
    default: "Radios 24 — Radio online sin fronteras",
    template: "%s | Radios 24",
  },
  description:
    "Escuchá 50 emisoras digitales en vivo: música, cultura, información y comunidades de Paraguay y el mundo.",
  applicationName: "Radios 24",
  keywords: [
    "radio online",
    "radios Paraguay",
    "streaming de radio",
    "emisoras digitales",
    "música online",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "/",
    siteName: "Radios 24",
    title: "Radios 24 — Radio online sin fronteras",
    description:
      "50 emisoras digitales en vivo, disponibles desde cualquier lugar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Radios 24 — Radio online sin fronteras",
    description:
      "50 emisoras digitales en vivo, disponibles desde cualquier lugar.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-PY">
      <body>
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
