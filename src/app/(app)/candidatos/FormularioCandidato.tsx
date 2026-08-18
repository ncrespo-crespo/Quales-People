import type { CandidatoCompleto, Equipo, Vacante } from "@/lib/types";
import { ETAPAS_CANDIDATO, ORIGENES_CANDIDATO } from "@/lib/types";

export function FormularioCandidato({
  action,
  vacantes,
  equipo,
  candidato,
  urlCvActual,
  error,
}: {
  action: (formData: FormData) => void;
  vacantes: Vacante[];
  equipo: Equipo[];
  candidato?: CandidatoCompleto;
  urlCvActual?: string | null;
  error?: string;
}) {
  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="mx-auto flex w-full max-w-lg flex-col gap-4 p-8"
    >
      <h1 className="text-xl font-bold text-brand-navy dark:text-white">
        {candidato ? "Editar candidato" : "Nuevo candidato"}
      </h1>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {candidato && (
        <input type="hidden" name="etapa_anterior" value={candidato.etapa_actual} />
      )}

      <Campo label="Nombre completo">
        <input
          name="nombre_completo"
          required
          defaultValue={candidato?.nombre_completo}
          className="campo"
        />
      </Campo>

      <Campo label="Email">
        <input type="email" name="email" defaultValue={candidato?.email ?? ""} className="campo" />
      </Campo>

      <Campo label="Teléfono">
        <input name="telefono" defaultValue={candidato?.telefono ?? ""} className="campo" />
      </Campo>

      <Campo label="LinkedIn">
        <input
          name="linkedin_url"
          defaultValue={candidato?.linkedin_url ?? ""}
          className="campo"
        />
      </Campo>

      <Campo label="Vacante">
        <select name="vacante_id" defaultValue={candidato?.vacante_id ?? ""} className="campo">
          <option value="">Sin vacante asignada</option>
          {vacantes.map((vacante) => (
            <option key={vacante.id} value={vacante.id}>
              {vacante.titulo}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Reclutador asignado">
        <select
          name="reclutador_asignado_id"
          defaultValue={candidato?.reclutador_asignado_id ?? ""}
          className="campo"
        >
          <option value="">Sin asignar</option>
          {equipo.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.nombre ?? persona.email}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Origen">
        <select name="origen" defaultValue={candidato?.origen ?? ""} className="campo">
          <option value="">—</option>
          {ORIGENES_CANDIDATO.map((origen) => (
            <option key={origen} value={origen}>
              {origen}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Etapa">
        <select
          name="etapa_actual"
          required
          defaultValue={candidato?.etapa_actual ?? "Sourcing"}
          className="campo"
        >
          {ETAPAS_CANDIDATO.map((etapa) => (
            <option key={etapa} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>
      </Campo>

      {candidato && (
        <Campo label="Nota sobre el cambio de etapa (opcional)">
          <input name="nota_cambio_etapa" className="campo" />
        </Campo>
      )}

      <Campo label="Motivo del descarte (obligatorio si la etapa es Descartado)">
        <input
          name="descartado_motivo"
          defaultValue={candidato?.descartado_motivo ?? ""}
          className="campo"
        />
      </Campo>

      {candidato && (
        <Campo label="Fecha de contacto">
          <input
            type="date"
            name="fecha_ingreso"
            defaultValue={candidato.fecha_ingreso?.slice(0, 10)}
            className="campo"
          />
        </Campo>
      )}

      <Campo label={urlCvActual ? "Reemplazar CV" : "CV"}>
        <input type="file" name="cv" accept=".pdf,.doc,.docx" className="campo" />
      </Campo>
      {urlCvActual && (
        <a
          href={urlCvActual}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-blue hover:underline"
        >
          Ver CV actual
        </a>
      )}

      {candidato && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="oculto" defaultChecked={candidato.oculto} />
          Ocultar de los listados y el tablero
        </label>
      )}

      {candidato && <SeccionesAvanzadas candidato={candidato} />}

      <button
        type="submit"
        className="mt-2 rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
      >
        Guardar
      </button>
    </form>
  );
}

type TipoCampo = "texto" | "textarea" | "fecha" | "numero" | "booleano";

type CampoSpec = {
  name: keyof CandidatoCompleto;
  label: string;
  tipo?: TipoCampo;
};

const SECCIONES: { titulo: string; campos: CampoSpec[] }[] = [
  {
    titulo: "Perfil",
    campos: [
      { name: "apellido", label: "Apellido" },
      { name: "pais", label: "País" },
      { name: "provincia_estado", label: "Provincia / estado" },
      { name: "localidad", label: "Localidad" },
      { name: "genero", label: "Género" },
      { name: "fecha_nacimiento", label: "Fecha de nacimiento", tipo: "fecha" },
      { name: "area", label: "Área" },
      { name: "formacion_tecnica", label: "Formación técnica" },
      { name: "anios_experiencia", label: "Años de experiencia", tipo: "numero" },
      { name: "experiencia_consultoria", label: "Experiencia en consultoría", tipo: "booleano" },
      { name: "nivel_ingles", label: "Nivel de inglés" },
      { name: "stack_principal", label: "Stack principal" },
      { name: "lugar_empleo_actual", label: "Lugar de empleo actual" },
      { name: "expectativa_salarial", label: "Expectativa salarial" },
      { name: "rate_fl", label: "Rate freelance" },
      { name: "tipo_moneda", label: "Tipo de moneda" },
      { name: "tipo_candidato", label: "Tipo de candidato" },
      { name: "disponibilidad_ingreso", label: "Disponibilidad de ingreso" },
      { name: "fuente_importada", label: "Fuente" },
    ],
  },
  {
    titulo: "Proceso de selección",
    campos: [
      { name: "fecha_primer_contacto", label: "Fecha primer contacto", tipo: "fecha" },
      { name: "fecha_screening_hr", label: "Fecha screening HR", tipo: "fecha" },
      { name: "seniority_propuesto_hr", label: "Seniority propuesto (HR)" },
      { name: "feedback_entrevista_hr", label: "Feedback entrevista HR", tipo: "textarea" },
      { name: "fecha_entrevista_area", label: "Fecha entrevista área", tipo: "fecha" },
      { name: "seniority_propuesto_area", label: "Seniority propuesto (área)" },
      { name: "feedback_entrevista", label: "Feedback entrevista", tipo: "textarea" },
      { name: "feedback_entrevista_area", label: "Feedback entrevista área", tipo: "textarea" },
      { name: "estado_final_importado", label: "Estado final (importado)" },
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
      { name: "ob_induccion_empresa", label: "Inducción empresa" },
      { name: "ob_induccion_empresa_horario", label: "Inducción empresa · horario" },
      { name: "ob_induccion_area_responsable", label: "Inducción al área · responsable" },
      { name: "ob_induccion_area_horario", label: "Inducción al área · horario" },
      { name: "ob_induccion_proyecto_responsable", label: "Inducción a proyecto · responsable" },
      { name: "ob_induccion_proyecto_horario", label: "Inducción a proyecto · horario" },
      { name: "ob_fecha_envio_elementos", label: "Envío de elementos de trabajo", tipo: "fecha" },
      { name: "ob_fecha_recepcion_elementos", label: "Recepción de elementos de trabajo", tipo: "fecha" },
    ],
  },
];

function SeccionesAvanzadas({ candidato }: { candidato: CandidatoCompleto }) {
  return (
    <div className="flex flex-col gap-2">
      {SECCIONES.map((seccion) => (
        <details key={seccion.titulo} className="rounded border border-black/10 p-3 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
            {seccion.titulo}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {seccion.campos.map((campo) => (
              <CampoDinamico key={campo.name} campo={campo} valor={candidato[campo.name]} />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function CampoDinamico({ campo, valor }: { campo: CampoSpec; valor: unknown }) {
  const nombre = campo.name;

  if (campo.tipo === "textarea") {
    return (
      <Campo label={campo.label}>
        <textarea name={nombre} rows={2} defaultValue={(valor as string) ?? ""} className="campo" />
      </Campo>
    );
  }

  if (campo.tipo === "fecha") {
    return (
      <Campo label={campo.label}>
        <input
          type="date"
          name={nombre}
          defaultValue={valor ? String(valor).slice(0, 10) : ""}
          className="campo"
        />
      </Campo>
    );
  }

  if (campo.tipo === "numero") {
    return (
      <Campo label={campo.label}>
        <input
          type="number"
          step="any"
          name={nombre}
          defaultValue={valor === null || valor === undefined ? "" : String(valor)}
          className="campo"
        />
      </Campo>
    );
  }

  if (campo.tipo === "booleano") {
    const actual = valor === true ? "true" : valor === false ? "false" : "";
    return (
      <Campo label={campo.label}>
        <select name={nombre} defaultValue={actual} className="campo">
          <option value="">Sin dato</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      </Campo>
    );
  }

  return (
    <Campo label={campo.label}>
      <input name={nombre} defaultValue={(valor as string) ?? ""} className="campo" />
    </Campo>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
      {label}
      {children}
    </label>
  );
}
