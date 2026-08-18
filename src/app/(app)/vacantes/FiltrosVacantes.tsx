"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, EstadoVacante } from "@/lib/types";
import { PRIORIDADES_VACANTE } from "@/lib/types";

export function FiltrosVacantes({
  estados,
  equipo,
}: {
  estados: EstadoVacante[];
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
    router.push(`/vacantes?${params.toString()}`);
  }

  return (
    <>
      <select
        className="campo"
        defaultValue={searchParams.get("estado") ?? ""}
        onChange={(e) => actualizar("estado", e.target.value)}
      >
        <option value="">Todos los estados</option>
        {estados.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
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
        defaultValue={searchParams.get("prioridad") ?? ""}
        onChange={(e) => actualizar("prioridad", e.target.value)}
      >
        <option value="">Todas las prioridades</option>
        {PRIORIDADES_VACANTE.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <input
        className="campo"
        placeholder="Buscar por cliente / área"
        defaultValue={searchParams.get("cliente") ?? ""}
        onChange={(e) => actualizar("cliente", e.target.value)}
      />
    </>
  );
}
