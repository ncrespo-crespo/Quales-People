"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoVacante } from "@/lib/types";

export async function crearEstado(formData: FormData) {
  const supabase = await createClient();

  const { data: estados } = await supabase
    .from("estados_vacante")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1)
    .returns<Pick<EstadoVacante, "orden">[]>();

  const siguienteOrden = (estados?.[0]?.orden ?? 0) + 1;

  await supabase.from("estados_vacante").insert({
    nombre: String(formData.get("nombre")),
    color_hex: String(formData.get("color_hex")),
    es_terminal: formData.get("es_terminal") === "on",
    orden: siguienteOrden,
  });

  revalidatePath("/configuracion/estados");
}

export async function actualizarEstado(id: string, formData: FormData) {
  const supabase = await createClient();

  await supabase
    .from("estados_vacante")
    .update({
      nombre: String(formData.get("nombre")),
      color_hex: String(formData.get("color_hex")),
      es_terminal: formData.get("es_terminal") === "on",
    })
    .eq("id", id);

  revalidatePath("/configuracion/estados");
}

export async function moverEstado(id: string, direccion: "arriba" | "abajo") {
  const supabase = await createClient();

  const { data: estados } = await supabase
    .from("estados_vacante")
    .select("*")
    .order("orden")
    .returns<EstadoVacante[]>();

  if (!estados) return;

  const indice = estados.findIndex((e) => e.id === id);
  const indiceVecino = direccion === "arriba" ? indice - 1 : indice + 1;
  if (indice === -1 || indiceVecino < 0 || indiceVecino >= estados.length) return;

  const actual = estados[indice];
  const vecino = estados[indiceVecino];

  await Promise.all([
    supabase.from("estados_vacante").update({ orden: vecino.orden }).eq("id", actual.id),
    supabase.from("estados_vacante").update({ orden: actual.orden }).eq("id", vecino.id),
  ]);

  revalidatePath("/configuracion/estados");
}
