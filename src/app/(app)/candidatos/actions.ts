"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function valorONulo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor === null || valor === "" ? null : String(valor);
}

async function subirCvSiCorresponde(
  supabase: Awaited<ReturnType<typeof createClient>>,
  candidatoId: string,
  formData: FormData,
) {
  const archivo = formData.get("cv");
  if (!(archivo instanceof File) || archivo.size === 0) return null;

  const ruta = `${candidatoId}/${Date.now()}-${archivo.name}`;
  const { error } = await supabase.storage.from("cvs").upload(ruta, archivo, {
    upsert: true,
  });
  if (error) throw error;
  return ruta;
}

export async function crearCandidato(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const etapaInicial = String(formData.get("etapa_actual"));

  const { data: candidato, error } = await supabase
    .from("candidatos")
    .insert({
      nombre_completo: String(formData.get("nombre_completo")),
      email: valorONulo(formData, "email"),
      telefono: valorONulo(formData, "telefono"),
      vacante_id: valorONulo(formData, "vacante_id"),
      reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
      etapa_actual: etapaInicial,
      linkedin_url: valorONulo(formData, "linkedin_url"),
      origen: valorONulo(formData, "origen"),
    })
    .select("id")
    .single();

  if (error || !candidato) {
    redirect(`/candidatos/nuevo?error=${encodeURIComponent(error?.message ?? "error desconocido")}`);
  }

  try {
    const rutaCv = await subirCvSiCorresponde(supabase, candidato.id, formData);
    if (rutaCv) {
      await supabase.from("candidatos").update({ cv_url: rutaCv }).eq("id", candidato.id);
    }
  } catch {
    redirect(`/candidatos/nuevo?error=${encodeURIComponent("no se pudo subir el CV")}`);
  }

  await supabase.from("historial_etapas").insert({
    candidato_id: candidato.id,
    etapa_anterior: null,
    etapa_nueva: etapaInicial,
    movido_por_id: user!.id,
  });

  revalidatePath("/candidatos");
  redirect("/candidatos");
}

export async function actualizarCandidato(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const etapaAnterior = String(formData.get("etapa_anterior"));
  const etapaNueva = String(formData.get("etapa_actual"));
  const motivoDescarte = valorONulo(formData, "descartado_motivo");

  if (etapaNueva === "Descartado" && !motivoDescarte) {
    redirect(
      `/candidatos/${id}/editar?error=${encodeURIComponent("para descartar un candidato hay que indicar el motivo")}`,
    );
  }

  try {
    const rutaCv = await subirCvSiCorresponde(supabase, id, formData);

    const { error } = await supabase
      .from("candidatos")
      .update({
        nombre_completo: String(formData.get("nombre_completo")),
        email: valorONulo(formData, "email"),
        telefono: valorONulo(formData, "telefono"),
        vacante_id: valorONulo(formData, "vacante_id"),
        reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
        etapa_actual: etapaNueva,
        linkedin_url: valorONulo(formData, "linkedin_url"),
        origen: valorONulo(formData, "origen"),
        descartado_motivo: etapaNueva === "Descartado" ? motivoDescarte : null,
        ...(rutaCv ? { cv_url: rutaCv } : {}),
      })
      .eq("id", id);

    if (error) throw error;
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "error desconocido";
    redirect(`/candidatos/${id}/editar?error=${encodeURIComponent(mensaje)}`);
  }

  if (etapaAnterior !== etapaNueva) {
    await supabase.from("historial_etapas").insert({
      candidato_id: id,
      etapa_anterior: etapaAnterior,
      etapa_nueva: etapaNueva,
      movido_por_id: user!.id,
      nota: etapaNueva === "Descartado" ? motivoDescarte : valorONulo(formData, "nota_cambio_etapa"),
    });
  }

  revalidatePath("/candidatos");
  redirect("/candidatos");
}
