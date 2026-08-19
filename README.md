# ATS Interno — Qualesgroup

Aplicación web interna para reemplazar la planilla de reclutamiento por un ATS
simple: trazabilidad automática del recorrido de cada candidato, vista Kanban
de búsquedas y candidatos, y coordinación de carga de trabajo del equipo.

Ver la especificación completa en el PRD del proyecto (documento "ATS Interno
— Especificación técnica").

## Stack

- **Next.js (App Router, TypeScript)** — frontend y API en un mismo proyecto.
- **Supabase** — base de datos Postgres, auth y storage de archivos (CVs).
- **Vercel** — hosting del frontend.
- **Tailwind CSS** — estilos.

## Estado actual: Fase 5 — Overview y métricas

- Fase 0: scaffold de Next.js, cliente de Supabase, deploy en Vercel.
- Fase 1: tablas de la base de datos (sección 4 del PRD), login con
  email/contraseña y alta automática de usuarios en `equipo`.
- Fase 2: alta/edición de vacantes y candidatos, carga de CV a Storage,
  listados en tabla, y la pantalla de configuración de estados de vacante
  (`/configuracion/estados`, solo admin). Además se amplió el esquema con
  los datos reales de la planilla de reclutamiento (ver más abajo).
- Fase 3: `/vacantes/kanban` (arrastrar una vacante entre columnas de
  estado) y `/candidatos/kanban` (arrastrar un candidato entre etapas, con
  selector de vacante/reclutador/origen). Cada movimiento dispara
  automáticamente el registro correspondiente — `historial_etapas` para
  candidatos (pide motivo si el destino es "Descartado"), o
  `fecha_cierre_proceso` para vacantes que llegan a un estado terminal.
- Fase 4: ficha de candidato (`/candidatos/:id`) con línea de tiempo de
  `historial_etapas`, notas de entrevistas, comunicaciones, indicador de
  días en la etapa actual, y los datos importados de la planilla agrupados
  en secciones plegables (los más relevantes para reclutar —
  experiencia, inglés, stack— se ven directo, sin desplegar nada). El
  listado de `/vacantes` tiene filtros (estado, reclutador, prioridad,
  cliente/área), columna de fecha de inicio (orden descendente por
  defecto), prioridad (`Alta`/`Media`/`Baja`, configurable por vacante) y
  una insignia "Crítico" cuando una búsqueda lleva más de
  `DIAS_OPEN_CRITICO` (3) días abierta. El listado de `/candidatos` tiene
  los mismos filtros que el tablero (etapa, vacante, reclutador, origen),
  más columnas de días en etapa, fecha de contacto y link directo a
  LinkedIn.
- `/configuracion/equipo` (solo admin): invitar gente nueva por email (le
  llega un mail de Supabase para poner su contraseña) y editar
  rol/estado activo de cada miembro, sin tocar la base a mano. Requiere
  la variable de entorno `SUPABASE_SERVICE_ROLE_KEY` (ver más abajo).
- Mejoras varias: tipografía Poppins en toda la app (igual que
  qualesgroup.com); fondo sólido en los `<select>` para que se lean bien
  las opciones en cualquier navegador/tema; columnas ordenables con clic
  en el encabezado en los listados de vacantes y candidatos; el
  formulario de editar candidato ahora expone todos los campos
  (incluida la fecha de contacto), agrupados en secciones plegables; y
  la posibilidad de ocultar un candidato del listado/tablero sin
  borrarlo (`candidatos.oculto`, con un checkbox "Mostrar ocultos" para
  volver a verlos).
- Rediseño de candidatos → postulaciones (migración 0009): un candidato
  puede estar en más de un proceso de selección a la vez. `candidatos`
  quedó solo con datos de la persona (perfil); la relación con una
  vacante (etapa, reclutador asignado, motivo de descarte, y todo el
  detalle de proceso de selección/oferta laboral/onboarding importado de
  la planilla) vive en la tabla nueva `postulaciones`, una fila por cada
  búsqueda a la que se presentó. `historial_etapas` pasa a llevar la
  trazabilidad por postulación. La ficha del candidato (`/candidatos/:id`)
  ahora tiene una sección "Postulaciones" con una entrada por proceso
  (cada una con su propio historial, y se puede agregar/eliminar). El
  tablero (`/candidatos/kanban`, ahora "tablero de postulaciones")
  muestra una tarjeta por postulación: si alguien está en dos búsquedas a
  la vez, aparece dos veces, cada una en la columna de su propia etapa.
  El listado `/candidatos` pasó a ser un directorio de personas (ya no
  tiene etapa/vacante), con la cantidad de postulaciones de cada una.
- Fase 5: `/` ahora es el **Overview** (primera pestaña del nav):
  cantidad de vacantes / activas / Hired / Cancelled, TTF promedio, días
  open promedio, tasa de conversión a Hired, distribución por estado y
  por prioridad, y carga de trabajo por reclutador (activas, Hired, TTF
  promedio) — todo filtrable por reclutador. Tanto el Overview como los
  listados de `/vacantes` (por `fecha_inicio_proceso`) y `/candidatos`
  (por `fecha_ingreso`, la fecha de contacto) se filtran por año, con
  **2026** como valor por defecto (`ANIO_POR_DEFECTO` en
  `src/lib/types.ts`) y selector para cambiarlo. Una vacante o candidato
  sin esa fecha cargada no va a aparecer bajo ningún año — no hay forma
  de ubicarlo en el tiempo sin ese dato.
- `/candidatos` suma filtros por postulación (vacante a la que se
  presentó), provincia/estado y nivel de inglés (desplegables armados a
  partir de los valores que ya existen cargados, no una lista fija), y
  stack principal (búsqueda de texto libre — pensado para términos como
  "SQL", "Snowflake", "PBI"; en el futuro se puede convertir en tags). El
  tablero de postulaciones (`/candidatos/kanban`, migración 0010) tiene
  los mismos filtros de provincia/estado, nivel de inglés y stack. En
  ambas pantallas todos los filtros (incluido el de año) quedan en una
  sola fila.
- Redefinición de campos persona vs. proceso (migración 0011, ver "Base
  de datos" más abajo): el candidato suma "Nombres" separado de
  "Apellidos"; tipo de candidato, disponibilidad de ingreso, expectativa
  salarial y moneda pasan a ser del proceso de selección (antes eran de
  la persona); se agrega la fecha de entrevista de HR (distinta de la de
  screening); onboarding pasa a tener fecha y hora + responsable por
  cada instancia (empresa/área/proyecto). Los `<select>` de vacante (al
  crear un candidato, en postulaciones y en los filtros) ahora muestran
  cliente y fecha de inicio además del título, para distinguir búsquedas
  con el mismo nombre.
- Vacantes ampliadas (migración 0012): igual que los candidatos, ahora se
  pueden ocultar del listado/tablero sin borrarlas (`vacantes.oculto`,
  checkbox "Mostrar ocultas"). Suman stack principal, nivel de inglés,
  ubicación (provincia/estado y localidad — el país ya existía),
  modalidad de trabajo (On Site / Híbrido / Remoto), banda salarial y un
  check de "acepta freelance". El candidato suma "remuneración
  pretendida" (distinta de la expectativa salarial de una postulación
  puntual, que vive en `postulaciones`).
- `/vacantes/:id`: ficha de la vacante (antes solo se podía editar, no
  ver el detalle). Muestra todos sus datos y la lista de postulantes con
  etapa, reclutador y fecha — antes esa relación vacante↔candidato no se
  veía en ningún lado. El listado de `/vacantes` suma una columna
  "Postulantes" con la cantidad.
- `/match` (pestaña nueva): elegís una vacante y sugiere candidatos que
  todavía no están postulados a ella, por coincidencia de stack
  principal, nivel de inglés y ubicación (heurística de texto, no IA —
  pensada para iterar). Desde ahí se puede postular directo con un
  botón. También se llega filtrado desde la ficha de la vacante ("Ver
  candidatos sugeridos").
- Todos los filtros de selección de los listados (vacantes, candidatos,
  tablero de postulaciones, Overview) pasan a ser de selección múltiple
  — se puede filtrar por varios estados, reclutadores, orígenes, etc. a
  la vez (`src/components/FiltroMultiple.tsx`).
- Banda salarial (vacante) y remuneración pretendida (candidato) pasan a
  ser un monto con su moneda (`ARS`/`USD`/`EUR`, migración 0013) en vez
  de texto libre, para poder comparar valores más adelante.
- Limpieza de columnas importadas de la planilla original que quedaban
  sueltas, sin relación real con el resto de los datos (migraciones
  0014 y 0015, ver "Base de datos"): el reclutador ahora es siempre la
  FK real a `equipo` (no texto libre), y las postulaciones históricas
  quedan vinculadas a su vacante cuando se pudo identificar quién
  terminó contratado. La vacante también suma **Tipo de oportunidad**
  (selector: Qualer/Manpower/Freelance/Talento Tech) y **Hiring
  Manager**, y **País** pasa a mostrarse como campo propio (separado de
  provincia/localidad) tanto en la vacante como en el candidato.
- Refresh de estilo y navegación (migración 0016):
  - Los listados de `/candidatos` y `/vacantes` muestran 20 resultados
    por página, con paginación al pie (cambiar cualquier filtro, orden
    o año vuelve a la página 1 para no quedar en una página vacía).
  - Reordenamiento de columnas: **Estado** (de la persona/vacante) pasa
    a estar junto al nombre/título en vez de al final, para verlo de
    un vistazo; las columnas numéricas quedan alineadas a la derecha;
    filas con hover para ubicarse mejor en tablas largas.
  - En el tablero de vacantes y el de postulaciones, ahora se puede
    hacer click en el título/nombre de cada tarjeta para ir directo a
    su ficha (antes solo se podía arrastrar).
  - La postulación ahora deja explícito si es **Qualer** o
    **Freelance** (`tipo_candidato`, visible en la ficha del
    candidato, en el tablero y en la lista de postulantes de la
    vacante); si es Freelance, pide además su origen (**Mercado**,
    **Elías** o **Agencia**).
- **Estado propio del candidato** (migración 0017): el candidato tiene
  ahora su propio campo **Estado** (`candidatos.estado`), editable
  directamente desde el formulario de alta/edición con un selector de
  lista fija (`ESTADOS_CANDIDATO` en `src/lib/types.ts`) — antes se
  mostraba solo como un dato derivado de la postulación más reciente
  y no se podía cargar ni cambiar de forma independiente. Es un
  concepto distinto de la etapa de una postulación puntual y del
  estado de una vacante. Se agregó también como filtro (selección
  múltiple) en el listado de candidatos. La columna no tiene check
  constraint a propósito: la lista de estados probablemente crezca y
  forzarla en la base obligaría a una migración cada vez que se suma
  uno nuevo — el control de qué valores existen vive en la app.

El resto de las funcionalidades (Gmail) se
construyen en las fases siguientes (ver el PRD, sección 6 — Roadmap de
construcción).

## Requisitos previos

1. Un proyecto creado en [supabase.com](https://supabase.com).
2. Una cuenta en [vercel.com](https://vercel.com) conectada al repositorio de
   GitHub (para el deploy).

## Base de datos

Las migraciones viven en `supabase/migrations/`. Para aplicar la primera
(tablas, vista de métricas y políticas de acceso):

1. Abrir el proyecto en [supabase.com](https://supabase.com) →
   **SQL Editor** → **New query**.
2. Pegar el contenido de `supabase/migrations/0001_esquema_inicial.sql` y
   ejecutarlo.

Esto crea las tablas (`equipo`, `vacantes`, `estados_vacante`, `candidatos`,
`historial_etapas`, `notas_entrevistas`, `comunicaciones`), la vista
`vw_metricas_vacantes` y los 9 estados iniciales de vacante.

Después correr también, en orden:

- `0002_storage_cvs.sql` — bucket privado `cvs`.
- `0003_ampliacion_vacantes.sql` y `0004_ampliacion_candidatos.sql` —
  campos que salen de la planilla real de reclutamiento (ver más abajo).
- `0005_vista_candidatos_pipeline.sql` — días en la etapa actual, para el
  tablero de candidatos.
- `0006_prioridad_vacantes.sql` — prioridad de la búsqueda.
- `0007_rol_desde_invitacion.sql` — el alta de equipo respeta el rol
  elegido al invitar (ver "Alta de usuarios del equipo").
- `0008_ocultar_candidatos.sql` — permite ocultar un candidato del
  listado/tablero sin borrarlo.
- `0009_postulaciones.sql` — separa "quién es la persona" (`candidatos`)
  de "en qué proceso está, para qué vacante" (`postulaciones`, N por
  candidato). Migra los datos existentes sola, sin pedir nada: cada
  candidato pasa a tener su primera postulación con lo que ya tenía
  cargado. Importante correrla recién **después** de la carga inicial de
  la planilla (más abajo), nunca antes — necesita que `candidatos` ya
  tenga los datos para poder migrarlos.
- `0010_filtros_tablero_postulaciones.sql` — agrega a la vista del
  tablero (`vw_postulaciones_pipeline`) provincia/estado, nivel de
  inglés y stack principal del candidato, para poder filtrar el
  tablero de postulaciones igual que ya se filtra el listado de
  candidatos.
- `0011_redefinicion_perfil_y_proceso.sql` — redefine, según la lista
  definitiva de campos, qué es de la persona y qué es del proceso:
  - `candidatos` suma `nombre` (nombre de pila, separado de `apellido`).
    `nombre_completo` se sigue usando en toda la app para
    mostrar/ordenar/buscar; se recalcula solo (`nombre` + `apellido`)
    cada vez que se guarda el candidato.
  - `tipo_candidato`, `disponibilidad_ingreso`, `expectativa_salarial` y
    `tipo_moneda` se mudan de `candidatos` a `postulaciones` (dependen de
    a qué búsqueda/cliente se postula, no son fijos de la persona). Los
    datos ya cargados se migran solos.
  - `postulaciones` suma `fecha_entrevista_hr` (screening y entrevista de
    HR son dos pasos distintos, antes solo existía la fecha de
    screening).
  - `feedback_entrevista` y `feedback_entrevista_area` estaban
    duplicados desde la planilla original: se unifican en
    `feedback_entrevista_area`.
  - `estado_final_importado` pasa a llamarse `estado_final`: ya no es
    solo un dato arrastrado de la importación, es un campo normal del
    proceso.
  - Onboarding: cada instancia (empresa/área/proyecto) pasa a tener
    "fecha y hora" (`ob_induccion_*_fecha_hora`, timestamp) +
    "responsable" (`ob_induccion_*_responsable`, texto). Antes "empresa"
    no tenía responsable y los "horario" eran texto libre sin fecha —
    esas columnas viejas quedan sin usarse desde la app (no se pueden
    convertir solas a fecha sin arriesgar datos): se pueden borrar más
    adelante a mano si están vacías.
- `0012_vacantes_ampliadas.sql` — `vacantes` suma `oculto` (mismo
  criterio que `candidatos.oculto`), `stack_principal`, `nivel_ingles`,
  `provincia_estado`, `localidad` (el país ya existía desde la 0003),
  `modalidad_trabajo` (`On Site` / `Híbrido` / `Remoto`, con check
  constraint), `banda_salarial` y `acepta_freelance`. `candidatos` suma
  `remuneracion_pretendida`.
- `0013_moneda_remuneracion.sql` — `banda_salarial` (vacantes) y
  `remuneracion_pretendida` (candidatos) pasan de texto libre a monto
  numérico, cada uno con su moneda (`moneda_banda_salarial` /
  `moneda_remuneracion_pretendida`, `ARS`/`USD`/`EUR` con check
  constraint) — antes no se podían comparar valores ni sabías en qué
  moneda estaba cada uno.
- `0014_reclutador_desde_importado.sql` — `reclutador_nombre_importado`
  (texto libre traído de la planilla, migración 0003) se elimina:
  primero completa `reclutador_responsable_id` (la FK real a `equipo`)
  buscando cada nombre importado en `equipo.nombre` — por nombre
  completo y, si no matcheó, por nombre de pila cuando es inequívoco —
  sin pisar ninguna vacante que ya tuviera un responsable asignado a
  mano. Cualquier vacante que no se pueda emparejar se avisa por NOTICE
  en el SQL Editor para asignarla manualmente, y recién después borra la
  columna. Validado contra Postgres local con los datos reales de la
  planilla (66 de 66 vacantes con reclutador importado emparejaron).
- `0015_candidato_ingresado_vinculo.sql` — `candidato_ingresado_nombre`
  (texto libre, migración 0003, el nombre de quien terminó contratado)
  no tenía ninguna relación real: ninguna postulación importada traía
  `vacante_id`. Esta migración arma ese vínculo buscando el candidato
  por nombre (comparando por conjunto de palabras, sin importar
  orden/mayúsculas/acentos, porque el texto importado a veces viene
  "Apellido Nombre" y otras "Nombre Apellido") y asignándole la vacante
  a su postulación, solo cuando el nombre matchea con un único
  candidato y ese candidato tiene una única postulación todavía sin
  vacante. A diferencia de la 0014, acá la columna original no se
  borra — solo se pidió vincular. Los que no se puedan emparejar se
  avisan por NOTICE para vincular a mano desde la ficha del candidato.
- `0016_origen_freelance.sql` — agrega `postulaciones.origen_freelance`
  (`Mercado` / `Elías` / `Agencia`, con check constraint), solo tiene
  sentido cuando `tipo_candidato` es `Freelance`.
- `0017_estado_candidato.sql` — agrega `candidatos.estado` (texto,
  sin check constraint a propósito — ver más arriba). Hace un backfill
  desde la `estado_final` de la postulación más reciente de cada
  candidato, para que el histórico ya cargado no quede vacío. De acá
  en más se carga y edita directamente desde el formulario del
  candidato.

### Carga inicial desde la planilla de reclutamiento

`supabase/seed/` tiene la carga de los datos reales (Pipeline_Data_v1.0.xlsx,
agosto 2026), para correr **una sola vez** y **después** de las 4
migraciones de arriba:

1. `0001_vacantes_hiring_plan_2026.sql` — las 69 búsquedas de la hoja
   "Hiring Plan Services 2026".
2. `0002_candidatos_importados.sql` — 264 de las 392 filas de la hoja
   "Candidatosas" (128 quedaron afuera: tenían el nombre roto por una
   fórmula `#REF!` en la planilla original — el detalle está en el
   encabezado del archivo).

Ninguno de los dos vincula candidatos con vacantes todavía (`vacante_id`
queda vacío): esa relación no existe en la planilla de origen y hay que
definirla a mano más adelante. `supabase/seed/scripts/generar_seeds.py` es
el script que generó estos dos archivos, guardado como referencia del
mapeo planilla → columnas (no está pensado para correrse de nuevo tal
cual).

### Alta de usuarios del equipo

Desde la app: **Configuración → Equipo** (solo admin) → invitar por email.
Al invitar, un trigger crea de inmediato su fila en `equipo` con el nombre
y el rol elegidos en el formulario (todavía sin poder loguearse). Le llega
un mail de Supabase con un link a `/invitacion`, donde define su
contraseña y ya queda activa la cuenta. Requiere tener cargada
`SUPABASE_SERVICE_ROLE_KEY` (ver "Variables de entorno").

**Importante — configuración obligatoria en Supabase**: el link de
invitación solo funciona si `/invitacion` está en la lista de redirects
permitidos. En el dashboard de Supabase → **Authentication → URL
Configuration → Redirect URLs**, agregar:

- `https://<tu-dominio-de-producción>/invitacion`
- `http://localhost:3000/invitacion` (para probar en desarrollo local)

Si esa URL no está en la lista, Supabase ignora el `redirectTo` y manda al
Site URL por defecto, donde la app no tiene forma de recibir el token de
sesión — la persona ve el login pero no tiene contraseña todavía. Cada
link de invitación es de un solo uso: si ya se abrió (o venció) y la
persona no llegó a definir su contraseña, hay que reenviarlo — hay un
botón **"Reenviar invitación"** por cada persona en Configuración →
Equipo que genera un link nuevo sin tocar su fila de `equipo`.

También se puede seguir dando de alta manualmente desde el dashboard de
Supabase (**Authentication → Users → Add user**): en ese caso el trigger
usa `reclutador` por defecto (`admin` si el email es
`ncrespo@qualesgroup.com`), editable después desde Configuración → Equipo.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# completar .env.local con las credenciales del proyecto de Supabase
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La página de inicio
indica si las variables de Supabase están configuradas.

### Variables de entorno

Ver `.env.example`. Se obtienen desde el dashboard de Supabase, en
`Project Settings > API`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — la clave `service_role` (secreta) de la
  misma pantalla. Solo se usa del lado del servidor (invitar gente desde
  Configuración → Equipo). **Nunca** con prefijo `NEXT_PUBLIC_`, nunca en
  el repo: en Vercel se carga igual que las otras, en **Settings →
  Environment Variables**.

## Scripts

- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción.
- `npm run start` — sirve el build de producción.
- `npm run lint` — linter.

## Deploy

Importar el repositorio en Vercel y configurar las mismas variables de
entorno del punto anterior en el proyecto de Vercel (`Settings >
Environment Variables`). Cada push a la rama principal dispara un deploy
automático.
