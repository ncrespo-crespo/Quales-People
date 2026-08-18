"use client";

import { useFormStatus } from "react-dom";

// Sin esto, un doble click en "Guardar" (p. ej. por una conexión lenta,
// sin ningún indicio visual de que ya se está guardando) manda el
// formulario dos veces y crea el candidato duplicado.
export function BotonGuardar({ children = "Guardar" }: { children?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "Guardando..." : children}
    </button>
  );
}
