"use client";

import type { Equipo } from "@/lib/types";
import { FiltroAnio } from "@/components/FiltroAnio";
import { FiltroMultiple } from "@/components/FiltroMultiple";

export function FiltrosOverview({ equipo }: { equipo: Equipo[] }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <FiltroAnio basePath="/" />
      <FiltroMultiple
        campo="reclutador"
        basePath="/"
        etiquetaTodos="Todos los reclutadores"
        opciones={equipo.map((p) => ({ value: p.id, label: p.nombre ?? p.email }))}
      />
    </div>
  );
}
