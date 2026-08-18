"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InvitacionPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [estado, setEstado] = useState<"cargando" | "lista" | "invalida">("cargando");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEstado(session ? "lista" : "invalida");
    });
  }, [supabase]);

  async function aceptarInvitacion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setEnviando(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-8 dark:bg-black">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">
          Quales <span className="font-normal text-zinc-500 dark:text-zinc-400">ATS</span>
        </h1>

        {estado === "cargando" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Validando invitación…</p>
        )}

        {estado === "invalida" && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            Este link de invitación no es válido o ya venció. Pedile a un admin que te
            reenvíe la invitación desde Configuración → Equipo.
          </p>
        )}

        {estado === "lista" && (
          <form onSubmit={aceptarInvitacion} className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Definí tu contraseña para terminar de activar tu cuenta.
            </p>

            {error && (
              <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Contraseña
              <input
                type="password"
                required
                autoComplete="new-password"
                className="campo"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Confirmar contraseña
              <input
                type="password"
                required
                autoComplete="new-password"
                className="campo"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
            >
              {enviando ? "Guardando…" : "Activar cuenta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
