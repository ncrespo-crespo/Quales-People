"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function esAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = await supabase
    .from("equipo")
    .select("rol")
    .eq("id", user!.id)
    .single();
  return perfil?.rol === "admin";
}

async function urlInvitacion() {
  const encabezados = await headers();
  const origen = `${encabezados.get("x-forwarded-proto") ?? "https"}://${encabezados.get("host")}`;
  return `${origen}/invitacion`;
}

export async function invitarMiembro(formData: FormData) {
  if (!(await esAdmin())) {
    return { error: "solo un admin puede invitar gente al equipo" };
  }

  const nombre = String(formData.get("nombre"));
  const email = String(formData.get("email"));
  const rol = String(formData.get("rol"));

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol },
    redirectTo: await urlInvitacion(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/configuracion/equipo");
  return { error: null };
}

// Para alguien que ya fue invitado pero todavía no pudo activar su cuenta
// (p. ej. el link de invitación anterior venció o no llegó a definir la
// contraseña): reenvía la invitación al mismo email sin tocar su fila de
// `equipo`, porque el usuario en auth.users ya existe.
export async function reenviarInvitacion(id: string) {
  if (!(await esAdmin())) {
    return { error: "solo un admin puede reenviar invitaciones" };
  }

  const supabase = await createClient();
  const { data: persona, error: errorPersona } = await supabase
    .from("equipo")
    .select("email, nombre, rol")
    .eq("id", id)
    .single();

  if (errorPersona || !persona) {
    return { error: errorPersona?.message ?? "no se encontró a esa persona" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(persona.email, {
    data: { nombre: persona.nombre, rol: persona.rol },
    redirectTo: await urlInvitacion(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/configuracion/equipo");
  return { error: null };
}

export async function actualizarMiembro(id: string, formData: FormData) {
  if (!(await esAdmin())) {
    return { error: "solo un admin puede editar el equipo" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("equipo")
    .update({
      nombre: String(formData.get("nombre")),
      rol: String(formData.get("rol")),
      activo: formData.get("activo") === "on",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/configuracion/equipo");
  return { error: null };
}
