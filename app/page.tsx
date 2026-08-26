import RadioPortalClient from "@/components/RadioPortalClient";
import { readRadiosFile } from "@/app/api/radios/_utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const radios = readRadiosFile().filter(
    (radio: { status?: string; streamUrl?: string }) =>
      radio.status === "online" && Boolean(radio.streamUrl)
  );
  const shuffled = [...radios];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  const featuredSlugs = shuffled.slice(0, 4).map((radio) => radio.slug);

  return (
    <RadioPortalClient radios={radios} featuredSlugs={featuredSlugs} />
  );
}
