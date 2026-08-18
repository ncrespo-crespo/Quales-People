import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, EstadoVacante, VacanteConMetricas } from "@/lib/types";
import { TableroVacantes } from "./TableroVacantes";

export default async function VacantesKanbanPage() {
  const supabase = await createClient();

  const [{ data: estados }, { data: vacantes }, { data: equipo }] = await Promise.all([
    supabase.from("estados_vacante").select("*").order("orden").returns<EstadoVacante[]>(),
    supabase
      .from("vw_metricas_vacantes")
      .select("*")
      .eq("oculto", false)
      .returns<VacanteConMetricas[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-xl font-bold text-brand-navy dark:text-white">
          Tablero de vacantes
        </h1>
        <Link href="/vacantes" className="text-sm text-brand-blue hover:underline">
          Ver como tabla
        </Link>
      </div>
      <TableroVacantes
        estados={estados ?? []}
        vacantesIniciales={vacantes ?? []}
        nombrePorId={nombrePorId}
      />
    </div>
  );
}
