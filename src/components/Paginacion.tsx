import Link from "next/link";

export const TAMANIO_PAGINA = 20;

export function Paginacion({
  pagina,
  totalPaginas,
  basePath,
  searchParams,
}: {
  pagina: number;
  totalPaginas: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPaginas <= 1) return null;

  function url(p: number) {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries(searchParams)) {
      if (valor !== undefined && clave !== "pagina") params.set(clave, valor);
    }
    if (p > 1) params.set("pagina", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm">
      <Link
        href={url(Math.max(1, pagina - 1))}
        className={`rounded border border-black/15 px-3 py-1.5 dark:border-white/15 ${
          pagina === 1
            ? "pointer-events-none opacity-40"
            : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        ← Anterior
      </Link>
      <span className="text-zinc-600 dark:text-zinc-400">
        Página {pagina} de {totalPaginas}
      </span>
      <Link
        href={url(Math.min(totalPaginas, pagina + 1))}
        className={`rounded border border-black/15 px-3 py-1.5 dark:border-white/15 ${
          pagina === totalPaginas
            ? "pointer-events-none opacity-40"
            : "text-zinc-700 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
        }`}
      >
        Siguiente →
      </Link>
    </div>
  );
}
