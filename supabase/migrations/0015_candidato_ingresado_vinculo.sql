-- `candidato_ingresado_nombre` (importado del Hiring Plan) es el nombre de
-- quien terminó contratado para esa búsqueda, pero ninguna postulación
-- importada tenía `vacante_id` cargado (esa relación no existía en la
-- planilla de origen). Esto arma el vínculo real: si el nombre matchea
-- con un único candidato y ese candidato tiene una única postulación
-- todavía sin vacante, se la asigna a esta vacante.
--
-- El matching compara por conjunto de palabras (sin importar
-- orden/mayúsculas/acentos) porque el texto importado a veces viene como
-- "Apellido Nombre" y otras veces "Nombre Apellido".
--
-- A diferencia de reclutador_nombre_importado, esta columna NO se borra:
-- solo se pidió vincular, no eliminar.

create extension if not exists unaccent;

create or replace function normalizar_nombre_para_match(texto text)
returns text
language sql
immutable
as $$
  select string_agg(palabra, ' ' order by palabra)
  from unnest(regexp_split_to_array(lower(unaccent(trim(texto))), '\s+')) as palabra
  where palabra <> '';
$$;

update postulaciones p
set vacante_id = v.id
from vacantes v
join candidatos c
  on normalizar_nombre_para_match(c.nombre_completo)
     = normalizar_nombre_para_match(v.candidato_ingresado_nombre)
where v.candidato_ingresado_nombre is not null
  and p.candidato_id = c.id
  and p.vacante_id is null
  and (
    select count(*) from candidatos c2
    where normalizar_nombre_para_match(c2.nombre_completo)
        = normalizar_nombre_para_match(v.candidato_ingresado_nombre)
  ) = 1
  and (
    select count(*) from postulaciones p2 where p2.candidato_id = c.id
  ) = 1;

do $$
declare
  fila record;
  total int := 0;
begin
  for fila in
    select v.id, v.titulo, v.candidato_ingresado_nombre
    from vacantes v
    where v.candidato_ingresado_nombre is not null
      and not exists (select 1 from postulaciones p where p.vacante_id = v.id)
  loop
    total := total + 1;
    raise notice 'Sin vincular: vacante "%" (id %) - candidato ingresado "%". Revisar y vincular a mano desde la ficha del candidato.',
      fila.titulo, fila.id, fila.candidato_ingresado_nombre;
  end loop;

  if total = 0 then
    raise notice 'Todas las vacantes con candidato ingresado quedaron vinculadas a una postulación.';
  else
    raise notice '% vacante(s) sin poder vincular automáticamente — revisar los avisos de arriba.', total;
  end if;
end $$;
