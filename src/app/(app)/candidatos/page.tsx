import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Candidato, Postulacion, Vacante } from "@/lib/types";
import { ANIO_POR_DEFECTO } from "@/lib/types";
import { rangoAnio } from "@/lib/fechas";
import { EncabezadoOrdenable } from "@/components/EncabezadoOrdenable";
import { FiltroAnio } from "@/components/FiltroAnio";
import { Paginacion, TAMANIO_PAGINA } from "@/components/Paginacion";
import { FiltrosPersonas } from "./FiltrosPersonas";
import { alternarOcultoCandidato } from "./actions";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

const ID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

const COLUMNAS_ORDENABLES = new Set(["nombre_completo", "origen", "fecha_ingreso"]);

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    origen?: string;
    ocultos?: string;
    anio?: string;
    vacante?: string;
    provincia?: string;
    ingles?: string;
    stack?: string;
    sort?: string;
    dir?: string;
    pagina?: string;
  }>;
}) {
  const resueltos = await searchParams;
  const { q, origen, ocultos, vacante, provincia, ingles, stack } = resueltos;
  const anio = Number(resueltos.anio) || ANIO_POR_DEFECTO;
  const sort = resueltos.sort && COLUMNAS_ORDENABLES.has(resueltos.sort)
    ? resueltos.sort
    : "fecha_ingreso";
  const dir = resueltos.dir === "asc" ? "asc" : "desc";
  const pagina = Math.max(1, Number(resueltos.pagina) || 1);
  const supabase = await createClient();
  const { desde, hasta } = rangoAnio(anio);

  let idsPorVacante: string[] | null = null;
  if (vacante) {
    const { data: postulacionesDeVacante } = await supabase
      .from("postulaciones")
      .select("candidato_id")
      .in("vacante_id", vacante.split(","));
    idsPorVacante = (postulacionesDeVacante ?? []).map((p) => p.candidato_id);
  }

  let consulta = supabase
    .from("candidatos")
    .select("*", { count: "exact" })
    .gte("fecha_ingreso", desde)
    .lt("fecha_ingreso", hasta)
    .order(sort, { ascending: dir === "asc", nullsFirst: false });
  if (!ocultos) consulta = consulta.eq("oculto", false);
  if (q) consulta = consulta.ilike("nombre_completo", `%${q}%`);
  if (origen) consulta = consulta.in("origen", origen.split(","));
  if (provincia) consulta = consulta.in("provincia_estado", provincia.split(","));
  if (ingles) consulta = consulta.in("nivel_ingles", ingles.split(","));
  if (stack) consulta = consulta.ilike("stack_principal", `%${stack}%`);
  if (idsPorVacante) consulta = consulta.in("id", idsPorVacante.length ? idsPorVacante : [ID_INEXISTENTE]);
  consulta = consulta.range((pagina - 1) * TAMANIO_PAGINA, pagina * TAMANIO_PAGINA - 1);

  const [{ data: candidatos, count: totalCandidatos }, { data: postulaciones }, { data: vacantes }, { data: perfiles }] =
    await Promise.all([
      consulta.returns<Candidato[]>(),
      supabase
        .from("postulaciones")
        .select("id, candidato_id, etapa_actual, estado_final, fecha_postulacion")
        .order("fecha_postulacion", { ascending: false })
        .returns<
          Pick<Postulacion, "id" | "candidato_id" | "etapa_actual" | "estado_final" | "fecha_postulacion">[]
        >(),
      supabase.from("vacantes").select("*").returns<Vacante[]>(),
      supabase
        .from("candidatos")
        .select("provincia_estado, nivel_ingles")
        .returns<{ provincia_estado: string | null; nivel_ingles: string | null }[]>(),
    ]);

  const postulacionesPorCandidato = new Map<string, number>();
  // Ordenadas por fecha_postulacion desc: la primera que aparece por
  // candidato es su postulación más reciente.
  const estadoPorCandidato = new Map<string, string>();
  for (const p of postulaciones ?? []) {
    postulacionesPorCandidato.set(p.candidato_id, (postulacionesPorCandidato.get(p.candidato_id) ?? 0) + 1);
    if (!estadoPorCandidato.has(p.candidato_id)) {
      estadoPorCandidato.set(p.candidato_id, p.estado_final ?? p.etapa_actual);
    }
  }

  const provincias = [...new Set((perfiles ?? []).map((p) => p.provincia_estado).filter((v): v is string => !!v))].sort();
  const nivelesIngles = [...new Set((perfiles ?? []).map((p) => p.nivel_ingles).filter((v): v is string => !!v))].sort();
  const totalPaginas = Math.max(1, Math.ceil((totalCandidatos ?? 0) / TAMANIO_PAGINA));

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
            Ver tablero de postulaciones
          </Link>
          <Link
            href="/candidatos/nuevo"
            className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            + Nuevo candidato
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <FiltroAnio basePath="/candidatos" />
        <FiltrosPersonas vacantes={vacantes ?? []} provincias={provincias} nivelesIngles={nivelesIngles} />
      </div>

      <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
        {totalCandidatos ?? 0} candidato{(totalCandidatos ?? 0) === 1 ? "" : "s"}
      </p>

      <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              {encabezado("nombre_completo", "Nombre")}
              <th className="px-4 py-2">Estado</th>
              {encabezado("origen", "Origen")}
              <th className="px-4 py-2">Contacto</th>
              {encabezado("fecha_ingreso", "Fecha de contacto", "desc")}
              <th className="px-4 py-2 text-right">Postulaciones</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(candidatos ?? []).map((candidato) => (
              <tr
                key={candidato.id}
                className={`border-t border-black/10 hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.02] ${
                  candidato.oculto ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-50">
                  <Link href={`/candidatos/${candidato.id}`} className="hover:underline">
                    {candidato.nombre_completo}
                  </Link>
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {estadoPorCandidato.get(candidato.id) ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  {candidato.origen ?? "—"}
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span>{[candidato.email, candidato.telefono].filter(Boolean).join(" · ") || "—"}</span>
                    {candidato.linkedin_url && (
                      <a
                        href={candidato.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-brand-blue hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {formatearFecha(candidato.fecha_ingreso)}
                </td>
                <td className="px-4 py-2 text-right text-zinc-600 dark:text-zinc-400">
                  {postulacionesPorCandidato.get(candidato.id) ?? 0}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <form
                    action={async () => {
                      "use server";
                      await alternarOcultoCandidato(candidato.id, !candidato.oculto);
                    }}
                    className="inline"
                  >
                    <button type="submit" className="text-brand-blue hover:underline">
                      {candidato.oculto ? "Mostrar" : "Ocultar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(candidatos ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Todavía no hay candidatos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={pagina} totalPaginas={totalPaginas} basePath="/candidatos" searchParams={resueltos} />
    </div>
  );
}
