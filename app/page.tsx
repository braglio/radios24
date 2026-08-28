import RadioPortalClient from "@/components/RadioPortalClient";
import { readRadiosFile } from "@/app/api/radios/_utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  const radios = readRadiosFile().filter(
    (radio: { status?: string; streamUrl?: string }) =>
      radio.status === "online" && Boolean(radio.streamUrl)
  );

  return <RadioPortalClient radios={radios} />;
}
