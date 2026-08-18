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

## Estado actual: Fase 2 — CRUD de vacantes y candidatos

- Fase 0: scaffold de Next.js, cliente de Supabase, deploy en Vercel.
- Fase 1: tablas de la base de datos (sección 4 del PRD), login con
  email/contraseña y alta automática de usuarios en `equipo`.
- Fase 2: alta/edición de vacantes y candidatos, carga de CV a Storage,
  listados en tabla, y la pantalla de configuración de estados de vacante
  (`/configuracion/estados`, solo admin).

El resto de las funcionalidades (Kanban, ficha de candidato, dashboard,
Gmail) se construyen en las fases siguientes (ver el PRD, sección 6 —
Roadmap de construcción).

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

Después correr también, en orden, `0002_storage_cvs.sql` (bucket privado
`cvs`), `0003_ampliacion_vacantes.sql` y `0004_ampliacion_candidatos.sql`
(campos que salen de la planilla real de reclutamiento — ver más abajo).

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

Por ahora se crean desde el dashboard de Supabase: **Authentication → Users
→ Add user** (con email y contraseña). Al primer login, un trigger crea
automáticamente su fila en `equipo` con rol `reclutador` (o `admin` si el
email es `ncrespo@qualesgroup.com`). Para cambiar el rol de alguien más a
`admin`, editar la fila correspondiente en la tabla `equipo`.

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
