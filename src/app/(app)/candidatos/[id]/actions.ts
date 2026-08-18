"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function valorONulo(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor === null || valor === "" ? null : String(valor);
}

export async function agregarNotaEntrevista(candidatoId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const calificacion = valorONulo(formData, "calificacion");

  await supabase.from("notas_entrevistas").insert({
    candidato_id: candidatoId,
    entrevistador_id: user!.id,
    etapa: valorONulo(formData, "etapa"),
    feedback: valorONulo(formData, "feedback"),
    calificacion: calificacion ? Number(calificacion) : null,
  });

  revalidatePath(`/candidatos/${candidatoId}`);
}

export async function agregarComunicacion(candidatoId: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("comunicaciones").insert({
    candidato_id: candidatoId,
    tipo: String(formData.get("tipo")),
    asunto: valorONulo(formData, "asunto"),
    resumen: valorONulo(formData, "resumen"),
  });

  revalidatePath(`/candidatos/${candidatoId}`);
}
