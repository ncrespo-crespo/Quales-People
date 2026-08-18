# Script que generó los archivos ../0001_vacantes_hiring_plan_2026.sql y
# ../0002_candidatos_importados.sql a partir de Pipeline_Data_v1.0.xlsx
# (Quales, agosto 2026). Se guarda como referencia de cómo se hizo el mapeo
# planilla -> esquema, no para volver a correrlo tal cual: RUTA_XLSX apunta
# a un archivo que solo existía en esa sesión. Requiere openpyxl
# (`pip install openpyxl`).
import datetime
import sys

import openpyxl

RUTA_XLSX = sys.argv[1] if len(sys.argv) > 1 else "Pipeline_Data_v1.0.xlsx"
wb = openpyxl.load_workbook(RUTA_XLSX, data_only=True)

ERRORES_EXCEL = {"#REF!", "#N/A", "#VALUE!", "#DIV/0!", "#NAME?", "#NULL!", "#NUM!"}


def sanear_fila(row):
    """Los valores en cache de una fórmula rota (ej. referencia borrada)
    quedan como el texto del error de Excel. Se tratan como celda vacía."""
    return tuple(
        None if isinstance(v, str) and v.strip() in ERRORES_EXCEL else v for v in row
    )


def sql(valor):
    if valor is None:
        return "null"
    if isinstance(valor, bool):
        return "true" if valor else "false"
    if isinstance(valor, (int, float)):
        return repr(valor)
    if isinstance(valor, datetime.datetime):
        return f"'{valor.date().isoformat()}'"
    if isinstance(valor, datetime.date):
        return f"'{valor.isoformat()}'"
    texto = str(valor).strip()
    if texto == "":
        return "null"
    return "'" + texto.replace("'", "''") + "'"


ADVERTENCIAS = []  # (hoja, fila, campo, valor_original, motivo)


def _parsear_fecha_texto(s):
    s = s.strip()
    if not s or s.upper() in {"N/A", "NA", "-", "S/D"}:
        return None, None
    partes = [p for p in s.replace("//", "/").split("/") if p != ""]
    if len(partes) == 2 and len(partes[1]) == 6:
        partes = [partes[0], partes[1][:2], partes[1][2:]]
    if len(partes) != 3:
        return None, "formato de fecha no reconocido"
    try:
        dia, mes, anio = (int(p) for p in partes)
        if anio < 100:
            anio += 2000
        return datetime.date(anio, mes, dia), None
    except (ValueError, TypeError):
        return None, "fecha inválida"


def sql_fecha(valor, hoja, fila, campo):
    if valor is None:
        return "null"
    if isinstance(valor, datetime.datetime):
        return f"'{valor.date().isoformat()}'"
    if isinstance(valor, datetime.date):
        return f"'{valor.isoformat()}'"
    if isinstance(valor, datetime.time):
        ADVERTENCIAS.append((hoja, fila, campo, valor, "es una hora, no una fecha"))
        return "null"
    if isinstance(valor, (int, float)):
        # número de serie de fecha de Excel (época 1899-12-30)
        try:
            fecha = datetime.date(1899, 12, 30) + datetime.timedelta(days=valor)
            if 1990 <= fecha.year <= 2100:
                return f"'{fecha.isoformat()}'"
        except (ValueError, OverflowError):
            pass
        ADVERTENCIAS.append((hoja, fila, campo, valor, "número no interpretable como fecha"))
        return "null"
    fecha, motivo = _parsear_fecha_texto(str(valor))
    if fecha is not None:
        return f"'{fecha.isoformat()}'"
    if motivo:
        ADVERTENCIAS.append((hoja, fila, campo, valor, motivo))
    return "null"


def sql_bool_si_no(valor):
    if valor is None:
        return "null"
    v = str(valor).strip().upper()
    if v == "SI":
        return "true"
    if v == "NO":
        return "false"
    return "null"


# ---------------------------------------------------------------------
# Vacantes (Hiring Plan Services 2026)
# ---------------------------------------------------------------------
ws = wb["Hiring Plan Services 2026"]
headers = [c.value for c in ws[1]]


def col(name):
    return headers.index(name)


NORMALIZAR_OPORTUNIDAD = {
    "Talnto Tech": "Talento Tech",
    "Mampower": "Manpower",
}

filas_vacantes = []
for fila_idx, r in enumerate(ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=True), start=2):
    if not r[col("Nombre Posición")]:
        continue
    oportunidad = r[col("Oportunidad")]
    if oportunidad in NORMALIZAR_OPORTUNIDAD:
        oportunidad = NORMALIZAR_OPORTUNIDAD[oportunidad]

    filas_vacantes.append(
        {
            "_fila": fila_idx,
            "titulo": r[col("Nombre Posición")],
            "cliente_o_area": r[col("Cliente")],
            "estado_nombre": r[col("Status")],
            "fecha_inicio_proceso": r[col("Fecha inicio proceso")],
            "fecha_cierre_proceso": r[col("Fecha cierre proceso")],
            "fecha_prevista_ingreso_hm": r[col("Fecha prevista de ingreso \n(HM)")],
            "fecha_ingreso_confirmada": r[col("Fecha de ingreso confirmada")],
            "notas": r[col("Comentarios")],
            "trimestre": r[col("Quarter")],
            "proyecto": r[col("Proyecto")],
            "nivel": r[col("Level")],
            "tipo_oportunidad": oportunidad,
            "pais": r[col("País")],
            "bu": r[col("BU")],
            "hiring_manager_nombre": r[col("Nombre Hiring Manager")],
            "reclutador_nombre_importado": r[col("Recruiter Owner")],
            "perfiles_presentados": r[col("Perfiles presentados")],
            "candidato_ingresado_nombre": r[col("Candidato/a Ingresado/a")],
        }
    )

COLUMNAS_VACANTES = [
    "titulo",
    "cliente_o_area",
    "estado_id",
    "fecha_inicio_proceso",
    "fecha_cierre_proceso",
    "fecha_prevista_ingreso_hm",
    "fecha_ingreso_confirmada",
    "notas",
    "trimestre",
    "proyecto",
    "nivel",
    "tipo_oportunidad",
    "pais",
    "bu",
    "hiring_manager_nombre",
    "reclutador_nombre_importado",
    "perfiles_presentados",
    "candidato_ingresado_nombre",
]

lineas = [
    "-- Carga inicial de vacantes desde 'Hiring Plan Services 2026'.",
    "-- Generado a partir de Pipeline_Data_v1.0.xlsx. Ejecutar UNA SOLA VEZ",
    "-- (no tiene protección contra duplicados si se corre dos veces).",
    "--",
    "-- El trigger que autocompleta fecha_cierre_proceso al llegar a un estado",
    "-- terminal se desactiva durante esta carga: varias búsquedas Hired/",
    "-- Cancelled de la planilla no tienen fecha de cierre real, y dejar el",
    "-- trigger activo la reemplazaría por la fecha de hoy, inflando el Time",
    "-- To Fill. Mejor un campo vacío (a completar a mano si se conoce la",
    "-- fecha real) que un dato incorrecto.",
    "alter table vacantes disable trigger antes_de_insertar_vacante;",
    "",
    f"insert into vacantes ({', '.join(COLUMNAS_VACANTES)})",
    "values",
]
valores = []
for f in filas_vacantes:
    hoja = "Hiring Plan Services 2026"
    vals = [
        sql(f["titulo"]),
        sql(f["cliente_o_area"]),
        f"(select id from estados_vacante where nombre = {sql(f['estado_nombre'])})",
        sql_fecha(f["fecha_inicio_proceso"], hoja, f["_fila"], "Fecha inicio proceso"),
        sql_fecha(f["fecha_cierre_proceso"], hoja, f["_fila"], "Fecha cierre proceso"),
        sql_fecha(f["fecha_prevista_ingreso_hm"], hoja, f["_fila"], "Fecha prevista de ingreso (HM)"),
        sql_fecha(f["fecha_ingreso_confirmada"], hoja, f["_fila"], "Fecha de ingreso confirmada"),
        sql(f["notas"]),
        sql(f["trimestre"]),
        sql(f["proyecto"]),
        sql(f["nivel"]),
        sql(f["tipo_oportunidad"]),
        sql(f["pais"]),
        sql(f["bu"]),
        sql(f["hiring_manager_nombre"]),
        sql(f["reclutador_nombre_importado"]),
        sql(f["perfiles_presentados"]),
        sql(f["candidato_ingresado_nombre"]),
    ]
    valores.append("  (" + ", ".join(vals) + ")")
lineas.append(",\n".join(valores) + ";")
lineas.append("")
lineas.append("alter table vacantes enable trigger antes_de_insertar_vacante;")

with open("../0001_vacantes_hiring_plan_2026.sql", "w") as f:
    f.write("\n".join(lineas) + "\n")

print(f"vacantes: {len(filas_vacantes)} filas")

# ---------------------------------------------------------------------
# Candidatos (Candidatosas)
# ---------------------------------------------------------------------
ws2 = wb["Candidatosas"]
headers2 = [c.value for c in ws2[1]]


def col2(name):
    return headers2.index(name)


def mapear_etapa(status_final, avanza_ol):
    if not status_final:
        return "Sourcing", None
    s = str(status_final).strip().lower()
    if "contratado" in s or s == "hired":
        return "Contratado", None
    if s.startswith("out ") or "rechazada" in s:
        return "Descartado", str(status_final).strip()
    if "entrevista" in s:
        return "Entrevista RRHH", None
    if "continua en base" in s:
        return "Sourcing", None
    return "Sourcing", None


filas_excluidas_nombre_roto = []
filas_candidatos = []
for fila_idx, r_crudo in enumerate(ws2.iter_rows(min_row=2, max_row=ws2.max_row, values_only=True), start=2):
    r = sanear_fila(r_crudo)
    apellido = r[col2("Apellido")]
    nombre = r[col2("Nombre")]
    if not apellido and not nombre:
        if r_crudo[col2("Apellido")] or r_crudo[col2("Nombre")]:
            # tenía algo antes de sanear: era #REF!, no una fila vacía real
            filas_excluidas_nombre_roto.append(fila_idx)
        continue  # fila vacía o con nombre/apellido roto (fórmula #REF!)

    nombre_completo = " ".join(p for p in [nombre, apellido] if p).strip()
    status_final = r[col2("Status Final")]
    etapa_actual, descartado_motivo = mapear_etapa(status_final, r[col2("¿Avanza a OL?")])

    filas_candidatos.append(
        {
            "_fila": fila_idx,
            "nombre_completo": nombre_completo,
            "apellido": str(apellido).strip() if apellido else None,
            "linkedin_url": r[col2("LKD")],
            "fecha_ingreso": r[col2("Fecha Primer Contacto")],
            "pais": r[col2("País")],
            "provincia_estado": r[col2("Provincia/Estado")],
            "localidad": r[col2("Localidad")],
            "genero": r[col2("Género")],
            "fecha_nacimiento": r[col2("Fecha de nacimiento")],
            "area": r[col2("Área")],
            "formacion_tecnica": r[col2("Formación Técnica")],
            "anios_experiencia": r[col2("Años de Experiencia")],
            "experiencia_consultoria": sql_bool_si_no(r[col2("Experiencia en consultoría")]),
            "nivel_ingles": r[col2("Nivel de Inglés")],
            "stack_principal": r[col2("Stack principal")],
            "lugar_empleo_actual": r[col2("Lugar de Empleo Actual")],
            "expectativa_salarial": r[col2("Expectativa Salarial")],
            "tipo_candidato": r[col2("Tipo de Candidat@")],
            "disponibilidad_ingreso": r[col2("Disponibilidad de ingreso")],
            "fuente_importada": r[col2("Fuente")],
            "rate_fl": r[col2("Rate FL")],
            "tipo_moneda": r[col2("Tipo de moneda")],
            "fecha_primer_contacto": r[col2("Fecha Primer Contacto")],
            "fecha_screening_hr": r[col2("Fecha screening HR")],
            "seniority_propuesto_hr": r[col2("Seniority Propuesto\n HR")],
            "feedback_entrevista_hr": r[col2("Feedback Entrevista HR")],
            "fecha_entrevista_area": r[col2("Fecha entrevista Área")],
            "seniority_propuesto_area": r[col2("Seniority Propuesto por Área")],
            "feedback_entrevista": r[col2("Feedback Entrevista")],
            "feedback_entrevista_area": r[col2("Feedback Entrevista Área")],
            "avanza_ol": sql_bool_si_no(r[col2("¿Avanza a OL?")]),
            "fecha_envio_ol": r[col2("Fecha de envío OL")],
            "aceptacion_ol": sql_bool_si_no(r[col2("Aceptación OL")]),
            "fecha_aceptacion_rechazo_ol": r[col2("Fecha aceptación/rechazo OL")],
            "motivo_rechazo_ol": r[col2("Motivo rechazo OL")],
            "fecha_ingreso_efectiva": r[col2("Fecha de ingreso efectiva")],
            "feedback_proceso_candidato": r[col2("Feedback del proceso al candidat@")],
            "licencias_programadas": r[col2("Licencias Programadas")],
            "estado_final_importado": status_final,
            "etapa_actual": etapa_actual,
            "descartado_motivo": descartado_motivo,
            "ob_cliente": r[col2("OB\nCliente")],
            "ob_proyecto": r[col2("OB\nProyecto")],
            "ob_induccion_empresa": r[col2("OB\nInducción Empresa")],
            "ob_induccion_empresa_horario": r[col2("Inducción Empresa | Horario")],
            "ob_induccion_area_responsable": r[col2("OB\nInducción al área | Responsable")],
            "ob_induccion_area_horario": r[col2("OB\nInducción al área | Horario")],
            "ob_induccion_proyecto_responsable": r[col2("OB\nInducción a Proyecto | Responsable")],
            "ob_induccion_proyecto_horario": r[col2("OB\nInducción a Proyecto | Horario")],
            "ob_fecha_envio_elementos": r[col2("OB\nFecha de Envío de elementos de trabajo")],
            "ob_fecha_recepcion_elementos": r[col2("OB\nFecha de Recepción de elementos de trabajo")],
        }
    )

COLUMNAS_CANDIDATOS = [
    "nombre_completo",
    "apellido",
    "linkedin_url",
    "fecha_ingreso",
    "pais",
    "provincia_estado",
    "localidad",
    "genero",
    "fecha_nacimiento",
    "area",
    "formacion_tecnica",
    "anios_experiencia",
    "experiencia_consultoria",
    "nivel_ingles",
    "stack_principal",
    "lugar_empleo_actual",
    "expectativa_salarial",
    "tipo_candidato",
    "disponibilidad_ingreso",
    "fuente_importada",
    "rate_fl",
    "tipo_moneda",
    "fecha_primer_contacto",
    "fecha_screening_hr",
    "seniority_propuesto_hr",
    "feedback_entrevista_hr",
    "fecha_entrevista_area",
    "seniority_propuesto_area",
    "feedback_entrevista",
    "feedback_entrevista_area",
    "avanza_ol",
    "fecha_envio_ol",
    "aceptacion_ol",
    "fecha_aceptacion_rechazo_ol",
    "motivo_rechazo_ol",
    "fecha_ingreso_efectiva",
    "feedback_proceso_candidato",
    "licencias_programadas",
    "estado_final_importado",
    "etapa_actual",
    "descartado_motivo",
    "ob_cliente",
    "ob_proyecto",
    "ob_induccion_empresa",
    "ob_induccion_empresa_horario",
    "ob_induccion_area_responsable",
    "ob_induccion_area_horario",
    "ob_induccion_proyecto_responsable",
    "ob_induccion_proyecto_horario",
    "ob_fecha_envio_elementos",
    "ob_fecha_recepcion_elementos",
]

CAMPOS_BOOL_YA_SQL = {"experiencia_consultoria", "avanza_ol", "aceptacion_ol"}
CAMPOS_FECHA = {
    "fecha_ingreso",
    "fecha_nacimiento",
    "fecha_primer_contacto",
    "fecha_screening_hr",
    "fecha_entrevista_area",
    "fecha_envio_ol",
    "fecha_aceptacion_rechazo_ol",
    "fecha_ingreso_efectiva",
    "ob_fecha_envio_elementos",
    "ob_fecha_recepcion_elementos",
}

lineas2 = [
    "-- Carga inicial de candidatos desde la planilla 'Candidatosas'.",
    "-- Generado a partir de Pipeline_Data_v1.0.xlsx. Ejecutar UNA SOLA VEZ.",
    "--",
    "-- etapa_actual sale de un mapeo simplificado de 'Status Final':",
    "--   contiene 'contratado'/'hired'      -> Contratado",
    "--   empieza con 'out ' o 'rechazada'   -> Descartado (el texto original",
    "--                                        queda en descartado_motivo)",
    "--   contiene 'entrevista'              -> Entrevista RRHH",
    "--   'continua en base' / vacío         -> Sourcing",
    "-- El texto original siempre se conserva en estado_final_importado por si",
    "-- este mapeo hay que ajustarlo a mano.",
    "-- vacante_id y reclutador_asignado_id quedan sin asignar: todavía no hay",
    "-- una relación clara entre estas filas y las búsquedas del otro import.",
    "--",
    "-- 128 filas de la planilla original NO se importan: sus columnas",
    "-- Apellido/Nombre son fórmulas rotas (=IFERROR(...#REF!...)) que hace",
    "-- referencia a una columna borrada en la planilla. El nombre real ya no",
    "-- está recuperable desde este archivo; hace falta la planilla previa a",
    "-- ese borrado si se quiere rescatar esas filas (filas de la hoja",
    "-- Candidatosas: 178-334 aprox., no consecutivas).",
    "",
    f"insert into candidatos ({', '.join(COLUMNAS_CANDIDATOS)})",
    "values",
]
valores2 = []
for f in filas_candidatos:
    vals = []
    for campo in COLUMNAS_CANDIDATOS:
        v = f[campo]
        if campo in CAMPOS_BOOL_YA_SQL:
            vals.append(v)  # ya viene convertido a 'true'/'false'/'null'
        elif campo in CAMPOS_FECHA:
            valor_sql = sql_fecha(v, "Candidatosas", f["_fila"], campo)
            if campo == "fecha_ingreso" and valor_sql == "null":
                # NOT NULL con default now(): sin "Fecha Primer Contacto"
                # confiable, se registra como ingresado en el momento de
                # la carga en vez de inventar una fecha histórica.
                valor_sql = "now()"
            vals.append(valor_sql)
        else:
            vals.append(sql(v))
    valores2.append("  (" + ", ".join(vals) + ")")
lineas2.append(",\n".join(valores2) + ";")

with open("../0002_candidatos_importados.sql", "w") as f:
    f.write("\n".join(lineas2) + "\n")

print(f"candidatos: {len(filas_candidatos)} filas")
print(
    f"candidatos EXCLUIDOS por nombre/apellido roto (#REF!): "
    f"{len(filas_excluidas_nombre_roto)} -> filas {filas_excluidas_nombre_roto}"
)

if ADVERTENCIAS:
    print(f"\n{len(ADVERTENCIAS)} advertencias (fechas no interpretables, quedaron en null):")
    for hoja, fila, campo, valor, motivo in ADVERTENCIAS:
        print(f"  [{hoja}] fila {fila}, columna '{campo}': {valor!r} -> {motivo}")
