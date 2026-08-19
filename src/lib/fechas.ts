// Rango [desde, hasta) de un año calendario, para filtrar por una columna
// de fecha con `.gte(desde).lt(hasta)`.
export function rangoAnio(anio: number) {
  return {
    desde: `${anio}-01-01`,
    hasta: `${anio + 1}-01-01`,
  };
}

// Filtro OR de PostgREST para varios años sobre una columna de fecha, para
// usar con `.or(...)` de supabase-js: cada año se arma como su propio
// rango [desde, hasta) y se combinan con "or".
export function filtroPorAnios(campo: string, anios: number[]) {
  return anios
    .map((anio) => {
      const { desde, hasta } = rangoAnio(anio);
      return `and(${campo}.gte.${desde},${campo}.lt.${hasta})`;
    })
    .join(",");
}
