import type { CandidatoCompleto, Vacante } from "@/lib/types";

function palabrasClave(texto: string | null): Set<string> {
  if (!texto) return new Set();
  return new Set(
    texto
      .toLowerCase()
      .split(/[,;/\n]+/)
      .map((p) => p.trim())
      .filter(Boolean),
  );
}

export type CandidatoConScore = {
  candidato: CandidatoCompleto;
  score: number;
  coincidencias: string[];
};

// Heurística simple de matching: pesa más el overlap de stack (lo más
// determinante para saber si un candidato sirve para la búsqueda) y suma
// puntos extra si coincide el nivel de inglés o la ubicación. No usa IA:
// es comparación de texto, pensada para iterar/ajustar según feedback.
export function candidatosSugeridos(
  vacante: Vacante,
  candidatos: CandidatoCompleto[],
): CandidatoConScore[] {
  const stackVacante = palabrasClave(vacante.stack_principal);

  return candidatos
    .map((candidato) => {
      const stackCandidato = palabrasClave(candidato.stack_principal);
      const coincidenciasStack = [...stackVacante].filter((p) => stackCandidato.has(p));

      const coincidencias: string[] = [];
      let score = 0;

      if (coincidenciasStack.length > 0) {
        score += coincidenciasStack.length * 2;
        coincidencias.push(`Stack: ${coincidenciasStack.join(", ")}`);
      }

      if (
        vacante.nivel_ingles &&
        candidato.nivel_ingles &&
        vacante.nivel_ingles.trim().toLowerCase() === candidato.nivel_ingles.trim().toLowerCase()
      ) {
        score += 1;
        coincidencias.push(`Inglés: ${candidato.nivel_ingles}`);
      }

      if (
        vacante.provincia_estado &&
        candidato.provincia_estado &&
        vacante.provincia_estado.trim().toLowerCase() === candidato.provincia_estado.trim().toLowerCase()
      ) {
        score += 1;
        coincidencias.push(`Ubicación: ${candidato.provincia_estado}`);
      }

      return { candidato, score, coincidencias };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
