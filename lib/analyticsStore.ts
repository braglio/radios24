import fs from "fs";
import path from "path";

type Analytics = {
  openEvents: number;
  playEvents: number;
  byRadio: Record<string, { opens: number; plays: number }>;
  updatedAt: string;
};

const filePath = path.join(process.cwd(), "data", "analytics.json");

const emptyAnalytics = (): Analytics => ({
  openEvents: 0,
  playEvents: 0,
  byRadio: {},
  updatedAt: new Date().toISOString(),
});

export function readAnalytics(): Analytics {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Analytics;

    return {
      openEvents: Number(data.openEvents || 0),
      playEvents: Number(data.playEvents || 0),
      byRadio: data.byRadio || {},
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyAnalytics();
  }
}

export function recordAnalytics(slug: string, type: "open" | "play") {
  const analytics = readAnalytics();
  const radio = analytics.byRadio[slug] || { opens: 0, plays: 0 };

  if (type === "open") {
    analytics.openEvents += 1;
    radio.opens += 1;
  } else {
    analytics.playEvents += 1;
    radio.plays += 1;
  }

  analytics.byRadio[slug] = radio;
  analytics.updatedAt = new Date().toISOString();

  const temporaryPath = `${filePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(analytics, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, filePath);

  return analytics;
}
