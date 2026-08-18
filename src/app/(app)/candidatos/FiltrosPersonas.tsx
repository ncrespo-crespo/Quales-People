"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ORIGENES_CANDIDATO } from "@/lib/types";

export function FiltrosPersonas() {
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
    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
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

      <label className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("ocultos") === "1"}
          onChange={(e) => actualizar("ocultos", e.target.checked ? "1" : "")}
        />
        Mostrar ocultos
      </label>
    </div>
  );
}
