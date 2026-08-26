"use client";

import { useEffect, useState } from "react";

export default function LiveStats() {
  const [live, setLive] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  async function load() {
    try {
      const liveRes = await fetch("/api/radios/live-status", { cache: "no-store" });
      const analyticsRes = await fetch("/api/radios/analytics-summary", { cache: "no-store" });

      setLive(await liveRes.json());
      setAnalytics(await analyticsRes.json());
    } catch {}
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="grid gap-4 px-8 pt-8 md:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-[#08080a] p-5">
        <p className="text-sm text-zinc-500">Radios online</p>
        <p className="mt-2 text-4xl font-black text-emerald-400">{live?.online ?? 0}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#08080a] p-5">
        <p className="text-sm text-zinc-500">Radios offline</p>
        <p className="mt-2 text-4xl font-black text-red-400">{live?.offline ?? 0}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#08080a] p-5">
        <p className="text-sm text-zinc-500">Oyentes actuales</p>
        <p className="mt-2 text-4xl font-black text-yellow-400">{live?.listeners ?? 0}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#08080a] p-5">
        <p className="text-sm text-zinc-500">Aperturas player</p>
        <p className="mt-2 text-4xl font-black text-cyan-400">{analytics?.openEvents ?? 0}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#08080a] p-5">
        <p className="text-sm text-zinc-500">Reproducciones</p>
        <p className="mt-2 text-4xl font-black text-fuchsia-400">{analytics?.playEvents ?? 0}</p>
      </div>
    </section>
  );
}
