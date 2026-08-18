import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "../login/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between bg-brand-navy px-6 py-3 text-white">
        <nav className="flex items-center gap-5 text-sm font-medium text-white/80">
          <Link href="/" className="text-base font-bold text-white">
            Quales <span className="font-normal text-white/70">ATS</span>
          </Link>
          <Link href="/" className="hover:text-white">
            Overview
          </Link>
          <Link href="/vacantes" className="hover:text-white">
            Vacantes
          </Link>
          <Link href="/candidatos" className="hover:text-white">
            Candidatos
          </Link>
          {perfil?.rol === "admin" && (
            <Link href="/configuracion" className="hover:text-white">
              Configuración
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span>
            {perfil?.nombre ?? user!.email}
            {perfil?.rol ? ` · ${perfil.rol}` : ""}
          </span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded bg-brand-green px-3 py-1 font-medium text-brand-navy hover:brightness-95"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
