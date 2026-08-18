// Rango [desde, hasta) de un año calendario, para filtrar por una columna
// de fecha con `.gte(desde).lt(hasta)`.
export function rangoAnio(anio: number) {
  return {
    desde: `${anio}-01-01`,
    hasta: `${anio + 1}-01-01`,
  };
}
