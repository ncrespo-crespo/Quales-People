-- Vacantes: se pueden ocultar igual que los candidatos, y suman los
-- campos necesarios para poder armar el Match con candidatos (mismo
-- criterio que ya existe del lado del candidato: stack, inglés,
-- ubicación) más lo específico de la búsqueda (modalidad, banda
-- salarial, si acepta freelance).
-- "pais" no se agrega: ya existe desde la migración 0003 (importado del
-- Hiring Plan), completa provincia_estado/localidad para tener el mismo
-- detalle de ubicación que usa el candidato.
alter table vacantes
  add column oculto boolean not null default false,
  add column stack_principal text,
  add column nivel_ingles text,
  add column provincia_estado text,
  add column localidad text,
  add column modalidad_trabajo text
    check (modalidad_trabajo in ('On Site', 'Híbrido', 'Remoto')),
  add column banda_salarial text,
  add column acepta_freelance boolean not null default false;

-- Candidato: remuneración pretendida general de la persona (distinta de
-- `postulaciones.expectativa_salarial`, que es la negociada para un
-- proceso puntual).
alter table candidatos add column remuneracion_pretendida text;

-- vw_metricas_vacantes hace select v.*: al agregar columnas a vacantes
-- hay que recrearla para que las traiga.
drop view if exists vw_metricas_vacantes;
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
