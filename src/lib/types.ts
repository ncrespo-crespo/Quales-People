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

export type Candidato = {
  id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  vacante_id: string | null;
  reclutador_asignado_id: string | null;
  etapa_actual: string;
  cv_url: string | null;
  linkedin_url: string | null;
  origen: string | null;
  fecha_ingreso: string;
  descartado_motivo: string | null;
};
