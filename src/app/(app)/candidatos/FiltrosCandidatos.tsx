"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo, Vacante } from "@/lib/types";
import { ORIGENES_CANDIDATO } from "@/lib/types";

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
        defaultValue={searchParams.get("provincia") ?? ""}
        onChange={(e) => actualizar("provincia", e.target.value)}
      >
        <option value="">Toda provincia / estado</option>
        {provincias.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        className="campo"
        defaultValue={searchParams.get("ingles") ?? ""}
        onChange={(e) => actualizar("ingles", e.target.value)}
      >
        <option value="">Todo nivel de inglés</option>
        {nivelesIngles.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <input
        className="campo"
        placeholder="Buscar por stack (SQL, Snowflake, PBI...)"
        defaultValue={searchParams.get("stack") ?? ""}
        onChange={(e) => actualizar("stack", e.target.value)}
      />

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
    </>
  );
}
