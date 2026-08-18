import type { Vacante } from "@/lib/types";

// Varias búsquedas pueden tener el mismo título ("Analista de Datos" en
// más de un cliente, o repetida en distintas fechas): un <select> que solo
// muestre el título no alcanza para elegir la correcta.
export function etiquetaVacante(vacante: Vacante) {
  const cliente = vacante.cliente_o_area ?? "sin cliente";
  const fecha = vacante.fecha_inicio_proceso
    ? new Date(vacante.fecha_inicio_proceso).toLocaleDateString("es-AR")
    : "sin fecha";
  return `${vacante.titulo} — ${cliente} (${fecha})`;
}
