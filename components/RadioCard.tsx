type Radio = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  description: string;
  streamUrl: string;
  status: string;
  color: string;
};

export default function RadioCard({
  radio,
  index,
}: {
  radio: Radio;
  index: number;
}) {
  const initials = radio.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <article className="group flex cursor-pointer items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-cyan-400/50 hover:bg-white/[0.07]">
      <div
        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${radio.color} text-2xl font-black shadow-lg`}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300">
          {radio.name}
        </h3>
        <p className="text-sm text-zinc-500">{radio.genre}</p>
        <p className="mt-1 hidden text-sm text-zinc-400 md:block">
          {radio.description}
        </p>
      </div>

      <div className="hidden text-right md:block">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Canal {String(index + 1).padStart(2, "0")}
        </p>
        <p className="mt-2 text-xs text-emerald-400">● Señal Online</p>
      </div>
    </article>
  );
}
