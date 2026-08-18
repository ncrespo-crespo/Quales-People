import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, VacanteConMetricas } from "@/lib/types";

export default async function VacantesPage() {
  const supabase = await createClient();

  const [{ data: vacantes }, { data: equipo }] = await Promise.all([
    supabase
      .from("vw_metricas_vacantes")
      .select("*")
      .order("estado_es_terminal", { ascending: true })
      .order("fecha_inicio_proceso", { ascending: false })
      .returns<VacanteConMetricas[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">Vacantes</h1>
        <div className="flex items-center gap-4">
          <Link href="/vacantes/kanban" className="text-sm text-brand-blue hover:underline">
            Ver como tablero
          </Link>
          <Link
            href="/vacantes/nueva"
            className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            + Nueva vacante
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Título</th>
              <th className="px-4 py-2">Cliente / área</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Responsable</th>
              <th className="px-4 py-2">Días open / TTF</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(vacantes ?? []).map((vacante) => (
              <tr key={vacante.id} className="border-t border-black/10 dark:border-white/10">
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-50">
                  {vacante.titulo}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {vacante.cliente_o_area ?? "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="rounded-full px-2 py-1 text-xs font-medium text-black/80"
                    style={{ backgroundColor: vacante.estado_color }}
                  >
                    {vacante.estado_nombre}
                  </span>
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {vacante.reclutador_responsable_id
                    ? (nombrePorId.get(vacante.reclutador_responsable_id) ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {vacante.time_to_fill !== null
                    ? `${vacante.time_to_fill} días (TTF)`
                    : vacante.dias_open !== null
                      ? `${vacante.dias_open} días open`
                      : "—"}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  {vacante.drive_url && (
                    <a
                      href={vacante.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-3 text-brand-blue hover:underline"
                    >
                      Placa
                    </a>
                  )}
                  <Link
                    href={`/vacantes/${vacante.id}/editar`}
                    className="text-brand-blue hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {(vacantes ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Todavía no hay vacantes cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
