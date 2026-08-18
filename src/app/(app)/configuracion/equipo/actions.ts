"use server";

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
