-- El estado del candidato pasa a ser un campo propio de la persona (no
-- derivado de sus postulaciones): se puede editar directamente desde
-- ahora en más, con una lista fija de valores para elegir.
--
-- Sin check constraint a propósito: es una lista que probablemente crezca
-- (nuevos estados a medida que se necesiten) y forzarla en la base
-- obligaría a una migración cada vez — el listado seleccionable vive en
-- la app (ESTADOS_CANDIDATO en src/lib/types.ts).
alter table candidatos add column estado text;

-- Backfill desde el histórico: cada candidato importado tenía un único
-- "Status" en la planilla original, que quedó como estado_final de su
-- primera (y en la mayoría de los casos única) postulación. Se toma el
-- de su postulación más reciente.
update candidatos c
set estado = (
  select p.estado_final
  from postulaciones p
  where p.candidato_id = c.id
  order by p.fecha_postulacion desc
  limit 1
)
where c.estado is null;
