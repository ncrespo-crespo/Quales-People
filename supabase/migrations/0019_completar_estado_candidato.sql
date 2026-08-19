-- El backfill de la migración 0017 dejó sin `estado` a los candidatos
-- cuyo "Status Final" venía en blanco en la planilla original (no tenían
-- ningún estado_final cargado en su postulación). En esos casos, en la
-- planilla un status en blanco significaba lo mismo que "Continua en
-- base" (sin resultado final todavía, sigue en la base de candidatos) —
-- es el mismo criterio que ya usaba la importación original para mapear
-- la etapa de esos casos (ver supabase/seed/scripts/generar_seeds.py).
update candidatos
set estado = 'Continua en base'
where estado is null;
