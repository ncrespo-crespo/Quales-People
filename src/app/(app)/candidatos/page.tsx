import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Candidato, Equipo, Vacante } from "@/lib/types";

export default async function CandidatosPage() {
  const supabase = await createClient();

  const [{ data: candidatos }, { data: vacantes }, { data: equipo }] = await Promise.all([
    supabase
      .from("candidatos")
      .select("*")
      .order("fecha_ingreso", { ascending: false })
      .returns<Candidato[]>(),
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const tituloVacantePorId = new Map((vacantes ?? []).map((v) => [v.id, v.titulo]));
  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">Candidatos</h1>
        <div className="flex items-center gap-4">
          <Link href="/candidatos/kanban" className="text-sm text-brand-blue hover:underline">
            Ver como tablero
          </Link>
          <Link
            href="/candidatos/nuevo"
            className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            + Nuevo candidato
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Vacante</th>
              <th className="px-4 py-2">Etapa</th>
              <th className="px-4 py-2">Reclutador</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(candidatos ?? []).map((candidato) => (
              <tr key={candidato.id} className="border-t border-black/10 dark:border-white/10">
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-50">
                  {candidato.nombre_completo}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.vacante_id ? (tituloVacantePorId.get(candidato.vacante_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.etapa_actual}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.reclutador_asignado_id
                    ? (nombrePorId.get(candidato.reclutador_asignado_id) ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/candidatos/${candidato.id}/editar`}
                    className="text-brand-blue hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(candidatos ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Todavía no hay candidatos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
