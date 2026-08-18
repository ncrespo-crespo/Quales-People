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
import type { EstadoVacante, VacanteConMetricas } from "@/lib/types";
import { moverVacante } from "../actions";

export function TableroVacantes({
  estados,
  vacantesIniciales,
  nombrePorId,
}: {
  estados: EstadoVacante[];
  vacantesIniciales: VacanteConMetricas[];
  nombrePorId: Map<string, string>;
}) {
  const [vacantes, setVacantes] = useState(vacantesIniciales);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function alSoltar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over) return;

    const vacanteId = String(active.id);
    const nuevoEstadoId = String(over.id);
    const vacante = vacantes.find((v) => v.id === vacanteId);
    if (!vacante || vacante.estado_id === nuevoEstadoId) return;

    const anterior = vacante.estado_id;
    const nuevoEstado = estados.find((e) => e.id === nuevoEstadoId)!;
    setVacantes((prev) =>
      prev.map((v) =>
        v.id === vacanteId
          ? { ...v, estado_id: nuevoEstadoId, estado_nombre: nuevoEstado.nombre, estado_color: nuevoEstado.color_hex }
          : v,
      ),
    );
    setError(null);

    const resultado = await moverVacante(vacanteId, nuevoEstadoId);
    if (resultado.error) {
      setError(resultado.error);
      setVacantes((prev) => prev.map((v) => (v.id === vacanteId ? { ...v, estado_id: anterior } : v)));
    }
  }

  return (
    <div className="p-8">
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <DndContext sensors={sensors} onDragEnd={alSoltar}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {estados.map((estado) => (
            <Columna
              key={estado.id}
              estado={estado}
              vacantes={vacantes.filter((v) => v.estado_id === estado.id)}
              nombrePorId={nombrePorId}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Columna({
  estado,
  vacantes,
  nombrePorId,
}: {
  estado: EstadoVacante;
  vacantes: VacanteConMetricas[];
  nombrePorId: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded border ${
        isOver ? "border-brand-blue" : "border-black/10 dark:border-white/10"
      }`}
    >
      <div
        className="flex items-center justify-between rounded-t px-3 py-2 text-sm font-semibold text-black/80"
        style={{ backgroundColor: estado.color_hex }}
      >
        <span>{estado.nombre}</span>
        <span className="text-xs font-normal">{vacantes.length}</span>
      </div>
      <div className="flex min-h-[4rem] flex-1 flex-col gap-2 p-2">
        {vacantes.map((vacante) => (
          <Tarjeta key={vacante.id} vacante={vacante} nombrePorId={nombrePorId} />
        ))}
      </div>
    </div>
  );
}

function Tarjeta({
  vacante,
  nombrePorId,
}: {
  vacante: VacanteConMetricas;
  nombrePorId: Map<string, string>;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: vacante.id,
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
      <p className="font-medium text-black dark:text-zinc-50">{vacante.titulo}</p>
      {vacante.cliente_o_area && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{vacante.cliente_o_area}</p>
      )}
      <div className="mt-1 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {vacante.reclutador_responsable_id
            ? (nombrePorId.get(vacante.reclutador_responsable_id) ?? "—")
            : "Sin asignar"}
        </span>
        {vacante.time_to_fill !== null ? (
          <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
            TTF {vacante.time_to_fill}d
          </span>
        ) : vacante.dias_open !== null ? (
          <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
            {vacante.dias_open}d open
          </span>
        ) : null}
      </div>
    </div>
  );
}
