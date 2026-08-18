"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, Vacante } from "@/lib/types";
import { ORIGENES_CANDIDATO } from "@/lib/types";

export function FiltrosCandidatos({
  vacantes,
  equipo,
}: {
  vacantes: Vacante[];
  equipo: Equipo[];
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
    router.push(`/candidatos/kanban?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 px-8 pb-4 text-sm">
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
    </div>
  );
}
