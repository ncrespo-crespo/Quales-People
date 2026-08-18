"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function valorONulo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor === null || valor === "" ? null : String(valor);
}

export async function crearVacante(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("vacantes").insert({
    titulo: String(formData.get("titulo")),
    cliente_o_area: valorONulo(formData, "cliente_o_area"),
    estado_id: String(formData.get("estado_id")),
    reclutador_responsable_id: valorONulo(formData, "reclutador_responsable_id"),
    fecha_inicio_proceso: String(formData.get("fecha_inicio_proceso")),
    fecha_prevista_ingreso_hm: valorONulo(formData, "fecha_prevista_ingreso_hm"),
    notas: valorONulo(formData, "notas"),
    drive_url: valorONulo(formData, "drive_url"),
  });

  if (error) {
    redirect(`/vacantes/nueva?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/vacantes");
  redirect("/vacantes");
}

export async function actualizarVacante(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vacantes")
    .update({
      titulo: String(formData.get("titulo")),
      cliente_o_area: valorONulo(formData, "cliente_o_area"),
      estado_id: String(formData.get("estado_id")),
      reclutador_responsable_id: valorONulo(formData, "reclutador_responsable_id"),
      fecha_inicio_proceso: String(formData.get("fecha_inicio_proceso")),
      fecha_prevista_ingreso_hm: valorONulo(formData, "fecha_prevista_ingreso_hm"),
      fecha_ingreso_confirmada: valorONulo(formData, "fecha_ingreso_confirmada"),
      notas: valorONulo(formData, "notas"),
      drive_url: valorONulo(formData, "drive_url"),
    })
    .eq("id", id);

  if (error) {
    redirect(`/vacantes/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/vacantes");
  redirect("/vacantes");
}

export async function moverVacante(id: string, estadoId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vacantes")
    .update({ estado_id: estadoId })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/vacantes");
  revalidatePath("/vacantes/kanban");
  return { error: null };
}
