import Link from "next/link";

export function EncabezadoOrdenable({
  campo,
  etiqueta,
  basePath,
  searchParams,
  ordenPorDefecto = "asc",
}: {
  campo: string;
  etiqueta: string;
  basePath: string;
  searchParams: Record<string, string | undefined>;
  ordenPorDefecto?: "asc" | "desc";
}) {
  const esActivo = searchParams.sort === campo;
  const dirActual = searchParams.dir === "asc" ? "asc" : "desc";
  const dirSiguiente = esActivo ? (dirActual === "asc" ? "desc" : "asc") : ordenPorDefecto;

  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(searchParams)) {
    if (valor !== undefined && clave !== "sort" && clave !== "dir") {
      params.set(clave, valor);
    }
  }
  params.set("sort", campo);
  params.set("dir", dirSiguiente);

  return (
    <th className="px-4 py-2">
      <Link
        href={`${basePath}?${params.toString()}`}
        className="inline-flex items-center gap-1 hover:text-black dark:hover:text-white"
      >
        {etiqueta}
        {esActivo && <span className="text-[10px]">{dirActual === "asc" ? "▲" : "▼"}</span>}
      </Link>
    </th>
  );
}
