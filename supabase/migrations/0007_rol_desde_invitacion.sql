-- Cuando se invita a alguien desde /configuracion/equipo, el admin ya eligió
-- su rol; el trigger de alta ahora lo respeta si viene en los metadatos del
-- usuario invitado. Si no viene (login espontáneo sin invitación previa),
-- se mantiene el comportamiento anterior.
create or replace function public.manejar_nuevo_usuario()
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
    coalesce(
      new.raw_user_meta_data ->> 'rol',
      case when new.email = 'ncrespo@qualesgroup.com' then 'admin' else 'reclutador' end
    )
  );
  return new;
end;
$$;
