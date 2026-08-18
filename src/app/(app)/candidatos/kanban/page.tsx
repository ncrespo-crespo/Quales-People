import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CandidatoConDias, Equipo, Vacante } from "@/lib/types";
import { FiltrosCandidatos } from "./FiltrosCandidatos";
import { TableroCandidatos } from "./TableroCandidatos";

export default async function CandidatosKanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ vacante?: string; reclutador?: string; origen?: string }>;
}) {
  const { vacante, reclutador, origen } = await searchParams;
  const supabase = await createClient();

  let consulta = supabase.from("vw_candidatos_pipeline").select("*");
  if (vacante) consulta = consulta.eq("vacante_id", vacante);
  if (reclutador) consulta = consulta.eq("reclutador_asignado_id", reclutador);
  if (origen) consulta = consulta.eq("origen", origen);

  const [{ data: candidatos }, { data: vacantes }, { data: equipo }] = await Promise.all([
    consulta.returns<CandidatoConDias[]>(),
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
    supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
  ]);

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">
          Tablero de candidatos
        </h1>
        <Link href="/candidatos" className="text-sm text-brand-blue hover:underline">
          Ver como tabla
        </Link>
      </div>
      <FiltrosCandidatos vacantes={vacantes ?? []} equipo={equipo ?? []} />
      <TableroCandidatos candidatosIniciales={candidatos ?? []} nombrePorId={nombrePorId} />
    </div>
  );
}
