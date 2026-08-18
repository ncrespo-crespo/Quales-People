import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usa la service_role key: solo para acciones de administración (invitar
// usuarios) ejecutadas en el servidor. El paquete "server-only" hace que el
// build falle si este archivo termina importado desde un componente cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
