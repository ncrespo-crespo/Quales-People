"use client";

import { useState, useTransition } from "react";
import type { Rol } from "@/lib/types";
import { invitarMiembro } from "./actions";

const ROLES: Rol[] = ["admin", "reclutador", "hiring_manager"];

export function FormularioInvitar() {
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [pendiente, iniciarTransicion] = useTransition();

  function enviar(formData: FormData) {
    setError(null);
    setExito(false);
    iniciarTransicion(async () => {
      const resultado = await invitarMiembro(formData);
      if (resultado.error) {
        setError(resultado.error);
      } else {
        setExito(true);
      }
    });
  }

  return (
    <form action={enviar} className="flex flex-col gap-2">
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {exito && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          Invitación enviada. Le va a llegar un email para definir su contraseña.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input name="nombre" placeholder="Nombre" required className="campo flex-1" />
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="campo flex-1"
        />
        <select name="rol" defaultValue="reclutador" className="campo">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pendiente}
          className="rounded bg-brand-green px-4 py-2 text-sm font-medium text-brand-navy hover:brightness-95 disabled:opacity-50"
        >
          {pendiente ? "Invitando..." : "Invitar"}
        </button>
      </div>
    </form>
  );
}
