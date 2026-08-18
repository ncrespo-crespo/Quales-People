import { createClient } from "@/lib/supabase/server";
import type { Equipo, Vacante } from "@/lib/types";
import { FormularioCandidato } from "../FormularioCandidato";
import { crearCandidato } from "../actions";

export default async function NuevoCandidatoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: vacantes }, { data: equipo }] = await Promise.all([
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
    supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
  ]);

  return (
    <FormularioCandidato
      action={crearCandidato}
      vacantes={vacantes ?? []}
      equipo={equipo ?? []}
      error={error}
    />
  );
}
