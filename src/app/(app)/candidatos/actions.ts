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
        // datos básicos
        nombre_completo: String(formData.get("nombre_completo")),
        email: valorONulo(formData, "email"),
        telefono: valorONulo(formData, "telefono"),
        vacante_id: valorONulo(formData, "vacante_id"),
        reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
        etapa_actual: etapaNueva,
        linkedin_url: valorONulo(formData, "linkedin_url"),
        origen: valorONulo(formData, "origen"),
        descartado_motivo: etapaNueva === "Descartado" ? motivoDescarte : null,
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
        // proceso de selección
        fecha_primer_contacto: valorONulo(formData, "fecha_primer_contacto"),
        fecha_screening_hr: valorONulo(formData, "fecha_screening_hr"),
        seniority_propuesto_hr: valorONulo(formData, "seniority_propuesto_hr"),
        feedback_entrevista_hr: valorONulo(formData, "feedback_entrevista_hr"),
        fecha_entrevista_area: valorONulo(formData, "fecha_entrevista_area"),
        seniority_propuesto_area: valorONulo(formData, "seniority_propuesto_area"),
        feedback_entrevista: valorONulo(formData, "feedback_entrevista"),
        feedback_entrevista_area: valorONulo(formData, "feedback_entrevista_area"),
        estado_final_importado: valorONulo(formData, "estado_final_importado"),
        // oferta laboral
        avanza_ol: valorBooleano(formData, "avanza_ol"),
        fecha_envio_ol: valorONulo(formData, "fecha_envio_ol"),
        aceptacion_ol: valorBooleano(formData, "aceptacion_ol"),
        fecha_aceptacion_rechazo_ol: valorONulo(formData, "fecha_aceptacion_rechazo_ol"),
        motivo_rechazo_ol: valorONulo(formData, "motivo_rechazo_ol"),
        fecha_ingreso_efectiva: valorONulo(formData, "fecha_ingreso_efectiva"),
        feedback_proceso_candidato: valorONulo(formData, "feedback_proceso_candidato"),
        licencias_programadas: valorONulo(formData, "licencias_programadas"),
        // onboarding
        ob_cliente: valorONulo(formData, "ob_cliente"),
        ob_proyecto: valorONulo(formData, "ob_proyecto"),
        ob_induccion_empresa: valorONulo(formData, "ob_induccion_empresa"),
        ob_induccion_empresa_horario: valorONulo(formData, "ob_induccion_empresa_horario"),
        ob_induccion_area_responsable: valorONulo(formData, "ob_induccion_area_responsable"),
        ob_induccion_area_horario: valorONulo(formData, "ob_induccion_area_horario"),
        ob_induccion_proyecto_responsable: valorONulo(formData, "ob_induccion_proyecto_responsable"),
        ob_induccion_proyecto_horario: valorONulo(formData, "ob_induccion_proyecto_horario"),
        ob_fecha_envio_elementos: valorONulo(formData, "ob_fecha_envio_elementos"),
        ob_fecha_recepcion_elementos: valorONulo(formData, "ob_fecha_recepcion_elementos"),
      })
      .eq("id", id);

    if (error) throw error;
  } catch (e) {
    const mensaje = mensajeDeError(e);
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

export async function moverCandidato(
  id: string,
  etapaAnterior: string,
  etapaNueva: string,
  nota: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (etapaNueva === "Descartado" && !nota) {
    return { error: "para descartar un candidato hay que indicar el motivo" };
  }
  if (etapaAnterior === etapaNueva) {
    return { error: null };
  }

  const { error } = await supabase
    .from("candidatos")
    .update({
      etapa_actual: etapaNueva,
      descartado_motivo: etapaNueva === "Descartado" ? nota : null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("historial_etapas").insert({
    candidato_id: id,
    etapa_anterior: etapaAnterior,
    etapa_nueva: etapaNueva,
    movido_por_id: user!.id,
    nota,
  });

  revalidatePath("/candidatos");
  revalidatePath("/candidatos/kanban");
  return { error: null };
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
