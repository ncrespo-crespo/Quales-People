"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, EstadoVacante } from "@/lib/types";
import { PRIORIDADES_VACANTE } from "@/lib/types";
import { FiltroMultiple } from "@/components/FiltroMultiple";

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
      <FiltroMultiple
        campo="estado"
        basePath="/vacantes"
        etiquetaTodos="Todos los estados"
        opciones={estados.map((e) => ({ value: e.id, label: e.nombre }))}
      />

      <FiltroMultiple
        campo="reclutador"
        basePath="/vacantes"
        etiquetaTodos="Todos los reclutadores"
        opciones={equipo.map((p) => ({ value: p.id, label: p.nombre ?? p.email }))}
      />

      <FiltroMultiple
        campo="prioridad"
        basePath="/vacantes"
        etiquetaTodos="Todas las prioridades"
        opciones={PRIORIDADES_VACANTE.map((p) => ({ value: p, label: p }))}
      />

      <input
        className="campo"
        placeholder="Buscar por cliente / área"
        defaultValue={searchParams.get("cliente") ?? ""}
        onChange={(e) => actualizar("cliente", e.target.value)}
      />

      <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("ocultos") === "1"}
          onChange={(e) => actualizar("ocultos", e.target.checked ? "1" : "")}
        />
        Mostrar ocultas
      </label>
    </>
  );
}
