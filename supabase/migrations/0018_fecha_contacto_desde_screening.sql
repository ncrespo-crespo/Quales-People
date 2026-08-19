-- "Fecha de contacto" del candidato (candidatos.fecha_ingreso) se había
-- cargado, en la importación original (migración 0009), desde la columna
-- "Fecha Primer Contacto" de la planilla. El dato correcto para ese campo
-- es la "Fecha screening HR" del pipeline: se corrige tomando el valor de
-- fecha_screening_hr de la primera postulación de cada candidato (la más
-- antigua por fecha_postulacion), cuando existe.
--
-- No toca candidatos sin ninguna postulación con fecha_screening_hr
-- cargada: mantienen el valor que ya tenían.
update candidatos c
set fecha_ingreso = p.fecha_screening_hr
from (
  select distinct on (candidato_id) candidato_id, fecha_screening_hr
  from postulaciones
  where fecha_screening_hr is not null
  order by candidato_id, fecha_postulacion asc
) p
where p.candidato_id = c.id;
