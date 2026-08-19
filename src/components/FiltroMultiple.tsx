"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Filtro de selección múltiple genérico: guarda los valores elegidos como
// lista separada por comas en el query param `campo` (ej. ?estado=a,b).
export function FiltroMultiple({
  campo,
  opciones,
  basePath,
  etiquetaTodos,
}: {
  campo: string;
  opciones: { value: string; label: string }[];
  basePath: string;
  etiquetaTodos: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const seleccionados = (searchParams.get(campo) ?? "").split(",").filter(Boolean);

  useEffect(() => {
    function alClickearFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClickearFuera);
    return () => document.removeEventListener("mousedown", alClickearFuera);
  }, []);

  function actualizar(valores: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    if (valores.length > 0) {
      params.set(campo, valores.join(","));
    } else {
      params.delete(campo);
    }
    params.delete("pagina");
    router.push(`${basePath}?${params.toString()}`);
  }

  function alternar(valor: string) {
    const actuales = new Set(seleccionados);
    if (actuales.has(valor)) {
      actuales.delete(valor);
    } else {
      actuales.add(valor);
    }
    actualizar([...actuales]);
  }

  const todoSeleccionado = opciones.length > 0 && seleccionados.length === opciones.length;

  function alternarTodo() {
    actualizar(todoSeleccionado ? [] : opciones.map((o) => o.value));
  }

  const etiquetaBoton =
    seleccionados.length === 0
      ? etiquetaTodos
      : seleccionados.length === 1
        ? (opciones.find((o) => o.value === seleccionados[0])?.label ?? seleccionados[0])
        : `${seleccionados.length} seleccionados`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="campo flex min-w-40 items-center justify-between gap-2 text-left text-sm"
      >
        <span className="truncate">{etiquetaBoton}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">▾</span>
      </button>
      {abierto && (
        <div className="absolute z-10 mt-1 max-h-64 min-w-full overflow-y-auto rounded border border-black/15 bg-white p-1 shadow-lg dark:border-white/15 dark:bg-zinc-900">
          {opciones.length === 0 && (
            <p className="whitespace-nowrap px-2 py-1 text-xs text-zinc-500">Sin opciones</p>
          )}
          {opciones.length > 0 && (
            <label className="mb-1 flex cursor-pointer items-center gap-2 whitespace-nowrap rounded border-b border-black/10 px-2 py-1 pb-2 text-sm font-medium text-black hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/10">
              <input type="checkbox" checked={todoSeleccionado} onChange={alternarTodo} />
              Seleccionar todo
            </label>
          )}
          {opciones.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded px-2 py-1 text-sm text-black hover:bg-black/5 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              <input
                type="checkbox"
                checked={seleccionados.includes(o.value)}
                onChange={() => alternar(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
