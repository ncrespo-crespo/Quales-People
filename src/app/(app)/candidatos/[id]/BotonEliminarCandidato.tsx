"use client";

import { useState, useTransition } from "react";
import { eliminarCandidato } from "../actions";

export function BotonEliminarCandidato({ id, nombre }: { id: string; nombre: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar a ${nombre}? Se borran también todas sus postulaciones, notas e historial. Esto no se puede deshacer.`,
      )
    ) {
      return;
    }
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await eliminarCandidato(id);
      if (resultado?.error) {
        setError(resultado.error);
      }
    });
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={eliminar}
        disabled={pendiente}
        className="text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {pendiente ? "Eliminando..." : "Eliminar"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
