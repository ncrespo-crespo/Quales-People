"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, Vacante } from "@/lib/types";
import { ORIGENES_CANDIDATO } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import { FiltroMultiple } from "@/components/FiltroMultiple";

export function FiltrosCandidatos({
  basePath,
  vacantes,
  equipo,
  provincias = [],
  nivelesIngles = [],
  incluirOcultos = false,
}: {
  basePath: string;
  vacantes: Vacante[];
  equipo: Equipo[];
  provincias?: string[];
  nivelesIngles?: string[];
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
    <>
      <FiltroMultiple
        campo="vacante"
        basePath={basePath}
        etiquetaTodos="Todas las vacantes"
        opciones={vacantes.map((v) => ({ value: v.id, label: etiquetaVacante(v) }))}
      />

      <FiltroMultiple
        campo="reclutador"
        basePath={basePath}
        etiquetaTodos="Todos los reclutadores"
        opciones={equipo.map((p) => ({ value: p.id, label: p.nombre ?? p.email }))}
      />

      <FiltroMultiple
        campo="provincia"
        basePath={basePath}
        etiquetaTodos="Toda provincia / estado"
        opciones={provincias.map((p) => ({ value: p, label: p }))}
      />

      <FiltroMultiple
        campo="ingles"
        basePath={basePath}
        etiquetaTodos="Todo nivel de inglés"
        opciones={nivelesIngles.map((n) => ({ value: n, label: n }))}
      />

      <input
        className="campo"
        placeholder="Buscar por stack (SQL, Snowflake, PBI...)"
        defaultValue={searchParams.get("stack") ?? ""}
        onChange={(e) => actualizar("stack", e.target.value)}
      />

      <FiltroMultiple
        campo="origen"
        basePath={basePath}
        etiquetaTodos="Todos los orígenes"
        opciones={ORIGENES_CANDIDATO.map((o) => ({ value: o, label: o }))}
      />

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
    </>
  );
}
