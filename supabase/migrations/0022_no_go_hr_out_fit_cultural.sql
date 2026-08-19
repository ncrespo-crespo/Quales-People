-- Regla del proceso: un "NO GO" en el feedback de la entrevista de HR es,
-- en sí mismo, un descarte por fit cultural — no hace falta esperar a que
-- se cargue el status final del proceso para reflejarlo en el estado del
-- candidato. De acá en más lo aplica el propio formulario de postulación
-- (ver actualizarPostulacion); esta migración corrige el histórico.
--
-- Se aplica sin condición (incluso si el candidato ya tenía otro estado
-- cargado): de los 61 candidatos con NO GO en la carga real, ninguno
-- tenía un estado positivo (Hired/Contratado) que se pudiera pisar por
-- error — quedaban repartidos entre otros motivos de "Out" o "Continua
-- en base", que es exactamente lo que esta regla corrige.
update candidatos c
set estado = 'Out por fit cultural'
where exists (
  select 1 from postulaciones p
  where p.candidato_id = c.id and p.feedback_entrevista_hr = 'NO GO'
);
