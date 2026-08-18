import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "./login/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("equipo")
    .select("nombre, rol")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-8 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        ATS Interno — Qualesgroup
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Hola, {perfil?.nombre ?? user!.email}
        {perfil?.rol ? ` (${perfil.rol})` : ""}.
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Sesión iniciada. Las búsquedas y candidatos se agregan en la próxima fase.
      </p>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="rounded border border-black/15 px-4 py-2 text-sm text-black hover:bg-black/5 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/10"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
