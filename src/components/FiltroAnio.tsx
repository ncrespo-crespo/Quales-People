"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ANIOS_DISPONIBLES, ANIO_POR_DEFECTO } from "@/lib/types";

// Selector de año, de selección múltiple igual que el resto de los
// filtros. Sin año elegido en la URL, se toma el año por defecto — nunca
// queda en "ningún año" (no tendría sentido para estas pantallas).
export function FiltroAnio({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const valorParam = searchParams.get("anio");
  const seleccionados = valorParam
    ? valorParam.split(",").map(Number).filter((n) => !Number.isNaN(n))
    : [ANIO_POR_DEFECTO];

  useEffect(() => {
    function alClickearFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClickearFuera);
    return () => document.removeEventListener("mousedown", alClickearFuera);
  }, []);

  function actualizar(anios: number[]) {
    if (anios.length === 0) return; // siempre queda al menos un año elegido
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", anios.join(","));
    params.delete("pagina");
    router.push(`${basePath}?${params.toString()}`);
  }

  function alternar(anio: number) {
    const actuales = new Set(seleccionados);
    if (actuales.has(anio)) {
      actuales.delete(anio);
    } else {
      actuales.add(anio);
    }
    actualizar([...actuales]);
  }

  const todoSeleccionado = seleccionados.length === ANIOS_DISPONIBLES.length;

  function alternarTodo() {
    actualizar(todoSeleccionado ? [ANIO_POR_DEFECTO] : [...ANIOS_DISPONIBLES]);
  }

  const etiquetaBoton =
    seleccionados.length === 1 ? String(seleccionados[0]) : `${seleccionados.length} años`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="campo flex min-w-28 items-center justify-between gap-2 text-left text-sm"
      >
        <span className="truncate">{etiquetaBoton}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">▾</span>
      </button>
      {abierto && (
        <div className="absolute z-10 mt-1 max-h-64 min-w-full overflow-y-auto rounded border border-black/15 bg-white p-1 shadow-lg dark:border-white/15 dark:bg-zinc-900">
          <label className="mb-1 flex cursor-pointer items-center gap-2 whitespace-nowrap rounded border-b border-black/10 px-2 py-1 pb-2 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/10">
            <input type="checkbox" checked={todoSeleccionado} onChange={alternarTodo} />
            Seleccionar todo
          </label>
          {ANIOS_DISPONIBLES.map((anio) => (
            <label
              key={anio}
              className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded px-2 py-1 text-sm text-black hover:bg-black/5 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              <input
                type="checkbox"
                checked={seleccionados.includes(anio)}
                onChange={() => alternar(anio)}
              />
              {anio}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
