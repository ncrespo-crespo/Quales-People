-- `reclutador_nombre_importado` era texto libre traído de la planilla
-- (Hiring Plan 2026, migración 0003): un nombre escrito a mano, sin
-- relación real con `equipo`. El campo correcto ya existe
-- (`reclutador_responsable_id`, FK a `equipo`) — este script completa esa
-- FK buscando cada nombre importado en `equipo.nombre` y recién después
-- borra la columna vieja.
--
-- Dos pasadas de matching, sin tocar las vacantes que ya tenían
-- `reclutador_responsable_id` cargado a mano:
--   1) nombre completo, ignorando mayúsculas/acentos/espacios extra.
--   2) si no matcheó, primer nombre solo (por si el texto importado traía
--      solo el nombre de pila) — únicamente cuando ese primer nombre es
--      inequívoco (nadie más en equipo comparte el mismo primer nombre).
--
-- Antes de borrar la columna, imprime un aviso (NOTICE, visible en el
-- SQL Editor de Supabase) por cada vacante que no se pudo emparejar, para
-- poder revisarlas y asignarlas a mano desde el formulario de la vacante.

create extension if not exists unaccent;

update vacantes v
set reclutador_responsable_id = e.id
from equipo e
where v.reclutador_responsable_id is null
  and v.reclutador_nombre_importado is not null
  and lower(unaccent(trim(e.nombre))) = lower(unaccent(trim(v.reclutador_nombre_importado)));

update vacantes v
set reclutador_responsable_id = e.id
from equipo e
where v.reclutador_responsable_id is null
  and v.reclutador_nombre_importado is not null
  and lower(unaccent(split_part(trim(e.nombre), ' ', 1)))
      = lower(unaccent(split_part(trim(v.reclutador_nombre_importado), ' ', 1)))
  and (
    select count(*) from equipo e2
    where lower(unaccent(split_part(trim(e2.nombre), ' ', 1)))
        = lower(unaccent(split_part(trim(v.reclutador_nombre_importado), ' ', 1)))
  ) = 1;

do $$
declare
  fila record;
  total int := 0;
begin
  for fila in
    select id, titulo, reclutador_nombre_importado
    from vacantes
    where reclutador_nombre_importado is not null
      and reclutador_responsable_id is null
  loop
    total := total + 1;
    raise notice 'Sin emparejar: vacante "%" (id %) - reclutador importado "%". Asignar a mano desde /vacantes/%/editar.',
      fila.titulo, fila.id, fila.reclutador_nombre_importado, fila.id;
  end loop;

  if total = 0 then
    raise notice 'Todas las vacantes con reclutador importado quedaron emparejadas con alguien de equipo.';
  else
    raise notice '% vacante(s) sin emparejar — revisar los avisos de arriba.', total;
  end if;
end $$;

-- vw_metricas_vacantes hace select v.*: depende de la columna que se
-- borra, hay que recrearla.
drop view if exists vw_metricas_vacantes;

alter table vacantes drop column reclutador_nombre_importado;

create view vw_metricas_vacantes as
select
  v.*,
  ev.nombre as estado_nombre,
  ev.color_hex as estado_color,
  ev.es_terminal as estado_es_terminal,
  case when ev.nombre = 'Hired' and v.fecha_cierre_proceso is not null
    then v.fecha_cierre_proceso - v.fecha_inicio_proceso
    else null
  end as time_to_fill,
  case when ev.es_terminal = false
    then current_date - v.fecha_inicio_proceso
    else null
  end as dias_open,
  case when v.fecha_ingreso_confirmada is not null and v.fecha_prevista_ingreso_hm is not null
    then v.fecha_ingreso_confirmada - v.fecha_prevista_ingreso_hm
    else null
  end as dif_fip_fic
from vacantes v
join estados_vacante ev on ev.id = v.estado_id;
