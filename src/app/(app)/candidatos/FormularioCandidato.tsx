import type { Candidato, Equipo, Vacante } from "@/lib/types";
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
  candidato?: Candidato;
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

      <button
        type="submit"
        className="mt-2 rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:brightness-110"
      >
        Guardar
      </button>
    </form>
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
