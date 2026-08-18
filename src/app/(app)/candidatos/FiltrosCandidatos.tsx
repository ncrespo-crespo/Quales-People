"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, Vacante } from "@/lib/types";
import { ORIGENES_CANDIDATO } from "@/lib/types";

export function FiltrosCandidatos({
  basePath,
  vacantes,
  equipo,
  incluirOcultos = false,
}: {
  basePath: string;
  vacantes: Vacante[];
  equipo: Equipo[];
  incluirOcultos?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function actualizar(campo: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(campo, valor);
    } else {
      params.delete(campo);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 pb-4 text-sm">
      <select
        className="campo"
        defaultValue={searchParams.get("vacante") ?? ""}
        onChange={(e) => actualizar("vacante", e.target.value)}
      >
        <option value="">Todas las vacantes</option>
        {vacantes.map((v) => (
          <option key={v.id} value={v.id}>
            {v.titulo}
          </option>
        ))}
      </select>

      <select
        className="campo"
        defaultValue={searchParams.get("reclutador") ?? ""}
        onChange={(e) => actualizar("reclutador", e.target.value)}
      >
        <option value="">Todos los reclutadores</option>
        {equipo.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre ?? p.email}
          </option>
        ))}
      </select>

      <select
        className="campo"
        defaultValue={searchParams.get("origen") ?? ""}
        onChange={(e) => actualizar("origen", e.target.value)}
      >
        <option value="">Todos los orígenes</option>
        {ORIGENES_CANDIDATO.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {incluirOcultos && (
        <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            defaultChecked={searchParams.get("ocultos") === "1"}
            onChange={(e) => actualizar("ocultos", e.target.checked ? "1" : "")}
          />
          Mostrar ocultos
        </label>
      )}
    </div>
  );
}
