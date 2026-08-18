"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function valorONulo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor === null || valor === "" ? null : String(valor);
}

function valorNumero(formData: FormData, campo: string) {
  const valor = valorONulo(formData, campo);
  return valor === null ? null : Number(valor);
}

function valorBooleano(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  if (valor === "true") return true;
  if (valor === "false") return false;
  return null;
}

function mensajeDeError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof e.message === "string") {
    return e.message;
  }
  return "error desconocido";
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

// Crea la persona. Si se eligió una vacante en el formulario, además crea
// su primera postulación (evita el paso extra de "guardar candidato" y
// después "agregar postulación" para el caso más común).
export async function crearCandidato(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const vacanteInicial = valorONulo(formData, "vacante_id");

  const { data: candidato, error } = await supabase
    .from("candidatos")
    .insert({
      nombre_completo: String(formData.get("nombre_completo")),
      email: valorONulo(formData, "email"),
      telefono: valorONulo(formData, "telefono"),
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

  if (vacanteInicial) {
    const { data: postulacion } = await supabase
      .from("postulaciones")
      .insert({
        candidato_id: candidato.id,
        vacante_id: vacanteInicial,
        reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
        etapa_actual: "Sourcing",
      })
      .select("id")
      .single();

    if (postulacion) {
      await supabase.from("historial_etapas").insert({
        postulacion_id: postulacion.id,
        etapa_anterior: null,
        etapa_nueva: "Sourcing",
        movido_por_id: user!.id,
      });
    }
  }

  revalidatePath("/candidatos");
  redirect("/candidatos");
}

// Solo datos de la persona: la relación con vacantes vive en postulaciones
// (ver postulaciones/actions.ts).
export async function actualizarCandidato(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const rutaCv = await subirCvSiCorresponde(supabase, id, formData);

    const { error } = await supabase
      .from("candidatos")
      .update({
        nombre_completo: String(formData.get("nombre_completo")),
        email: valorONulo(formData, "email"),
        telefono: valorONulo(formData, "telefono"),
        linkedin_url: valorONulo(formData, "linkedin_url"),
        origen: valorONulo(formData, "origen"),
        fecha_ingreso: valorONulo(formData, "fecha_ingreso") ?? new Date().toISOString(),
        oculto: formData.get("oculto") === "on",
        ...(rutaCv ? { cv_url: rutaCv } : {}),
        // perfil
        apellido: valorONulo(formData, "apellido"),
        pais: valorONulo(formData, "pais"),
        provincia_estado: valorONulo(formData, "provincia_estado"),
        localidad: valorONulo(formData, "localidad"),
        genero: valorONulo(formData, "genero"),
        fecha_nacimiento: valorONulo(formData, "fecha_nacimiento"),
        area: valorONulo(formData, "area"),
        formacion_tecnica: valorONulo(formData, "formacion_tecnica"),
        anios_experiencia: valorNumero(formData, "anios_experiencia"),
        experiencia_consultoria: valorBooleano(formData, "experiencia_consultoria"),
        nivel_ingles: valorONulo(formData, "nivel_ingles"),
        stack_principal: valorONulo(formData, "stack_principal"),
        lugar_empleo_actual: valorONulo(formData, "lugar_empleo_actual"),
        expectativa_salarial: valorONulo(formData, "expectativa_salarial"),
        rate_fl: valorONulo(formData, "rate_fl"),
        tipo_moneda: valorONulo(formData, "tipo_moneda"),
        tipo_candidato: valorONulo(formData, "tipo_candidato"),
        disponibilidad_ingreso: valorONulo(formData, "disponibilidad_ingreso"),
        fuente_importada: valorONulo(formData, "fuente_importada"),
      })
      .eq("id", id);

    if (error) throw error;
  } catch (e) {
    redirect(`/candidatos/${id}/editar?error=${encodeURIComponent(mensajeDeError(e))}`);
  }

  revalidatePath("/candidatos");
  redirect(`/candidatos/${id}`);
}

export async function alternarOcultoCandidato(id: string, oculto: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("candidatos").update({ oculto }).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/candidatos");
  revalidatePath("/candidatos/kanban");
  return { error: null };
}
