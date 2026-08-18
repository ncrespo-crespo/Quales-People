-- Redefine qué campos son de la PERSONA (candidatos) y cuáles son del
-- PROCESO de selección (postulaciones), según la lista definitiva pasada
-- por Naty. En general: todo lo que puede cambiar según a qué vacante/
-- cliente se postula (tipo de candidato buscado, disponibilidad,
-- expectativa salarial, moneda) es del proceso, no de la persona.

-- candidatos: nombre de pila separado del apellido (antes solo existía
-- "apellido" + un "nombre_completo" único). nombre_completo se seguye
-- usando en toda la app para mostrar/ordenar/buscar; se recalcula desde
-- el server (nombre + apellido) cada vez que se guarda el candidato, así
-- que no hace falta tocar nada más para los candidatos ya importados.
alter table candidatos add column nombre text;

-- vw_postulaciones_pipeline hace select p.* sobre postulaciones: depende
-- de todas sus columnas, así que hay que sacarla de en medio antes de
-- tocar esa tabla (se recrea al final con las columnas nuevas).
drop view if exists vw_postulaciones_pipeline;

-- Estos 4 campos son del proceso (dependen de la búsqueda a la que se
-- postula), no de la persona: se mudan a postulaciones. Primero se migran
-- los datos ya cargados y recién después se borra la columna vieja.
alter table postulaciones
  add column tipo_candidato text,
  add column disponibilidad_ingreso text,
  add column expectativa_salarial text,
  add column tipo_moneda text;

update postulaciones p
set tipo_candidato = c.tipo_candidato,
    disponibilidad_ingreso = c.disponibilidad_ingreso,
    expectativa_salarial = c.expectativa_salarial,
    tipo_moneda = c.tipo_moneda
from candidatos c
where c.id = p.candidato_id;

alter table candidatos
  drop column tipo_candidato,
  drop column disponibilidad_ingreso,
  drop column expectativa_salarial,
  drop column tipo_moneda;

-- "Fecha screening HR" y "Fecha Entrevista HR" son dos pasos distintos del
-- proceso; ya existía la de screening, faltaba la de la entrevista.
alter table postulaciones add column fecha_entrevista_hr timestamptz;

-- feedback_entrevista y feedback_entrevista_area quedaron duplicados desde
-- la planilla original (dos columnas para lo mismo): se unifican en una
-- sola, sin perder datos.
update postulaciones
set feedback_entrevista_area = coalesce(feedback_entrevista_area, feedback_entrevista)
where feedback_entrevista is not null;

alter table postulaciones drop column feedback_entrevista;

-- Iba como "importado" porque en su momento solo se completaba al migrar
-- la planilla; de acá en más es un campo normal del proceso.
alter table postulaciones rename column estado_final_importado to estado_final;

-- Onboarding: cada instancia (empresa/área/proyecto) pasa a tener
-- "fecha y hora" + "responsable". Antes "empresa" no tenía responsable, y
-- los "horario" eran texto libre sin fecha (no se pueden convertir solos
-- a timestamptz sin arriesgar datos, así que quedan sin usar en vez de
-- borrarse: se pueden limpiar más adelante si están vacíos).
alter table postulaciones
  add column ob_induccion_empresa_responsable text,
  add column ob_induccion_empresa_fecha_hora timestamptz,
  add column ob_induccion_area_fecha_hora timestamptz,
  add column ob_induccion_proyecto_fecha_hora timestamptz;

update postulaciones
set ob_induccion_empresa_responsable = ob_induccion_empresa
where ob_induccion_empresa is not null;

-- Recrear la vista con las columnas nuevas.
create view vw_postulaciones_pipeline as
select
  p.*,
  c.nombre_completo,
  c.oculto as candidato_oculto,
  c.origen as candidato_origen,
  c.linkedin_url as candidato_linkedin_url,
  ultima.fecha as fecha_desde_etapa_actual,
  extract(day from now() - ultima.fecha)::int as dias_en_etapa,
  c.provincia_estado as candidato_provincia_estado,
  c.nivel_ingles as candidato_nivel_ingles,
  c.stack_principal as candidato_stack_principal
from postulaciones p
join candidatos c on c.id = p.candidato_id
left join lateral (
  select fecha
  from historial_etapas h
  where h.postulacion_id = p.id and h.etapa_nueva = p.etapa_actual
  order by fecha desc
  limit 1
) ultima on true;
