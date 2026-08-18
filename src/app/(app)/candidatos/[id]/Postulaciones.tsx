import type { Equipo, HistorialEtapa, Postulacion, Vacante } from "@/lib/types";
import { FormNuevaPostulacion } from "./FormNuevaPostulacion";
import { PostulacionItem } from "./PostulacionItem";

export function SeccionPostulaciones({
  candidatoId,
  postulaciones,
  historialPorPostulacion,
  vacantes,
  equipo,
}: {
  candidatoId: string;
  postulaciones: Postulacion[];
  historialPorPostulacion: Map<string, HistorialEtapa[]>;
  vacantes: Vacante[];
  equipo: Equipo[];
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Postulaciones
      </h2>

      <div className="flex flex-col gap-3">
        {postulaciones.length === 0 && (
          <p className="text-sm text-zinc-500">Todavía no tiene ninguna postulación.</p>
        )}
        {postulaciones.map((postulacion) => (
          <PostulacionItem
            key={postulacion.id}
            candidatoId={candidatoId}
            postulacion={postulacion}
            historial={historialPorPostulacion.get(postulacion.id) ?? []}
            vacantes={vacantes}
            equipo={equipo}
          />
        ))}
      </div>

      <FormNuevaPostulacion candidatoId={candidatoId} vacantes={vacantes} equipo={equipo} />
    </section>
  );
}
