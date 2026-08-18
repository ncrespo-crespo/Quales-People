import { createClient } from "@/lib/supabase/server";
import type { Equipo, EstadoVacante } from "@/lib/types";
import { FormularioVacante } from "../FormularioVacante";
import { crearVacante } from "../actions";

export default async function NuevaVacantePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: estados }, { data: equipo }] = await Promise.all([
    supabase.from("estados_vacante").select("*").order("orden").returns<EstadoVacante[]>(),
    supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
  ]);

  return (
    <FormularioVacante
      action={crearVacante}
      estados={estados ?? []}
      equipo={equipo ?? []}
      error={error}
    />
  );
}
