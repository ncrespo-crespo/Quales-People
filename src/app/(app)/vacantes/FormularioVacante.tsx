import type { Equipo, EstadoVacante, Vacante } from "@/lib/types";
import { MODALIDADES_TRABAJO, PRIORIDADES_VACANTE } from "@/lib/types";

export function FormularioVacante({
  action,
  estados,
  equipo,
  vacante,
  error,
}: {
  action: (formData: FormData) => void;
  estados: EstadoVacante[];
  equipo: Equipo[];
  vacante?: Vacante;
  error?: string;
}) {
  return (
    <form
      action={action}
      className="mx-auto flex w-full max-w-lg flex-col gap-4 p-8"
    >
      <h1 className="text-xl font-bold text-brand-navy dark:text-white">
        {vacante ? "Editar vacante" : "Nueva vacante"}
      </h1>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <Campo label="Título">
        <input
          name="titulo"
          required
          defaultValue={vacante?.titulo}
          className="campo"
        />
      </Campo>

      <Campo label="Cliente / área">
        <input
          name="cliente_o_area"
          defaultValue={vacante?.cliente_o_area ?? ""}
          className="campo"
        />
      </Campo>

      <Campo label="Estado">
        <select
          name="estado_id"
          required
          defaultValue={vacante?.estado_id}
          className="campo"
        >
          {estados.map((estado) => (
            <option key={estado.id} value={estado.id}>
              {estado.nombre}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Prioridad">
        <select
          name="prioridad"
          required
          defaultValue={vacante?.prioridad ?? "Media"}
          className="campo"
        >
          {PRIORIDADES_VACANTE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Reclutador responsable">
        <select
          name="reclutador_responsable_id"
          defaultValue={vacante?.reclutador_responsable_id ?? ""}
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

      <Campo label="Fecha de inicio del proceso">
        <input
          type="date"
          name="fecha_inicio_proceso"
          required
          defaultValue={vacante?.fecha_inicio_proceso ?? new Date().toISOString().slice(0, 10)}
          className="campo"
        />
      </Campo>

      <Campo label="Fecha prevista de ingreso (HM)">
        <input
          type="date"
          name="fecha_prevista_ingreso_hm"
          defaultValue={vacante?.fecha_prevista_ingreso_hm ?? ""}
          className="campo"
        />
      </Campo>

      {vacante && (
        <Campo label="Fecha de ingreso confirmada">
          <input
            type="date"
            name="fecha_ingreso_confirmada"
            defaultValue={vacante.fecha_ingreso_confirmada ?? ""}
            className="campo"
          />
        </Campo>
      )}

      <Campo label="Stack principal">
        <input
          name="stack_principal"
          placeholder="SQL, Snowflake, Power BI..."
          defaultValue={vacante?.stack_principal ?? ""}
          className="campo"
        />
      </Campo>

      <Campo label="Nivel de inglés">
        <input
          name="nivel_ingles"
          defaultValue={vacante?.nivel_ingles ?? ""}
          className="campo"
        />
      </Campo>

      <div className="flex gap-2">
        <Campo label="País">
          <input name="pais" defaultValue={vacante?.pais ?? ""} className="campo" />
        </Campo>
        <Campo label="Provincia / estado">
          <input
            name="provincia_estado"
            defaultValue={vacante?.provincia_estado ?? ""}
            className="campo"
          />
        </Campo>
        <Campo label="Localidad">
          <input name="localidad" defaultValue={vacante?.localidad ?? ""} className="campo" />
        </Campo>
      </div>

      <Campo label="Modalidad de trabajo">
        <select
          name="modalidad_trabajo"
          defaultValue={vacante?.modalidad_trabajo ?? ""}
          className="campo"
        >
          <option value="">Sin definir</option>
          {MODALIDADES_TRABAJO.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Campo>

      <Campo label="Banda salarial">
        <input
          name="banda_salarial"
          placeholder="Ej: USD 2000-3000"
          defaultValue={vacante?.banda_salarial ?? ""}
          className="campo"
        />
      </Campo>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          name="acepta_freelance"
          defaultChecked={vacante?.acepta_freelance ?? false}
        />
        Acepta freelance
      </label>

      <Campo label="Notas">
        <textarea
          name="notas"
          rows={3}
          defaultValue={vacante?.notas ?? ""}
          className="campo"
        />
      </Campo>

      <Campo label="Link de Drive (placa de la búsqueda)">
        <input
          type="url"
          name="drive_url"
          defaultValue={vacante?.drive_url ?? ""}
          placeholder="https://drive.google.com/..."
          className="campo"
        />
      </Campo>

      {vacante && (
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" name="oculto" defaultChecked={vacante.oculto} />
          Ocultar de los listados y el tablero
        </label>
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
