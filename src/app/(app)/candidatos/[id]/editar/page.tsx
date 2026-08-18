import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CandidatoCompleto, Equipo, Vacante } from "@/lib/types";
import { FormularioCandidato } from "../../FormularioCandidato";
import { actualizarCandidato } from "../../actions";

export default async function EditarCandidatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: candidato }, { data: vacantes }, { data: equipo }] = await Promise.all([
    supabase.from("candidatos").select("*").eq("id", id).single<CandidatoCompleto>(),
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
    supabase.from("equipo").select("*").eq("activo", true).returns<Equipo[]>(),
  ]);

  if (!candidato) {
    notFound();
  }

  let urlCvActual: string | null = null;
  if (candidato.cv_url) {
    const { data } = await supabase.storage
      .from("cvs")
      .createSignedUrl(candidato.cv_url, 60 * 10);
    urlCvActual = data?.signedUrl ?? null;
  }

  return (
    <FormularioCandidato
      action={actualizarCandidato.bind(null, id)}
      vacantes={vacantes ?? []}
      equipo={equipo ?? []}
      candidato={candidato}
      urlCvActual={urlCvActual}
      error={error}
    />
  );
}
