"use client";

import { useState } from "react";
import type { Equipo, Vacante } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import { crearPostulacion } from "../postulaciones/actions";

export function FormNuevaPostulacion({
  candidatoId,
  vacantes,
  equipo,
}: {
  candidatoId: string;
  vacantes: Vacante[];
  equipo: Equipo[];
}) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-4 self-start rounded bg-brand-green px-3 py-1.5 text-sm font-medium text-brand-navy hover:brightness-95"
      >
        + Agregar otra postulación
      </button>
    );
  }

  return (
    <form
      action={crearPostulacion.bind(null, candidatoId)}
      className="mt-4 flex flex-wrap items-center gap-2 rounded border border-dashed border-black/20 p-3 dark:border-white/20"
    >
      <select name="vacante_id" required className="campo flex-1">
        <option value="">Elegir vacante...</option>
        {vacantes.map((v) => (
          <option key={v.id} value={v.id}>
            {etiquetaVacante(v)}
          </option>
        ))}
      </select>
      <select name="reclutador_asignado_id" className="campo">
        <option value="">Sin asignar</option>
        {equipo.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre ?? p.email}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded bg-brand-green px-3 py-1.5 text-sm font-medium text-brand-navy hover:brightness-95"
      >
        Guardar postulación
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="rounded border border-black/20 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        Cancelar
      </button>
    </form>
  );
}
