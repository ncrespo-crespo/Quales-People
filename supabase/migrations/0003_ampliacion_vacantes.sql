-- Fase 2 (datos reales): campos de "Hiring Plan Services 2026" que no
-- estaban contemplados en el esquema original.
--
-- TTF, Días Open y Dif FIP/FIC NO se agregan como columnas: ya se calculan
-- solos en vw_metricas_vacantes a partir de las fechas existentes.
--
-- `reclutador_nombre_importado` y `hiring_manager_nombre` quedan como texto
-- libre (no FK a `equipo`) porque esas personas todavía no tienen una
-- cuenta en el sistema. Cuando inicien sesión por primera vez van a
-- aparecer en `equipo` y se las puede reasignar a mano desde el formulario
-- de la vacante (que sí usa la FK `reclutador_responsable_id`).

alter table vacantes
  alter column fecha_inicio_proceso drop not null,
  alter column fecha_inicio_proceso drop default,
  add column trimestre text,
  add column proyecto text,
  add column nivel text,
  add column tipo_oportunidad text,
  add column pais text,
  add column bu text,
  add column hiring_manager_nombre text,
  add column reclutador_nombre_importado text,
  add column perfiles_presentados text,
  add column candidato_ingresado_nombre text,
  add column drive_url text;

-- El trigger de cierre automático solo corría en UPDATE; con la carga
-- inicial (y cualquier alta futura que ya nazca en un estado terminal)
-- también tiene que correr en INSERT.
create or replace function public.actualizar_fecha_cierre_vacante()
returns trigger
language plpgsql
as $$
declare
  es_terminal_nuevo boolean;
begin
  if tg_op = 'UPDATE' and new.estado_id is not distinct from old.estado_id then
    return new;
  end if;

  select es_terminal into es_terminal_nuevo
  from estados_vacante where id = new.estado_id;

  if es_terminal_nuevo then
    new.fecha_cierre_proceso := coalesce(new.fecha_cierre_proceso, current_date);
  elsif tg_op = 'UPDATE' then
    new.fecha_cierre_proceso := null;
  end if;

  return new;
end;
$$;

create trigger antes_de_insertar_vacante
  before insert on vacantes
  for each row execute function public.actualizar_fecha_cierre_vacante();
