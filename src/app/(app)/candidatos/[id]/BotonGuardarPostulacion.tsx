"use client";

import { useFormStatus } from "react-dom";

// useFormStatus solo refleja el estado del <form> si se llama desde un
// componente hijo, no desde el mismo componente que lo renderiza — de ahí
// que esto esté separado en vez de ser un <button> suelto.
export function BotonGuardarPostulacion() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-brand-green px-3 py-1.5 text-sm font-medium text-brand-navy hover:brightness-95 disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar postulación"}
    </button>
  );
}
