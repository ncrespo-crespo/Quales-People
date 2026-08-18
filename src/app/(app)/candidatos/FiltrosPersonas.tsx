"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Vacante } from "@/lib/types";
import { ORIGENES_CANDIDATO } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import { FiltroMultiple } from "@/components/FiltroMultiple";

export function FiltrosPersonas({
  vacantes,
  provincias,
  nivelesIngles,
}: {
  vacantes: Vacante[];
  provincias: string[];
  nivelesIngles: string[];
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
    router.push(`/candidatos?${params.toString()}`);
  }

  return (
    <>
      <input
        className="campo"
        placeholder="Buscar por nombre o apellido..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => actualizar("q", e.target.value)}
      />

      <FiltroMultiple
        campo="vacante"
        basePath="/candidatos"
        etiquetaTodos="Todas las postulaciones"
        opciones={vacantes.map((v) => ({ value: v.id, label: etiquetaVacante(v) }))}
      />

      <FiltroMultiple
        campo="provincia"
        basePath="/candidatos"
        etiquetaTodos="Toda provincia / estado"
        opciones={provincias.map((p) => ({ value: p, label: p }))}
      />

      <FiltroMultiple
        campo="ingles"
        basePath="/candidatos"
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
        basePath="/candidatos"
        etiquetaTodos="Todos los orígenes"
        opciones={ORIGENES_CANDIDATO.map((o) => ({ value: o, label: o }))}
      />

      <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("ocultos") === "1"}
          onChange={(e) => actualizar("ocultos", e.target.checked ? "1" : "")}
        />
        Mostrar ocultos
      </label>
    </>
  );
}
