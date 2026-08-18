import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, Rol } from "@/lib/types";
import { actualizarMiembro } from "./actions";
import { FormularioInvitar } from "./FormularioInvitar";

const ROLES: Rol[] = ["admin", "reclutador", "hiring_manager"];

export default async function ConfiguracionEquipoPage() {
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

  const { data: equipo } = await supabase
    .from("equipo")
    .select("*")
    .order("creado_en")
    .returns<Equipo[]>();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-navy dark:text-white">Equipo</h1>

      <div className="flex flex-col gap-2">
        {(equipo ?? []).map((persona) => (
          <form
            key={persona.id}
            action={async (formData: FormData) => {
              "use server";
              await actualizarMiembro(persona.id, formData);
            }}
            className="flex flex-wrap items-center gap-2 rounded border border-black/10 p-3 dark:border-white/10"
          >
            <input
              name="nombre"
              defaultValue={persona.nombre ?? ""}
              className="campo w-40"
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{persona.email}</span>
            <select name="rol" defaultValue={persona.rol} className="campo">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" name="activo" defaultChecked={persona.activo} />
              Activo
            </label>
            <button
              type="submit"
              className="ml-auto rounded bg-brand-navy px-3 py-1 text-xs font-medium text-white hover:brightness-110"
            >
              Guardar
            </button>
          </form>
        ))}
        {(equipo ?? []).length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no hay nadie en el equipo.</p>
        )}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Invitar a alguien nuevo
      </h2>
      <FormularioInvitar />
    </div>
  );
}
