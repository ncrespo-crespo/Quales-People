-- Fase 2 (datos reales): campos de la planilla "Candidatosas" que no
-- estaban contemplados en el esquema original. Se agregan sin tocar los
-- campos existentes (linkedin_url, origen, cv_url, vacante_id, etc.), que
-- siguen usándose igual desde los formularios de la app.

alter table candidatos
  -- datos personales / perfil
  add column apellido text,
  add column pais text,
  add column provincia_estado text,
  add column localidad text,
  add column genero text,
  add column fecha_nacimiento date,
  add column area text,
  add column formacion_tecnica text,
  add column anios_experiencia numeric,
  add column experiencia_consultoria boolean,
  add column nivel_ingles text,
  add column stack_principal text,
  add column lugar_empleo_actual text,
  -- texto libre: en la planilla vienen valores mixtos ("$4.000.000",
  -- "27000", una fecha cargada por error) que no entran en una columna
  -- numérica sin perder datos.
  add column expectativa_salarial text,
  add column rate_fl text,
  add column tipo_moneda text,
  add column tipo_candidato text,
  add column disponibilidad_ingreso text,
  add column fuente_importada text,
  -- proceso de selección
  add column fecha_primer_contacto date,
  add column fecha_screening_hr date,
  add column seniority_propuesto_hr text,
  add column feedback_entrevista_hr text,
  add column fecha_entrevista_area date,
  add column seniority_propuesto_area text,
  add column feedback_entrevista text,
  add column feedback_entrevista_area text,
  -- oferta laboral
  add column avanza_ol boolean,
  add column fecha_envio_ol date,
  add column aceptacion_ol boolean,
  add column fecha_aceptacion_rechazo_ol date,
  add column motivo_rechazo_ol text,
  add column fecha_ingreso_efectiva date,
  add column feedback_proceso_candidato text,
  add column licencias_programadas text,
  -- estado final tal como está en la planilla (más granular que
  -- etapa_actual: distingue motivos de baja como "Out por salario" /
  -- "Out por seniority" / "Out por fit cultural"). etapa_actual guarda una
  -- versión simplificada mapeada a nuestras etapas del PRD.
  add column estado_final_importado text,
  -- onboarding
  add column ob_cliente text,
  add column ob_proyecto text,
  add column ob_induccion_empresa text,
  add column ob_induccion_empresa_horario text,
  add column ob_induccion_area_responsable text,
  add column ob_induccion_area_horario text,
  add column ob_induccion_proyecto_responsable text,
  add column ob_induccion_proyecto_horario text,
  add column ob_fecha_envio_elementos date,
  add column ob_fecha_recepcion_elementos date;
