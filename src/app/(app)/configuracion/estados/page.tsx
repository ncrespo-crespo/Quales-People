import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EstadoVacante } from "@/lib/types";
import { actualizarEstado, crearEstado, moverEstado } from "./actions";

export default async function ConfiguracionEstadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("equipo")
    .select("rol")
    .eq("id", user!.id)
    .single();

  if (perfil?.rol !== "admin") {
    redirect("/");
  }

  const { data: estados } = await supabase
    .from("estados_vacante")
    .select("*")
    .order("orden")
    .returns<EstadoVacante[]>();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-navy dark:text-white">
        Estados de vacante
      </h1>

      <div className="flex flex-col gap-2">
        {(estados ?? []).map((estado, i) => (
          <form
            key={estado.id}
            action={actualizarEstado.bind(null, estado.id)}
            className="flex items-center gap-2 rounded border border-black/10 p-3 dark:border-white/10"
          >
            <div className="flex flex-col">
              <button
                type="submit"
                formAction={moverEstado.bind(null, estado.id, "arriba")}
                disabled={i === 0}
                className="text-xs text-zinc-500 hover:text-black disabled:opacity-30 dark:hover:text-white"
              >
                ▲
              </button>
              <button
                type="submit"
                formAction={moverEstado.bind(null, estado.id, "abajo")}
                disabled={i === (estados?.length ?? 1) - 1}
                className="text-xs text-zinc-500 hover:text-black disabled:opacity-30 dark:hover:text-white"
              >
                ▼
              </button>
            </div>

            <input type="color" name="color_hex" defaultValue={estado.color_hex} className="h-8 w-8" />

            <input
              name="nombre"
              defaultValue={estado.nombre}
              className="campo flex-1"
            />

            <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                name="es_terminal"
                defaultChecked={estado.es_terminal}
              />
              Terminal
            </label>

            <button
              type="submit"
              className="rounded bg-brand-navy px-3 py-1 text-xs font-medium text-white hover:brightness-110"
            >
              Guardar
            </button>
          </form>
        ))}
      </div>

      <form
        action={crearEstado}
        className="mt-6 flex items-center gap-2 rounded border border-dashed border-black/20 p-3 dark:border-white/20"
      >
        <input type="color" name="color_hex" defaultValue="#e5e7eb" className="h-8 w-8" />
        <input
          name="nombre"
          placeholder="Nuevo estado"
          required
          className="campo flex-1"
        />
        <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" name="es_terminal" />
          Terminal
        </label>
        <button
          type="submit"
          className="rounded bg-brand-green px-3 py-1 text-xs font-medium text-brand-navy hover:brightness-95"
        >
          + Agregar
        </button>
      </form>
    </div>
  );
}
