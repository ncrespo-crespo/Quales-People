import { ETAPAS_CANDIDATO } from "@/lib/types";
import type { Equipo, HistorialEtapa, Postulacion, Vacante } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import {
  actualizarPostulacion,
  crearPostulacion,
  eliminarPostulacion,
} from "../postulaciones/actions";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

type CampoSpec = {
  name: keyof Postulacion;
  label: string;
  tipo?: "fecha" | "fecha_hora" | "textarea" | "booleano";
};

const GRUPOS: { titulo: string; campos: CampoSpec[] }[] = [
  {
    titulo: "Proceso de selección",
    campos: [
      { name: "tipo_candidato", label: "Tipo de candidato" },
      { name: "fecha_primer_contacto", label: "Fecha primer contacto", tipo: "fecha" },
      { name: "fecha_screening_hr", label: "Fecha screening HR", tipo: "fecha" },
      { name: "fecha_entrevista_hr", label: "Fecha entrevista HR", tipo: "fecha" },
      { name: "seniority_propuesto_hr", label: "Seniority propuesto (HR)" },
      { name: "feedback_entrevista_hr", label: "Feedback entrevista HR", tipo: "textarea" },
      { name: "fecha_entrevista_area", label: "Fecha entrevista área", tipo: "fecha" },
      { name: "seniority_propuesto_area", label: "Seniority propuesto (área)" },
      { name: "feedback_entrevista_area", label: "Feedback entrevista área", tipo: "textarea" },
      { name: "disponibilidad_ingreso", label: "Disponibilidad de ingreso" },
      { name: "expectativa_salarial", label: "Expectativa salarial" },
      { name: "tipo_moneda", label: "Moneda" },
      { name: "estado_final", label: "Status final" },
    ],
  },
  {
    titulo: "Oferta laboral",
    campos: [
      { name: "avanza_ol", label: "¿Avanza a OL?", tipo: "booleano" },
      { name: "fecha_envio_ol", label: "Fecha de envío OL", tipo: "fecha" },
      { name: "aceptacion_ol", label: "Aceptación OL", tipo: "booleano" },
      { name: "fecha_aceptacion_rechazo_ol", label: "Fecha aceptación/rechazo OL", tipo: "fecha" },
      { name: "motivo_rechazo_ol", label: "Motivo de rechazo OL" },
      { name: "fecha_ingreso_efectiva", label: "Fecha de ingreso efectiva", tipo: "fecha" },
      { name: "feedback_proceso_candidato", label: "Feedback del proceso al candidato", tipo: "textarea" },
      { name: "licencias_programadas", label: "Licencias programadas" },
    ],
  },
  {
    titulo: "Onboarding",
    campos: [
      { name: "ob_cliente", label: "Cliente" },
      { name: "ob_proyecto", label: "Proyecto" },
      { name: "ob_induccion_empresa_fecha_hora", label: "Fecha y hora onboarding empresa", tipo: "fecha_hora" },
      { name: "ob_induccion_empresa_responsable", label: "Inducción a empresa · responsable" },
      { name: "ob_induccion_area_fecha_hora", label: "Fecha y hora inducción al área", tipo: "fecha_hora" },
      { name: "ob_induccion_area_responsable", label: "Inducción al área · responsable" },
      { name: "ob_induccion_proyecto_fecha_hora", label: "Fecha y hora inducción a proyecto", tipo: "fecha_hora" },
      { name: "ob_induccion_proyecto_responsable", label: "Inducción a proyecto · responsable" },
      { name: "ob_fecha_envio_elementos", label: "Envío de elementos de trabajo", tipo: "fecha" },
      { name: "ob_fecha_recepcion_elementos", label: "Recepción de elementos de trabajo", tipo: "fecha" },
    ],
  },
];

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
  const tituloVacantePorId = new Map(vacantes.map((v) => [v.id, v.titulo]));
  const nombrePorId = new Map(equipo.map((p) => [p.id, p.nombre ?? p.email]));

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
          <details
            key={postulacion.id}
            className="rounded border border-black/10 p-3 dark:border-white/10"
          >
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-black dark:text-zinc-50">
                {postulacion.vacante_id
                  ? (tituloVacantePorId.get(postulacion.vacante_id) ?? "Vacante eliminada")
                  : "Sin vacante asignada"}
              </span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                {postulacion.etapa_actual}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatearFecha(postulacion.fecha_postulacion)}
              </span>
            </summary>

            <div className="mt-3 flex flex-col gap-4">
              <form
                action={actualizarPostulacion.bind(null, postulacion.id, candidatoId)}
                className="flex flex-col gap-2"
              >
                <input type="hidden" name="etapa_anterior" value={postulacion.etapa_actual} />
                <div className="flex flex-wrap gap-2">
                  <select
                    name="vacante_id"
                    defaultValue={postulacion.vacante_id ?? ""}
                    className="campo flex-1"
                  >
                    <option value="">Sin vacante asignada</option>
                    {vacantes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {etiquetaVacante(v)}
                      </option>
                    ))}
                  </select>
                  <select
                    name="reclutador_asignado_id"
                    defaultValue={postulacion.reclutador_asignado_id ?? ""}
                    className="campo"
                  >
                    <option value="">Sin asignar</option>
                    {equipo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre ?? p.email}
                      </option>
                    ))}
                  </select>
                  <select name="etapa_actual" required defaultValue={postulacion.etapa_actual} className="campo">
                    {ETAPAS_CANDIDATO.map((etapa) => (
                      <option key={etapa} value={etapa}>
                        {etapa}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="descartado_motivo"
                  placeholder="Motivo del descarte (obligatorio si la etapa es Descartado)"
                  defaultValue={postulacion.descartado_motivo ?? ""}
                  className="campo"
                />
                <input
                  name="nota_cambio_etapa"
                  placeholder="Nota sobre el cambio de etapa (opcional)"
                  className="campo"
                />

                <div className="flex flex-col gap-2">
                  {GRUPOS.map((grupo) => (
                    <details key={grupo.titulo} className="rounded border border-black/10 p-2 dark:border-white/10">
                      <summary className="cursor-pointer text-xs font-medium text-black dark:text-zinc-50">
                        {grupo.titulo}
                      </summary>
                      <div className="mt-2 flex flex-col gap-2">
                        {grupo.campos.map((campo) => (
                          <CampoPostulacion key={campo.name} campo={campo} valor={postulacion[campo.name]} />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>

                <button
                  type="submit"
                  className="self-start rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                >
                  Guardar postulación
                </button>
              </form>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Historial
                </p>
                <ol className="flex flex-col gap-2">
                  {(historialPorPostulacion.get(postulacion.id) ?? []).map((h) => (
                    <li key={h.id} className="border-l-2 border-brand-blue/40 pl-3 text-sm">
                      <p className="text-black dark:text-zinc-50">
                        {h.etapa_anterior ? `${h.etapa_anterior} → ${h.etapa_nueva}` : `Alta en ${h.etapa_nueva}`}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatearFecha(h.fecha)}
                        {h.movido_por_id ? ` · ${nombrePorId.get(h.movido_por_id) ?? "—"}` : ""}
                      </p>
                      {h.nota && <p className="mt-1 text-zinc-600 dark:text-zinc-300">{h.nota}</p>}
                    </li>
                  ))}
                  {(historialPorPostulacion.get(postulacion.id) ?? []).length === 0 && (
                    <p className="text-sm text-zinc-500">Sin movimientos registrados.</p>
                  )}
                </ol>
              </div>

              <form
                action={async () => {
                  "use server";
                  await eliminarPostulacion(postulacion.id, candidatoId);
                }}
              >
                <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                  Eliminar esta postulación
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>

      <form
        action={crearPostulacion.bind(null, candidatoId)}
        className="mt-4 flex flex-wrap items-center gap-2 rounded border border-dashed border-black/20 p-3 dark:border-white/20"
      >
        <select name="vacante_id" required className="campo flex-1">
          <option value="">Elegir vacante...</option>
          {vacantes.map((v) => (
            <option key={v.id} value={v.id}>
              {etiquetaVacante(v)}
            </option>
          ))}
        </select>
        <select name="reclutador_asignado_id" className="campo">
          <option value="">Sin asignar</option>
          {equipo.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre ?? p.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded bg-brand-green px-3 py-1.5 text-sm font-medium text-brand-navy hover:brightness-95"
        >
          + Nueva postulación
        </button>
      </form>
    </section>
  );
}

function CampoPostulacion({ campo, valor }: { campo: CampoSpec; valor: unknown }) {
  const nombre = campo.name;

  if (campo.tipo === "textarea") {
    return (
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        {campo.label}
        <textarea name={nombre} rows={2} defaultValue={(valor as string) ?? ""} className="campo" />
      </label>
    );
  }

  if (campo.tipo === "fecha") {
    return (
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        {campo.label}
        <input
          type="date"
          name={nombre}
          defaultValue={valor ? String(valor).slice(0, 10) : ""}
          className="campo"
        />
      </label>
    );
  }

  if (campo.tipo === "fecha_hora") {
    return (
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        {campo.label}
        <input
          type="datetime-local"
          name={nombre}
          defaultValue={valor ? String(valor).slice(0, 16) : ""}
          className="campo"
        />
      </label>
    );
  }

  if (campo.tipo === "booleano") {
    const actual = valor === true ? "true" : valor === false ? "false" : "";
    return (
      <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        {campo.label}
        <select name={nombre} defaultValue={actual} className="campo">
          <option value="">Sin dato</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
      {campo.label}
      <input name={nombre} defaultValue={(valor as string) ?? ""} className="campo" />
    </label>
  );
}
