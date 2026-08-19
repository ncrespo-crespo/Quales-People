-- "Contratado" y "Hired" eran dos valores distintos para el mismo estado
-- final del candidato. Se unifican en "Hired" (ESTADOS_CANDIDATO ya no
-- incluye "Contratado" como opción propia).
update candidatos
set estado = 'Hired'
where estado = 'Contratado';
