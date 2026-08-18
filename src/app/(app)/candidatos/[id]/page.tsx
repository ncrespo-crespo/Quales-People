import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  CandidatoFicha,
  Comunicacion,
  Equipo,
  HistorialEtapa,
  NotaEntrevista,
  Vacante,
} from "@/lib/types";
import { agregarComunicacion, agregarNotaEntrevista } from "./actions";
import { TIPOS_COMUNICACION } from "@/lib/types";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

export default async function FichaCandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: candidato },
    { data: historial },
    { data: notas },
    { data: comunicaciones },
    { data: equipo },
    { data: vacantes },
  ] = await Promise.all([
    supabase.from("vw_candidatos_pipeline").select("*").eq("id", id).single<CandidatoFicha>(),
    supabase
      .from("historial_etapas")
      .select("*")
      .eq("candidato_id", id)
      .order("fecha", { ascending: false })
      .returns<HistorialEtapa[]>(),
    supabase
      .from("notas_entrevistas")
      .select("*")
      .eq("candidato_id", id)
      .order("fecha", { ascending: false })
      .returns<NotaEntrevista[]>(),
    supabase
      .from("comunicaciones")
      .select("*")
      .eq("candidato_id", id)
      .order("fecha", { ascending: false })
      .returns<Comunicacion[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
    supabase.from("vacantes").select("*").returns<Vacante[]>(),
  ]);

  if (!candidato) {
    notFound();
  }

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));
  const vacante = (vacantes ?? []).find((v) => v.id === candidato.vacante_id);

  let urlCv: string | null = null;
  if (candidato.cv_url) {
    const { data } = await supabase.storage.from("cvs").createSignedUrl(candidato.cv_url, 60 * 10);
    urlCv = data?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy dark:text-white">
            {candidato.nombre_completo}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {candidato.etapa_actual}
            {vacante ? ` · ${vacante.titulo}` : ""}
            {candidato.dias_en_etapa !== null ? ` · ${candidato.dias_en_etapa} días en esta etapa` : ""}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/candidatos" className="text-brand-blue hover:underline">
            Volver
          </Link>
          <Link href={`/candidatos/${id}/editar`} className="text-brand-blue hover:underline">
            Editar
          </Link>
        </div>
      </div>

      <Seccion titulo="Datos">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Dato label="Email" valor={candidato.email} />
          <Dato label="Teléfono" valor={candidato.telefono} />
          <Dato
            label="LinkedIn"
            valor={
              candidato.linkedin_url ? (
                <a
                  href={candidato.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Ver perfil
                </a>
              ) : null
            }
          />
          <Dato
            label="Reclutador asignado"
            valor={
              candidato.reclutador_asignado_id
                ? (nombrePorId.get(candidato.reclutador_asignado_id) ?? null)
                : null
            }
          />
          <Dato label="Origen" valor={candidato.origen} />
          <Dato label="Fecha de ingreso" valor={formatearFecha(candidato.fecha_ingreso)} />
          <Dato
            label="Ubicación"
            valor={[candidato.localidad, candidato.pais].filter(Boolean).join(", ") || null}
          />
          <Dato label="Área" valor={candidato.area} />
          <Dato
            label="Años de experiencia"
            valor={candidato.anios_experiencia !== null ? String(candidato.anios_experiencia) : null}
          />
          <Dato label="Nivel de inglés" valor={candidato.nivel_ingles} />
          <Dato label="Stack principal" valor={candidato.stack_principal} />
          <Dato label="Tipo de candidato" valor={candidato.tipo_candidato} />
          <Dato label="Disponibilidad de ingreso" valor={candidato.disponibilidad_ingreso} />
          {candidato.etapa_actual === "Descartado" && (
            <Dato label="Motivo del descarte" valor={candidato.descartado_motivo} />
          )}
          <Dato
            label="CV"
            valor={
              urlCv ? (
                <a
                  href={urlCv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Ver CV
                </a>
              ) : null
            }
          />
        </dl>
      </Seccion>

      <DatosImportados candidato={candidato} />

      <Seccion titulo="Historial de etapas">
        {(historial ?? []).length === 0 && (
          <p className="text-sm text-zinc-500">Sin movimientos registrados.</p>
        )}
        <ol className="flex flex-col gap-3">
          {(historial ?? []).map((h) => (
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
        </ol>
      </Seccion>

      <Seccion titulo="Notas de entrevistas">
        <div className="mb-4 flex flex-col gap-3">
          {(notas ?? []).map((nota) => (
            <div key={nota.id} className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatearFecha(nota.fecha)}
                {nota.entrevistador_id ? ` · ${nombrePorId.get(nota.entrevistador_id) ?? "—"}` : ""}
                {nota.etapa ? ` · ${nota.etapa}` : ""}
                {nota.calificacion ? ` · ${nota.calificacion}/5` : ""}
              </p>
              {nota.feedback && <p className="mt-1 text-black dark:text-zinc-50">{nota.feedback}</p>}
            </div>
          ))}
          {(notas ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">Todavía no hay notas cargadas.</p>
          )}
        </div>
        <form action={agregarNotaEntrevista.bind(null, id)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input name="etapa" placeholder="Etapa" className="campo flex-1" />
            <select name="calificacion" className="campo w-28" defaultValue="">
              <option value="">Sin nota</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}/5
                </option>
              ))}
            </select>
          </div>
          <textarea name="feedback" placeholder="Feedback de la entrevista" rows={2} className="campo" />
          <button
            type="submit"
            className="self-start rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          >
            Agregar nota
          </button>
        </form>
      </Seccion>

      <Seccion titulo="Comunicaciones">
        <div className="mb-4 flex flex-col gap-3">
          {(comunicaciones ?? []).map((c) => (
            <div key={c.id} className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatearFecha(c.fecha)} · {c.tipo}
                {c.asunto ? ` · ${c.asunto}` : ""}
              </p>
              {c.resumen && <p className="mt-1 text-black dark:text-zinc-50">{c.resumen}</p>}
            </div>
          ))}
          {(comunicaciones ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">Todavía no hay comunicaciones registradas.</p>
          )}
        </div>
        <form action={agregarComunicacion.bind(null, id)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select name="tipo" required className="campo w-44" defaultValue={TIPOS_COMUNICACION[0]}>
              {TIPOS_COMUNICACION.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input name="asunto" placeholder="Asunto (opcional)" className="campo flex-1" />
          </div>
          <textarea name="resumen" placeholder="Resumen" rows={2} className="campo" />
          <button
            type="submit"
            className="self-start rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
          >
            Registrar comunicación
          </button>
        </form>
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-black dark:text-zinc-50">{valor ?? "—"}</dd>
    </div>
  );
}

function DatosImportados({ candidato }: { candidato: CandidatoFicha }) {
  const grupos: { titulo: string; campos: [string, React.ReactNode][] }[] = [
    {
      titulo: "Perfil (otros datos)",
      campos: [
        ["Provincia / estado", candidato.provincia_estado],
        ["Género", candidato.genero],
        ["Formación técnica", candidato.formacion_tecnica],
        ["Lugar de empleo actual", candidato.lugar_empleo_actual],
        ["Expectativa salarial", candidato.expectativa_salarial],
        ["Rate freelance", candidato.rate_fl],
        ["Fuente (importada)", candidato.fuente_importada],
      ],
    },
    {
      titulo: "Proceso de selección",
      campos: [
        ["Fecha primer contacto", formatearFecha(candidato.fecha_primer_contacto)],
        ["Fecha screening HR", formatearFecha(candidato.fecha_screening_hr)],
        ["Seniority propuesto (HR)", candidato.seniority_propuesto_hr],
        ["Feedback entrevista HR", candidato.feedback_entrevista_hr],
        ["Fecha entrevista área", formatearFecha(candidato.fecha_entrevista_area)],
        ["Seniority propuesto (área)", candidato.seniority_propuesto_area],
        ["Feedback entrevista", candidato.feedback_entrevista],
        ["Feedback entrevista área", candidato.feedback_entrevista_area],
        ["Estado final (importado)", candidato.estado_final_importado],
      ],
    },
    {
      titulo: "Oferta laboral",
      campos: [
        ["¿Avanza a OL?", candidato.avanza_ol === null ? null : candidato.avanza_ol ? "Sí" : "No"],
        ["Fecha de envío OL", formatearFecha(candidato.fecha_envio_ol)],
        ["Aceptación OL", candidato.aceptacion_ol === null ? null : candidato.aceptacion_ol ? "Sí" : "No"],
        ["Fecha aceptación/rechazo OL", formatearFecha(candidato.fecha_aceptacion_rechazo_ol)],
        ["Motivo de rechazo OL", candidato.motivo_rechazo_ol],
        ["Fecha de ingreso efectiva", formatearFecha(candidato.fecha_ingreso_efectiva)],
        ["Feedback del proceso al candidato", candidato.feedback_proceso_candidato],
        ["Licencias programadas", candidato.licencias_programadas],
      ],
    },
    {
      titulo: "Onboarding",
      campos: [
        ["Cliente", candidato.ob_cliente],
        ["Proyecto", candidato.ob_proyecto],
        ["Inducción empresa", candidato.ob_induccion_empresa],
        ["Inducción empresa · horario", candidato.ob_induccion_empresa_horario],
        ["Inducción al área · responsable", candidato.ob_induccion_area_responsable],
        ["Inducción al área · horario", candidato.ob_induccion_area_horario],
        ["Inducción a proyecto · responsable", candidato.ob_induccion_proyecto_responsable],
        ["Inducción a proyecto · horario", candidato.ob_induccion_proyecto_horario],
        ["Envío de elementos de trabajo", formatearFecha(candidato.ob_fecha_envio_elementos)],
        ["Recepción de elementos de trabajo", formatearFecha(candidato.ob_fecha_recepcion_elementos)],
      ],
    },
  ];

  const gruposConDatos = grupos.filter((g) =>
    g.campos.some(([, valor]) => valor !== null && valor !== undefined && valor !== "—"),
  );

  if (gruposConDatos.length === 0) return null;

  return (
    <Seccion titulo="Información importada de la planilla">
      <div className="flex flex-col gap-2">
        {gruposConDatos.map((grupo) => (
          <details key={grupo.titulo} className="rounded border border-black/10 p-3 dark:border-white/10">
            <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
              {grupo.titulo}
            </summary>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {grupo.campos.map(([label, valor]) => (
                <Dato key={label} label={label} valor={valor} />
              ))}
            </dl>
          </details>
        ))}
      </div>
    </Seccion>
  );
}
