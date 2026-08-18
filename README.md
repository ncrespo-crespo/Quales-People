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

## Estado actual: Fase 0 — Setup

Este commit cubre el scaffold inicial: proyecto Next.js corriendo, cliente de
Supabase configurado (browser y server) y listo para desplegar en Vercel. Las
tablas, el login y el resto de las funcionalidades se construyen en las fases
siguientes (ver el PRD, sección 6 — Roadmap de construcción).

## Requisitos previos

1. Un proyecto creado en [supabase.com](https://supabase.com).
2. Una cuenta en [vercel.com](https://vercel.com) conectada al repositorio de
   GitHub (para el deploy).

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
