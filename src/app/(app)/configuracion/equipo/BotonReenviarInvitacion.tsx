"use client";

import { useState, useTransition } from "react";
import { reenviarInvitacion } from "./actions";

export function BotonReenviarInvitacion({ id }: { id: string }) {
  const [estado, setEstado] = useState<"inicial" | "enviada" | "error">("inicial");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  function reenviar() {
    setEstado("inicial");
    setMensaje(null);
    iniciarTransicion(async () => {
      const resultado = await reenviarInvitacion(id);
      if (resultado.error) {
        setEstado("error");
        setMensaje(resultado.error);
      } else {
        setEstado("enviada");
      }
    });
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={reenviar}
        disabled={pendiente}
        className="text-xs text-brand-blue hover:underline disabled:opacity-50"
      >
        {pendiente ? "Reenviando..." : "Reenviar invitación"}
      </button>
      {estado === "enviada" && (
        <span className="text-xs text-green-700 dark:text-green-400">Enviada</span>
      )}
      {estado === "error" && (
        <span className="text-xs text-red-700 dark:text-red-400">{mensaje}</span>
      )}
    </span>
  );
}
