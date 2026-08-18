export type Rol = "admin" | "reclutador" | "hiring_manager";

export type Equipo = {
  id: string;
  nombre: string | null;
  email: string;
  rol: Rol;
  activo: boolean;
  creado_en: string;
};

export type EstadoVacante = {
  id: string;
  nombre: string;
  color_hex: string;
  orden: number;
  es_terminal: boolean;
};

export const PRIORIDADES_VACANTE = ["Alta", "Media", "Baja"] as const;
export type PrioridadVacante = (typeof PRIORIDADES_VACANTE)[number];

// Umbral de días abiertos a partir del cual una búsqueda se marca "Crítica"
// en el listado y el tablero.
export const DIAS_OPEN_CRITICO = 3;

// Año por defecto para el Overview y los listados de vacantes/candidatos.
export const ANIO_POR_DEFECTO = 2026;
export const ANIOS_DISPONIBLES = [2024, 2025, 2026, 2027] as const;

export type Vacante = {
  id: string;
  titulo: string;
  cliente_o_area: string | null;
  estado_id: string;
  reclutador_responsable_id: string | null;
  fecha_inicio_proceso: string;
  fecha_cierre_proceso: string | null;
  fecha_prevista_ingreso_hm: string | null;
  fecha_ingreso_confirmada: string | null;
  notas: string | null;
  drive_url: string | null;
  prioridad: PrioridadVacante;
};

export type VacanteConMetricas = Vacante & {
  estado_nombre: string;
  estado_color: string;
  estado_es_terminal: boolean;
  time_to_fill: number | null;
  dias_open: number | null;
  dif_fip_fic: number | null;
};

export const ORIGENES_CANDIDATO = [
  "referido",
  "linkedin",
  "base_propia",
  "postulacion",
  "otro",
] as const;

export type OrigenCandidato = (typeof ORIGENES_CANDIDATO)[number];

export const ETAPAS_CANDIDATO = [
  "Sourcing",
  "Screening/CV",
  "Entrevista RRHH",
  "Entrevista técnica/manager",
  "Oferta",
  "Contratado",
  "Descartado",
] as const;

// Datos de la persona. Un candidato puede tener varias postulaciones (una
// por cada proceso de selección en el que participa, a veces en simultáneo)
// — ver `Postulacion` más abajo.
export type Candidato = {
  id: string;
  nombre: string | null;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  origen: string | null;
  fecha_ingreso: string;
  oculto: boolean;
};

// Campos de perfil agregados en la migración 0004 a partir de la planilla
// "Candidatosas" (ver PRD). Todos opcionales: solo están completos en los
// candidatos importados, no en los que se cargan desde el formulario.
// Nota: tipo_candidato, disponibilidad_ingreso, expectativa_salarial y
// tipo_moneda se mudaron a `Postulacion` en la migración 0011 — son del
// proceso de selección, no de la persona.
export type CandidatoPerfil = {
  apellido: string | null;
  pais: string | null;
  provincia_estado: string | null;
  localidad: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  area: string | null;
  formacion_tecnica: string | null;
  anios_experiencia: number | null;
  experiencia_consultoria: boolean | null;
  nivel_ingles: string | null;
  stack_principal: string | null;
  lugar_empleo_actual: string | null;
  rate_fl: string | null;
  fuente_importada: string | null;
};

export type CandidatoCompleto = Candidato & CandidatoPerfil;

// La relación candidato <-> vacante: un candidato puede tener más de una
// postulación (a la misma vacante no, pero sí a varias en paralelo o a lo
// largo del tiempo), cada una con su propia etapa e historial. vacante_id
// es nullable: los candidatos importados de la planilla no traían esa
// relación, y quedaron como "postulación sin vacante asignada todavía".
export type Postulacion = {
  id: string;
  candidato_id: string;
  vacante_id: string | null;
  etapa_actual: string;
  reclutador_asignado_id: string | null;
  descartado_motivo: string | null;
  fecha_postulacion: string;
  // proceso de selección
  tipo_candidato: string | null;
  disponibilidad_ingreso: string | null;
  expectativa_salarial: string | null;
  tipo_moneda: string | null;
  fecha_primer_contacto: string | null;
  fecha_screening_hr: string | null;
  fecha_entrevista_hr: string | null;
  seniority_propuesto_hr: string | null;
  feedback_entrevista_hr: string | null;
  fecha_entrevista_area: string | null;
  seniority_propuesto_area: string | null;
  feedback_entrevista_area: string | null;
  estado_final: string | null;
  // oferta laboral
  avanza_ol: boolean | null;
  fecha_envio_ol: string | null;
  aceptacion_ol: boolean | null;
  fecha_aceptacion_rechazo_ol: string | null;
  motivo_rechazo_ol: string | null;
  fecha_ingreso_efectiva: string | null;
  feedback_proceso_candidato: string | null;
  licencias_programadas: string | null;
  // onboarding
  ob_cliente: string | null;
  ob_proyecto: string | null;
  ob_induccion_empresa_responsable: string | null;
  ob_induccion_empresa_fecha_hora: string | null;
  ob_induccion_area_responsable: string | null;
  ob_induccion_area_fecha_hora: string | null;
  ob_induccion_proyecto_responsable: string | null;
  ob_induccion_proyecto_fecha_hora: string | null;
  ob_fecha_envio_elementos: string | null;
  ob_fecha_recepcion_elementos: string | null;
};

export type PostulacionConDias = Postulacion & {
  nombre_completo: string;
  candidato_oculto: boolean;
  candidato_origen: string | null;
  candidato_linkedin_url: string | null;
  fecha_desde_etapa_actual: string | null;
  dias_en_etapa: number | null;
  candidato_provincia_estado: string | null;
  candidato_nivel_ingles: string | null;
  candidato_stack_principal: string | null;
};

export type HistorialEtapa = {
  id: string;
  postulacion_id: string;
  etapa_anterior: string | null;
  etapa_nueva: string;
  movido_por_id: string | null;
  nota: string | null;
  fecha: string;
};

export type NotaEntrevista = {
  id: string;
  candidato_id: string;
  entrevistador_id: string | null;
  etapa: string | null;
  feedback: string | null;
  calificacion: number | null;
  fecha: string;
};

export const TIPOS_COMUNICACION = [
  "email_enviado",
  "email_recibido",
  "llamada",
  "whatsapp",
] as const;

export type Comunicacion = {
  id: string;
  candidato_id: string;
  tipo: (typeof TIPOS_COMUNICACION)[number];
  asunto: string | null;
  resumen: string | null;
  gmail_thread_id: string | null;
  fecha: string;
};
