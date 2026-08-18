import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  CandidatoCompleto,
  Comunicacion,
  Equipo,
  HistorialEtapa,
  NotaEntrevista,
  Postulacion,
  Vacante,
} from "@/lib/types";
import { agregarComunicacion, agregarNotaEntrevista } from "./actions";
import { BotonEliminarCandidato } from "./BotonEliminarCandidato";
import { SeccionPostulaciones } from "./Postulaciones";
import { TIPOS_COMUNICACION } from "@/lib/types";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

export default async function FichaCandidatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfilUsuario } = await supabase
    .from("equipo")
    .select("rol")
    .eq("id", user!.id)
    .single();
  const esAdmin = perfilUsuario?.rol === "admin";

  const [
    { data: candidato },
    { data: postulaciones },
    { data: notas },
    { data: comunicaciones },
    { data: equipo },
    { data: vacantes },
  ] = await Promise.all([
    supabase.from("candidatos").select("*").eq("id", id).single<CandidatoCompleto>(),
    supabase
      .from("postulaciones")
      .select("*")
      .eq("candidato_id", id)
      .order("fecha_postulacion", { ascending: false })
      .returns<Postulacion[]>(),
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

  const idsPostulaciones = (postulaciones ?? []).map((p) => p.id);
  const { data: historial } = idsPostulaciones.length
    ? await supabase
        .from("historial_etapas")
        .select("*")
        .in("postulacion_id", idsPostulaciones)
        .order("fecha", { ascending: false })
        .returns<HistorialEtapa[]>()
    : { data: [] as HistorialEtapa[] };

  const historialPorPostulacion = new Map<string, HistorialEtapa[]>();
  for (const h of historial ?? []) {
    const lista = historialPorPostulacion.get(h.postulacion_id) ?? [];
    lista.push(h);
    historialPorPostulacion.set(h.postulacion_id, lista);
  }

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
            {(postulaciones ?? []).length} postulación
            {(postulaciones ?? []).length === 1 ? "" : "es"}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/candidatos" className="text-brand-blue hover:underline">
            Volver
          </Link>
          <Link href={`/candidatos/${id}/editar`} className="text-brand-blue hover:underline">
            Editar
          </Link>
          {esAdmin && (
            <BotonEliminarCandidato id={id} nombre={candidato.nombre_completo} />
          )}
        </div>
      </div>

      {errorParam && (
        <p className="mb-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorParam}
        </p>
      )}

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
          <Dato label="Origen" valor={candidato.origen} />
          <Dato label="Fecha de contacto" valor={formatearFecha(candidato.fecha_ingreso)} />
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

      <PerfilOtrosDatos candidato={candidato} />

      <SeccionPostulaciones
        candidatoId={id}
        postulaciones={postulaciones ?? []}
        historialPorPostulacion={historialPorPostulacion}
        vacantes={vacantes ?? []}
        equipo={equipo ?? []}
      />

      <Seccion titulo="Notas de entrevistas">
        <div className="mb-4 flex flex-col gap-3">
          {(notas ?? []).map((nota) => (
            <div key={nota.id} className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatearFecha(nota.fecha)}
                {nota.entrevistador_id ? ` · ${equipo?.find((e) => e.id === nota.entrevistador_id)?.nombre ?? "—"}` : ""}
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

function PerfilOtrosDatos({ candidato }: { candidato: CandidatoCompleto }) {
  const campos: [string, React.ReactNode][] = [
    ["Provincia / estado", candidato.provincia_estado],
    ["Género", candidato.genero],
    ["Formación técnica", candidato.formacion_tecnica],
    ["Lugar de empleo actual", candidato.lugar_empleo_actual],
    ["Expectativa salarial", candidato.expectativa_salarial],
    ["Rate freelance", candidato.rate_fl],
    ["Tipo de moneda", candidato.tipo_moneda],
    ["Fuente (importada)", candidato.fuente_importada],
  ];

  const tieneDatos = campos.some(([, valor]) => valor !== null && valor !== undefined);
  if (!tieneDatos) return null;

  return (
    <Seccion titulo="Perfil">
      <details className="rounded border border-black/10 p-3 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
          Otros datos de perfil
        </summary>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {campos.map(([label, valor]) => (
            <Dato key={label} label={label} valor={valor} />
          ))}
        </dl>
      </details>
    </Seccion>
  );
}
