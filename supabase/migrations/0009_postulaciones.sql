-- Un candidato puede estar en más de un proceso de selección a la vez.
-- Se separa "quién es la persona" (candidatos) de "en qué proceso está,
-- para qué vacante" (postulaciones, N postulaciones por candidato).
--
-- vacante_id es NULLABLE: la mayoría de los candidatos importados no
-- tenían una vacante vinculada en la planilla de origen, y no hay forma
-- de recuperar ese dato — quedan como "postulación sin vacante asignada
-- todavía" en vez de perder toda su información de proceso/oferta/
-- onboarding.

create table postulaciones (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos (id) on delete cascade,
  vacante_id uuid references vacantes (id),
  etapa_actual text not null default 'Sourcing',
  reclutador_asignado_id uuid references equipo (id),
  descartado_motivo text,
  fecha_postulacion timestamptz not null default now(),
  -- proceso de selección
  fecha_primer_contacto date,
  fecha_screening_hr date,
  seniority_propuesto_hr text,
  feedback_entrevista_hr text,
  fecha_entrevista_area date,
  seniority_propuesto_area text,
  feedback_entrevista text,
  feedback_entrevista_area text,
  estado_final_importado text,
  -- oferta laboral
  avanza_ol boolean,
  fecha_envio_ol date,
  aceptacion_ol boolean,
  fecha_aceptacion_rechazo_ol date,
  motivo_rechazo_ol text,
  fecha_ingreso_efectiva date,
  feedback_proceso_candidato text,
  licencias_programadas text,
  -- onboarding
  ob_cliente text,
  ob_proyecto text,
  ob_induccion_empresa text,
  ob_induccion_empresa_horario text,
  ob_induccion_area_responsable text,
  ob_induccion_area_horario text,
  ob_induccion_proyecto_responsable text,
  ob_induccion_proyecto_horario text,
  ob_fecha_envio_elementos date,
  ob_fecha_recepcion_elementos date
);

alter table postulaciones enable row level security;
create policy "postulaciones: acceso autenticado" on postulaciones
  for all to authenticated using (true) with check (true);

-- Migra cada candidato existente a su primera postulación, preservando
-- todo lo que hoy vive en candidatos.
insert into postulaciones (
  candidato_id, vacante_id, etapa_actual, reclutador_asignado_id, descartado_motivo,
  fecha_postulacion, fecha_primer_contacto, fecha_screening_hr, seniority_propuesto_hr,
  feedback_entrevista_hr, fecha_entrevista_area, seniority_propuesto_area, feedback_entrevista,
  feedback_entrevista_area, estado_final_importado, avanza_ol, fecha_envio_ol, aceptacion_ol,
  fecha_aceptacion_rechazo_ol, motivo_rechazo_ol, fecha_ingreso_efectiva, feedback_proceso_candidato,
  licencias_programadas, ob_cliente, ob_proyecto, ob_induccion_empresa, ob_induccion_empresa_horario,
  ob_induccion_area_responsable, ob_induccion_area_horario, ob_induccion_proyecto_responsable,
  ob_induccion_proyecto_horario, ob_fecha_envio_elementos, ob_fecha_recepcion_elementos
)
select
  id, vacante_id, etapa_actual, reclutador_asignado_id, descartado_motivo,
  fecha_ingreso, fecha_primer_contacto, fecha_screening_hr, seniority_propuesto_hr,
  feedback_entrevista_hr, fecha_entrevista_area, seniority_propuesto_area, feedback_entrevista,
  feedback_entrevista_area, estado_final_importado, avanza_ol, fecha_envio_ol, aceptacion_ol,
  fecha_aceptacion_rechazo_ol, motivo_rechazo_ol, fecha_ingreso_efectiva, feedback_proceso_candidato,
  licencias_programadas, ob_cliente, ob_proyecto, ob_induccion_empresa, ob_induccion_empresa_horario,
  ob_induccion_area_responsable, ob_induccion_area_horario, ob_induccion_proyecto_responsable,
  ob_induccion_proyecto_horario, ob_fecha_envio_elementos, ob_fecha_recepcion_elementos
from candidatos;

-- vw_candidatos_pipeline depende de historial_etapas.candidato_id: hay que
-- sacarla de encima antes de poder tocar esa columna.
drop view if exists vw_candidatos_pipeline;

-- historial_etapas pasa a llevar la trazabilidad de una postulación, no
-- de un candidato directamente (recién ahora existe la relación 1 a 1
-- para poder mapear cada fila vieja a su nueva postulación).
alter table historial_etapas add column postulacion_id uuid references postulaciones (id) on delete cascade;

update historial_etapas h
set postulacion_id = p.id
from postulaciones p
where p.candidato_id = h.candidato_id;

alter table historial_etapas
  alter column postulacion_id set not null,
  drop column candidato_id;

-- Los triggers de vacantes no tocan candidatos/postulaciones: sin cambios.
-- candidatos queda solo con datos de la persona.
alter table candidatos
  drop column vacante_id,
  drop column reclutador_asignado_id,
  drop column etapa_actual,
  drop column descartado_motivo,
  drop column fecha_primer_contacto,
  drop column fecha_screening_hr,
  drop column seniority_propuesto_hr,
  drop column feedback_entrevista_hr,
  drop column fecha_entrevista_area,
  drop column seniority_propuesto_area,
  drop column feedback_entrevista,
  drop column feedback_entrevista_area,
  drop column estado_final_importado,
  drop column avanza_ol,
  drop column fecha_envio_ol,
  drop column aceptacion_ol,
  drop column fecha_aceptacion_rechazo_ol,
  drop column motivo_rechazo_ol,
  drop column fecha_ingreso_efectiva,
  drop column feedback_proceso_candidato,
  drop column licencias_programadas,
  drop column ob_cliente,
  drop column ob_proyecto,
  drop column ob_induccion_empresa,
  drop column ob_induccion_empresa_horario,
  drop column ob_induccion_area_responsable,
  drop column ob_induccion_area_horario,
  drop column ob_induccion_proyecto_responsable,
  drop column ob_induccion_proyecto_horario,
  drop column ob_fecha_envio_elementos,
  drop column ob_fecha_recepcion_elementos;

-- notas_entrevistas y comunicaciones se quedan atadas al candidato (son
-- generales a la persona, no a un proceso puntual). Si más adelante hace
-- falta separarlas por postulación, se agrega postulacion_id ahí.

-- Reemplazo de vw_candidatos_pipeline (calculaba días en la etapa a
-- partir de candidatos.etapa_actual, que ya no existe): ahora es por
-- postulación.
create view vw_postulaciones_pipeline as
select
  p.*,
  c.nombre_completo,
  c.oculto as candidato_oculto,
  c.origen as candidato_origen,
  c.linkedin_url as candidato_linkedin_url,
  ultima.fecha as fecha_desde_etapa_actual,
  extract(day from now() - ultima.fecha)::int as dias_en_etapa
from postulaciones p
join candidatos c on c.id = p.candidato_id
left join lateral (
  select fecha
  from historial_etapas h
  where h.postulacion_id = p.id and h.etapa_nueva = p.etapa_actual
  order by fecha desc
  limit 1
) ultima on true;
