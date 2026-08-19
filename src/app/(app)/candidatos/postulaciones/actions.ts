"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function valorONulo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor === null || valor === "" ? null : String(valor);
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

function revalidarTodo(candidatoId: string) {
  revalidatePath("/candidatos");
  revalidatePath("/candidatos/kanban");
  revalidatePath(`/candidatos/${candidatoId}`);
}

export async function crearPostulacion(candidatoId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: postulacion, error } = await supabase
    .from("postulaciones")
    .insert({
      candidato_id: candidatoId,
      vacante_id: valorONulo(formData, "vacante_id"),
      reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
      etapa_actual: "Sourcing",
    })
    .select("id")
    .single();

  if (error || !postulacion) {
    redirect(
      `/candidatos/${candidatoId}?error=${encodeURIComponent(error?.message ?? "error desconocido")}`,
    );
  }

  // Sin historial acá: recién queda registro de movimiento cuando cambia de
  // etapa de verdad (ver actualizarPostulacion/moverPostulacion). El alta
  // en sí ya se ve en "fecha de postulación".
  revalidarTodo(candidatoId);
  redirect(`/candidatos/${candidatoId}`);
}

export async function actualizarPostulacion(id: string, candidatoId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const etapaAnterior = String(formData.get("etapa_anterior"));
  const etapaNueva = String(formData.get("etapa_actual"));
  const motivoDescarte = valorONulo(formData, "descartado_motivo");

  if (etapaNueva === "Descartado" && !motivoDescarte) {
    redirect(
      `/candidatos/${candidatoId}?error=${encodeURIComponent("para descartar hay que indicar el motivo")}`,
    );
  }

  const { error } = await supabase
    .from("postulaciones")
    .update({
      vacante_id: valorONulo(formData, "vacante_id"),
      reclutador_asignado_id: valorONulo(formData, "reclutador_asignado_id"),
      etapa_actual: etapaNueva,
      descartado_motivo: etapaNueva === "Descartado" ? motivoDescarte : null,
      // proceso de selección
      tipo_candidato: valorONulo(formData, "tipo_candidato"),
      origen_freelance:
        valorONulo(formData, "tipo_candidato") === "Freelance"
          ? valorONulo(formData, "origen_freelance")
          : null,
      disponibilidad_ingreso: valorONulo(formData, "disponibilidad_ingreso"),
      expectativa_salarial: valorONulo(formData, "expectativa_salarial"),
      tipo_moneda: valorONulo(formData, "tipo_moneda"),
      fecha_primer_contacto: valorONulo(formData, "fecha_primer_contacto"),
      fecha_screening_hr: valorONulo(formData, "fecha_screening_hr"),
      fecha_entrevista_hr: valorONulo(formData, "fecha_entrevista_hr"),
      seniority_propuesto_hr: valorONulo(formData, "seniority_propuesto_hr"),
      feedback_entrevista_hr: valorONulo(formData, "feedback_entrevista_hr"),
      fecha_entrevista_area: valorONulo(formData, "fecha_entrevista_area"),
      seniority_propuesto_area: valorONulo(formData, "seniority_propuesto_area"),
      feedback_entrevista_area: valorONulo(formData, "feedback_entrevista_area"),
      estado_final: valorONulo(formData, "estado_final"),
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
      ob_induccion_empresa_responsable: valorONulo(formData, "ob_induccion_empresa_responsable"),
      ob_induccion_empresa_fecha_hora: valorONulo(formData, "ob_induccion_empresa_fecha_hora"),
      ob_induccion_area_responsable: valorONulo(formData, "ob_induccion_area_responsable"),
      ob_induccion_area_fecha_hora: valorONulo(formData, "ob_induccion_area_fecha_hora"),
      ob_induccion_proyecto_responsable: valorONulo(formData, "ob_induccion_proyecto_responsable"),
      ob_induccion_proyecto_fecha_hora: valorONulo(formData, "ob_induccion_proyecto_fecha_hora"),
      ob_fecha_envio_elementos: valorONulo(formData, "ob_fecha_envio_elementos"),
      ob_fecha_recepcion_elementos: valorONulo(formData, "ob_fecha_recepcion_elementos"),
    })
    .eq("id", id);

  if (error) {
    redirect(`/candidatos/${candidatoId}?error=${encodeURIComponent(error.message)}`);
  }

  if (etapaAnterior !== etapaNueva) {
    await supabase.from("historial_etapas").insert({
      postulacion_id: id,
      etapa_anterior: etapaAnterior,
      etapa_nueva: etapaNueva,
      movido_por_id: user!.id,
      nota: etapaNueva === "Descartado" ? motivoDescarte : valorONulo(formData, "nota_cambio_etapa"),
    });
  }

  revalidarTodo(candidatoId);
  redirect(`/candidatos/${candidatoId}`);
}

// Para el drag & drop del tablero: mueve solo la etapa, con nota/motivo.
export async function moverPostulacion(
  id: string,
  candidatoId: string,
  etapaAnterior: string,
  etapaNueva: string,
  nota: string | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (etapaNueva === "Descartado" && !nota) {
    return { error: "para descartar hay que indicar el motivo" };
  }
  if (etapaAnterior === etapaNueva) {
    return { error: null };
  }

  const { error } = await supabase
    .from("postulaciones")
    .update({
      etapa_actual: etapaNueva,
      descartado_motivo: etapaNueva === "Descartado" ? nota : null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await supabase.from("historial_etapas").insert({
    postulacion_id: id,
    etapa_anterior: etapaAnterior,
    etapa_nueva: etapaNueva,
    movido_por_id: user!.id,
    nota,
  });

  revalidarTodo(candidatoId);
  return { error: null };
}

export async function eliminarPostulacion(id: string, candidatoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("postulaciones").delete().eq("id", id);

  if (error) {
    return { error: mensajeDeError(error) };
  }

  revalidarTodo(candidatoId);
  return { error: null };
}
