import Link from "next/link";
import type { CandidatoCompleto, Equipo, Vacante } from "@/lib/types";
import { ESTADOS_CANDIDATO, MONEDAS, ORIGENES_CANDIDATO } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import { BotonGuardar } from "./BotonGuardar";

// Los candidatos importados solo tenían "nombre_completo" + "apellido"
// (sin nombre de pila suelto). Para no dejar el campo "Nombres" vacío en
// esos casos, se infiere restando el apellido del nombre completo.
function inferirNombre(candidato?: CandidatoCompleto) {
  if (!candidato) return "";
  if (candidato.nombre) return candidato.nombre;
  const completo = candidato.nombre_completo?.trim() ?? "";
  const apellido = candidato.apellido?.trim();
  if (apellido && completo.toLowerCase().endsWith(apellido.toLowerCase())) {
    return completo.slice(0, completo.length - apellido.length).trim();
  }
  return completo;
}

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

      <div className="flex gap-2">
        <Campo label="Nombres">
          <input
            name="nombre"
            required
            defaultValue={inferirNombre(candidato)}
            className="campo"
          />
        </Campo>
        <Campo label="Apellidos">
          <input
            name="apellido"
            required
            defaultValue={candidato?.apellido ?? ""}
            className="campo"
          />
        </Campo>
      </div>

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

      <Campo label="Estado">
        <select name="estado" defaultValue={candidato?.estado ?? ""} className="campo">
          <option value="">—</option>
          {ESTADOS_CANDIDATO.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>
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

      {!candidato && (
        <>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Opcional: si ya sabés para qué búsqueda es, se crea la primera postulación de
            una. Si no, se puede agregar después desde la ficha del candidato.
          </p>
          <Campo label="Vacante">
            <select name="vacante_id" defaultValue="" className="campo">
              <option value="">Sin vacante todavía</option>
              {vacantes.map((vacante) => (
                <option key={vacante.id} value={vacante.id}>
                  {etiquetaVacante(vacante)}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Reclutador asignado">
            <select name="reclutador_asignado_id" defaultValue="" className="campo">
              <option value="">Sin asignar</option>
              {equipo.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.nombre ?? persona.email}
                </option>
              ))}
            </select>
          </Campo>
        </>
      )}

      {candidato && (
        <p className="rounded border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
          Para vincular otra vacante, cambiar la etapa o ver el historial de sus
          postulaciones, hacelo desde{" "}
          <Link href={`/candidatos/${candidato.id}`} className="text-brand-blue hover:underline">
            la ficha del candidato
          </Link>
          , en la sección &quot;Postulaciones&quot;.
        </p>
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

      <SeccionPerfil candidato={candidato} />

      <BotonGuardar />
    </form>
  );
}

type TipoCampo = "texto" | "fecha" | "numero" | "booleano";

type CampoSpec = {
  name: keyof CandidatoCompleto;
  label: string;
  tipo?: TipoCampo;
};

const CAMPOS_PERFIL: CampoSpec[] = [
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
  { name: "rate_fl", label: "Rate freelance" },
];

function SeccionPerfil({ candidato }: { candidato?: CandidatoCompleto }) {
  return (
    <details open className="rounded border border-black/10 p-3 dark:border-white/10">
      <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
        Perfil
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {CAMPOS_PERFIL.map((campo) => (
          <CampoDinamico key={campo.name} campo={campo} valor={candidato?.[campo.name]} />
        ))}

        <div className="flex gap-2">
          <Campo label="Remuneración pretendida">
            <input
              type="number"
              step="any"
              name="remuneracion_pretendida"
              defaultValue={candidato?.remuneracion_pretendida ?? ""}
              className="campo"
            />
          </Campo>
          <Campo label="Moneda">
            <select
              name="moneda_remuneracion_pretendida"
              defaultValue={candidato?.moneda_remuneracion_pretendida ?? ""}
              className="campo"
            >
              <option value="">—</option>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </div>
    </details>
  );
}

function CampoDinamico({ campo, valor }: { campo: CampoSpec; valor: unknown }) {
  const nombre = campo.name;

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
