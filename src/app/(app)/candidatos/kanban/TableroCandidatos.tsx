"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { CandidatoConDias } from "@/lib/types";
import { ETAPAS_CANDIDATO } from "@/lib/types";
import { moverCandidato } from "../actions";

const COLUMNAS_COLAPSADAS_POR_DEFECTO = new Set(["Contratado", "Descartado"]);

export function TableroCandidatos({
  candidatosIniciales,
  nombrePorId,
}: {
  candidatosIniciales: CandidatoConDias[];
  nombrePorId: Map<string, string>;
}) {
  const [candidatos, setCandidatos] = useState(candidatosIniciales);
  const [colapsadas, setColapsadas] = useState(COLUMNAS_COLAPSADAS_POR_DEFECTO);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<{
    candidatoId: string;
    etapaAnterior: string;
    etapaNueva: string;
  } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over) return;
    const candidato = candidatos.find((c) => c.id === String(active.id));
    const etapaNueva = String(over.id);
    if (!candidato || candidato.etapa_actual === etapaNueva) return;
    setPendiente({ candidatoId: candidato.id, etapaAnterior: candidato.etapa_actual, etapaNueva });
  }

  async function confirmarMovimiento(nota: string | null) {
    if (!pendiente) return;
    const { candidatoId, etapaAnterior, etapaNueva } = pendiente;
    setPendiente(null);
    setError(null);
    setCandidatos((prev) =>
      prev.map((c) => (c.id === candidatoId ? { ...c, etapa_actual: etapaNueva } : c)),
    );

    const resultado = await moverCandidato(candidatoId, etapaAnterior, etapaNueva, nota);
    if (resultado.error) {
      setError(resultado.error);
      setCandidatos((prev) =>
        prev.map((c) => (c.id === candidatoId ? { ...c, etapa_actual: etapaAnterior } : c)),
      );
    }
  }

  function alternarColapso(etapa: string) {
    setColapsadas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(etapa)) nuevo.delete(etapa);
      else nuevo.add(etapa);
      return nuevo;
    });
  }

  return (
    <div className="px-8 pb-8">
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={alSoltar}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_CANDIDATO.map((etapa) => (
            <Columna
              key={etapa}
              etapa={etapa}
              candidatos={candidatos.filter((c) => c.etapa_actual === etapa)}
              nombrePorId={nombrePorId}
              colapsada={colapsadas.has(etapa)}
              onToggle={() => alternarColapso(etapa)}
            />
          ))}
        </div>
      </DndContext>

      {pendiente && (
        <ModalNota
          etapaNueva={pendiente.etapaNueva}
          onCancelar={() => setPendiente(null)}
          onConfirmar={confirmarMovimiento}
        />
      )}
    </div>
  );
}

function Columna({
  etapa,
  candidatos,
  nombrePorId,
  colapsada,
  onToggle,
}: {
  etapa: string;
  candidatos: CandidatoConDias[];
  nombrePorId: Map<string, string>;
  colapsada: boolean;
  onToggle: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });

  if (colapsada) {
    return (
      <button
        ref={setNodeRef}
        onClick={onToggle}
        className={`flex w-12 shrink-0 flex-col items-center gap-2 rounded border py-3 text-xs font-semibold text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10 ${
          isOver ? "border-brand-blue" : "border-black/10 dark:border-white/10"
        }`}
        style={{ writingMode: "vertical-rl" }}
      >
        {etapa} ({candidatos.length})
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded border ${
        isOver ? "border-brand-blue" : "border-black/10 dark:border-white/10"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex items-center justify-between rounded-t bg-black/5 px-3 py-2 text-left text-sm font-semibold text-zinc-700 hover:bg-black/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
      >
        <span>{etapa}</span>
        <span className="text-xs font-normal">{candidatos.length}</span>
      </button>
      <div className="flex min-h-[4rem] flex-1 flex-col gap-2 p-2">
        {candidatos.map((candidato) => (
          <Tarjeta key={candidato.id} candidato={candidato} nombrePorId={nombrePorId} />
        ))}
      </div>
    </div>
  );
}

function Tarjeta({
  candidato,
  nombrePorId,
}: {
  candidato: CandidatoConDias;
  nombrePorId: Map<string, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidato.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
          : undefined
      }
      className={`cursor-grab rounded border border-black/10 bg-white p-2 text-sm shadow-sm active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="font-medium text-black dark:text-zinc-50">{candidato.nombre_completo}</p>
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {candidato.reclutador_asignado_id
            ? (nombrePorId.get(candidato.reclutador_asignado_id) ?? "—")
            : "Sin asignar"}
        </span>
        {candidato.dias_en_etapa !== null && (
          <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
            {candidato.dias_en_etapa}d en etapa
          </span>
        )}
      </div>
    </div>
  );
}

function ModalNota({
  etapaNueva,
  onCancelar,
  onConfirmar,
}: {
  etapaNueva: string;
  onCancelar: () => void;
  onConfirmar: (nota: string | null) => void;
}) {
  const [nota, setNota] = useState("");
  const esDescarte = etapaNueva === "Descartado";

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded bg-white p-5 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold text-black dark:text-zinc-50">
          Mover a &quot;{etapaNueva}&quot;
        </h2>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {esDescarte ? "Motivo del descarte (obligatorio)" : "Nota (opcional)"}
          <textarea
            className="campo"
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            autoFocus
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancelar}
            className="rounded border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(nota || null)}
            disabled={esDescarte && !nota.trim()}
            className="rounded bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
