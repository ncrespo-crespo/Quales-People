"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Equipo } from "@/lib/types";
import { FiltroAnio } from "@/components/FiltroAnio";

export function FiltrosOverview({ equipo }: { equipo: Equipo[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function actualizar(campo: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor) {
      params.set(campo, valor);
    } else {
      params.delete(campo);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <FiltroAnio basePath="/" />
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
    </div>
  );
}
