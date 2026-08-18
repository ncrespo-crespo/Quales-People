-- Fase 2: bucket privado de Storage para los CVs de los candidatos.

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "cvs: acceso autenticado"
on storage.objects
for all to authenticated
using (bucket_id = 'cvs')
with check (bucket_id = 'cvs');
