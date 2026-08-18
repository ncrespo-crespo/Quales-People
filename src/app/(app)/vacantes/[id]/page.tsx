import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Equipo, PostulacionConDias, VacanteConMetricas } from "@/lib/types";
import { esCritico, InsigniaCritico, InsigniaPrioridad } from "../insignias";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

export default async function FichaVacantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: vacante }, { data: postulaciones }, { data: equipo }] = await Promise.all([
    supabase.from("vw_metricas_vacantes").select("*").eq("id", id).single<VacanteConMetricas>(),
    supabase
      .from("vw_postulaciones_pipeline")
      .select("*")
      .eq("vacante_id", id)
      .order("fecha_postulacion", { ascending: false })
      .returns<PostulacionConDias[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  if (!vacante) {
    notFound();
  }

  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-navy dark:text-white">{vacante.titulo}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {vacante.cliente_o_area ?? "Sin cliente / área"}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/vacantes" className="text-brand-blue hover:underline">
            Volver
          </Link>
          <Link href={`/match?vacante=${vacante.id}`} className="text-brand-blue hover:underline">
            Ver candidatos sugeridos
          </Link>
          <Link href={`/vacantes/${id}/editar`} className="text-brand-blue hover:underline">
            Editar
          </Link>
        </div>
      </div>

      <Seccion titulo="Datos">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Dato
            label="Estado"
            valor={
              <span
                className="rounded-full px-2 py-1 text-xs font-medium text-black/80"
                style={{ backgroundColor: vacante.estado_color }}
              >
                {vacante.estado_nombre}
              </span>
            }
          />
          <Dato label="Prioridad" valor={<InsigniaPrioridad prioridad={vacante.prioridad} />} />
          <Dato
            label="Responsable"
            valor={
              vacante.reclutador_responsable_id
                ? (nombrePorId.get(vacante.reclutador_responsable_id) ?? "—")
                : null
            }
          />
          <Dato
            label="Días open / TTF"
            valor={
              <span className="flex items-center gap-2">
                {vacante.time_to_fill !== null
                  ? `${vacante.time_to_fill} días (TTF)`
                  : vacante.dias_open !== null
                    ? `${vacante.dias_open} días open`
                    : "—"}
                {esCritico(vacante.dias_open) && <InsigniaCritico />}
              </span>
            }
          />
          <Dato label="Fecha de inicio" valor={formatearFecha(vacante.fecha_inicio_proceso)} />
          <Dato
            label="Fecha prevista de ingreso"
            valor={formatearFecha(vacante.fecha_prevista_ingreso_hm)}
          />
          <Dato
            label="Fecha de ingreso confirmada"
            valor={formatearFecha(vacante.fecha_ingreso_confirmada)}
          />
          <Dato label="Stack principal" valor={vacante.stack_principal} />
          <Dato label="Nivel de inglés" valor={vacante.nivel_ingles} />
          <Dato
            label="Ubicación"
            valor={[vacante.localidad, vacante.provincia_estado, vacante.pais].filter(Boolean).join(", ") || null}
          />
          <Dato label="Modalidad de trabajo" valor={vacante.modalidad_trabajo} />
          <Dato
            label="Banda salarial"
            valor={
              vacante.banda_salarial !== null
                ? `${vacante.moneda_banda_salarial ?? ""} ${vacante.banda_salarial}`.trim()
                : null
            }
          />
          <Dato label="Acepta freelance" valor={vacante.acepta_freelance ? "Sí" : "No"} />
          <Dato
            label="Placa"
            valor={
              vacante.drive_url ? (
                <a
                  href={vacante.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Ver en Drive
                </a>
              ) : null
            }
          />
        </dl>
        {vacante.notas && (
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
            {vacante.notas}
          </p>
        )}
      </Seccion>

      <Seccion titulo={`Postulantes (${(postulaciones ?? []).length})`}>
        <div className="flex flex-col gap-2">
          {(postulaciones ?? []).map((p) => (
            <Link
              key={p.id}
              href={`/candidatos/${p.candidato_id}`}
              className={`flex flex-wrap items-center gap-2 rounded border border-black/10 p-3 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5 ${
                p.candidato_oculto ? "opacity-50" : ""
              }`}
            >
              <span className="font-medium text-black dark:text-zinc-50">
                {p.nombre_completo}
              </span>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                {p.etapa_actual}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {p.reclutador_asignado_id
                  ? nombrePorId.get(p.reclutador_asignado_id)
                  : "sin reclutador asignado"}
              </span>
              <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                {formatearFecha(p.fecha_postulacion)}
              </span>
            </Link>
          ))}
          {(postulaciones ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">
              Todavía no tiene candidatos postulados.{" "}
              <Link href={`/match?vacante=${vacante.id}`} className="text-brand-blue hover:underline">
                Ver sugerencias
              </Link>
              .
            </p>
          )}
        </div>
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
