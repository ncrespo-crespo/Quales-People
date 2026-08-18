import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
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

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-navy dark:text-white">Configuración</h1>
      <div className="flex flex-col gap-3">
        <Link
          href="/configuracion/estados"
          className="rounded border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          <p className="font-medium text-black dark:text-zinc-50">Estados de vacante</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Agregar, renombrar, cambiar color y reordenar las columnas del tablero de vacantes.
          </p>
        </Link>
        <Link
          href="/configuracion/equipo"
          className="rounded border border-black/10 p-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          <p className="font-medium text-black dark:text-zinc-50">Equipo</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Invitar reclutadores, cambiar roles y activar/desactivar cuentas.
          </p>
        </Link>
      </div>
    </div>
  );
}
