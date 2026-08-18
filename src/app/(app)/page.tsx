import { createClient } from "@/lib/supabase/server";
import type { Equipo, VacanteConMetricas } from "@/lib/types";
import { ANIO_POR_DEFECTO } from "@/lib/types";
import { rangoAnio } from "@/lib/fechas";
import { FiltrosOverview } from "./FiltrosOverview";

function promedio(valores: number[]) {
  if (valores.length === 0) return null;
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; reclutador?: string }>;
}) {
  const { anio: anioParam, reclutador } = await searchParams;
  const anio = Number(anioParam) || ANIO_POR_DEFECTO;
  const { desde, hasta } = rangoAnio(anio);
  const supabase = await createClient();

  let consulta = supabase
    .from("vw_metricas_vacantes")
    .select("*")
    .gte("fecha_inicio_proceso", desde)
    .lt("fecha_inicio_proceso", hasta);
  if (reclutador) consulta = consulta.eq("reclutador_responsable_id", reclutador);

  const [{ data: vacantes }, { data: equipo }] = await Promise.all([
    consulta.returns<VacanteConMetricas[]>(),
    supabase.from("equipo").select("*").returns<Equipo[]>(),
  ]);

  const lista = vacantes ?? [];
  const nombrePorId = new Map((equipo ?? []).map((p) => [p.id, p.nombre ?? p.email]));

  const total = lista.length;
  const activas = lista.filter((v) => !v.estado_es_terminal);
  const hired = lista.filter((v) => v.estado_nombre === "Hired");
  const cancelled = lista.filter((v) => v.estado_nombre === "Cancelled");
  const ttfPromedio = promedio(hired.map((v) => v.time_to_fill).filter((n): n is number => n !== null));
  const diasOpenPromedio = promedio(
    activas.map((v) => v.dias_open).filter((n): n is number => n !== null),
  );
  const tasaConversion = total > 0 ? Math.round((hired.length / total) * 100) : null;

  const porEstado = new Map<string, { color: string; cantidad: number }>();
  for (const v of lista) {
    const actual = porEstado.get(v.estado_nombre) ?? { color: v.estado_color, cantidad: 0 };
    actual.cantidad += 1;
    porEstado.set(v.estado_nombre, actual);
  }

  const porPrioridad = new Map<string, number>();
  for (const v of lista) {
    porPrioridad.set(v.prioridad, (porPrioridad.get(v.prioridad) ?? 0) + 1);
  }

  const porReclutador = new Map<string, { activas: number; hired: number; ttf: number[] }>();
  for (const v of lista) {
    const clave = v.reclutador_responsable_id
      ? (nombrePorId.get(v.reclutador_responsable_id) ?? "—")
      : "Sin asignar";
    const actual = porReclutador.get(clave) ?? { activas: 0, hired: 0, ttf: [] };
    if (!v.estado_es_terminal) actual.activas += 1;
    if (v.estado_nombre === "Hired") {
      actual.hired += 1;
      if (v.time_to_fill !== null) actual.ttf.push(v.time_to_fill);
    }
    porReclutador.set(clave, actual);
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-xl font-bold text-brand-navy dark:text-white">
        Overview — Búsquedas {anio}
      </h1>

      <FiltrosOverview equipo={equipo ?? []} />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Vacantes" valor={total} />
        <Tile label="Activas" valor={activas.length} />
        <Tile label="Hired" valor={hired.length} />
        <Tile label="Cancelled" valor={cancelled.length} />
        <Tile label="TTF promedio" valor={ttfPromedio !== null ? `${ttfPromedio}d` : "—"} />
        <Tile label="Días open promedio" valor={diasOpenPromedio !== null ? `${diasOpenPromedio}d` : "—"} />
      </div>

      {tasaConversion !== null && (
        <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
          Tasa de conversión a Hired: <span className="font-semibold text-black dark:text-zinc-50">{tasaConversion}%</span>
          {" "}({hired.length} de {total})
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Por estado
          </h2>
          <BarraDistribucion
            datos={[...porEstado.entries()].map(([nombre, d]) => ({
              etiqueta: nombre,
              cantidad: d.cantidad,
              color: d.color,
            }))}
            total={total}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Por prioridad
          </h2>
          <BarraDistribucion
            datos={[...porPrioridad.entries()].map(([nombre, cantidad]) => ({
              etiqueta: nombre,
              cantidad,
              color:
                nombre === "Alta" ? "#fca5a5" : nombre === "Media" ? "#fde68a" : "#e5e7eb",
            }))}
            total={total}
          />
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Carga de trabajo por reclutador
        </h2>
        <div className="overflow-x-auto rounded border border-black/10 dark:border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2">Reclutador</th>
                <th className="px-4 py-2">Activas</th>
                <th className="px-4 py-2">Hired</th>
                <th className="px-4 py-2">TTF promedio</th>
              </tr>
            </thead>
            <tbody>
              {[...porReclutador.entries()].map(([nombre, d]) => (
                <tr key={nombre} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-2 font-medium text-black dark:text-zinc-50">{nombre}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{d.activas}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{d.hired}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                    {d.ttf.length ? `${promedio(d.ttf)}d` : "—"}
                  </td>
                </tr>
              ))}
              {porReclutador.size === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Sin datos para {anio}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="rounded border border-black/10 p-4 dark:border-white/10">
      <p className="text-2xl font-bold text-brand-navy dark:text-white">{valor}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

function BarraDistribucion({
  datos,
  total,
}: {
  datos: { etiqueta: string; cantidad: number; color: string }[];
  total: number;
}) {
  if (datos.length === 0 || total === 0) {
    return <p className="text-sm text-zinc-500">Sin datos.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {datos
        .sort((a, b) => b.cantidad - a.cantidad)
        .map((d) => (
          <div key={d.etiqueta} className="flex items-center gap-2 text-sm">
            <span className="w-32 shrink-0 truncate text-zinc-600 dark:text-zinc-400">{d.etiqueta}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-black/5 dark:bg-white/10">
              <div
                className="h-full"
                style={{ width: `${(d.cantidad / total) * 100}%`, backgroundColor: d.color }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-zinc-600 dark:text-zinc-400">{d.cantidad}</span>
          </div>
        ))}
    </div>
  );
}
