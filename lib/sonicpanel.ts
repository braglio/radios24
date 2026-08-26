export function getSonicPanelPort(streamUrl: string) {
  try {
    const url = new URL(streamUrl);
    return url.pathname.split("/").filter(Boolean)[0] || "";
  } catch {
    return "";
  }
}

export async function getSonicPanelInfo(streamUrl: string) {
  try {
    const url = new URL(streamUrl);
    if (url.protocol !== "https:" || url.hostname !== "stream.lacurulla.com") {
      throw new Error("Stream host not allowed");
    }

    const port = getSonicPanelPort(streamUrl);
    if (!/^\d{2,5}$/.test(port)) {
      throw new Error("Invalid stream port");
    }

    const infoUrl = `${url.protocol}//${url.host}/cp/get_info.php?p=${port}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(infoUrl, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    return {
      ok: true,
      title: data?.title || "Transmitiendo en vivo",
      art: data?.art || "",
      listeners: Number(data?.listeners || data?.ulistener || data?.currentlisteners || 0),
      bitrate: String(data?.bitrate || ""),
      history: Array.isArray(data?.history) ? data.history : [],
      error: "",
    };
  } catch (error) {
    return {
      ok: false,
      title: "Metadata no disponible",
      art: "",
      listeners: 0,
      bitrate: "",
      history: [],
      error: String(error),
    };
  }
}
