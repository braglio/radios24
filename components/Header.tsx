export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div>
          <h1 className="text-2xl font-black tracking-widest">
            MUSICANAL<span className="text-cyan-400">24</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.45em] text-zinc-500">
            Premium Dark Portal
          </p>
        </div>

        <input
          className="hidden w-full max-w-md rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 md:block"
          placeholder="Buscar radios por nombre o género..."
        />

        <button className="rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-bold shadow-lg shadow-fuchsia-900/30 hover:bg-fuchsia-600">
          + Agregar Radio
        </button>
      </div>
    </header>
  );
}
