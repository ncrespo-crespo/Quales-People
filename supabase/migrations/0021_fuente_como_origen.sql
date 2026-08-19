-- "Fuente" (fuente_importada, texto libre traído de la planilla) y
-- "Origen" (candidatos.origen, el selector que se usa desde el
-- formulario) eran dos campos separados para el mismo concepto: de dónde
-- salió el candidato. `origen` nunca se completó para los candidatos
-- importados (esa columna no venía en la carga original), así que queda
-- vacía justo donde `fuente_importada` sí tiene el dato real.
--
-- Se unifican en `origen`, normalizando las variantes de un mismo origen
-- que quedaron escritas de forma distinta en la planilla ("Elias" y
-- "Consultora - Elías" son la misma consultora; "Referid@" es lo mismo
-- que la opción "referido" que ya existía en el selector).
update candidatos
set origen = case fuente_importada
  when 'Elias' then 'Consultora - Elías'
  when 'Referid@' then 'referido'
  when 'The flock' then 'The Flock'
  else fuente_importada
end
where origen is null and nullif(trim(fuente_importada), '') is not null;

alter table candidatos drop column fuente_importada;
