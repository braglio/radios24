export default function PlayerBar() {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
            ▌▌
          </div>
          <div>
            <p className="font-bold">Seleccioná una emisora</p>
            <p className="text-sm text-emerald-400">Transmitiendo en vivo</p>
          </div>
        </div>

        <div className="flex items-center gap-5 text-2xl">
          <button className="text-zinc-500 hover:text-white">◀</button>
          <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black">
            ▶
          </button>
          <button className="text-zinc-500 hover:text-white">▶</button>
        </div>

        <div className="hidden w-48 items-center gap-3 md:flex">
          <span className="text-zinc-500">🔊</span>
          <div className="h-1 flex-1 rounded-full bg-zinc-800">
            <div className="h-1 w-2/3 rounded-full bg-cyan-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
