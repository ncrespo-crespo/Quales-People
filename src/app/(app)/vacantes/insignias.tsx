import { DIAS_OPEN_CRITICO, type PrioridadVacante } from "@/lib/types";

const COLOR_PRIORIDAD: Record<PrioridadVacante, string> = {
  Alta: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Media: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Baja: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function InsigniaPrioridad({ prioridad }: { prioridad: PrioridadVacante }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLOR_PRIORIDAD[prioridad]}`}>
      {prioridad}
    </span>
  );
}

export function esCritico(diasOpen: number | null) {
  return diasOpen !== null && diasOpen > DIAS_OPEN_CRITICO;
}

export function InsigniaCritico() {
  return (
    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
      Crítico
    </span>
  );
}
