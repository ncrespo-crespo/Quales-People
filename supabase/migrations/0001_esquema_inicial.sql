-- Fase 1: esquema inicial del ATS interno (ver PRD, sección 4).

create extension if not exists pgcrypto;

-- equipo -----------------------------------------------------------------
-- El id es el mismo que auth.users.id: así el registro de equipo se crea
-- solo cuando alguien inicia sesión por primera vez (ver trigger más abajo)
-- y auth.uid() = equipo.id sirve directo para las políticas de RLS.
create table equipo (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  email text not null unique,
  rol text not null default 'reclutador'
    check (rol in ('admin', 'reclutador', 'hiring_manager')),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- función auxiliar para las políticas de RLS, evita recursión sobre `equipo`
create function public.rol_actual()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select rol from equipo where id = auth.uid();
$$;

-- da de alta automáticamente en `equipo` a quien se loguea por primera vez
create function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into equipo (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when new.email = 'ncrespo@qualesgroup.com' then 'admin' else 'reclutador' end
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- estados_vacante ----------------------------------------------------------
create table estados_vacante (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  color_hex text not null,
  orden int not null,
  es_terminal boolean not null default false
);

insert into estados_vacante (nombre, color_hex, orden, es_terminal) values
  ('Potencial', '#fbcfe8', 1, false),
  ('Kick Off', '#e5e7eb', 2, false),
  ('Pending', '#fde68a', 3, false),
  ('On Going', '#a5f3fc', 4, false),
  ('Advanced', '#94a3b8', 5, false),
  ('Job Offer', '#c4b5fd', 6, false),
  ('Stand By', '#e5e7eb', 7, false),
  ('Hired', '#86efac', 8, true),
  ('Cancelled', '#fca5a5', 9, true);

-- vacantes -------------------------------------------------------------
create table vacantes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_o_area text,
  estado_id uuid not null references estados_vacante (id),
  reclutador_responsable_id uuid references equipo (id),
  fecha_inicio_proceso date not null default current_date,
  fecha_cierre_proceso date,
  fecha_prevista_ingreso_hm date,
  fecha_ingreso_confirmada date,
  notas text
);

-- al llegar a un estado terminal (Hired/Cancelled) completa la fecha de
-- cierre sola; si se revierte a un estado no terminal, la limpia.
create function public.actualizar_fecha_cierre_vacante()
returns trigger
language plpgsql
as $$
declare
  es_terminal_nuevo boolean;
begin
  if new.estado_id is distinct from old.estado_id then
    select es_terminal into es_terminal_nuevo
    from estados_vacante where id = new.estado_id;

    if es_terminal_nuevo then
      new.fecha_cierre_proceso := coalesce(new.fecha_cierre_proceso, current_date);
    else
      new.fecha_cierre_proceso := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger antes_de_actualizar_vacante
  before update on vacantes
  for each row execute function public.actualizar_fecha_cierre_vacante();

-- candidatos -------------------------------------------------------------
create table candidatos (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  email text,
  telefono text,
  vacante_id uuid references vacantes (id),
  reclutador_asignado_id uuid references equipo (id),
  etapa_actual text not null default 'Sourcing',
  cv_url text,
  linkedin_url text,
  origen text,
  fecha_ingreso timestamptz not null default now(),
  descartado_motivo text
);

-- historial_etapas ---------------------------------------------------------
-- Append-only: acá vive la trazabilidad. Nunca se edita ni se borra.
create table historial_etapas (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos (id) on delete cascade,
  etapa_anterior text,
  etapa_nueva text not null,
  movido_por_id uuid references equipo (id),
  nota text,
  fecha timestamptz not null default now()
);

-- notas_entrevistas --------------------------------------------------------
create table notas_entrevistas (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos (id) on delete cascade,
  entrevistador_id uuid references equipo (id),
  etapa text,
  feedback text,
  calificacion int check (calificacion between 1 and 5),
  fecha timestamptz not null default now()
);

-- comunicaciones -----------------------------------------------------------
create table comunicaciones (
  id uuid primary key default gen_random_uuid(),
  candidato_id uuid not null references candidatos (id) on delete cascade,
  tipo text not null check (tipo in ('email_enviado', 'email_recibido', 'llamada', 'whatsapp')),
  asunto text,
  resumen text,
  gmail_thread_id text,
  fecha timestamptz not null default now()
);

-- vw_metricas_vacantes -----------------------------------------------------
create view vw_metricas_vacantes as
select
  v.*,
  ev.nombre as estado_nombre,
  ev.color_hex as estado_color,
  ev.es_terminal as estado_es_terminal,
  case when ev.nombre = 'Hired' and v.fecha_cierre_proceso is not null
    then v.fecha_cierre_proceso - v.fecha_inicio_proceso
    else null
  end as time_to_fill,
  case when ev.es_terminal = false
    then current_date - v.fecha_inicio_proceso
    else null
  end as dias_open,
  case when v.fecha_ingreso_confirmada is not null and v.fecha_prevista_ingreso_hm is not null
    then v.fecha_ingreso_confirmada - v.fecha_prevista_ingreso_hm
    else null
  end as dif_fip_fic
from vacantes v
join estados_vacante ev on ev.id = v.estado_id;

-- RLS ------------------------------------------------------------------
-- Equipo de 2-4 personas de confianza: cualquier usuario autenticado puede
-- leer y operar los datos del ATS. `equipo` es la excepción: cualquiera
-- puede leerlo (para asignar responsables) pero solo un admin lo edita.
alter table equipo enable row level security;
alter table estados_vacante enable row level security;
alter table vacantes enable row level security;
alter table candidatos enable row level security;
alter table historial_etapas enable row level security;
alter table notas_entrevistas enable row level security;
alter table comunicaciones enable row level security;

create policy "equipo: lectura autenticada" on equipo
  for select to authenticated using (true);
create policy "equipo: solo admin edita" on equipo
  for update to authenticated using (public.rol_actual() = 'admin');

create policy "estados_vacante: lectura autenticada" on estados_vacante
  for select to authenticated using (true);
create policy "estados_vacante: solo admin escribe" on estados_vacante
  for all to authenticated
  using (public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');

create policy "vacantes: acceso autenticado" on vacantes
  for all to authenticated using (true) with check (true);
create policy "candidatos: acceso autenticado" on candidatos
  for all to authenticated using (true) with check (true);
create policy "historial_etapas: acceso autenticado" on historial_etapas
  for all to authenticated using (true) with check (true);
create policy "notas_entrevistas: acceso autenticado" on notas_entrevistas
  for all to authenticated using (true) with check (true);
create policy "comunicaciones: acceso autenticado" on comunicaciones
  for all to authenticated using (true) with check (true);
