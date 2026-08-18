import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CandidatoConDias, Equipo, Vacante } from "@/lib/types";
import { FiltrosCandidatos } from "./FiltrosCandidatos";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{
    etapa?: string;
    vacante?: string;
    reclutador?: string;
    origen?: string;
  }>;
}) {
  const { etapa, vacante, reclutador, origen } = await searchParams;
  const supabase = await createClient();

  let consulta = supabase
    .from("vw_candidatos_pipeline")
    .select("*")
    .order("fecha_ingreso", { ascending: false });
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
      />

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Vacante</th>
              <th className="px-4 py-2">Etapa</th>
              <th className="px-4 py-2">Días en etapa</th>
              <th className="px-4 py-2">Reclutador</th>
              <th className="px-4 py-2">Fecha de contacto</th>
              <th className="px-4 py-2">LinkedIn</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(candidatos ?? []).map((candidato) => (
              <tr key={candidato.id} className="border-t border-black/10 dark:border-white/10">
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
