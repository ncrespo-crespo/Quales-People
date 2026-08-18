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
Le llega un mail de Supabase para que defina su contraseña; al aceptar la
invitación, un trigger crea su fila en `equipo` con el nombre y el rol
elegidos en el formulario. Requiere tener cargada
`SUPABASE_SERVICE_ROLE_KEY` (ver "Variables de entorno").

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
