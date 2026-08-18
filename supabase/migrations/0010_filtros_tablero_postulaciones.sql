-- Agrega a vw_postulaciones_pipeline los campos del candidato que hacían
-- falta para poder filtrar el tablero por provincia/estado, nivel de
-- inglés y stack principal (igual que ya se puede en el listado
-- /candidatos). Van al final del select: "create or replace view" no
-- permite insertar columnas en el medio de una vista ya existente.
create or replace view vw_postulaciones_pipeline as
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
