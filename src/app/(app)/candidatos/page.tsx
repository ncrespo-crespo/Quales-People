import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CandidatoConDias, Equipo, Vacante } from "@/lib/types";
import { EncabezadoOrdenable } from "@/components/EncabezadoOrdenable";
import { FiltrosCandidatos } from "./FiltrosCandidatos";
import { alternarOcultoCandidato } from "./actions";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

const COLUMNAS_ORDENABLES = new Set([
  "nombre_completo",
  "etapa_actual",
  "dias_en_etapa",
  "fecha_ingreso",
]);

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{
    etapa?: string;
    vacante?: string;
    reclutador?: string;
    origen?: string;
    ocultos?: string;
    sort?: string;
    dir?: string;
  }>;
}) {
  const resueltos = await searchParams;
  const { etapa, vacante, reclutador, origen, ocultos } = resueltos;
  const sort = resueltos.sort && COLUMNAS_ORDENABLES.has(resueltos.sort)
    ? resueltos.sort
    : "fecha_ingreso";
  const dir = resueltos.dir === "asc" ? "asc" : "desc";
  const supabase = await createClient();

  let consulta = supabase
    .from("vw_candidatos_pipeline")
    .select("*")
    .order(sort, { ascending: dir === "asc", nullsFirst: false });
  if (!ocultos) consulta = consulta.eq("oculto", false);
  if (etapa) consulta = consulta.eq("etapa_actual", etapa);
  if (vacante) consulta = consulta.eq("vacante_id", vacante);
  if (reclutador) consulta = consulta.eq("reclutador_asignado_id", reclutador);
  if (origen) consulta = consulta.eq("origen", origen);

  const [{ data: candidatos }, { data: vacantes }, { data: equipo }] = await Promise.all([
    consulta.returns<CandidatoConDias[]>(),
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const tituloVacantePorId = new Map((vacantes ?? []).map((v) => [v.id, v.titulo]));
  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));
  const encabezado = (campo: string, etiqueta: string, ordenPorDefecto?: "asc" | "desc") => (
    <EncabezadoOrdenable
      campo={campo}
      etiqueta={etiqueta}
      basePath="/candidatos"
      searchParams={resueltos}
      ordenPorDefecto={ordenPorDefecto}
    />
  );

  return (
    <div className="mx-auto max-w-6xl p-8">
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

      <FiltrosCandidatos
        basePath="/candidatos"
        vacantes={vacantes ?? []}
        equipo={equipo ?? []}
        incluirEtapa
        incluirOcultos
      />

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              {encabezado("nombre_completo", "Nombre")}
              <th className="px-4 py-2">Vacante</th>
              {encabezado("etapa_actual", "Etapa")}
              {encabezado("dias_en_etapa", "Días en etapa", "desc")}
              <th className="px-4 py-2">Reclutador</th>
              {encabezado("fecha_ingreso", "Fecha de contacto", "desc")}
              <th className="px-4 py-2">LinkedIn</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(candidatos ?? []).map((candidato) => (
              <tr
                key={candidato.id}
                className={`border-t border-black/10 dark:border-white/10 ${
                  candidato.oculto ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-50">
                  <Link href={`/candidatos/${candidato.id}`} className="hover:underline">
                    {candidato.nombre_completo}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.vacante_id ? (tituloVacantePorId.get(candidato.vacante_id) ?? "—") : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.etapa_actual}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.dias_en_etapa !== null ? `${candidato.dias_en_etapa}d` : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.reclutador_asignado_id
                    ? (nombrePorId.get(candidato.reclutador_asignado_id) ?? "—")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {formatearFecha(candidato.fecha_ingreso)}
                </td>
                <td className="px-4 py-2">
                  {candidato.linkedin_url ? (
                    <a
                      href={candidato.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:underline"
                    >
                      Ver perfil
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <form
                    action={async () => {
                      "use server";
                      await alternarOcultoCandidato(candidato.id, !candidato.oculto);
                    }}
                    className="inline"
                  >
                    <button type="submit" className="mr-3 text-brand-blue hover:underline">
                      {candidato.oculto ? "Mostrar" : "Ocultar"}
                    </button>
                  </form>
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
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
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
