"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Radio = {
  id: number;
  slug: string;
  name: string;
  genre: string;
  description: string;
  streamUrl: string;
  logo: string;
  originalLogo: string;
  status: string;
  color: string;
};

function SortableRadioItem({
  radio,
  index,
  listeners,
  onEdit,
  onToggle,
}: {
  radio: Radio;
  index: number;
  listeners: number;
  onEdit: (radio: Radio) => void;
  onToggle: (id: number) => void;
}) {
  const { attributes, listeners: dragListeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: radio.id });

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-4 rounded-2xl border border-white/10 bg-[#08080a] p-4 transition ${
        isDragging ? "scale-[1.01] border-cyan-400 shadow-2xl shadow-cyan-500/20" : ""
      }`}
    >
      <button
        {...attributes}
        {...dragListeners}
        className="cursor-grab rounded-xl border border-white/10 px-3 py-3 text-zinc-500 active:cursor-grabbing"
        title="Arrastrar"
      >
        ☰
      </button>

      <div className="w-10 text-sm text-zinc-600">
        {String(index + 1).padStart(2, "0")}
      </div>

      <img
        src={radio.logo}
        alt={radio.name}
        className="h-14 w-14 rounded-xl bg-zinc-900 object-contain p-1"
      />

      <div className="min-w-0 flex-1">
        <h3 className="font-bold">{radio.name}</h3>
        <p className="text-sm text-zinc-500">{radio.genre}</p>

        <div className="mt-1 flex items-center gap-3">
          <p className={radio.status === "online" ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
            ● {radio.status}
          </p>

          <p className="text-xs text-yellow-400">
            {listeners} oyentes
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(radio.id)}
          className="rounded-lg border border-white/10 px-3 py-2"
        >
          {radio.status === "online" ? "Off" : "On"}
        </button>

        <button
          onClick={() => onEdit(radio)}
          className="rounded-lg bg-cyan-400 px-3 py-2 font-bold text-black"
        >
          Editar
        </button>
      </div>
    </article>
  );
}

export default function AdminClient({ initialRadios }: { initialRadios: Radio[] }) {
  const [radios, setRadios] = useState(initialRadios);
  const [selected, setSelected] = useState<Radio | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [liveMap, setLiveMap] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [savingRadio, setSavingRadio] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    async function loadLiveListeners() {
      try {
        const res = await fetch("/api/radios/live-status", { cache: "no-store" });
        const data = await res.json();

        const map: Record<string, number> = {};

        for (const item of data.radios || []) {
          map[item.slug] = Number(item.listeners || 0);
        }

        setLiveMap(map);
      } catch {}
    }

    loadLiveListeners();
    const timer = setInterval(loadLiveListeners, 30000);

    return () => clearInterval(timer);
  }, []);

  const saveOrder = async (newRadios: Radio[]) => {
    setSavingOrder(true);

    const res = await fetch("/api/radios/reorder-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newRadios.map((radio) => radio.id) }),
    });

    const data = await res.json();
    setRadios(data.radios);
    setSavingOrder(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = radios.findIndex((item) => item.id === active.id);
    const newIndex = radios.findIndex((item) => item.id === over.id);

    const newRadios = arrayMove(radios, oldIndex, newIndex);
    setRadios(newRadios);
    await saveOrder(newRadios);
  };

  const toggle = async (id: number) => {
    const res = await fetch("/api/radios/toggle", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    setRadios(data.radios);

    if (selected?.id === id) {
      const updated = data.radios.find((item: Radio) => item.id === id);
      if (updated) setSelected(updated);
    }
  };

  const save = async () => {
    if (!selected) return;

    setSavingRadio(true);
    setMessage("");

    const isNew = selected.id === 0;
    const res = await fetch(isNew ? "/api/radios" : "/api/radios/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "No se pudo guardar la emisora.");
      setSavingRadio(false);
      return;
    }

    setRadios(data.radios || []);
    setSelected(isNew ? data.radio : null);
    setMessage(isNew ? "Emisora agregada. Ya podés subir su logo." : "Cambios guardados.");
    setSavingRadio(false);
  };

  const addRadio = () => {
    setMessage("");
    setSelected({
      id: 0,
      slug: "",
      name: "",
      genre: "General",
      description: "",
      streamUrl: "https://stream.lacurulla.com/",
      logo: "/logos/audio-spot.png",
      originalLogo: "",
      status: "online",
      color: "from-cyan-600 to-fuchsia-900",
    });
  };

  const uploadLogo = async (id: number, file: File) => {
    setUploadingLogo(true);

    const formData = new FormData();
    formData.append("id", String(id));
    formData.append("logo", file);

    const res = await fetch("/api/radios/upload-logo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setRadios(data.radios);

    const updated = data.radios.find((item: Radio) => item.id === id);
    if (updated) setSelected(updated);

    setUploadingLogo(false);
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file && selected) {
      await uploadLogo(selected.id, file);
    }
  };

  return (
    <>
      <header className="border-b border-white/10 bg-black px-8 py-6">
        <h1 className="text-4xl font-black">
          RADIOS<span className="text-cyan-400">24</span> ADMIN
        </h1>

        <p className="mt-2 text-zinc-500">
          Panel profesional de gestión de emisoras · Drag & Drop PRO · Upload logos
        </p>
      </header>

      <section className="grid gap-8 px-8 py-8 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Emisoras ({radios.length})</h2>

            <div className="flex items-center gap-3">
              <p className="text-sm text-zinc-500">
                {savingOrder ? "Guardando orden..." : "Arrastrá para reordenar"}
              </p>
              <button
                type="button"
                onClick={addRadio}
                className="rounded-xl bg-emerald-400 px-4 py-2.5 font-black text-black transition hover:bg-emerald-300"
              >
                + Agregar emisora
              </button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={radios.map((radio) => radio.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3">
                {radios.map((radio, index) => (
                  <SortableRadioItem
                    key={radio.id}
                    radio={radio}
                    index={index}
                    listeners={liveMap[radio.slug] ?? 0}
                    onEdit={setSelected}
                    onToggle={toggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <aside className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[#08080a] p-6">
          <h2 className="mb-5 text-2xl font-bold">
            {selected?.id === 0 ? "Nueva emisora" : "Editor"}
          </h2>

          {!selected ? (
            <p className="text-zinc-500">Seleccioná una emisora para editar.</p>
          ) : (
            <div className="grid gap-4">
              <img
                src={selected.logo}
                alt={selected.name}
                className="h-32 w-32 rounded-2xl bg-zinc-900 object-contain p-2"
              />

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Nombre</span>
                <input
                  className="rounded-xl border border-white/10 bg-black p-3"
                  value={selected.name}
                  onChange={(event) => setSelected({ ...selected, name: event.target.value })}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Slug para la página</span>
                <input
                  className="rounded-xl border border-white/10 bg-black p-3"
                  value={selected.slug}
                  placeholder="radio-mi-emisora"
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      slug: event.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                />
                <span className="text-xs text-zinc-600">
                  Página: /player/{selected.slug || "radio-mi-emisora"}
                </span>
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Género / Categoría</span>
                <input
                  className="rounded-xl border border-white/10 bg-black p-3"
                  value={selected.genre}
                  onChange={(event) => setSelected({ ...selected, genre: event.target.value })}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Descripción</span>
                <textarea
                  className="min-h-28 rounded-xl border border-white/10 bg-black p-3"
                  value={selected.description}
                  onChange={(event) => setSelected({ ...selected, description: event.target.value })}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Stream URL</span>
                <input
                  className="rounded-xl border border-white/10 bg-black p-3"
                  value={selected.streamUrl}
                  onChange={(event) => setSelected({ ...selected, streamUrl: event.target.value })}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-zinc-400">Logo local</span>
                <input
                  className="rounded-xl border border-white/10 bg-black p-3"
                  value={selected.logo}
                  onChange={(event) => setSelected({ ...selected, logo: event.target.value })}
                />
              </label>

              <label
                onDrop={selected.id === 0 ? undefined : handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className={`flex flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition ${
                  selected.id === 0
                    ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50"
                    : "cursor-pointer border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                <span className="text-lg font-bold text-cyan-300">
                  {selected.id === 0
                    ? "Guardá primero la emisora"
                    : uploadingLogo
                      ? "Subiendo logo..."
                      : "Subir nuevo logo"}
                </span>

                <span className="mt-2 text-sm text-zinc-500">
                  PNG · JPG · WEBP · SVG
                </span>

                <span className="mt-1 text-xs text-zinc-600">
                  Click o arrastrá un archivo
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={selected.id === 0}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && selected) uploadLogo(selected.id, file);
                  }}
                />
              </label>

              {message && (
                <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-200">
                  {message}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={save}
                  disabled={savingRadio}
                  className="flex-1 rounded-xl bg-cyan-400 px-5 py-4 font-black text-black"
                >
                  {savingRadio
                    ? "Guardando..."
                    : selected.id === 0
                      ? "Agregar emisora"
                      : "Guardar"}
                </button>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-white/10 px-5 py-4"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
