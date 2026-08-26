export type Station = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  description: string;
  streamUrl: string;
  fallbackStreamUrl?: string;
  logo: string;
  originalLogo: string;
  status: "online" | "offline";
  color: string;
};

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error";

export type StreamSource = "primary" | "fallback";

export type AudioError = {
  code:
    | "autoplay-blocked"
    | "network"
    | "media"
    | "unsupported"
    | "retries-exhausted"
    | "unknown";
  message: string;
  recoverable: boolean;
};

export type AudioState = {
  status: PlaybackStatus;
  currentStation: Station | null;
  source: StreamSource | null;
  volume: number;
  error: AudioError | null;
  retryCount: number;
};
