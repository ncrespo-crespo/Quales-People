"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ANIOS_DISPONIBLES, ANIO_POR_DEFECTO } from "@/lib/types";

export function FiltroAnio({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function actualizar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", valor);
    params.delete("pagina");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <select
      className="campo"
      defaultValue={searchParams.get("anio") ?? String(ANIO_POR_DEFECTO)}
      onChange={(e) => actualizar(e.target.value)}
    >
      {ANIOS_DISPONIBLES.map((anio) => (
        <option key={anio} value={anio}>
          {anio}
        </option>
      ))}
    </select>
  );
}
