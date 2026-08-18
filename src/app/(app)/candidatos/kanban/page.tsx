import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, PostulacionConDias, Vacante } from "@/lib/types";
import { FiltrosCandidatos } from "../FiltrosCandidatos";
import { TableroCandidatos } from "./TableroCandidatos";

export default async function CandidatosKanbanPage({
  searchParams,
}: {
  searchParams: Promise<{
    vacante?: string;
    reclutador?: string;
    origen?: string;
    provincia?: string;
    ingles?: string;
    stack?: string;
    ocultos?: string;
  }>;
}) {
  const { vacante, reclutador, origen, provincia, ingles, stack, ocultos } = await searchParams;
  const supabase = await createClient();

  let consulta = supabase.from("vw_postulaciones_pipeline").select("*");
  if (!ocultos) consulta = consulta.eq("candidato_oculto", false);
  if (vacante) consulta = consulta.in("vacante_id", vacante.split(","));
  if (reclutador) consulta = consulta.in("reclutador_asignado_id", reclutador.split(","));
  if (origen) consulta = consulta.in("candidato_origen", origen.split(","));
  if (provincia) consulta = consulta.in("candidato_provincia_estado", provincia.split(","));
  if (ingles) consulta = consulta.in("candidato_nivel_ingles", ingles.split(","));
  if (stack) consulta = consulta.ilike("candidato_stack_principal", `%${stack}%`);

  const [{ data: postulaciones }, { data: vacantes }, { data: equipo }, { data: perfiles }] =
    await Promise.all([
      consulta.returns<PostulacionConDias[]>(),
      supabase.from("vacantes").select("*").returns<Vacante[]>(),
      supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
      supabase
        .from("candidatos")
        .select("provincia_estado, nivel_ingles")
        .returns<{ provincia_estado: string | null; nivel_ingles: string | null }[]>(),
    ]);

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));
  const provincias = [...new Set((perfiles ?? []).map((p) => p.provincia_estado).filter((v): v is string => !!v))].sort();
  const nivelesIngles = [...new Set((perfiles ?? []).map((p) => p.nivel_ingles).filter((v): v is string => !!v))].sort();

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">
          Tablero de postulaciones
        </h1>
        <Link href="/candidatos" className="text-sm text-brand-blue hover:underline">
          Ver candidatos
        </Link>
      </div>
      <div className="px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <FiltrosCandidatos
            basePath="/candidatos/kanban"
            vacantes={vacantes ?? []}
            equipo={equipo ?? []}
            provincias={provincias}
            nivelesIngles={nivelesIngles}
            incluirOcultos
          />
        </div>
      </div>
      <TableroCandidatos postulacionesIniciales={postulaciones ?? []} nombrePorId={nombrePorId} />
    </div>
  );
}
