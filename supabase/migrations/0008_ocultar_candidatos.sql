-- Permite sacar un candidato de las vistas por defecto (listado y tablero)
-- sin borrarlo. Se puede volver a mostrar en cualquier momento.
alter table candidatos
  add column oculto boolean not null default false;

-- vw_candidatos_pipeline se creó con "select c.*": Postgres fija esa lista
-- de columnas al crear la vista y no la actualiza sola cuando se agregan
-- columnas nuevas a candidatos. Hay que recrearla para que incluya
-- `oculto` (y cualquier columna futura). "create or replace" no alcanza
-- acá porque la columna nueva queda en el medio de la lista (antes de
-- fecha_desde_etapa_actual/dias_en_etapa) y Postgres solo permite agregar
-- columnas al final con replace; por eso se dropea y se recrea.
drop view if exists vw_candidatos_pipeline;
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
