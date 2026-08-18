import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, EstadoVacante, Vacante } from "@/lib/types";
import { FormularioVacante } from "../../FormularioVacante";
import { actualizarVacante } from "../../actions";

export default async function EditarVacantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: vacante }, { data: estados }, { data: equipo }] = await Promise.all([
    supabase.from("vacantes").select("*").eq("id", id).single<Vacante>(),
    supabase.from("estados_vacante").select("*").order("orden").returns<EstadoVacante[]>(),
    supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
  ]);

  if (!vacante) {
    notFound();
  }

  return (
    <FormularioVacante
      action={actualizarVacante.bind(null, id)}
      estados={estados ?? []}
      equipo={equipo ?? []}
      vacante={vacante}
      error={error}
    />
  );
}
