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

## Estado actual: Fase 1 — Datos base y login

- Fase 0: scaffold de Next.js, cliente de Supabase, deploy en Vercel.
- Fase 1: tablas de la base de datos (sección 4 del PRD), login con
  email/contraseña y alta automática de usuarios en `equipo`.

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
