import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, EstadoVacante, VacanteConMetricas } from "@/lib/types";
import { ANIO_POR_DEFECTO } from "@/lib/types";
import { rangoAnio } from "@/lib/fechas";
import { EncabezadoOrdenable } from "@/components/EncabezadoOrdenable";
import { FiltroAnio } from "@/components/FiltroAnio";
import { FiltrosVacantes } from "./FiltrosVacantes";
import { esCritico, InsigniaCritico, InsigniaPrioridad } from "./insignias";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

const COLUMNAS_ORDENABLES = new Set([
  "titulo",
  "cliente_o_area",
  "fecha_inicio_proceso",
  "estado_nombre",
  "prioridad",
  "dias_open",
]);

export default async function VacantesPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string;
    reclutador?: string;
    cliente?: string;
    prioridad?: string;
    anio?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const resueltos = await searchParams;
  const { estado, reclutador, cliente, prioridad } = resueltos;
  const anio = Number(resueltos.anio) || ANIO_POR_DEFECTO;
  const sort = resueltos.sort && COLUMNAS_ORDENABLES.has(resueltos.sort)
    ? resueltos.sort
    : "fecha_inicio_proceso";
  const dir = resueltos.dir === "asc" ? "asc" : "desc";
  const supabase = await createClient();
  const { desde, hasta } = rangoAnio(anio);

  let consulta = supabase
    .from("vw_metricas_vacantes")
    .select("*")
    .gte("fecha_inicio_proceso", desde)
    .lt("fecha_inicio_proceso", hasta)
    .order(sort, { ascending: dir === "asc", nullsFirst: false });
  if (estado) consulta = consulta.eq("estado_id", estado);
  if (reclutador) consulta = consulta.eq("reclutador_responsable_id", reclutador);
  if (cliente) consulta = consulta.ilike("cliente_o_area", `%${cliente}%`);
  if (prioridad) consulta = consulta.eq("prioridad", prioridad);

  const [{ data: vacantes }, { data: estados }, { data: equipo }] = await Promise.all([
    consulta.returns<VacanteConMetricas[]>(),
    supabase.from("estados_vacante").select("*").order("orden").returns<EstadoVacante[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));
  const encabezado = (campo: string, etiqueta: string, ordenPorDefecto?: "asc" | "desc") => (
    <EncabezadoOrdenable
      campo={campo}
      etiqueta={etiqueta}
      basePath="/vacantes"
      searchParams={resueltos}
      ordenPorDefecto={ordenPorDefecto}
    />
  );

  return (
    <div className="mx-auto max-w-6xl p-8">
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FiltroAnio basePath="/vacantes" />
        <FiltrosVacantes estados={estados ?? []} equipo={equipo ?? []} />
      </div>

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              {encabezado("titulo", "Título")}
              {encabezado("cliente_o_area", "Cliente / área")}
              {encabezado("fecha_inicio_proceso", "Fecha de inicio", "desc")}
              {encabezado("estado_nombre", "Estado")}
              {encabezado("prioridad", "Prioridad")}
              <th className="px-4 py-2">Responsable</th>
              {encabezado("dias_open", "Días open / TTF", "desc")}
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
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {formatearFecha(vacante.fecha_inicio_proceso)}
                </td>
                <td className="px-4 py-2">
                  <span
                    className="rounded-full px-2 py-1 text-xs font-medium text-black/80"
                    style={{ backgroundColor: vacante.estado_color }}
                  >
                    {vacante.estado_nombre}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <InsigniaPrioridad prioridad={vacante.prioridad} />
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {vacante.reclutador_responsable_id
                    ? (nombrePorId.get(vacante.reclutador_responsable_id) ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>
                      {vacante.time_to_fill !== null
                        ? `${vacante.time_to_fill} días (TTF)`
                        : vacante.dias_open !== null
                          ? `${vacante.dias_open} días open`
                          : "—"}
                    </span>
                    {esCritico(vacante.dias_open) && <InsigniaCritico />}
                  </div>
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
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
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
