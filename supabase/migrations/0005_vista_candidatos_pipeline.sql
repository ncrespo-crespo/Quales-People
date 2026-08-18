-- Fase 3: cuántos días lleva un candidato en su etapa actual, para el
-- tablero de candidatos (sección 7.2 del PRD: "detectar candidatos
-- estancados"). Se calcula a partir de la última entrada en
-- historial_etapas para esa etapa, no de una columna aparte.
create view vw_candidatos_pipeline as
select
  c.*,
  ultima.fecha as fecha_desde_etapa_actual,
  extract(day from now() - ultima.fecha)::int as dias_en_etapa
from candidatos c
left join lateral (
  select fecha
  from historial_etapas h
  where h.candidato_id = c.id and h.etapa_nueva = c.etapa_actual
  order by fecha desc
  limit 1
) ultima on true;
