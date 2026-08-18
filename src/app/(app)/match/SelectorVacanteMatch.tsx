"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Vacante } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";

export function SelectorVacanteMatch({ vacantes }: { vacantes: Vacante[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      className="campo"
      defaultValue={searchParams.get("vacante") ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("vacante", e.target.value);
        } else {
          params.delete("vacante");
        }
        router.push(`/match?${params.toString()}`);
      }}
    >
      <option value="">Elegir una vacante...</option>
      {vacantes.map((v) => (
        <option key={v.id} value={v.id}>
          {etiquetaVacante(v)}
        </option>
      ))}
    </select>
  );
}
