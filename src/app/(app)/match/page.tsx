import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CandidatoCompleto, Vacante } from "@/lib/types";
import { candidatosSugeridos } from "@/lib/match";
import { etiquetaVacante } from "@/lib/vacantes";
import { crearPostulacion } from "../candidatos/postulaciones/actions";
import { SelectorVacanteMatch } from "./SelectorVacanteMatch";

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ vacante?: string }>;
}) {
  const { vacante: vacanteId } = await searchParams;
  const supabase = await createClient();

  const { data: vacantes } = await supabase
    .from("vacantes")
    .select("*")
    .eq("oculto", false)
    .order("fecha_inicio_proceso", { ascending: false })
    .returns<Vacante[]>();

  let vacante: Vacante | null = null;
  let sugeridos: ReturnType<typeof candidatosSugeridos> = [];

  if (vacanteId) {
    const [{ data: vacanteSeleccionada }, { data: candidatos }, { data: yaPostulados }] =
      await Promise.all([
        supabase.from("vacantes").select("*").eq("id", vacanteId).single<Vacante>(),
        supabase
          .from("candidatos")
          .select("*")
          .eq("oculto", false)
          .returns<CandidatoCompleto[]>(),
        supabase.from("postulaciones").select("candidato_id").eq("vacante_id", vacanteId),
      ]);

    vacante = vacanteSeleccionada;
    const idsYaPostulados = new Set((yaPostulados ?? []).map((p) => p.candidato_id));

    if (vacante) {
      sugeridos = candidatosSugeridos(
        vacante,
        (candidatos ?? []).filter((c) => !idsYaPostulados.has(c.id)),
      ).slice(0, 20);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-navy dark:text-white">Match</h1>

      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Elegí una vacante y te sugerimos candidatos según coincidencia de stack, nivel de inglés
        y ubicación. No incluye a quienes ya están postulados a esta búsqueda.
      </p>

      <div className="mb-6">
        <SelectorVacanteMatch vacantes={vacantes ?? []} />
      </div>

      {!vacanteId && (
        <p className="text-sm text-zinc-500">Elegí una vacante para ver sugerencias.</p>
      )}

      {vacanteId && !vacante && (
        <p className="text-sm text-zinc-500">No se encontró esa vacante.</p>
      )}

      {vacante && (
        <>
          <div className="mb-4 rounded border border-black/10 p-3 text-sm dark:border-white/10">
            <p className="font-medium text-black dark:text-zinc-50">{etiquetaVacante(vacante)}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stack buscado: {vacante.stack_principal ?? "sin definir"}
              {vacante.nivel_ingles ? ` · Inglés: ${vacante.nivel_ingles}` : ""}
              {vacante.provincia_estado ? ` · Ubicación: ${vacante.provincia_estado}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {sugeridos.map(({ candidato, score, coincidencias }) => (
              <div
                key={candidato.id}
                className="flex flex-wrap items-center gap-3 rounded border border-black/10 p-3 text-sm dark:border-white/10"
              >
                <Link
                  href={`/candidatos/${candidato.id}`}
                  className="font-medium text-black hover:underline dark:text-zinc-50"
                >
                  {candidato.nombre_completo}
                </Link>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                  Puntaje {score}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {coincidencias.join(" · ")}
                </span>
                <form
                  action={crearPostulacion.bind(null, candidato.id)}
                  className="ml-auto"
                >
                  <input type="hidden" name="vacante_id" value={vacante.id} />
                  <button
                    type="submit"
                    className="rounded bg-brand-green px-3 py-1.5 text-xs font-medium text-brand-navy hover:brightness-95"
                  >
                    + Postular
                  </button>
                </form>
              </div>
            ))}
            {sugeridos.length === 0 && (
              <p className="text-sm text-zinc-500">
                No encontramos candidatos con stack, inglés o ubicación en común con esta
                vacante todavía.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
