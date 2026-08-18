-- La remuneración pretendida del candidato y la banda salarial de la
-- vacante pasan a ser un monto numérico (antes texto libre, sin poder
-- comparar valores) más una moneda (ARS/USD/EUR) para cada una.
--
-- Si ya había algo cargado que no es un número limpio (símbolos de
-- moneda, rangos, etc.) se deja en null en vez de intentar adivinar y
-- romper la migración — son campos nuevos de esta misma semana, así que
-- no debería haber datos reales que perder.

alter table candidatos
  add column moneda_remuneracion_pretendida text
    check (moneda_remuneracion_pretendida in ('ARS', 'USD', 'EUR'));

alter table candidatos
  alter column remuneracion_pretendida type numeric
  using (
    case
      when remuneracion_pretendida ~ '^\s*[0-9]+(\.[0-9]+)?\s*$'
        then remuneracion_pretendida::numeric
      else null
    end
  );

alter table vacantes
  add column moneda_banda_salarial text
    check (moneda_banda_salarial in ('ARS', 'USD', 'EUR'));

-- vw_metricas_vacantes depende de banda_salarial (select v.*): hay que
-- sacarla de en medio antes de poder cambiarle el tipo a la columna.
drop view if exists vw_metricas_vacantes;

alter table vacantes
  alter column banda_salarial type numeric
  using (
    case
      when banda_salarial ~ '^\s*[0-9]+(\.[0-9]+)?\s*$'
        then banda_salarial::numeric
      else null
    end
  );

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
