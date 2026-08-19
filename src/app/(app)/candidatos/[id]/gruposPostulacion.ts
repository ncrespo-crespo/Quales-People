import type { Postulacion } from "@/lib/types";

export type CampoSpec = {
  name: keyof Postulacion;
  label: string;
  tipo?: "fecha" | "fecha_hora" | "textarea" | "booleano";
};

export const GRUPOS: { titulo: string; campos: CampoSpec[] }[] = [
  {
    titulo: "Proceso de selección",
    campos: [
      { name: "fecha_primer_contacto", label: "Fecha primer contacto", tipo: "fecha" },
      { name: "fecha_screening_hr", label: "Fecha screening HR", tipo: "fecha" },
      { name: "fecha_entrevista_hr", label: "Fecha entrevista HR", tipo: "fecha" },
      { name: "seniority_propuesto_hr", label: "Seniority propuesto (HR)" },
      { name: "feedback_entrevista_hr", label: "Feedback entrevista HR", tipo: "textarea" },
      { name: "fecha_entrevista_area", label: "Fecha entrevista área", tipo: "fecha" },
      { name: "seniority_propuesto_area", label: "Seniority propuesto (área)" },
      { name: "feedback_entrevista_area", label: "Feedback entrevista área", tipo: "textarea" },
      { name: "disponibilidad_ingreso", label: "Disponibilidad de ingreso" },
      { name: "expectativa_salarial", label: "Expectativa salarial" },
      { name: "tipo_moneda", label: "Moneda" },
      { name: "estado_final", label: "Status final" },
    ],
  },
  {
    titulo: "Oferta laboral",
    campos: [
      { name: "avanza_ol", label: "¿Avanza a OL?", tipo: "booleano" },
      { name: "fecha_envio_ol", label: "Fecha de envío OL", tipo: "fecha" },
      { name: "aceptacion_ol", label: "Aceptación OL", tipo: "booleano" },
      { name: "fecha_aceptacion_rechazo_ol", label: "Fecha aceptación/rechazo OL", tipo: "fecha" },
      { name: "motivo_rechazo_ol", label: "Motivo de rechazo OL" },
      { name: "fecha_ingreso_efectiva", label: "Fecha de ingreso efectiva", tipo: "fecha" },
      { name: "feedback_proceso_candidato", label: "Feedback del proceso al candidato", tipo: "textarea" },
      { name: "licencias_programadas", label: "Licencias programadas" },
    ],
  },
  {
    titulo: "Onboarding",
    campos: [
      { name: "ob_cliente", label: "Cliente" },
      { name: "ob_proyecto", label: "Proyecto" },
      { name: "ob_induccion_empresa_fecha_hora", label: "Fecha y hora onboarding empresa", tipo: "fecha_hora" },
      { name: "ob_induccion_empresa_responsable", label: "Inducción a empresa · responsable" },
      { name: "ob_induccion_area_fecha_hora", label: "Fecha y hora inducción al área", tipo: "fecha_hora" },
      { name: "ob_induccion_area_responsable", label: "Inducción al área · responsable" },
      { name: "ob_induccion_proyecto_fecha_hora", label: "Fecha y hora inducción a proyecto", tipo: "fecha_hora" },
      { name: "ob_induccion_proyecto_responsable", label: "Inducción a proyecto · responsable" },
      { name: "ob_fecha_envio_elementos", label: "Envío de elementos de trabajo", tipo: "fecha" },
      { name: "ob_fecha_recepcion_elementos", label: "Recepción de elementos de trabajo", tipo: "fecha" },
    ],
  },
];
