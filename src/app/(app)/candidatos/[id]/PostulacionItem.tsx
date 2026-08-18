"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ETAPAS_CANDIDATO } from "@/lib/types";
import type { Equipo, HistorialEtapa, Postulacion, Vacante } from "@/lib/types";
import { etiquetaVacante } from "@/lib/vacantes";
import { actualizarPostulacion, eliminarPostulacion } from "../postulaciones/actions";
import { GRUPOS, type CampoSpec } from "./gruposPostulacion";

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR");
}

function formatearFechaHora(fecha: string | null) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR");
}

function formatearValor(campo: CampoSpec, valor: unknown): string {
  if (campo.tipo === "fecha") return formatearFecha(valor as string | null);
  if (campo.tipo === "fecha_hora") return formatearFechaHora(valor as string | null);
  if (campo.tipo === "booleano") {
    if (valor === true) return "Sí";
    if (valor === false) return "No";
    return "—";
  }
  return valor ? String(valor) : "—";
}

export function PostulacionItem({
  candidatoId,
  postulacion,
  historial,
  vacantes,
  equipo,
}: {
  candidatoId: string;
  postulacion: Postulacion;
  historial: HistorialEtapa[];
  vacantes: Vacante[];
  equipo: Equipo[];
}) {
  const [editando, setEditando] = useState(false);
  const tituloVacantePorId = new Map(vacantes.map((v) => [v.id, etiquetaVacante(v)]));
  const nombrePorId = new Map(equipo.map((p) => [p.id, p.nombre ?? p.email]));
  // El alta de la postulación no se muestra como "movimiento": ya se ve en
  // "fecha de postulación". El historial solo tiene sentido para cambios
  // de etapa reales.
  const historialDeCambios = historial.filter((h) => h.etapa_anterior !== null);

  return (
    <details className="rounded border border-black/10 p-3 dark:border-white/10">
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
        {editando ? (
          <FormularioEdicion
            candidatoId={candidatoId}
            postulacion={postulacion}
            vacantes={vacantes}
            equipo={equipo}
            onCancelar={() => setEditando(false)}
          />
        ) : (
          <VistaPostulacion
            postulacion={postulacion}
            tituloVacantePorId={tituloVacantePorId}
            nombrePorId={nombrePorId}
            onEditar={() => setEditando(true)}
          />
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Historial
          </p>
          <ol className="flex flex-col gap-2">
            {historialDeCambios.map((h) => (
              <li key={h.id} className="border-l-2 border-brand-blue/40 pl-3 text-sm">
                <p className="text-black dark:text-zinc-50">
                  {h.etapa_anterior} → {h.etapa_nueva}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatearFecha(h.fecha)}
                  {h.movido_por_id ? ` · ${nombrePorId.get(h.movido_por_id) ?? "—"}` : ""}
                </p>
                {h.nota && <p className="mt-1 text-zinc-600 dark:text-zinc-300">{h.nota}</p>}
              </li>
            ))}
            {historialDeCambios.length === 0 && (
              <p className="text-sm text-zinc-500">Todavía no tuvo cambios de etapa.</p>
            )}
          </ol>
        </div>

        {!editando && (
          <form
            action={async () => {
              await eliminarPostulacion(postulacion.id, candidatoId);
            }}
          >
            <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
              Eliminar esta postulación
            </button>
          </form>
        )}
      </div>
    </details>
  );
}

function VistaPostulacion({
  postulacion,
  tituloVacantePorId,
  nombrePorId,
  onEditar,
}: {
  postulacion: Postulacion;
  tituloVacantePorId: Map<string, string>;
  nombrePorId: Map<string, string>;
  onEditar: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        <DatoVista
          label="Vacante"
          valor={
            postulacion.vacante_id
              ? (tituloVacantePorId.get(postulacion.vacante_id) ?? "Vacante eliminada")
              : null
          }
        />
        <DatoVista
          label="Reclutador asignado"
          valor={
            postulacion.reclutador_asignado_id
              ? (nombrePorId.get(postulacion.reclutador_asignado_id) ?? null)
              : null
          }
        />
        <DatoVista label="Etapa actual" valor={postulacion.etapa_actual} />
        {postulacion.etapa_actual === "Descartado" && (
          <DatoVista label="Motivo del descarte" valor={postulacion.descartado_motivo} />
        )}
      </dl>

      {GRUPOS.map((grupo) => {
        const camposConDato = grupo.campos.filter((c) => postulacion[c.name]);
        if (camposConDato.length === 0) return null;
        return (
          <details key={grupo.titulo} className="rounded border border-black/10 p-2 dark:border-white/10">
            <summary className="cursor-pointer text-xs font-medium text-black dark:text-zinc-50">
              {grupo.titulo}
            </summary>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
              {camposConDato.map((campo) => (
                <DatoVista
                  key={campo.name}
                  label={campo.label}
                  valor={formatearValor(campo, postulacion[campo.name])}
                />
              ))}
            </dl>
          </details>
        );
      })}

      <button
        type="button"
        onClick={onEditar}
        className="self-start rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
      >
        Editar postulación
      </button>
    </div>
  );
}

function DatoVista({ label, valor }: { label: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-black dark:text-zinc-50">{valor ?? "—"}</dd>
    </div>
  );
}

function FormularioEdicion({
  candidatoId,
  postulacion,
  vacantes,
  equipo,
  onCancelar,
}: {
  candidatoId: string;
  postulacion: Postulacion;
  vacantes: Vacante[];
  equipo: Equipo[];
  onCancelar: () => void;
}) {
  return (
    <form
      action={actualizarPostulacion.bind(null, postulacion.id, candidatoId)}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="etapa_anterior" value={postulacion.etapa_actual} />
      <div className="flex flex-wrap gap-2">
        <select name="vacante_id" defaultValue={postulacion.vacante_id ?? ""} className="campo flex-1">
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

      <div className="flex gap-2">
        <BotonGuardarEdicion />
        <button
          type="button"
          onClick={onCancelar}
          className="self-start rounded border border-black/20 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function BotonGuardarEdicion() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar postulación"}
    </button>
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
